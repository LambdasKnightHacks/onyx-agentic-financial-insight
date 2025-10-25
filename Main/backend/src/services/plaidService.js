// services/plaidService.js
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

class PlaidService {
  constructor() {
    this.client = new PlaidApi(
      new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV],
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

  async createLinkToken(userId) {
    return await this.client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Your App Name",
      products: ["auth", "transactions"],
      country_codes: ["US"],
      language: "en",
    });
  }

  async exchangeToken(publicToken) {
    return await this.client.itemPublicTokenExchange({
      public_token: publicToken,
    });
  }

  async getAccounts(accessToken) {
    return await this.client.accountsGet({
      access_token: accessToken,
    });
  }

  async getAuthData(accessToken) {
    return await this.client.authGet({
      access_token: accessToken,
    });
  }
}

module.exports = new PlaidService();
