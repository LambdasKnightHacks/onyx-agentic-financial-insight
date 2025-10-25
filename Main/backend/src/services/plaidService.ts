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
    const request: any = {
      access_token: accessToken,
      cursor: cursor,
    };
    return await this.client.transactionsSync(request);
  }
}

export default new PlaidService();
