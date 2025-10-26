import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase";
import { transformSupabaseTransactionToTransaction } from "@/src/types/database-types";
import { getUserIdFromRequest } from "@/src/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const suspicious = searchParams.get("suspicious");
    const limit = searchParams.get("limit");

    console.log("[Transactions API] GET request received");
    console.log("[Transactions API] Query params:", {
      accountId,
      suspicious,
      limit,
    });

    const userId = await getUserIdFromRequest(request);

    console.log("[Transactions API] User ID from request:", userId);

    if (!userId) {
      console.log("[Transactions API] No user ID - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("posted_at", { ascending: false });

    console.log("[Transactions API] Building query for user:", userId);

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (suspicious === "true") {
      query = query.gt("fraud_score", 0.5);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    console.log("[Transactions API] Executing query...");
    const { data: transactions, error } = await query;

    console.log("[Transactions API] Query executed");
    console.log("[Transactions API] Error:", error);
    console.log("[Transactions API] Raw data:", transactions);

    if (error) {
      console.error("[Transactions API] Error fetching transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    console.log(
      `[Transactions API] Found ${transactionsArray.length} transactions for user ${userId}`
    );

    if (transactionsArray.length > 0) {
      console.log(
        "[Transactions API] First transaction sample:",
        transactionsArray[0]
      );
    }

    const transformedTransactions = transactionsArray.map(
      transformSupabaseTransactionToTransaction
    );

    console.log(
      "[Transactions API] Transformed transactions:",
      transformedTransactions.length
    );
    console.log("[Transactions API] Returning response");

    return NextResponse.json(transformedTransactions);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.amount || !body.posted_at) {
      return NextResponse.json(
        { error: "Missing required fields: amount and posted_at are required" },
        { status: 400 }
      );
    }

    // Database constraint currently only accepts 'plaid' as source
    const source = "plaid";

    // expected transaction data
    const transactionData = {
      user_id: userId,
      account_id: body.account_id || null,
      plaid_transaction_id: body.plaid_transaction_id || null,
      source: source,
      posted_at: body.posted_at,
      authorized_date: body.authorized_date || null,
      amount: body.amount,
      currency: body.currency || "USD",
      merchant_name: body.merchant_name || null,
      merchant: body.merchant || body.merchant_name || null,
      description: body.description || body.merchant_name || null,
      category: body.category || null,
      subcategory: body.subcategory || null,
      pending: body.pending ?? false,
      payment_channel: body.payment_channel || null,
      status: body.pending ? "pending" : "posted", // Use 'posted' or 'pending' to match database constraint
      location_city: body.location_city || null,
      location_state: body.location_state || null,
      geo_lat: body.geo_lat || null,
      geo_lon: body.geo_lon || null,
      mcc: body.mcc || null,
      category_confidence: body.category_confidence || null,
      fraud_score: body.fraud_score || null,
      category_reason: body.category_reason || null,
      raw: body.raw || null,
      hash: body.hash || null,
      ingested_at: new Date().toISOString(),
    };

    // Debug: Print the full payload being sent to database
    console.log("=== TRANSACTION API PAYLOAD DEBUG ===");
    console.log("Full transaction data being sent to database:");
    console.log(JSON.stringify(transactionData, null, 2));
    console.log("=== END API PAYLOAD DEBUG ===");

    console.log(
      "Creating transaction:",
      transactionData.merchant_name,
      transactionData.amount
    );

    // Insert transaction into database
    const { data: transaction, error } = await supabaseAdmin
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      return NextResponse.json(
        {
          error: "Failed to create transaction",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Update account balance if account_id is provided
    if (transactionData.account_id) {
      try {
        // Get the latest balance for this account
        const { data: latestBalance, error: balanceError } = await supabaseAdmin
          .from("account_balances")
          .select("current, available")
          .eq("account_id", transactionData.account_id)
          .order("as_of", { ascending: false })
          .limit(1)
          .single();

        if (!balanceError && latestBalance) {
          // Calculate new balances
          const newCurrent = (latestBalance.current || 0) - Math.abs(transactionData.amount)
          const newAvailable = (latestBalance.available || 0) - Math.abs(transactionData.amount)

          // Insert new balance record
          await supabaseAdmin.from("account_balances").insert({
            account_id: transactionData.account_id,
            as_of: new Date().toISOString(),
            current: newCurrent,
            available: newAvailable,
            currency: transactionData.currency || "USD",
            source: "manual",
          });

          console.log(
            `Updated balance for account ${transactionData.account_id}`
          );
        }
      } catch (balanceUpdateError) {
        console.error("Error updating account balance:", balanceUpdateError);
        // Don't fail the transaction if balance update fails
      }
    }

    console.log("Transaction created successfully:", transaction.id);

    // Transform and return the created transaction
    const transformedTransaction =
      transformSupabaseTransactionToTransaction(transaction);
    return NextResponse.json(transformedTransaction, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
