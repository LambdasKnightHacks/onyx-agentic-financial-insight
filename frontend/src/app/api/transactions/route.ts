import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase";
import { transformSupabaseTransactionToTransaction } from "@/src/types/database-types";
import { getUserIdFromRequest } from "@/src/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const suspicious = searchParams.get("suspicious");

    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching transactions for user:", userId);

    let query = supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("posted_at", { ascending: false });

    // Apply filters
    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (suspicious === "true") {
      query = query.gt("fraud_score", 0.5);
    }

    const { data: transactions, error } = await query;

    console.log(
      "Query result - transactions found:",
      transactions?.length || 0
    );
    if (error) {
      console.error("Database error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    }

    if (!transactions) {
      console.error("Transactions is null or undefined");
    }

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Ensure we always return an array
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const transformedTransactions = transactionsArray.map(
      transformSupabaseTransactionToTransaction
    );

    return NextResponse.json(transformedTransactions);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
