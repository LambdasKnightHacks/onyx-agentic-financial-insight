import { supabase, PlaidTransaction } from "../utils/database";
import plaidService from "./plaidService";
import { Transaction } from "plaid";
import crypto from "crypto";

class TransactionSyncService {
  /**
   * Fetches transactions from Plaid and syncs them with the local database.
   * Uses a cursor for pagination to avoid duplicate data.
   */
  async syncTransactions(
    userId: string,
    itemId: string
  ): Promise<{ added: number; updated: number; removed: number }> {
    try {
      // Get the access token for this item
      const accessToken = await plaidService.getAccessToken(userId, itemId);

      // Get current cursor from the database
      // itemId here is the database UUID (plaid_items.id), not the Plaid item_id
      const { data: itemData, error: itemError } = await supabase
        .from("plaid_items")
        .select("cursor")
        .eq("id", itemId)
        .single();

      if (itemError) {
        throw new Error(`Failed to get cursor: ${itemError.message}`);
      }

      let cursor = itemData?.cursor || null;

      let added: Transaction[] = [];
      let modified: Transaction[] = [];
      let removed: { transaction_id?: string }[] = [];
      let hasMore = true;

      // Fetch transactions page by page until all are retrieved
      while (hasMore) {
        const response = await plaidService.getTransactions(
          accessToken,
          cursor
        );
        added = added.concat(response.added);
        modified = modified.concat(response.modified);
        removed = removed.concat(response.removed);
        hasMore = response.has_more;
        cursor = response.next_cursor;
      }

      // Process added and modified transactions
      // Filter out any undefined/null transactions
      const allTransactions = added
        .concat(modified)
        .filter((tx) => tx !== null && tx !== undefined);

      console.log(
        `[Transaction Sync] Processing ${allTransactions.length} transactions (${added.length} added, ${modified.length} modified)`
      );

      const processedCount = await this.processTransactions(
        userId,
        allTransactions
      );

      // Process removed transactions
      const removedCount = await this.removeTransactions(removed);

      // Update cursor in the database
      if (cursor) {
        await this.updateCursor(itemId, cursor);
      }

      return {
        added: processedCount.added,
        updated: processedCount.updated,
        removed: removedCount,
      };
    } catch (error) {
      console.error("Error syncing transactions:", error);
      throw error;
    }
  }

  /**
   * Inserts or updates a batch of transactions in the database.
   */
  private async processTransactions(
    userId: string,
    transactions: Transaction[]
  ): Promise<{ added: number; updated: number }> {
    let addedCount = 0;
    let updatedCount = 0;

    for (const tx of transactions) {
      const transactionData = await this.transformTransaction(userId, tx);

      // Skip if transformation returned null (account not found)
      if (!transactionData) {
        continue;
      }

      // Check if transaction already exists to accurately track adds vs updates
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id")
        .eq("plaid_transaction_id", tx.transaction_id)
        .single();

      const isUpdate = !!existingTx;

      const { data, error } = await supabase
        .from("transactions")
        .upsert(transactionData, {
          onConflict: "plaid_transaction_id",
        })
        .select();

      if (error) {
        console.error("Error upserting transaction:", error);
        console.error("Transaction data:", {
          plaid_transaction_id: transactionData.plaid_transaction_id,
          merchant: transactionData.merchant_name,
          amount: transactionData.amount,
        });
      } else if (data) {
        if (isUpdate) {
          updatedCount++;
        } else {
          addedCount++;
          // Update account balance for newly added transactions
          if (
            transactionData.account_id &&
            transactionData.amount !== undefined
          ) {
            await this.updateAccountBalance(
              transactionData.account_id,
              transactionData.amount,
              transactionData.currency || "USD"
            );
          }
        }
      }
    }

    return { added: addedCount, updated: updatedCount };
  }

