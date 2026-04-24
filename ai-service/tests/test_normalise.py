"""
Tests for normalise_skill — unit tests + property-based idempotency test.
"""

from hypothesis import given, settings
from hypothesis import strategies as st

from normalise import normalise_skill


# ---------------------------------------------------------------------------
# Property test: idempotency
# ---------------------------------------------------------------------------

@given(st.text(min_size=1).filter(lambda s: s.strip() != ""))
@settings(max_examples=100)
def test_normalise_skill_idempotent(s: str) -> None:
    """normalise_skill should be idempotent: applying it twice yields the same result."""
    once = normalise_skill(s)
    twice = normalise_skill(once)
    assert twice == once


# ---------------------------------------------------------------------------
# Unit tests
# ---------------------------------------------------------------------------

def test_exact_match() -> None:
    assert normalise_skill("Python") == "Python"


def test_alias_js() -> None:
    assert normalise_skill("js") == "JavaScript"


def test_alias_reactjs() -> None:
    assert normalise_skill("reactjs") == "React"


def test_alias_k8s() -> None:
    assert normalise_skill("k8s") == "Kubernetes"


def test_fuzzy_match_typo() -> None:
    # "Pythoon" is close enough (token_sort_ratio >= 85) to map to "Python"
    assert normalise_skill("Pythoon") == "Python"


def test_no_match_fallback() -> None:
    # Completely unknown string should be title-cased
    assert normalise_skill("xyzabc123") == "Xyzabc123"


def test_case_insensitive() -> None:
    assert normalise_skill("PYTHON") == "Python"
