"""
Property test for extract_and_score_skills — confidence scores must be in [0.0, 1.0].
"""

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st

from skill_extractor import extract_and_score_skills


@given(
    st.dictionaries(
        st.sampled_from(["skills", "experience", "education", "other"]),
        st.text(),
        min_size=1,
    )
)
@settings(max_examples=20, suppress_health_check=[HealthCheck.too_slow])
def test_confidence_scores_in_range(sections: dict) -> None:
    """All confidence_score values returned by extract_and_score_skills must be in [0.0, 1.0]."""
    results = extract_and_score_skills(sections)
    for skill in results:
        assert 0.0 <= skill.confidence_score <= 1.0, (
            f"confidence_score {skill.confidence_score} out of range for skill {skill.normalised_name!r}"
        )
