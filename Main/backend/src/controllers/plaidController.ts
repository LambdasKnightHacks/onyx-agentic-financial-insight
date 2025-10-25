import { Request, Response } from "express";
import plaidService from "../services/plaidService";
import transactionSyncService from "../services/transactionSyncService";

class plaidController {
  // Create link token for Plaid Link initialization
  async createLinkToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          error: "userId is required",
        });
        return;
      }

      const response = await plaidService.createLinkToken(userId);

      res.json({
        link_token: response.data.link_token,
        expiration: response.data.expiration,
      });
    } catch (error: any) {
      console.error("Error creating link token:", error);
      res.status(500).json({
        error: "Failed to create link token",
        details: error.message,
      });
    }
  }

  // Exchange public token for access token
  async exchangeToken(req: Request, res: Response): Promise<void> {
    try {
      const { public_token } = req.body;

      if (!public_token) {
        res.status(400).json({
          error: "public_token is required",
        });
        return;
      }

      const response = await plaidService.exchangeToken(public_token);

      res.json({
        access_token: response.data.access_token,
        item_id: response.data.item_id,
      });
    } catch (error: any) {
      console.error("Error exchanging token:", error);
      res.status(500).json({
        error: "Failed to exchange token",
        details: error.message,
      });
    }
  }

  // Get account information
  async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        res.status(400).json({
          error: "access_token is required",
        });
        return;
      }

      const response = await plaidService.getAccounts(access_token);

      res.json({
        accounts: response.data.accounts,
        item: response.data.item,
      });
    } catch (error: any) {
      console.error("Error getting accounts:", error);
      res.status(500).json({
        error: "Failed to get accounts",
        details: error.message,
      });
    }
  }

  // Get auth data (routing/account numbers)
  async getAuthData(req: Request, res: Response): Promise<void> {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        res.status(400).json({
          error: "access_token is required",
        });
        return;
      }

      const response = await plaidService.getAuthData(access_token);

      res.json({
        accounts: response.data.accounts,
        numbers: response.data.numbers,
        item: response.data.item,
      });
    } catch (error: any) {
      console.error("Error getting auth data:", error);
      res.status(500).json({
        error: "Failed to get auth data",
        details: error.message,
      });
    }
  }

  // Completes the bank connection flow
  async connectBank(req: Request, res: Response): Promise<void> {
    try {
      const { public_token, userId, institution_name, webhook_url } = req.body;

      if (!public_token || !userId || !institution_name) {
        res.status(400).json({
          error: "public_token, userId, and institution_name are required",
        });
        return;
      }

      // Exchange public token for access token
      const exchangeResponse = await plaidService.exchangeToken(public_token);
      const { access_token, item_id } = exchangeResponse.data;

      // Save access token to the database
      await plaidService.saveAccessToken(
        userId,
        item_id,
        access_token,
        institution_name,
        webhook_url
      );

      // Fetch and sync initial transactions
      await transactionSyncService.syncTransactions(userId, item_id);

      res.json({
        message: "Bank account connected successfully",
        item_id,
      });
    } catch (error: any) {
      console.error("Error connecting bank account:", error);
      res.status(500).json({
        error: "Failed to connect bank account",
        details: error.message,
      });
    }
  }

  // Handles Plaid webhooks
  async webhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhook_type, item_id } = req.body;

      // In a production environment, you should verify the webhook signature

      switch (webhook_type) {
        case "SYNC_UPDATES_AVAILABLE":
          const { user_id } = await plaidService.getItem(item_id); // Assumes getItem exists
          await transactionSyncService.syncTransactions(user_id, item_id);
          break;
        case "ERROR":
          const { error } = req.body;
          await plaidService.handleItemError(
            item_id,
            error.error_code,
            error.error_message
          );
          break;
        // Handle other webhook types as needed
      }

      res.status(200).send("Webhook received");
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(500).json({
        error: "Failed to handle webhook",
        details: error.message,
      });
    }
  }

  // Checks the status of a user's Plaid items
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      const status = await plaidService.getItemStatus(userId as string);
      res.json(status);
    } catch (error: any) {
      console.error("Error getting item status:", error);
      res.status(500).json({
        error: "Failed to get item status",
        details: error.message,
      });
    }
  }

  // Manually triggers a transaction sync
  async syncTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { userId, itemId } = req.body;

      if (!userId || !itemId) {
        res.status(400).json({ error: "userId and itemId are required" });
        return;
      }

      const result = await transactionSyncService.syncTransactions(
        userId,
        itemId
      );
      res.json({
        message: "Transaction sync completed",
        ...result,
      });
    } catch (error: any) {
      console.error("Error syncing transactions:", error);
      res.status(500).json({
        error: "Failed to sync transactions",
        details: error.message,
      });
    }
  }
}

export default new plaidController();
