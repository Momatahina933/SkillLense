"""
Property tests for run_match:
  1. match_score is always in [0, 100]
  2. matched + partial + missing == len(job_skills)
  3. weighted score formula is correct
"""

from hypothesis import given, settings
from hypothesis import strategies as st

from matcher import run_match
from models import JobSkill, MatchRequest, NormalisedSkill


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

normalised_skill_st = st.builds(
    NormalisedSkill,
    normalised_name=st.text(min_size=1, max_size=40).filter(str.strip),
)

job_skill_st = st.builds(
    JobSkill,
    skill_name=st.text(min_size=1, max_size=40).filter(str.strip),
    importance_weight=st.integers(min_value=1, max_value=5),
)


# ---------------------------------------------------------------------------
# Property 1: match_score bounds
# ---------------------------------------------------------------------------

@given(
    cv_skills=st.lists(normalised_skill_st, min_size=1, max_size=20),
    job_skills=st.lists(job_skill_st, min_size=1, max_size=20),
)
@settings(max_examples=50)
def test_match_score_bounds(cv_skills, job_skills) -> None:
    """match_score must always be in [0, 100]."""
    result = run_match(MatchRequest(cv_skills=cv_skills, job_skills=job_skills))
    assert 0 <= result.match_score <= 100


# ---------------------------------------------------------------------------
# Property 2: skill gap completeness
# ---------------------------------------------------------------------------

@given(
    cv_skills=st.lists(normalised_skill_st, min_size=1, max_size=20),
    job_skills=st.lists(job_skill_st, min_size=1, max_size=20),
)
@settings(max_examples=50)
def test_skill_gap_completeness(cv_skills, job_skills) -> None:
    """Every job skill must appear in exactly one of matched / partial / missing."""
    result = run_match(MatchRequest(cv_skills=cv_skills, job_skills=job_skills))
    total = len(result.matched) + len(result.partial) + len(result.missing)
    assert total == len(job_skills)


# ---------------------------------------------------------------------------
# Property 3: weighted score formula
# ---------------------------------------------------------------------------

@given(
    cv_skills=st.lists(normalised_skill_st, min_size=1, max_size=20),
    job_skills=st.lists(job_skill_st, min_size=1, max_size=20),
)
@settings(max_examples=50)
def test_weighted_score_formula(cv_skills, job_skills) -> None:
    """match_score must equal (sum_matched + sum_partial * 0.5) / total_weight * 100."""
    request = MatchRequest(cv_skills=cv_skills, job_skills=job_skills)
    result = run_match(request)

    # Build a lookup from skill_name -> importance_weight
    weight_map = {js.skill_name: js.importance_weight for js in job_skills}
    total_weight = sum(js.importance_weight for js in job_skills)

    sum_matched = sum(weight_map.get(s.skill, 0) for s in result.matched)
    sum_partial = sum(weight_map.get(s.skill, 0) for s in result.partial)

    expected = (sum_matched + sum_partial * 0.5) / total_weight * 100
    expected = max(0.0, min(100.0, expected))

    assert abs(result.match_score - expected) < 0.01
