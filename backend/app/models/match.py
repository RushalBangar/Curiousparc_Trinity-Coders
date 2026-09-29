from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from .user import Skill, Profile
from .job import Job

class ApplicationBase(BaseModel):
    job_id: UUID
    candidate_id: UUID

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: str = Field(..., pattern="^(applied|reviewing|shortlisted|rejected)$")

class Application(ApplicationBase):
    id: UUID
    match_score: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationDetail(Application):
    job: Optional[Job] = None
    candidate: Optional[Profile] = None

# Gap Analysis Models
class SkillMatchDetail(BaseModel):
    skill: Skill
    is_required: bool
    weight: float

class GapAnalysisResult(BaseModel):
    job_id: UUID
    candidate_id: UUID
    match_score_percentage: float
    matched_skills: List[SkillMatchDetail]
    critical_skill_gaps: List[SkillMatchDetail]
    bonus_competencies: List[SkillMatchDetail]
