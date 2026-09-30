from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client
from typing import List, Any, Dict
from app.core.database import get_supabase_client
from app.core.security import get_current_user
from app.models.user import CandidateSkillBase, CandidateSkillDetail, Profile

router = APIRouter()

@router.get("/me", response_model=Profile)
def get_my_profile(
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        response = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Profile not found: {str(e)}")

class ProfileInit(BaseModel):
    role: str = "seeker"

@router.post("/me/init-profile", response_model=Profile)
def init_my_profile(
    profile_data: ProfileInit,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Check if profile already exists
        try:
            existing = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()
            if existing.data:
                return existing.data
        except Exception:
            pass # Doesn't exist, proceed to create
            
        # Get user metadata (from Google)
        email = current_user.email
        full_name = "OAuth User"
        if hasattr(current_user, 'user_metadata') and current_user.user_metadata:
            full_name = current_user.user_metadata.get('full_name', 'OAuth User')
            
        new_profile = {
            "id": current_user.id,
            "email": email,
            "full_name": full_name,
            "role": profile_data.role
        }
        
        response = supabase.table("profiles").insert(new_profile).execute()
        if response.data:
            return response.data[0]
        raise Exception("Failed to insert profile")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to init profile: {str(e)}")

@router.get("/me/skills", response_model=List[CandidateSkillDetail])
def get_my_skills(
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Verify user is a seeker (optional but recommended)
        profile_res = supabase.table("profiles").select("role").eq("id", current_user.id).single().execute()
        if profile_res.data.get("role") != "seeker":
            raise HTTPException(status_code=403, detail="Only seekers have candidate skills")
            
        # Fetch candidate skills with the joined skill details
        response = supabase.table("candidate_skills")\
            .select("skill_id, proficiency_level, years_experience, quiz_score, skills(id, name, category)")\
            .eq("candidate_id", current_user.id)\
            .execute()
            
        # Transform the nested response from Supabase to match our Pydantic model
        skills_list = []
        for item in response.data:
            skills_list.append({
                "skill_id": item["skill_id"],
                "proficiency_level": item["proficiency_level"],
                "years_experience": item["years_experience"],
                "quiz_score": item.get("quiz_score"),
                "skill": item["skills"]
            })
            
        return skills_list
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/me/skills", status_code=status.HTTP_201_CREATED)
def add_update_skill(
    skill_data: CandidateSkillBase,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Upsert the candidate skill
        payload = {
            "candidate_id": current_user.id,
            "skill_id": str(skill_data.skill_id),
            "proficiency_level": skill_data.proficiency_level,
            "years_experience": skill_data.years_experience
        }
        
        if skill_data.quiz_score is not None:
            payload["quiz_score"] = skill_data.quiz_score
        
        # In Supabase, if we have a composite primary key, upsert will update if exists
        response = supabase.table("candidate_skills").upsert(payload).execute()
        
        return {"message": "Skill added/updated successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/me/skills/{skill_id}")
def remove_skill(
    skill_id: UUID,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        response = supabase.table("candidate_skills")\
            .delete()\
            .eq("candidate_id", current_user.id)\
            .eq("skill_id", str(skill_id))\
            .execute()
            
        return {"message": "Skill removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
