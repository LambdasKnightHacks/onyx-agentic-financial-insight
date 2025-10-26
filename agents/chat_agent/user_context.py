"""
User context management for chat agent.
Creates user-specific tool instances with security guarantees.
"""

from functools import wraps
from typing import Callable, Any
import inspect


class UserContextWrapper:
    """
    Wraps tools to automatically inject authenticated user_id.
    Ensures tools can ONLY access the current user's data.
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
    
    def wrap_tool(self, tool_func: Callable) -> Callable:
        """
        Wraps a tool function to automatically inject user_id.
        Removes user_id from the function signature so LLM can't override it.
        """
        sig = inspect.signature(tool_func)
        params = list(sig.parameters.values())
        
        # Check if function has user_id parameter
        has_user_id = any(p.name == 'user_id' for p in params)
        
        if not has_user_id:
            # Tool doesn't need user_id, return as-is
            return tool_func
        
        # Create wrapper that injects user_id
        @wraps(tool_func)
        async def wrapped(**kwargs):
            # Force user_id to authenticated user - CANNOT BE OVERRIDDEN
            kwargs['user_id'] = self.user_id
            return await tool_func(**kwargs)
        
        # Modify the signature to hide user_id from LLM
        new_params = [p for p in params if p.name != 'user_id']
        wrapped.__signature__ = sig.replace(parameters=new_params)
        
        # Preserve original function metadata
        wrapped.__name__ = tool_func.__name__
        wrapped.__doc__ = tool_func.__doc__
        
        return wrapped
    
    def wrap_all_tools(self, tools: list) -> list:
        """Wrap all tools in the list."""
        return [self.wrap_tool(tool) for tool in tools]


def create_user_context_instruction(user_id: str) -> str:
    """
    Creates a system instruction that explicitly tells the agent
    they are helping a specific authenticated user.
    """
    return f"""
🔒 SECURITY CONTEXT - READ CAREFULLY:

You are currently helping an authenticated user. All tools automatically use their account.
- User is already authenticated and verified
- All data queries are scoped to THIS USER ONLY
- You CANNOT and should NOT access other users' data
- NEVER ask the user for their user_id - it's handled automatically

When the user asks questions like:
- "Show my balance" → Call get_account_balances() (no user_id needed)
- "What are my transactions?" → Call get_recent_transactions() (no user_id needed)  
- "Show my budget" → Call get_budget_status() (no user_id needed)

The system automatically ensures all queries use the authenticated user's ID.
You do NOT need to specify or think about user_id at all.
"""

