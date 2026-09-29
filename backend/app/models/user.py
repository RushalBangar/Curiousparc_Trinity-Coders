from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID

# Shared properties
class ProfileBase(BaseModel):
    full_name: str
    role: str = Field(..., pattern="^(seeker|recruiter|admin)$")
    bio: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    resume_url: Optional[str] = None

# Properties to receive on creation
class ProfileCreate(ProfileBase):
    email: EmailStr

# Properties to receive on update
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    resume_url: Optional[str] = None

# Properties to return to client
class Profile(ProfileBase):
    id: UUID
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class SkillBase(BaseModel):
    name: str
    category: str

class Skill(SkillBase):
    id: UUID

    class Config:
        from_attributes = True

class CandidateSkillBase(BaseModel):
    skill_id: UUID
    proficiency_level: str = Field(..., pattern="^(beginner|intermediate|advanced|expert)$")
    years_experience: Optional[float] = None

class CandidateSkill(CandidateSkillBase):
    candidate_id: UUID

    class Config:
        from_attributes = True

class CandidateSkillDetail(CandidateSkillBase):
    skill: Skill
