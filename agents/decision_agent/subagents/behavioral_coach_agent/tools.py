"""
Behavioral Coach Tools

Helper functions for budget recommendation generation.
"""

from typing import Dict, Any, List
import json


def parse_llm_budget_recommendations(llm_output: str) -> Dict[str, Any]:
    """
    Parse LLM output into structured budget recommendations
    
    Args:
        llm_output: Raw LLM response
    
    Returns:
        Dict with parsed recommendations or error
    """
    try:
        # Try to extract JSON from the response
        # Sometimes LLM includes markdown code blocks
        if "```json" in llm_output:
            start = llm_output.find("```json") + 7
            end = llm_output.find("```", start)
            json_str = llm_output[start:end].strip()
        elif "```" in llm_output:
            start = llm_output.find("```") + 3
            end = llm_output.find("```", start)
            json_str = llm_output[start:end].strip()
        else:
            json_str = llm_output.strip()
        
        # Parse JSON
        recommendations = json.loads(json_str)
        
        # Validate structure
        if "recommendations" not in recommendations:
            return {
                "success": False,
                "error": "Missing 'recommendations' field in LLM output"
            }
        
        return {
            "success": True,
            "data": recommendations
        }
    
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"JSON parsing error: {str(e)}",
            "raw_output": llm_output[:500]  # Include first 500 chars for debugging
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }


def validate_budget_recommendations(recommendations: List[Dict[str, Any]], required_savings: float) -> Dict[str, Any]:
    """
    Validate that recommendations meet requirements
    
    Args:
        recommendations: List of recommendation dicts
        required_savings: Minimum savings needed
    
    Returns:
        Dict with validation results
    """
    total_savings = sum(rec.get("monthly_savings", 0) for rec in recommendations)
    
    issues = []
    
    # Check if total savings meets requirement
    if total_savings < required_savings:
        issues.append(f"Total savings (${total_savings:.2f}) below required (${required_savings:.2f})")
    
    # Check each recommendation has required fields
    required_fields = [
        "category", "subcategory", "action", "current_monthly",
        "suggested_monthly", "monthly_savings", "specific_change",
        "behavioral_tip", "difficulty", "lifestyle_impact"
    ]
    
    for i, rec in enumerate(recommendations):
        for field in required_fields:
            if field not in rec:
                issues.append(f"Recommendation {i+1} missing field: {field}")
    
    return {
        "is_valid": len(issues) == 0,
        "total_savings": total_savings,
        "meets_requirement": total_savings >= required_savings,
        "issues": issues
    }


def format_recommendations_for_database(
    recommendations: List[Dict[str, Any]],
    analysis_id: str
) -> List[Dict[str, Any]]:
    """
    Format recommendations for database insertion
    
    Args:
        recommendations: List of recommendation dicts
        analysis_id: ID of the decision analysis
    
    Returns:
        List of dicts ready for database insertion
    """
    formatted = []
    
    for i, rec in enumerate(recommendations):
        formatted.append({
            "analysis_id": analysis_id,
            "recommendation_type": "budget_cut" if rec["action"] == "reduce" else "budget_increase",
            "category": rec["category"],
            "subcategory": rec.get("subcategory"),
            "current_value": rec.get("current_monthly", 0),
            "suggested_value": rec.get("suggested_monthly", 0),
            "monthly_impact": rec.get("monthly_savings", 0),
            "reasoning": f"{rec.get('specific_change', '')} - {rec.get('behavioral_tip', '')}",
            "priority": (i + 1) * 10,  # Priority based on order
            "is_applied": False
        })
    
    return formatted

