from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from .database import get_supabase_client
from typing import Dict, Any

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Validates the JWT token with Supabase Auth and returns the user object.
    """
    token = credentials.credentials
    try:
        # We use get_user(token) which validates the JWT with the Supabase auth server
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # We can also fetch the user profile from the profiles table here if needed
        # user_profile = supabase.table("profiles").select("*").eq("id", user_response.user.id).single().execute()
        
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
