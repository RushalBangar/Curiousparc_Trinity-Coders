import logging
from typing import List, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.database import get_supabase_client
from app.core.security import get_current_user
from app.models.job import JobCreate, Job
from app.models.match import ApplicationUpdate
from app.services.matcher import calculate_match_and_gap_analysis

logger = logging.getLogger(__name__)
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
            
        logger.info(f"Job created successfully: {new_job['id']} by recruiter {current_user.id}")
        return new_job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to create job posting")

@router.get("/feed")
def get_job_feed(
    skip: int = 0,
    limit: int = 10,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Safe pagination bounds
        safe_skip = max(0, skip)
        safe_limit = max(1, min(limit, 50))
        
        response = supabase.table("jobs")\
            .select("*")\
            .eq("is_active", True)\
            .order("created_at", desc=True)\
            .range(safe_skip, safe_skip + safe_limit - 1)\
            .execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job feed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve jobs feed")

@router.get("/my-jobs")
def get_my_jobs(
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Dedicated endpoint for recruiters to fetch only their own posted jobs.
    """
    try:
        profile_res = supabase.table("profiles").select("role").eq("id", current_user.id).single().execute()
        if profile_res.data.get("role") != "recruiter":
            raise HTTPException(status_code=403, detail="Only recruiters can access their posted jobs")

        response = supabase.table("jobs")\
            .select("*")\
            .eq("recruiter_id", current_user.id)\
            .order("created_at", desc=True)\
            .execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recruiter jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve recruiter jobs")

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
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
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
            job_data["gap_analysis"] = gap_analysis.model_dump()
            
        return job_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching job: {str(e)}")

@router.post("/{job_id}/apply")
def apply_for_job(
    job_id: UUID,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Verify user is a seeker
        profile_res = supabase.table("profiles").select("role").eq("id", current_user.id).single().execute()
        if profile_res.data.get("role") != "seeker":
            raise HTTPException(status_code=403, detail="Only seekers can apply for jobs")
            
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
        
        # Check if already applied
        existing = supabase.table("applications").select("id").eq("job_id", str(job_id)).eq("candidate_id", str(current_user.id)).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="You have already applied for this job")
            
        match_score = gap_analysis.match_score_percentage
        
        payload = {
            "job_id": str(job_id),
            "candidate_id": current_user.id,
            "match_score": match_score,
            "status": "applied"
        }
        
        response = supabase.table("applications").insert(payload).execute()
        logger.info(f"Candidate {current_user.id} applied to job {job_id} with match score {match_score}%")
        return {"message": "Application submitted successfully", "data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying for job {job_id}: {e}", exc_info=True)
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
        if not job_check.data:
            raise HTTPException(status_code=404, detail="Job not found")
            
        db_recruiter_id = job_check.data.get("recruiter_id")
        
        if str(db_recruiter_id).lower() != str(current_user.id).lower():
            raise HTTPException(
                status_code=403, 
                detail="Not authorized to view candidates for this job"
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
        logger.error(f"Error fetching candidates for job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to retrieve candidates")

@router.patch("/{job_id}/applications/{candidate_id}")
def update_application_status(
    job_id: UUID,
    candidate_id: UUID,
    status_data: ApplicationUpdate,
    current_user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Ensure the current user is the owner (recruiter) of the job
        job_check = supabase.table("jobs").select("recruiter_id").eq("id", str(job_id)).single().execute()
        if not job_check.data:
            raise HTTPException(status_code=404, detail="Job not found")

        db_recruiter_id = job_check.data.get("recruiter_id")
        
        if str(db_recruiter_id).lower() != str(current_user.id).lower():
            raise HTTPException(status_code=403, detail="Not authorized to update applications for this job")
            
        new_status = status_data.status
            
        # Update the status
        response = supabase.table("applications")\
            .update({"status": new_status})\
            .eq("job_id", str(job_id))\
            .eq("candidate_id", str(candidate_id))\
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Application not found")
            
        logger.info(f"Application for candidate {candidate_id} on job {job_id} updated to {new_status}")
        return {"message": "Status updated successfully", "application": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application status: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to update application status")
