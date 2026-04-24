import os

from dotenv import load_dotenv

load_dotenv()

import asyncpg
import httpx
from fastapi import FastAPI
from contextlib import asynccontextmanager

from extractor import extract_docx, extract_pdf, segment_sections
from matcher import run_match
from models import ExtractedSkill, MatchRequest, MatchResponse, ParseRequest, ParseResponse
from skill_extractor import extract_and_score_skills


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise ML models on startup."""
    import logging
    logger = logging.getLogger(__name__)
    try:
        from ml_service import MLService
        MLService.initialize()
        logger.info("MLService ready.")
    except Exception as e:
        logger.warning(f"MLService init failed (will use rule-based fallback): {e}")
    yield


app = FastAPI(title="SkillLens AI Service", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "skilllens-ai"}


@app.get("/ml/status")
async def ml_status():
    """Return ML model initialisation status."""
    try:
        from ml_service import MLService
        return {"status": "ok", **MLService.status()}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/parse", response_model=ParseResponse)
async def parse_cv(request: ParseRequest):
    try:
        # 1. Download file from signed URL
        async with httpx.AsyncClient() as client:
            response = await client.get(request.file_url, timeout=30.0)
            response.raise_for_status()
            raw_bytes = response.content

        # 2. Extract text based on file type
        if request.file_type == "pdf":
            text = extract_pdf(raw_bytes)
        else:
            text = extract_docx(raw_bytes)

        if not text.strip():
            await update_cv_status(request.cv_id, "failed", "Could not extract text from document")
            return ParseResponse(
                cv_id=request.cv_id,
                skills=[],
                raw_text_sections={},
                status="failed",
                error="Could not extract text from document",
            )

        # 3. Segment sections
        sections = segment_sections(text)

        # 4. Extract and score skills
        skills = extract_and_score_skills(sections)

        # 5. Insert extracted_skills into DB
        await insert_extracted_skills(request.cv_id, skills)

        # 6. Update cv_uploads status to completed
        await update_cv_status(request.cv_id, "completed", None)

        return ParseResponse(
            cv_id=request.cv_id,
            skills=skills,
            raw_text_sections=sections,
            status="completed",
        )

    except Exception as e:
        try:
            await update_cv_status(request.cv_id, "failed", str(e))
        except Exception:
            pass  # Don't let DB update failure mask the original error
        return ParseResponse(
            cv_id=request.cv_id,
            skills=[],
            raw_text_sections={},
            status="failed",
            error=str(e),
        )


async def update_cv_status(cv_id: str, status: str, error_message: str | None):
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        await conn.execute(
            "UPDATE cv_uploads SET parse_status=$1, error_message=$2 WHERE cv_id=$3",
            status,
            error_message,
            cv_id,
        )
    finally:
        await conn.close()


async def insert_extracted_skills(cv_id: str, skills: list[ExtractedSkill]):
    if not skills:
        return
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        async with conn.transaction():
            for skill in skills:
                await conn.execute(
                    """INSERT INTO extracted_skills (skill_id, cv_id, raw_skill_text, normalised_name, confidence_score)
                       VALUES (gen_random_uuid(), $1, $2, $3, $4)""",
                    cv_id,
                    skill.raw_skill_text,
                    skill.normalised_name,
                    float(skill.confidence_score),
                )
    finally:
        await conn.close()


@app.post("/match", response_model=MatchResponse)
async def match_skills(request: MatchRequest):
    return run_match(request)
