from typing import List, Dict, Any
from uuid import UUID
from app.models.match import GapAnalysisResult, SkillMatchDetail
from app.models.user import Skill

def calculate_match_and_gap_analysis(
    job_id: UUID,
    candidate_id: UUID,
    candidate_skills: List[Dict[str, Any]],
    job_requirements: List[Dict[str, Any]]
) -> GapAnalysisResult:
    """
    Calculates the matching score between a candidate's skills and a job's required/preferred skills.
    Also produces a gap analysis categorizing skills.
    
    candidate_skills: list of dicts with 'skill_id', and optionally 'proficiency_level'.
    job_requirements: list of dicts with 'skill_id', 'is_required', 'weight', and nested 'skills' (id, name, category).
    """
    
    # Extract candidate skills into a dictionary for O(1) lookup and attribute access
    candidate_skills_dict = {str(cs["skill_id"]): cs for cs in candidate_skills}
    
    matched_skills = []
    critical_skill_gaps = []
    bonus_competencies = []
    
    total_req_weights = 0.0
    matched_req_weights = 0.0
    
    total_pref_weights = 0.0
    matched_pref_weights = 0.0
    
    has_preferred = False
    
    # Proficiency multipliers if quiz_score is missing
    prof_multiplier = {
        "beginner": 0.25,
        "intermediate": 0.50,
        "advanced": 0.75,
        "expert": 1.00
    }
    
    for req in job_requirements:
        skill_id = str(req["skill_id"])
        is_required = req["is_required"]
        weight = float(req["weight"])
        skill_data = req.get("skills", {})
        
        # Build the skill detail payload
        skill_detail = SkillMatchDetail(
            skill=Skill(id=UUID(skill_id), name=skill_data.get("name", "Unknown"), category=skill_data.get("category", "Unknown")),
            is_required=is_required,
            weight=weight
        )
        
        if is_required:
            total_req_weights += weight
            if skill_id in candidate_skills_dict:
                cand_skill = candidate_skills_dict[skill_id]
                
                # Determine multiplier (quiz score takes precedence, fallback to proficiency)
                multiplier = 0.5 # default
                if cand_skill.get("quiz_score") is not None:
                    multiplier = float(cand_skill["quiz_score"]) / 100.0
                elif cand_skill.get("proficiency_level"):
                    multiplier = prof_multiplier.get(cand_skill["proficiency_level"].lower(), 0.5)
                    
                matched_req_weights += (weight * multiplier)
                matched_skills.append(skill_detail)
            else:
                critical_skill_gaps.append(skill_detail)
        else:
            has_preferred = True
            total_pref_weights += weight
            if skill_id in candidate_skills_dict:
                cand_skill = candidate_skills_dict[skill_id]
                
                multiplier = 0.5 # default
                if cand_skill.get("quiz_score") is not None:
                    multiplier = float(cand_skill["quiz_score"]) / 100.0
                elif cand_skill.get("proficiency_level"):
                    multiplier = prof_multiplier.get(cand_skill["proficiency_level"].lower(), 0.5)
                    
                matched_pref_weights += (weight * multiplier)
                bonus_competencies.append(skill_detail)
                
    # Algorithmic Formulation
    weight_req_factor = 0.75
    weight_pref_factor = 0.25
    
    if not has_preferred or total_pref_weights == 0:
        weight_req_factor = 1.00
        weight_pref_factor = 0.00
        
    req_score = 0.0
    if total_req_weights > 0:
        req_score = matched_req_weights / total_req_weights
        
    pref_score = 0.0
    if total_pref_weights > 0:
        pref_score = matched_pref_weights / total_pref_weights
        
    match_score_percentage = ((weight_req_factor * req_score) + (weight_pref_factor * pref_score)) * 100
    
    return GapAnalysisResult(
        job_id=job_id,
        candidate_id=candidate_id,
        match_score_percentage=round(match_score_percentage, 2),
        matched_skills=matched_skills,
        critical_skill_gaps=critical_skill_gaps,
        bonus_competencies=bonus_competencies
    )