  /**
   * Removes transactions from the database based on their Plaid transaction ID.
   */
  private async removeTransactions(
    transactions: { transaction_id?: string }[]
  ): Promise<number> {
    const transactionIds = transactions
      .map((t) => t.transaction_id)
      .filter(Boolean) as string[];

    if (transactionIds.length === 0) {
      return 0;
    }

    const { error, count } = await supabase
      .from("transactions")
      .delete()
      .in("plaid_transaction_id", transactionIds);

    if (error) {
      console.error("Error removing transactions:", error);
    }

    return count || 0;
  }

  /**
   * Maps a Plaid transaction to the database schema.
   */
  private async transformTransaction(
    userId: string,
    tx: Transaction
  ): Promise<Partial<PlaidTransaction> | null> {
    const { data: accountData } = await supabase
      .from("accounts")
      .select("id")
      .eq("plaid_account_id", tx.account_id)
      .single();

    // If account not found, skip this transaction
    if (!accountData) {
      console.error(
        `[Transaction Sync] Account not found for plaid_account_id: ${tx.account_id}`
      );
      console.error(
        `[Transaction Sync] Skipping transaction: ${tx.transaction_id}`
      );
      return null;
    }

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(tx))
      .digest("hex");

    return {
      user_id: userId,
      account_id: accountData.id,
      plaid_transaction_id: tx.transaction_id,
      source: "plaid",
      posted_at: tx.date,
      authorized_date: tx.authorized_date || null,
      amount: tx.amount,
      currency: tx.iso_currency_code || "USD",
      merchant_name: tx.merchant_name || null,
      merchant: tx.merchant_name || null,
      description: tx.name || null,
      category: tx.category?.[0] || null,
      subcategory: tx.category?.[1] || null,
      pending: tx.pending ?? false,
      payment_channel: tx.payment_channel || null,
      status: tx.pending ? "pending" : "posted", // Use 'posted' or 'pending' to match database constraint
      location_city: tx.location?.city || null,
      location_state: tx.location?.region || null,
      geo_lat: tx.location?.lat || null,
      geo_lon: tx.location?.lon || null,
      mcc: null,
      category_confidence: null,
      fraud_score: null,
      category_reason: null,
      raw: tx,
      hash,
      ingested_at: new Date().toISOString(), // Add ingested timestamp
    };
  }

  /**
   * Updates account balance after a new transaction is added.
   * Based on the transaction API route logic.
   */
  private async updateAccountBalance(
    accountId: string,
    transactionAmount: number,
    currency: string
  ): Promise<void> {
    try {
      // Get the latest balance for this account
      const { data: latestBalance, error: balanceError } = await supabase
        .from("account_balances")
        .select("current, available")
        .eq("account_id", accountId)
        .order("as_of", { ascending: false })
        .limit(1)
        .single();

      if (!balanceError && latestBalance) {
        // Calculate new balances - subtract absolute value for debits
        const newCurrent =
          (latestBalance.current || 0) - Math.abs(transactionAmount);
        const newAvailable =
          (latestBalance.available || 0) - Math.abs(transactionAmount);

        // Insert new balance record
        await supabase.from("account_balances").insert({
          account_id: accountId,
          as_of: new Date().toISOString(),
          current: newCurrent,
          available: newAvailable,
          currency: currency,
          source: "plaid",
        });

        console.log(
          `[Transaction Sync] Updated balance for account ${accountId}`
        );
      }
    } catch (error) {
      console.error(
        "[Transaction Sync] Error updating account balance:",
        error
      );
      // Don't fail the transaction if balance update fails
    }
  }

  /**
   * Updates the cursor for a given Plaid item.
   */
  private async updateCursor(itemId: string, cursor: string): Promise<void> {
    const { error } = await supabase
      .from("plaid_items")
      .update({ cursor })
      .eq("id", itemId);

    if (error) {
      console.error("Error updating cursor:", error);
      throw new Error(`Failed to update cursor: ${error.message}`);
    }
  }
}

export default new TransactionSyncService();
