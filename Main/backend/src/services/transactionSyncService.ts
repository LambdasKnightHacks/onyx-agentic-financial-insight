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
      const { data: itemData, error: itemError } = await supabase
        .from("plaid_items")
        .select("cursor")
        .eq("item_id", itemId)
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
      const processedCount = await this.processTransactions(
        userId,
        added.concat(modified)
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

      const { data, error } = await supabase
        .from("plaid_transactions")
        .upsert(transactionData, {
          onConflict: "plaid_transaction_id",
        })
        .select();

      if (error) {
        console.error("Error upserting transaction:", error);
      } else if (data) {
        // This is a simplification; upsert doesn't tell us if it was an insert or update.
        // For more accuracy, you might need to select before upserting.
        updatedCount++;
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
      .from("plaid_transactions")
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
  ): Promise<Partial<PlaidTransaction>> {
    const { data: accountData } = await supabase
      .from("plaid_accounts")
      .select("id")
      .eq("plaid_account_id", tx.account_id)
      .single();

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(tx))
      .digest("hex");

    return {
      user_id: userId,
      account_id: accountData?.id || null,
      plaid_transaction_id: tx.transaction_id,
      source: "plaid",
      posted_at: tx.date,
      authorized_date: tx.authorized_date,
      amount: tx.amount,
      currency: tx.iso_currency_code,
      merchant_name: tx.merchant_name,
      description: tx.name,
      category: tx.category?.join(", "),
      pending: tx.pending,
      payment_channel: tx.payment_channel,
      status: tx.pending ? "pending" : "posted",
      location_city: tx.location.city,
      location_state: tx.location.region,
      geo_lat: tx.location.lat,
      geo_lon: tx.location.lon,
      mcc: tx.personal_finance_category?.detailed
        ? parseInt(tx.personal_finance_category.detailed.split("_")[1])
        : null,
      raw: tx,
      hash,
    };
  }

  /**
   * Updates the cursor for a given Plaid item.
   */
  private async updateCursor(itemId: string, cursor: string): Promise<void> {
    const { error } = await supabase
      .from("plaid_items")
      .update({ cursor })
      .eq("item_id", itemId);

    if (error) {
      console.error("Error updating cursor:", error);
      throw new Error(`Failed to update cursor: ${error.message}`);
    }
  }
}

export default new TransactionSyncService();
