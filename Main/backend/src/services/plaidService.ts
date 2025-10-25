import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  AuthGetRequest,
  TransactionsGetRequest,
  Products,
  CountryCode,
} from "plaid";
import { AxiosResponse } from "axios";
import {
  supabase,
  PlaidItem,
  PlaidAccount,
  PlaidTransaction,
} from "../utils/database";
import { encrypt, decrypt } from "../utils/encryption";

class PlaidService {
  private client: PlaidApi;

  constructor() {
    this.client = new PlaidApi(
      new Configuration({
        basePath:
          PlaidEnvironments[
            process.env.PLAID_ENV as keyof typeof PlaidEnvironments
          ],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
            "PLAID-SECRET": process.env.PLAID_SECRET,
            "Plaid-Version": "2020-09-14",
          },
        },
      })
    );
  }

  async createLinkToken(userId: string, webhookUrl?: string): Promise<any> {
    const request: LinkTokenCreateRequest = {
      user: { client_user_id: userId },
      client_name: "MyFinance",
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: webhookUrl || process.env.WEBHOOK_URL,
    };
    return await this.client.linkTokenCreate(request);
  }

  async exchangeToken(publicToken: string): Promise<any> {
    const request: ItemPublicTokenExchangeRequest = {
      public_token: publicToken,
    };
    return await this.client.itemPublicTokenExchange(request);
  }

  async getAccounts(accessToken: string): Promise<any> {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };
    return await this.client.accountsGet(request);
  }

  async getAuthData(accessToken: string): Promise<any> {
    const request: AuthGetRequest = {
      access_token: accessToken,
    };
    return await this.client.authGet(request);
  }

  // New methods for token storage and management

  async saveAccessToken(
    userId: string,
    itemId: string,
    accessToken: string,
    institutionName: string,
    webhookUrl?: string
  ): Promise<PlaidItem> {
    try {
      // Encrypt the access token before storing
      const encryptedToken = encrypt(accessToken);

      const { data, error } = await supabase
        .from("plaid_items")
        .insert({
          user_id: userId,
          item_id: itemId,
          access_token: encryptedToken,
          institution_name: institutionName,
          status: "active",
          webhook_url: webhookUrl || process.env.WEBHOOK_URL,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save access token: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error saving access token:", error);
      throw error;
    }
  }

  async getAccessToken(userId: string, itemId?: string): Promise<string> {
    try {
      let query = supabase
        .from("plaid_items")
        .select("access_token")
        .eq("user_id", userId)
        .eq("status", "active");

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error("No active access token found");
      }

      // Decrypt the access token
      return decrypt(data.access_token);
    } catch (error) {
      console.error("Error retrieving access token:", error);
      throw error;
    }
  }

  async getItemStatus(
    userId: string
  ): Promise<{ hasItems: boolean; items: PlaidItem[] }> {
    try {
      const { data, error } = await supabase
        .from("plaid_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch items: ${error.message}`);
      }

      return {
        hasItems: data && data.length > 0,
        items: data || [],
      };
    } catch (error) {
      console.error("Error checking item status:", error);
      throw error;
    }
  }

  async handleItemError(
    itemId: string,
    errorCode: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("plaid_items")
        .update({
          status: "error",
          error_code: errorCode,
          error_message: errorMessage,
        })
        .eq("item_id", itemId);

      if (error) {
        throw new Error(`Failed to update item error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error handling item error:", error);
      throw error;
    }
  }

  async syncTransactions(
    userId: string,
    itemId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ added: number; updated: number }> {
    try {
      // Get the access token for this item
      const accessToken = await this.getAccessToken(userId, itemId);

      // Get current cursor from database
      const { data: itemData, error: itemError } = await supabase
        .from("plaid_items")
        .select("cursor")
        .eq("item_id", itemId)
        .single();

      if (itemError) {
        throw new Error(`Failed to get cursor: ${itemError.message}`);
      }

      // Set default date range if not provided
      const defaultStartDate =
        startDate ||
        new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const defaultEndDate = endDate || new Date().toISOString().split("T")[0];

      // Fetch transactions from Plaid
      const request: TransactionsGetRequest = {
        access_token: accessToken,
        start_date: defaultStartDate,
        end_date: defaultEndDate,
      };

      // Add cursor if it exists
      if (itemData?.cursor) {
        (request as any).cursor = itemData.cursor;
      }

      const response = await this.client.transactionsGet(request);
      const transactions = response.data.transactions;
      const nextCursor = response.data.next_cursor;

      let added = 0;
      let updated = 0;

      // Process each transaction
      for (const plaidTransaction of transactions) {
        try {
          // Check if transaction already exists
          const { data: existingTx, error: checkError } = await supabase
            .from("transactions")
            .select("id")
            .eq("plaid_transaction_id", plaidTransaction.transaction_id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 = no rows found
            console.error("Error checking existing transaction:", checkError);
            continue;
          }

          // Get account ID from our accounts table
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .select("id")
            .eq("plaid_account_id", plaidTransaction.account_id)
            .single();

          if (accountError) {
            console.error("Account not found for transaction:", accountError);
            continue;
          }

          const transactionData: Partial<PlaidTransaction> = {
            user_id: userId,
            account_id: accountData.id,
            plaid_transaction_id: plaidTransaction.transaction_id,
            source: "plaid",
            posted_at: plaidTransaction.date,
            authorized_date: plaidTransaction.authorized_date || null,
            amount: plaidTransaction.amount,
            currency: plaidTransaction.iso_currency_code || "USD",
            merchant_name: plaidTransaction.merchant_name || null,
            merchant: plaidTransaction.merchant_name || null,
            description: plaidTransaction.name,
            category: plaidTransaction.category?.[0] || null,
            subcategory: plaidTransaction.category?.[1] || null,
            pending: plaidTransaction.pending,
            payment_channel: plaidTransaction.payment_channel || null,
            status: plaidTransaction.pending ? "pending" : "posted",
            location_city: plaidTransaction.location?.city || null,
            location_state: plaidTransaction.location?.region || null,
            geo_lat: plaidTransaction.location?.lat || null,
            geo_lon: plaidTransaction.location?.lon || null,
            mcc: (plaidTransaction as any).mcc || null,
            raw: plaidTransaction,
            hash: plaidTransaction.transaction_id, // Use Plaid ID as hash for deduplication
            ingested_at: new Date().toISOString(),
          };

          if (existingTx) {
            // Update existing transaction
            const { error: updateError } = await supabase
              .from("transactions")
              .update(transactionData)
              .eq("id", existingTx.id);

            if (!updateError) {
              updated++;
            }
          } else {
            // Insert new transaction
            const { error: insertError } = await supabase
              .from("transactions")
              .insert(transactionData);

            if (!insertError) {
              added++;
            }
          }
        } catch (txError) {
          console.error("Error processing transaction:", txError);
          continue;
        }
      }

      // Update cursor in plaid_items
      if (nextCursor) {
        const { error: cursorError } = await supabase
          .from("plaid_items")
          .update({ cursor: nextCursor })
          .eq("item_id", itemId);

        if (cursorError) {
          console.error("Error updating cursor:", cursorError);
        }
      }

      return { added, updated };
    } catch (error) {
      console.error("Error syncing transactions:", error);
      throw error;
    }
  }

  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
    cursor?: string
  ): Promise<any> {
    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    };

    // Add cursor if provided
    if (cursor) {
      (request as any).cursor = cursor;
    }

    return await this.client.transactionsGet(request);
  }
}

export default new PlaidService();
