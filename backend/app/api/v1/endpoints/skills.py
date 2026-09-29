from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List, Optional
from app.core.database import get_supabase_client
from app.core.security import get_current_user
from app.models.user import Skill

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
            query = query.eq("category", category)
            
        if search:
            query = query.ilike("name", f"%{search}%")
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
