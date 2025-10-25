const plaidService = require("../services/plaidService");

class PlaidController {
  // Create link token for Plaid Link initialization
  async createLinkToken(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: "userId is required",
        });
      }

      const response = await plaidService.createLinkToken(userId);

      res.json({
        link_token: response.data.link_token,
        expiration: response.data.expiration,
      });
    } catch (error) {
      console.error("Error creating link token:", error);
      res.status(500).json({
        error: "Failed to create link token",
        details: error.message,
      });
    }
  }

  // Exchange public token for access token
  async exchangeToken(req, res) {
    try {
      const { public_token } = req.body;

      if (!public_token) {
        return res.status(400).json({
          error: "public_token is required",
        });
      }

      const response = await plaidService.exchangeToken(public_token);

      res.json({
        access_token: response.data.access_token,
        item_id: response.data.item_id,
      });
    } catch (error) {
      console.error("Error exchanging token:", error);
      res.status(500).json({
        error: "Failed to exchange token",
        details: error.message,
      });
    }
  }

  // Get account information
  async getAccounts(req, res) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          error: "access_token is required",
        });
      }

      const response = await plaidService.getAccounts(access_token);

      res.json({
        accounts: response.data.accounts,
        item: response.data.item,
      });
    } catch (error) {
      console.error("Error getting accounts:", error);
      res.status(500).json({
        error: "Failed to get accounts",
        details: error.message,
      });
    }
  }

  // Get auth data (routing/account numbers)
  async getAuthData(req, res) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          error: "access_token is required",
        });
      }

      const response = await plaidService.getAuthData(access_token);

      res.json({
        accounts: response.data.accounts,
        numbers: response.data.numbers,
        item: response.data.item,
      });
    } catch (error) {
      console.error("Error getting auth data:", error);
      res.status(500).json({
        error: "Failed to get auth data",
        details: error.message,
      });
    }
  }
}

module.exports = new PlaidController();
