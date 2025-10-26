"""Configuration for Financial Summary Module"""

import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get Supabase client configured from environment variables."""
    supabase_url = os.getenv("SUPABASE_URL")
    # Use service key to bypass RLS for backend operations
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY/SUPABASE_ANON_KEY must be set in environment variables")
    
    return create_client(supabase_url, supabase_key)
