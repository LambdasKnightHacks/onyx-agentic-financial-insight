"""JSON parsing utilities for LLM responses."""

import json
import re
from typing import Dict, Any, Optional


def parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    """
    Parse JSON from LLM response, handling markdown code blocks and malformed JSON.
    
    This function tries multiple strategies to extract JSON from LLM responses:
    1. Direct JSON parsing (clean responses)
    2. Extract from markdown code blocks (```json ... ```)
    3. Find complete JSON object by brace matching (handles nested JSON)
    4. Strip common LLM artifacts before parsing
    
    Args:
        text: Raw text response from LLM
        
    Returns:
        Parsed JSON dict or None if parsing fails
    """
    if not text:
        return None
    
    # Clean common artifacts
    text = text.strip()
    
    # Strategy 1: Try direct JSON parse first (fastest)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Extract from markdown code blocks (multiple patterns)
    code_block_patterns = [
        r'```(?:json)?\s*(\{.+?\})\s*```',      # Standard markdown
        r'```(?:json)?\s*(\[.+?\])\s*```',      # Array format
        r'`(\{.+?\})`',                          # Inline code
    ]
    
    for pattern in code_block_patterns:
        match = re.search(pattern, text, re.DOTALL | re.MULTILINE)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                continue
    
    # Strategy 3: Find first complete JSON object by brace matching (robust)
    # This handles nested objects properly
    brace_count = 0
    start_idx = -1
    
    for i, char in enumerate(text):
        if char == '{':
            if brace_count == 0:
                start_idx = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and start_idx != -1:
                try:
                    json_str = text[start_idx:i+1]
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    # Try next occurrence
                    start_idx = -1
                    continue
    
    # Strategy 4: Try cleaning common LLM artifacts and re-parsing
    cleaned = text
    # Remove common prefixes
    for prefix in ["Here's the JSON:", "Response:", "Output:", "Result:"]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
    
    # Try parsing cleaned text
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    
    return None
