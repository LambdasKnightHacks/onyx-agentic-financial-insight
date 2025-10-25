"""JSON parsing utilities for LLM responses."""

import json
import re
from typing import Dict, Any, Optional


def parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    """
    Parse JSON from LLM response, handling markdown code blocks.
    
    This function tries multiple strategies to extract JSON from LLM responses:
    1. Direct JSON parsing
    2. Extract from markdown code blocks (```json ... ```)
    3. Find any JSON object pattern in the text
    
    Args:
        text: Raw text response from LLM
        
    Returns:
        Parsed JSON dict or None if parsing fails
    """
    if not text:
        return None
    
    try:
        # Try direct JSON parse first
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try extracting from markdown code blocks
    json_block_pattern = r'```(?:json)?\s*(\{[^`]+\})\s*```'
    match = re.search(json_block_pattern, text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try finding any JSON object
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    match = re.search(json_pattern, text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    return None
