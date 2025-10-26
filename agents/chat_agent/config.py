"""Configuration for the chat agent."""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# LLM Configuration
LLM_MODEL = "gemini-2.0-flash-exp"  # Use latest, fastest model

# Supabase client singleton
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get Supabase client singleton."""
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("Supabase URL and Service Key must be set in environment variables")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    return _supabase_client

def validate_config() -> bool:
    """Validate that all required configuration is present."""
    required_vars = [
        "SUPABASE_URL", 
        "SUPABASE_SERVICE_KEY"
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"Missing required environment variables: {missing}")
        return False
    
    return True

# Validate config on import
if not validate_config():
    print("Warning: Some configuration variables are missing. Check your .env file.")

