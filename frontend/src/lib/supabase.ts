import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Debug logging
if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}
if (!supabaseAnonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}
if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined");
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client for browser/frontend use
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createBrowserClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          created_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string | null;
          currency: string;
          display_mask: string | null;
          created_at: string;
          institution: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: string | null;
          currency?: string;
          display_mask?: string | null;
          created_at?: string;
          institution?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string | null;
          currency?: string;
          display_mask?: string | null;
          created_at?: string;
          institution?: string | null;
        };
      };
      account_balances: {
        Row: {
          id: string;
          account_id: string;
          as_of: string;
          current: number | null;
          available: number | null;
          currency: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          as_of: string;
          current?: number | null;
          available?: number | null;
          currency?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          as_of?: string;
          current?: number | null;
          available?: number | null;
          currency?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          plaid_transaction_id?: string | null;
          source?: string;
          posted_at: string;
          authorized_date?: string | null;
          amount: number;
          currency?: string | null;
          merchant_name?: string | null;
          merchant?: string | null;
          description?: string | null;
          category?: string | null;
          subcategory?: string | null;
          pending?: boolean;
          payment_channel?: string | null;
          status?: string;
          location_city?: string | null;
          location_state?: string | null;
          geo_lat?: number | null;
          geo_lon?: number | null;
          mcc?: number | null;
          category_confidence?: number | null;
          fraud_score?: number | null;
          category_reason?: string | null;
          raw?: any | null;
          hash?: string | null;
          ingested_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          plaid_transaction_id?: string | null;
          source?: string;
          posted_at?: string;
          authorized_date?: string | null;
          amount?: number;
          currency?: string | null;
          merchant_name?: string | null;
          merchant?: string | null;
          description?: string | null;
          category?: string | null;
          subcategory?: string | null;
          pending?: boolean;
          payment_channel?: string | null;
          status?: string;
          location_city?: string | null;
          location_state?: string | null;
          geo_lat?: number | null;
          geo_lon?: number | null;
          mcc?: number | null;
          category_confidence?: number | null;
          fraud_score?: number | null;
          category_reason?: string | null;
          raw?: any | null;
          hash?: string | null;
          ingested_at?: string;
        };
      };
      insights: {
        Row: {
          id: string;
          user_id: string;
          run_id: string | null;
          title: string;
          body: string | null;
          data: any | null;
          severity: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          run_id?: string | null;
          title: string;
          body?: string | null;
          data?: any | null;
          severity?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          run_id?: string | null;
          title?: string;
          body?: string | null;
          data?: any | null;
          severity?: string | null;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          tx_id: string;
          type: string;
          score: number | null;
          reason: string | null;
          severity: string | null;
          created_at: string;
          resolved: boolean;
          status: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tx_id: string;
          type: string;
          score?: number | null;
          reason?: string | null;
          severity?: string | null;
          created_at?: string;
          resolved?: boolean;
          status?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tx_id?: string;
          type?: string;
          score?: number | null;
          reason?: string | null;
          severity?: string | null;
          created_at?: string;
          resolved?: boolean;
          status?: string | null;
        };
      };
    };
  };
}
