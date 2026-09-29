from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from .user import Skill

class JobSkillBase(BaseModel):
    skill_id: UUID
    is_required: bool = True
    weight: float = Field(default=1.00, ge=0.5, le=2.0)

class JobSkillCreate(JobSkillBase):
    pass

class JobSkill(JobSkillBase):
    job_id: UUID

    class Config:
        from_attributes = True

class JobSkillDetail(JobSkillBase):
    skill: Skill

class JobBase(BaseModel):
    title: str
    company_name: str
    description: str
    location: str
    employment_type: str = Field(..., pattern="^(full-time|part-time|internship|contract)$")
    is_active: bool = True

class JobCreate(JobBase):
    skills: List[JobSkillCreate]

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    is_active: Optional[bool] = None

class Job(JobBase):
    id: UUID
    recruiter_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class JobDetail(Job):
    skills: List[JobSkillDetail]
