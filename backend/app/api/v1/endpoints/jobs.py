from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Any
from uuid import UUID
from app.core.database import get_supabase_client
from app.core.security import get_current_user
from app.models.job import JobCreate, Job
from app.models.match import ApplicationCreate
from app.services.matcher import calculate_match_and_gap_analysis

router = APIRouter()

@router.post("", response_model=Job, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Verify user is a recruiter
        profile_res = supabase.table("profiles").select("role").eq("id", current_user.id).single().execute()
        if profile_res.data.get("role") != "recruiter":
            raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
            
        # 1. Create the job record
        job_payload = {
            "recruiter_id": current_user.id,
            "title": job_data.title,
            "company_name": job_data.company_name,
            "description": job_data.description,
            "location": job_data.location,
            "employment_type": job_data.employment_type,
            "is_active": job_data.is_active
        }
        
        job_res = supabase.table("jobs").insert(job_payload).execute()
        new_job = job_res.data[0]
        
        # 2. Insert the associated job skills
        if job_data.skills:
            skills_payload = []
            for skill in job_data.skills:
                skills_payload.append({
                    "job_id": new_job["id"],
                    "skill_id": str(skill.skill_id),
                    "is_required": skill.is_required,
                    "weight": skill.weight
                })
            supabase.table("job_skills").insert(skills_payload).execute()
            
        return new_job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/feed")
def get_job_feed(
    skip: int = 0,
    limit: int = 10,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Fetch active jobs
        # Note: Match scores integration will be implemented in the matching engine phase
        response = supabase.table("jobs").select("*").eq("is_active", True).range(skip, skip + limit - 1).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{job_id}")
def get_job_detail(
    job_id: UUID,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Fetch job details with skills
        job_res = supabase.table("jobs").select("*, job_skills(skill_id, is_required, weight, skills(name, category))").eq("id", str(job_id)).single().execute()
        job_data = job_res.data
        
        # Check if current user is a seeker to perform gap analysis
        profile_res = supabase.table("profiles").select("role").eq("id", current_user.id).single().execute()
        
        if profile_res.data.get("role") == "seeker":
            # Fetch candidate skills
            cand_skills_res = supabase.table("candidate_skills").select("skill_id, proficiency_level, quiz_score").eq("candidate_id", current_user.id).execute()
            
            gap_analysis = calculate_match_and_gap_analysis(
                job_id=job_id,
                candidate_id=UUID(current_user.id),
                candidate_skills=cand_skills_res.data,
                job_requirements=job_data.get("job_skills", [])
            )
            job_data["gap_analysis"] = gap_analysis.dict()
            
        return job_data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Job not found: {str(e)}")

@router.post("/{job_id}/apply")
def apply_for_job(
    job_id: UUID,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Fetch job requirements
        job_res = supabase.table("jobs").select("job_skills(skill_id, is_required, weight, skills(name, category))").eq("id", str(job_id)).single().execute()
        job_requirements = job_res.data.get("job_skills", [])
        
        # Fetch candidate skills
        cand_skills_res = supabase.table("candidate_skills").select("skill_id, proficiency_level, quiz_score").eq("candidate_id", current_user.id).execute()
        
        # Calculate match
        gap_analysis = calculate_match_and_gap_analysis(
            job_id=job_id,
            candidate_id=UUID(current_user.id),
            candidate_skills=cand_skills_res.data,
            job_requirements=job_requirements
        )
        
        match_score = gap_analysis.match_score_percentage
        
        payload = {
            "job_id": str(job_id),
            "candidate_id": current_user.id,
            "match_score": match_score,
            "status": "applied"
        }
        
        response = supabase.table("applications").insert(payload).execute()
        return {"message": "Application submitted successfully", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to apply: {str(e)}")

@router.get("/{job_id}/candidates")
def get_job_candidates(
    job_id: UUID,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Ensure the current user is the owner (recruiter) of the job
        job_check = supabase.table("jobs").select("recruiter_id").eq("id", str(job_id)).single().execute()
        db_recruiter_id = job_check.data.get("recruiter_id")
        
        if str(db_recruiter_id).lower() != str(current_user.id).lower():
            raise HTTPException(
                status_code=403, 
                detail=f"Not authorized. Job owner: {db_recruiter_id}, Current User: {current_user.id}"
            )
            
        # Fetch applications for this job, sorted by match score descending
        response = supabase.table("applications")\
            .select("*, profiles(full_name, email, headline, resume_url)")\
            .eq("job_id", str(job_id))\
            .order("match_score", desc=True)\
            .execute()
            
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{job_id}/applications/{candidate_id}")
def update_application_status(
    job_id: UUID,
    candidate_id: UUID,
    status_data: dict,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Ensure the current user is the owner (recruiter) of the job
        job_check = supabase.table("jobs").select("recruiter_id").eq("id", str(job_id)).single().execute()
        db_recruiter_id = job_check.data.get("recruiter_id")
        
        if str(db_recruiter_id).lower() != str(current_user.id).lower():
            raise HTTPException(status_code=403, detail="Not authorized to update applications for this job")
            
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
            
        # Update the status
        response = supabase.table("applications")\
            .update({"status": new_status})\
            .eq("job_id", str(job_id))\
            .eq("candidate_id", str(candidate_id))\
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Application not found")
            
        return {"message": "Status updated successfully", "application": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

