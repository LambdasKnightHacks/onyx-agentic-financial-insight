import { createClient } from "@supabase/supabase-js";

// Database connection utility
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types for Plaid integration
export interface PlaidItem {
  id: string;
  user_id: string;
  item_id: string;
  access_token: string;
  institution_name: string;
  cursor: string | null;
  status: "active" | "error" | "requires_reauth";
  error_code: string | null;
  error_message: string | null;
  webhook_url: string | null;
  created_at: string;
}

export interface PlaidAccount {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  subtype?: string | null;
  currency: string;
  display_mask: string | null;
  institution: string | null;
  plaid_account_id: string | null;
  plaid_item_id: string | null;
  source: "plaid" | "manual";
  created_at: string;
}

export interface PlaidTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  plaid_transaction_id: string | null;
  source: string;
  posted_at: string;
  authorized_date: string | null;
  amount: number;
  currency: string | null;
  merchant_name: string | null;
  merchant: string | null;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  pending: boolean;
  payment_channel: string | null;
  status: string;
  location_city: string | null;
  location_state: string | null;
  geo_lat: number | null;
  geo_lon: number | null;
  mcc: number | null;
  category_confidence: number | null;
  fraud_score: number | null;
  category_reason: string | null;
  raw: any | null;
  hash: string | null;
  ingested_at: string;
}
