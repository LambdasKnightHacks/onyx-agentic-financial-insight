"""Configuration and constants for the transaction analysis pipeline."""

import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Simple in-memory cache for user context data
_user_context_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl_seconds = 300  # 5 minutes

# Google ADK 
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# Shared LLM Client (singleton pattern for efficiency)
_llm_client = None

def get_llm_client():
    """Get shared LLM client instance for all agents."""
    global _llm_client
    if _llm_client is None:
        from google.genai import Client
        _llm_client = Client()
    return _llm_client

# LLM Configuration
LLM_MODEL = "gemini-2.5-flash-lite"  # Using fast, stable, widely-available model
LLM_TIMEOUT = 10  # seconds

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Database Table Names (matching actual schema)
TABLES = {
    "users": "users",
    "accounts": "accounts", 
    "transactions": "transactions",
    "category_rules": "category_rules",
    "alerts": "alerts",
    "agent_runs": "agent_runs",
    "insights": "insights",
    "feedback": "feedback",
    "plaid_items": "plaid_items"
}

# Alert Types (based on schema)
ALERT_TYPES = {
    "DUPLICATE": "duplicate",
    "VELOCITY": "velocity", 
    "OUTLIER": "outlier",
    "GEO": "geo",
    "FRAUD": "fraud",
    "BUDGET": "budget",
    "CASHFLOW": "cashflow"
}

# Alert Severity Levels
SEVERITY_LEVELS = {
    "INFO": "info",
    "WARN": "warn", 
    "CRITICAL": "critical"
}

# Agent Run Modes
AGENT_MODES = {
    "PER_TX": "per_tx",
    "MICRO_BATCH": "micro_batch"
}

# Agent Run Status
AGENT_STATUS = {
    "RUNNING": "running",
    "PARTIAL": "partial",
    "DONE": "done",
    "ERROR": "error"
}

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

def get_cached_user_context(user_id: str) -> Optional[Dict[str, Any]]:
    """Get cached user context if available and not expired."""
    if user_id in _user_context_cache:
        cache_entry = _user_context_cache[user_id]
        cache_time = cache_entry.get("cached_at")
        if cache_time and (datetime.now() - cache_time).total_seconds() < _cache_ttl_seconds:
            return cache_entry.get("data")
    return None

def set_cached_user_context(user_id: str, data: Dict[str, Any]):
    """Cache user context data."""
    _user_context_cache[user_id] = {
        "data": data,
        "cached_at": datetime.now()
    }

def clear_user_cache(user_id: str = None):
    """Clear cache for specific user or all users."""
    if user_id:
        _user_context_cache.pop(user_id, None)
    else:
        _user_context_cache.clear()

# Validate config on import
if not validate_config():
    print("Warning: Some configuration variables are missing. Check your .env file.")