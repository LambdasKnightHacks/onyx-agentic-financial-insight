"""Input validation utilities for transaction data."""

from typing import Dict, Any
from decimal import Decimal, InvalidOperation
import re

def validate_transaction_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and normalize incoming transaction data based on actual schema.
    
    Args:
        data: Raw transaction dictionary
        
    Returns:
        Validated and normalized transaction data
        
    Raises:
        ValueError: If required fields are missing or invalid
    """
    required_fields = ["plaid_transaction_id", "amount", "merchant_name", "posted_at", "user_id"]
    
    # Check required fields
    missing = [field for field in required_fields if field not in data]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    
    # Validate amount (numeric(12,2) in schema)
    try:
        amount = Decimal(str(data["amount"]))
        if amount <= 0:
            raise ValueError("Amount must be positive")
        # Ensure it fits numeric(12,2) - max 10 digits before decimal, 2 after
        if amount.as_tuple().exponent < -2:
            raise ValueError("Amount cannot have more than 2 decimal places")
        if len(str(int(amount))) > 10:
            raise ValueError("Amount too large for database field")
    except (InvalidOperation, ValueError) as e:
        raise ValueError(f"Invalid amount: {e}")
    
    # Validate date format (date type in schema)
    posted_at = data["posted_at"]
    if not isinstance(posted_at, str) or not re.match(r'^\d{4}-\d{2}-\d{2}$', posted_at):
        raise ValueError("posted_at must be in YYYY-MM-DD format")
    
    # Validate authorized_date if present
    if "authorized_date" in data and data["authorized_date"]:
        auth_date = data["authorized_date"]
        if not isinstance(auth_date, str) or not re.match(r'^\d{4}-\d{2}-\d{2}$', auth_date):
            raise ValueError("authorized_date must be in YYYY-MM-DD format")
    
    # Validate user_id (uuid type in schema)
    user_id = data["user_id"]
    if not isinstance(user_id, str) or len(user_id) != 36:
        raise ValueError("user_id must be a valid UUID string")
    
    # Validate account_id if present (uuid type in schema)
    if "account_id" in data and data["account_id"]:
        account_id = data["account_id"]
        if not isinstance(account_id, str) or len(account_id) != 36:
            raise ValueError("account_id must be a valid UUID string")
    
    # Normalize merchant name
    merchant_name = data["merchant_name"]
    if merchant_name:
        merchant_name = merchant_name.strip().title()
    
    # Validate MCC if present (integer in schema)
    if "mcc" in data and data["mcc"] is not None:
        try:
            mcc = int(data["mcc"])
            if mcc < 0 or mcc > 9999:
                raise ValueError("MCC must be between 0 and 9999")
        except (ValueError, TypeError):
            raise ValueError("MCC must be a valid integer")
    
    # Validate geo coordinates if present
    if "geo_lat" in data and data["geo_lat"] is not None:
        try:
            lat = float(data["geo_lat"])
            if not -90 <= lat <= 90:
                raise ValueError("Latitude must be between -90 and 90")
        except (ValueError, TypeError):
            raise ValueError("geo_lat must be a valid number")
    
    if "geo_lon" in data and data["geo_lon"] is not None:
        try:
            lon = float(data["geo_lon"])
            if not -180 <= lon <= 180:
                raise ValueError("Longitude must be between -180 and 180")
        except (ValueError, TypeError):
            raise ValueError("geo_lon must be a valid number")
    
    return {
        **data,
        "amount": float(amount),
        "merchant_name": merchant_name,
        "status": data.get("status", "processed"),  # Default from schema
        "pending": data.get("pending", False),      # Default from schema
        "source": data.get("source", "plaid")       # Default from schema
    }

def validate_user_id(user_id: str) -> str:
    """Validate user ID format (UUID)."""
    if not user_id or not isinstance(user_id, str):
        raise ValueError("user_id must be a non-empty string")
    
    # UUID format validation
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    if not re.match(uuid_pattern, user_id.lower()):
        raise ValueError("user_id must be a valid UUID format")
    
    return user_id.strip()

def validate_alert_data(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate alert data for database insertion."""
    required_fields = ["type", "tx_id", "user_id"]
    missing = [field for field in required_fields if field not in alert_data]
    if missing:
        raise ValueError(f"Missing required alert fields: {missing}")
    
    # Validate alert type
    valid_types = ["duplicate", "velocity", "outlier", "geo", "fraud", "budget", "cashflow"]
    if alert_data["type"] not in valid_types:
        raise ValueError(f"Invalid alert type. Must be one of: {valid_types}")
    
    # Validate severity
    if "severity" in alert_data:
        valid_severities = ["info", "warn", "critical"]
        if alert_data["severity"] not in valid_severities:
            raise ValueError(f"Invalid severity. Must be one of: {valid_severities}")
    
    # Validate score (numeric type in schema)
    if "score" in alert_data and alert_data["score"] is not None:
        try:
            score = float(alert_data["score"])
            if not 0 <= score <= 1:
                raise ValueError("Score must be between 0 and 1")
        except (ValueError, TypeError):
            raise ValueError("Score must be a valid number")
    
    return alert_data