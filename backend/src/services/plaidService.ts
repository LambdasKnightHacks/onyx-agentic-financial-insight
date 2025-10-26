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
import { v4 as uuidv4 } from "uuid";

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

  async createLinkToken(
    userId: string,
    email: string,
    webhookUrl?: string
  ): Promise<any> {
    const request: LinkTokenCreateRequest = {
      user: { client_user_id: userId },
      client_name: "MyFinance",
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: webhookUrl || process.env.WEBHOOK_URL,
      user_token: undefined, // Explicitly undefined
    };

    if (email) {
      request.user.email_address = email;
    }
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

      // itemId is the database UUID (plaid_items.id), not the Plaid item_id
      if (itemId) {
        query = query.eq("id", itemId);
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

  async getItem(itemId: string): Promise<PlaidItem> {
    try {
      const { data, error } = await supabase
        .from("plaid_items")
        .select("*")
        .eq("item_id", itemId)
        .single();

      if (error || !data) {
        throw new Error(`Item not found: ${error?.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  async getTransactions(
    accessToken: string,
    cursor: string | null
  ): Promise<any> {
    try {
      const request: any = {
        access_token: accessToken,
        cursor: cursor,
      };
      console.log(
        `[Plaid Service] Fetching transactions with cursor: ${cursor || "null"}`
      );
      const response = await this.client.transactionsSync(request);
      console.log(
        `[Plaid Service] Received ${response.data.added.length} added, ${response.data.modified.length} modified, ${response.data.removed.length} removed transactions`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "[Plaid Service] Error fetching transactions:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async saveAccounts(
    userId: string,
    itemId: string,
    accounts: any[]
  ): Promise<PlaidAccount[]> {
    try {
      console.log(
        `[Plaid Service] Saving ${accounts.length} accounts for user ${userId}`
      );
      const savedAccounts: PlaidAccount[] = [];

      for (const account of accounts) {
        const accountData = {
          id: uuidv4(), // Generate a new UUID for the account
          user_id: userId,
          name: account.name,
          type: account.type,
          currency: account.balances.iso_currency_code || "USD",
          display_mask: account.mask,
          institution: account.official_name || account.name,
          plaid_account_id: account.account_id,
          plaid_item_id: itemId,
          source: "plaid" as const,
        };

        // Add subtype if available (column must exist in database)
        if (account.subtype) {
          accountData.subtype = account.subtype;
        }

        console.log(
          `[Plaid Service] Saving account: ${account.name} (${account.account_id})`
        );

        const { data, error } = await supabase
          .from("accounts")
          .upsert(accountData, {
            onConflict: "plaid_account_id",
          })
          .select()
          .single();

        if (error) {
          console.error(`[Plaid Service] Error saving account:`, error);
        } else if (data) {
          console.log(
            `[Plaid Service] ✓ Account saved successfully: ${data.name} (DB ID: ${data.id})`
          );
          savedAccounts.push(data as PlaidAccount);
        }
      }

      console.log(
        `[Plaid Service] Successfully saved ${savedAccounts.length}/${accounts.length} accounts`
      );
      return savedAccounts;
    } catch (error) {
      console.error("[Plaid Service] Error saving accounts:", error);
      throw error;
    }
  }

  async resetItemStatus(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("plaid_items")
        .update({
          status: "active",
          error_code: null,
          error_message: null,
        })
        .eq("item_id", itemId);

      if (error) {
        throw new Error(`Failed to reset item status: ${error.message}`);
      }
    } catch (error) {
      console.error("Error resetting item status:", error);
      throw error;
    }
  }

  async createSandboxTransaction(accessToken: string): Promise<any> {
    try {
      const transactionDate = new Date();
      const transactionData = {
        amount: 12.34,
        date_posted: transactionDate.toISOString().split("T")[0],
        date_transacted: transactionDate.toISOString().split("T")[0],
        description: "Test transaction from sandbox",
      };

      const request = {
        access_token: accessToken,
        transactions: [transactionData],
      };

      return await (this.client as any).sandboxTransactionsCreate(request);
    } catch (error) {
      console.error("Error creating sandbox transaction:", error);
      throw error;
    }
  }
}

export default new PlaidService();
