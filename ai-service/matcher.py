from sentence_transformers import SentenceTransformer
import numpy as np

from models import MatchRequest, MatchResponse, SkillMatchDetail

# Load model once at module level
_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

EXACT_THRESHOLD = 0.90
PARTIAL_THRESHOLD = 0.65


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def build_explanation(
    matched: list[SkillMatchDetail],
    partial: list[SkillMatchDetail],
    missing: list[SkillMatchDetail],
    score: float,
) -> str:
    matched_names = ", ".join(s.skill for s in matched)
    partial_names = ", ".join(s.skill for s in partial)
    missing_names = ", ".join(s.skill for s in missing)

    parts = [f"Match score: {score:.1f}%."]

    if matched:
        parts.append(f"Matched skills: {matched_names} ({len(matched)}).")
    else:
        parts.append("Matched skills: none.")

    if partial:
        parts.append(f"Partial matches: {partial_names} ({len(partial)}).")
    else:
        parts.append("Partial matches: none.")

    if missing:
        parts.append(f"Missing skills: {missing_names} ({len(missing)}).")
    else:
        parts.append("Missing skills: none.")

    return " ".join(parts)


def run_match(request: MatchRequest) -> MatchResponse:
    job_skills = request.job_skills
    cv_skills = request.cv_skills

    total_weight = sum(js.importance_weight for js in job_skills)
    earned_weight = 0.0
    matched: list[SkillMatchDetail] = []
    partial: list[SkillMatchDetail] = []
    missing: list[SkillMatchDetail] = []

    # Edge case: empty CV skills
    if not cv_skills:
        for js in job_skills:
            missing.append(SkillMatchDetail(skill=js.skill_name, score=0.0, type="missing"))
        explanation = build_explanation(matched, partial, missing, 0.0)
        return MatchResponse(
            match_score=0.0,
            matched=matched,
            partial=partial,
            missing=missing,
            explanation=explanation,
        )

    # Edge case: empty job skills
    if not job_skills:
        return MatchResponse(
            match_score=0.0,
            matched=[],
            partial=[],
            missing=[],
            explanation="No job skills provided for matching.",
        )

    # Step 1: Build normalised CV skill set
    cv_set = {s.normalised_name.lower() for s in cv_skills}

    # Step 2: Exact string match pass
    unmatched_job_skills = []
    for js in job_skills:
        if js.skill_name.lower() in cv_set:
            earned_weight += js.importance_weight
            matched.append(SkillMatchDetail(skill=js.skill_name, score=1.0, type="matched"))
        else:
            unmatched_job_skills.append(js)

    # Steps 3-6: Semantic similarity for remaining unmatched skills
    if unmatched_job_skills:
        # Step 3: Encode unmatched job skills
        job_names = [js.skill_name for js in unmatched_job_skills]
        job_embeddings = _model.encode(job_names)

        # Step 4: Encode all CV skills
        cv_names = [s.normalised_name for s in cv_skills]
        cv_embeddings = _model.encode(cv_names)

        # Steps 5-6: Compute cosine similarity and classify
        for js, job_emb in zip(unmatched_job_skills, job_embeddings):
            similarities = [_cosine_similarity(job_emb, cv_emb) for cv_emb in cv_embeddings]
            best_score = max(similarities)

            if best_score >= EXACT_THRESHOLD:
                earned_weight += js.importance_weight
                matched.append(SkillMatchDetail(skill=js.skill_name, score=best_score, type="matched"))
            elif best_score >= PARTIAL_THRESHOLD:
                earned_weight += js.importance_weight * 0.5
                partial.append(SkillMatchDetail(skill=js.skill_name, score=best_score, type="partial"))
            else:
                missing.append(SkillMatchDetail(skill=js.skill_name, score=best_score, type="missing"))

    # Step 7: Compute match score, clamped to [0, 100]
    if total_weight > 0:
        match_score = (earned_weight / total_weight) * 100
        match_score = max(0.0, min(100.0, match_score))
    else:
        match_score = 0.0

    # Step 8: Build explanation
    explanation = build_explanation(matched, partial, missing, match_score)

    return MatchResponse(
        match_score=match_score,
        matched=matched,
        partial=partial,
        missing=missing,
        explanation=explanation,
    )
