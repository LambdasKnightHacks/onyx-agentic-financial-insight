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
      const { publicToken, userId, metadata } = req.body;

      if (!publicToken || !userId) {
        res.status(400).json({
          error: "publicToken and userId are required",
        });
        return;
      }

      // Extract institution info from metadata if available
      const institutionName =
        metadata?.institution?.name || "Unknown Institution";
      const webhookUrl = process.env.WEBHOOK_URL;

      // Exchange public token for access token
      const exchangeResponse = await plaidService.exchangeToken(publicToken);
      const { access_token, item_id } = exchangeResponse.data;

      // Save access token to the database
      const plaidItem = await plaidService.saveAccessToken(
        userId,
        item_id,
        access_token,
        institutionName,
        webhookUrl
      );

      // Fetch accounts and save them
      const accountsResponse = await plaidService.getAccounts(access_token);
      const accounts = accountsResponse.data.accounts;

      // Save accounts to database
      const savedAccounts = await plaidService.saveAccounts(
        userId,
        item_id,
        accounts
      );

      // Trigger initial transaction sync in background
      // Don't await - let it run asynchronously
      transactionSyncService
        .syncTransactions(userId, item_id)
        .catch((error) => {
          console.error("Background transaction sync failed:", error);
        });

      res.json({
        success: true,
        message: "Bank account connected successfully",
        item_id,
        accounts: savedAccounts,
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
      const { webhook_type, webhook_code, item_id, error } = req.body;

      console.log(
        `[Plaid Webhook] Type: ${webhook_type}, Code: ${webhook_code}, Item: ${item_id}`
      );

      // TODO: In production, verify webhook signature
      // const signature = req.headers['plaid-verification'];
      // if (!verifyPlaidSignature(req.body, signature)) {
      //   res.status(401).json({ error: 'Invalid signature' });
      //   return;
      // }

      // Get item to retrieve user_id
      const plaidItem = await plaidService.getItem(item_id);

      switch (webhook_type) {
        case "TRANSACTIONS":
          // Handle transaction webhooks
          if (
            webhook_code === "INITIAL_UPDATE" ||
            webhook_code === "HISTORICAL_UPDATE"
          ) {
            console.log(
              `[Plaid Webhook] Initial transaction update for item ${item_id}`
            );
            // Trigger initial 2-year transaction sync
            await transactionSyncService.syncTransactions(
              plaidItem.user_id,
              item_id
            );
          } else if (webhook_code === "DEFAULT_UPDATE") {
            console.log(
              `[Plaid Webhook] Default transaction update for item ${item_id}`
            );
            // Sync new/modified transactions
            await transactionSyncService.syncTransactions(
              plaidItem.user_id,
              item_id
            );
          } else if (webhook_code === "TRANSACTIONS_REMOVED") {
            console.log(
              `[Plaid Webhook] Transactions removed for item ${item_id}`
            );
            // Handle removed transactions (already handled in sync)
            await transactionSyncService.syncTransactions(
              plaidItem.user_id,
              item_id
            );
          }
          break;

        case "ITEM":
          // Handle item-level webhooks
          if (webhook_code === "ERROR") {
            console.error(`[Plaid Webhook] Item error for ${item_id}:`, error);
            await plaidService.handleItemError(
              item_id,
              error?.error_code || "UNKNOWN_ERROR",
              error?.error_message || "Unknown error occurred"
            );
          } else if (webhook_code === "PENDING_EXPIRATION") {
            console.warn(
              `[Plaid Webhook] Item ${item_id} access will expire soon`
            );
            // Update status to require reauth
            await plaidService.handleItemError(
              item_id,
              "ITEM_LOGIN_REQUIRED",
              "Access will expire soon - user needs to re-authenticate"
            );
          } else if (webhook_code === "LOGIN_REPAIRED") {
            console.log(`[Plaid Webhook] Item ${item_id} login repaired`);
            // Reset item status to active
            await plaidService.resetItemStatus(item_id);
          }
          break;

        case "SYNC_UPDATES_AVAILABLE":
          console.log(
            `[Plaid Webhook] Sync updates available for item ${item_id}`
          );
          await transactionSyncService.syncTransactions(
            plaidItem.user_id,
            item_id
          );
          break;

        default:
          console.log(
            `[Plaid Webhook] Unhandled webhook type: ${webhook_type}`
          );
      }

      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("[Plaid Webhook Error]:", error);
      // Still return 200 to prevent Plaid from retrying
      res.status(200).json({
        received: true,
        error: "Processing error - logged for review",
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

      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      // If itemId is provided, sync that specific item
      if (itemId) {
        const result = await transactionSyncService.syncTransactions(
          userId,
          itemId
        );
        res.json({
          success: true,
          message: "Transaction sync completed",
          itemId,
          ...result,
        });
        return;
      }

      // Otherwise, sync all items for the user
      const { items } = await plaidService.getItemStatus(userId);

      if (!items || items.length === 0) {
        res.json({
          success: true,
          message: "No Plaid items found for user",
          totalAdded: 0,
          totalUpdated: 0,
          totalRemoved: 0,
        });
        return;
      }

      // Sync all items in parallel
      const syncResults = await Promise.allSettled(
        items.map((item) =>
          transactionSyncService.syncTransactions(userId, item.item_id)
        )
      );

      // Aggregate results
      let totalAdded = 0;
      let totalUpdated = 0;
      let totalRemoved = 0;
      let successCount = 0;
      let failCount = 0;

      syncResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
          totalAdded += result.value.added;
          totalUpdated += result.value.updated;
          totalRemoved += result.value.removed;
        } else {
          failCount++;
          console.error(
            `Failed to sync item ${items[index].item_id}:`,
            result.reason
          );
        }
      });

      res.json({
        success: true,
        message: "Transaction sync completed for all items",
        totalItems: items.length,
        successCount,
        failCount,
        totalAdded,
        totalUpdated,
        totalRemoved,
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
