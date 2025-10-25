import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  AuthGetRequest,
  Products,
  CountryCode,
} from "plaid";
import { AxiosResponse } from "axios";

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

  async createLinkToken(userId: string): Promise<any> {
    const request: LinkTokenCreateRequest = {
      user: { client_user_id: userId },
      client_name: "Your App Name",
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
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
}

export default new PlaidService();
