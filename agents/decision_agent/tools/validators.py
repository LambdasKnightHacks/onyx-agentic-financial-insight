"""
Data validation utilities for decision analysis

Validates user inputs, financial data, and decision parameters
before processing through the agent pipeline.
"""

from typing import Dict, Any, List, Tuple
from ..config import VALIDATION_RULES


def validate_decision_request(
    user_id: str,
    decision_type: str,
    options: List[Dict[str, Any]],
    preferences: Dict[str, Any],
    constraints: Dict[str, Any]
) -> Tuple[bool, List[str]]:
    """
    Validate decision analysis request parameters
    
    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []
    
    # Validate user_id
    if not user_id or not isinstance(user_id, str):
        errors.append("Invalid user_id")
    
    # Validate decision_type
    valid_types = [
        'car_lease_vs_finance',
        'car_lease_vs_buy',
        'mortgage_vs_rent',
        'travel_timing',
        'generic_purchase'
    ]
    if decision_type not in valid_types:
        errors.append(f"Invalid decision_type. Must be one of: {', '.join(valid_types)}")
    
    # Validate options (must have at least 2 options to compare)
    if not options or not isinstance(options, list):
        errors.append("Options must be a non-empty list")
    elif len(options) < 2:
        errors.append("Must provide at least 2 options to compare")
    
    # Validate each option has required fields
    for idx, option in enumerate(options):
        if not isinstance(option, dict):
            errors.append(f"Option {idx + 1} must be a dictionary")
            continue
        
        if 'type' not in option:
            errors.append(f"Option {idx + 1} missing 'type' field")
        
        # Decision-specific validations
        if decision_type == 'car_lease_vs_finance':
            errors.extend(_validate_car_option(option, idx + 1))
    
    # Validate preferences and constraints are dictionaries
    if preferences and not isinstance(preferences, dict):
        errors.append("Preferences must be a dictionary")
    
    if constraints and not isinstance(constraints, dict):
        errors.append("Constraints must be a dictionary")
    
    return (len(errors) == 0, errors)


def _validate_car_option(option: Dict[str, Any], option_num: int) -> List[str]:
    """Validate car-specific option parameters"""
    errors = []
    option_type = option.get('type')
    
    if option_type == 'lease':
        required_fields = [
            'monthly_payment',
            'down_payment',
            'lease_term_months',
            'miles_per_year',
            'mileage_cap'
        ]
        for field in required_fields:
            if field not in option:
                errors.append(f"Lease option {option_num} missing required field: {field}")
            elif not isinstance(option[field], (int, float)) or option[field] < 0:
                errors.append(f"Lease option {option_num} '{field}' must be a positive number")
    
    elif option_type == 'finance':
        required_fields = [
            'purchase_price',
            'down_payment',
            'apr',
            'loan_term_months'
        ]
        for field in required_fields:
            if field not in option:
                errors.append(f"Finance option {option_num} missing required field: {field}")
            elif not isinstance(option[field], (int, float)) or option[field] < 0:
                errors.append(f"Finance option {option_num} '{field}' must be a positive number")
        
        # APR should be reasonable (0-30%)
        if 'apr' in option and (option['apr'] < 0 or option['apr'] > 0.30):
            errors.append(f"Finance option {option_num} APR seems unrealistic (should be 0-30%)")
    
    return errors


def validate_user_profile(user_profile: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate user financial profile from Data Fusion Agent
    
    Ensures profile has necessary data for analysis
    """
    errors = []
    
    required_fields = [
        'total_balance',
        'monthly_income',
        'average_monthly_expenses'
    ]
    
    for field in required_fields:
        if field not in user_profile:
            errors.append(f"User profile missing required field: {field}")
        elif not isinstance(user_profile[field], (int, float)):
            errors.append(f"User profile '{field}' must be a number")
        elif user_profile[field] < 0:
            errors.append(f"User profile '{field}' cannot be negative")
    
    # Validate minimum balance
    if 'total_balance' in user_profile:
        if user_profile['total_balance'] < VALIDATION_RULES['min_analysis_balance']:
            errors.append(
                f"Total balance (${user_profile['total_balance']:.2f}) is too low for decision analysis. "
                f"Minimum: ${VALIDATION_RULES['min_analysis_balance']}"
            )
    
    # Validate income makes sense
    if 'monthly_income' in user_profile:
        if user_profile['monthly_income'] < VALIDATION_RULES['min_monthly_income']:
            errors.append(
                f"Monthly income (${user_profile['monthly_income']:.2f}) seems too low. "
                f"Minimum: ${VALIDATION_RULES['min_monthly_income']}"
            )
    
    # Validate expenses don't exceed income by too much
    if all(field in user_profile for field in ['monthly_income', 'average_monthly_expenses']):
        if user_profile['average_monthly_expenses'] > user_profile['monthly_income'] * 1.5:
            errors.append(
                "Monthly expenses significantly exceed income. "
                "Profile may be incomplete or inaccurate."
            )
    
    return (len(errors) == 0, errors)


def validate_tco_calculation(tco_result: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate TCO calculation results
    
    Ensures calculation produced reasonable results
    """
    errors = []
    
    required_fields = ['tco_expected', 'tco_breakdown', 'monthly_equivalent']
    
    for field in required_fields:
        if field not in tco_result:
            errors.append(f"TCO result missing required field: {field}")
    
    # Validate TCO is positive and reasonable
    if 'tco_expected' in tco_result:
        tco = tco_result['tco_expected']
        if tco < 0:
            errors.append("TCO cannot be negative")
        elif tco > 1000000:  # $1M sanity check
            errors.append(f"TCO seems unrealistically high: ${tco:,.2f}")
    
    # Validate breakdown sums reasonably
    if 'tco_breakdown' in tco_result and 'tco_expected' in tco_result:
        breakdown = tco_result['tco_breakdown']
        if isinstance(breakdown, dict):
            total = sum(v for v in breakdown.values() if isinstance(v, (int, float)))
            expected = tco_result['tco_expected']
            
            # Allow some variance for resale value subtraction
            if abs(total - expected) > expected * 0.5:
                errors.append(
                    f"TCO breakdown doesn't match expected TCO: "
                    f"breakdown sum=${total:,.2f}, expected=${expected:,.2f}"
                )
    
    return (len(errors) == 0, errors)


def sanitize_input_data(data: Any, max_depth: int = 10) -> Any:
    """
    Sanitize input data for safe storage and processing
    
    Removes any potentially dangerous content and limits depth
    to prevent memory issues with deeply nested structures
    """
    if max_depth <= 0:
        return "[MAX_DEPTH_EXCEEDED]"
    
    if isinstance(data, dict):
        return {
            k: sanitize_input_data(v, max_depth - 1)
            for k, v in data.items()
            if isinstance(k, str)  # Only allow string keys
        }
    elif isinstance(data, list):
        return [sanitize_input_data(item, max_depth - 1) for item in data[:1000]]  # Limit list size
    elif isinstance(data, (str, int, float, bool)) or data is None:
        return data
    else:
        return str(data)  # Convert other types to string

