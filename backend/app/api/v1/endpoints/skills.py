import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.database import get_supabase_client
from app.core.security import get_current_user
from app.models.user import Skill

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=List[Skill])
def get_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        query = supabase.table("skills").select("*")
        
        if category:
            query = query.eq("category", category[:50])
            
        if search:
            clean_search = search[:100].strip()
            query = query.ilike("name", f"%{clean_search}%")
            
        response = query.order("name").execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching skills: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve skills list")
