import pytest
from uuid import uuid4
from app.services.matcher import calculate_match_and_gap_analysis

def test_full_match_with_preferred():
    job_id = uuid4()
    candidate_id = uuid4()
    
    skill_req_1 = str(uuid4())
    skill_req_2 = str(uuid4())
    skill_pref_1 = str(uuid4())

    job_requirements = [
        {"skill_id": skill_req_1, "is_required": True, "weight": 1.0, "skills": {"name": "Python", "category": "Language"}},
        {"skill_id": skill_req_2, "is_required": True, "weight": 1.0, "skills": {"name": "FastAPI", "category": "Framework"}},
        {"skill_id": skill_pref_1, "is_required": False, "weight": 1.0, "skills": {"name": "Docker", "category": "DevOps"}}
    ]

    candidate_skills = [
        {"skill_id": skill_req_1, "proficiency_level": "advanced"},
        {"skill_id": skill_req_2, "proficiency_level": "advanced"},
        {"skill_id": skill_pref_1, "proficiency_level": "intermediate"}
    ]

    result = calculate_match_and_gap_analysis(job_id, candidate_id, candidate_skills, job_requirements)
    
    assert result.match_score_percentage == 68.75
    assert len(result.matched_skills) == 2
    assert len(result.critical_skill_gaps) == 0
    assert len(result.bonus_competencies) == 1

def test_partial_match_no_preferred():
    job_id = uuid4()
    candidate_id = uuid4()
    
    skill_req_1 = str(uuid4())
    skill_req_2 = str(uuid4())

    # Only mandatory skills, total weight = 2.0
    job_requirements = [
        {"skill_id": skill_req_1, "is_required": True, "weight": 1.0, "skills": {"name": "Python", "category": "Language"}},
        {"skill_id": skill_req_2, "is_required": True, "weight": 1.0, "skills": {"name": "FastAPI", "category": "Framework"}}
    ]

    # Candidate has only 1 out of 2 mandatory skills
    candidate_skills = [
        {"skill_id": skill_req_1, "proficiency_level": "advanced"}
    ]

    result = calculate_match_and_gap_analysis(job_id, candidate_id, candidate_skills, job_requirements)
    
    # 1 out of 2 matched (advanced = 0.75 mult) -> 37.5% match
    assert result.match_score_percentage == 37.5
    assert len(result.matched_skills) == 1
    assert len(result.critical_skill_gaps) == 1
    assert len(result.bonus_competencies) == 0

def test_zero_skills_match():
    job_id = uuid4()
    candidate_id = uuid4()
    
    skill_req_1 = str(uuid4())
    skill_pref_1 = str(uuid4())

    job_requirements = [
        {"skill_id": skill_req_1, "is_required": True, "weight": 1.0, "skills": {"name": "Python", "category": "Language"}},
        {"skill_id": skill_pref_1, "is_required": False, "weight": 1.0, "skills": {"name": "Docker", "category": "DevOps"}}
    ]

    # Candidate has no matching skills
    candidate_skills = []

    result = calculate_match_and_gap_analysis(job_id, candidate_id, candidate_skills, job_requirements)
    
    assert result.match_score_percentage == 0.0
    assert len(result.matched_skills) == 0
    assert len(result.critical_skill_gaps) == 1
    assert len(result.bonus_competencies) == 0

def test_weighted_match():
    job_id = uuid4()
    candidate_id = uuid4()
    
    skill_req_heavy = str(uuid4())
    skill_req_light = str(uuid4())
    skill_pref = str(uuid4())

    job_requirements = [
        {"skill_id": skill_req_heavy, "is_required": True, "weight": 2.0, "skills": {"name": "Python", "category": "Language"}},
        {"skill_id": skill_req_light, "is_required": True, "weight": 1.0, "skills": {"name": "HTML", "category": "Language"}},
        {"skill_id": skill_pref, "is_required": False, "weight": 1.0, "skills": {"name": "Docker", "category": "DevOps"}}
    ]

    # Candidate has the light requirement and the preferred skill, missing the heavy requirement
    candidate_skills = [
        {"skill_id": skill_req_light, "proficiency_level": "advanced"},
        {"skill_id": skill_pref, "proficiency_level": "intermediate"}
    ]

    result = calculate_match_and_gap_analysis(job_id, candidate_id, candidate_skills, job_requirements)
    
    # Required calculation:
    # matched_req = 1.0, total_req = 3.0 -> req_score = 0.3333
    # Pref calculation:
    # matched_pref = 1.0, total_pref = 1.0 -> pref_score = 1.0
    # Match % = (0.75 * 0.3333) + (0.25 * 1.0) = 0.25 + 0.25 = 0.50 -> 50%
    
    assert result.match_score_percentage == 50.0
    assert len(result.matched_skills) == 1
    assert result.matched_skills[0].skill.name == "HTML"
    assert len(result.critical_skill_gaps) == 1
    assert result.critical_skill_gaps[0].skill.name == "Python"
    assert len(result.bonus_competencies) == 1
