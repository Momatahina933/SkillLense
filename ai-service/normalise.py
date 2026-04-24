"""
Skill normalisation: maps raw skill text to canonical taxonomy names.

Steps:
  1. Lowercase + strip punctuation (keep alphanumeric, spaces, dots, plus signs)
  2. Exact case-insensitive match against taxonomy index
  3. Alias lookup from ALIAS_MAP
  4. rapidfuzz token_sort_ratio fuzzy match (threshold >= 85)
  5. Fallback: return raw_text.title()
"""

import re

from rapidfuzz import fuzz, process

from skill_taxonomy import ALIAS_MAP, SKILL_TAXONOMY

# O(1) exact lookup: lowercase canonical name -> canonical name
_taxonomy_lower_index: dict[str, str] = {s.lower(): s for s in SKILL_TAXONOMY}

# Lowercase alias map for consistent lookup
_alias_map_lower: dict[str, str] = {k.lower(): v for k, v in ALIAS_MAP.items()}

_FUZZY_THRESHOLD = 85
_STRIP_PATTERN = re.compile(r"[^\w\s.+]")


def normalise_skill(raw_text: str) -> str:
    """
    Normalise a raw skill string to a canonical taxonomy name.

    Args:
        raw_text: Raw skill text extracted from a CV or job description.

    Returns:
        Canonical skill name from SKILL_TAXONOMY, or title-cased raw_text
        if no match is found.
    """
    if not raw_text or not raw_text.strip():
        return ""

    # Step 1: lowercase + strip punctuation (keep alphanumeric, spaces, dots, plus)
    cleaned = _STRIP_PATTERN.sub("", raw_text).strip().lower()

    if not cleaned:
        return raw_text.title()

    # Step 2: exact case-insensitive match against taxonomy
    if cleaned in _taxonomy_lower_index:
        return _taxonomy_lower_index[cleaned]

    # Step 3: alias lookup
    if cleaned in _alias_map_lower:
        return _alias_map_lower[cleaned]

    # Step 4: fuzzy match using token_sort_ratio
    result = process.extractOne(
        cleaned,
        _taxonomy_lower_index.keys(),
        scorer=fuzz.token_sort_ratio,
        score_cutoff=_FUZZY_THRESHOLD,
    )
    if result is not None:
        matched_lower, _score, _idx = result
        return _taxonomy_lower_index[matched_lower]

    # Step 5: fallback — title-case the original input
    return raw_text.title()
