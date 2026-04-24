from pydantic import BaseModel, Field
from typing import Literal, Optional


class ExtractedSkill(BaseModel):
    raw_skill_text: str
    normalised_name: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    user_verified: bool = False


class ParseRequest(BaseModel):
    cv_id: str
    file_url: str
    file_type: Literal["pdf", "docx"]


class ParseResponse(BaseModel):
    cv_id: str
    skills: list[ExtractedSkill]
    raw_text_sections: dict[str, str]
    status: Literal["completed", "failed"]
    error: Optional[str] = None


class NormalisedSkill(BaseModel):
    normalised_name: str


class JobSkill(BaseModel):
    skill_name: str
    importance_weight: int = Field(ge=1, le=5)


class SkillMatchDetail(BaseModel):
    skill: str
    score: float = Field(ge=0.0, le=1.0)
    type: Literal["matched", "partial", "missing"]


class MatchRequest(BaseModel):
    cv_skills: list[NormalisedSkill]
    job_skills: list[JobSkill]


class MatchResponse(BaseModel):
    match_score: float = Field(ge=0.0, le=100.0)
    matched: list[SkillMatchDetail]
    partial: list[SkillMatchDetail]
    missing: list[SkillMatchDetail]
    explanation: str
