"""
spaCy-based skill extraction from CV text sections.
ML-enhanced: uses MLService to filter false positives and boost confidence scores.
"""

from __future__ import annotations

import spacy
from spacy.matcher import PhraseMatcher

from models import ExtractedSkill
from normalise import normalise_skill
from skill_taxonomy import ALIAS_MAP, SKILL_TAXONOMY

# ---------------------------------------------------------------------------
# Load spaCy model once at module level
# ---------------------------------------------------------------------------
try:
    _nlp = spacy.load("en_core_web_md")
except OSError:
    _nlp = spacy.load("en_core_web_sm")

# ---------------------------------------------------------------------------
# Build PhraseMatcher from taxonomy terms + alias keys
# ---------------------------------------------------------------------------
_matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")

_all_terms: list[str] = list(SKILL_TAXONOMY) + list(ALIAS_MAP.keys())
_patterns = list(_nlp.tokenizer.pipe(_all_terms))
_matcher.add("SKILLS", _patterns)

# Lowercase set of taxonomy entries for exact-match confidence boost
_taxonomy_lower: set[str] = {s.lower() for s in SKILL_TAXONOMY}

# Base confidence by section
_SECTION_BASE: dict[str, float] = {
    "skills": 0.90,
    "experience": 0.75,
    "education": 0.65,
    "other": 0.55,
}


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------

def extract_skills(sections: dict[str, str]) -> list[dict]:
    """
    Run spaCy pipeline + PhraseMatcher over each section and return raw
    candidate skill mentions.

    Args:
        sections: Mapping of section name → section text.
                  Expected keys: "skills", "experience", "education", "other".

    Returns:
        List of dicts with keys ``raw_text`` (str) and ``section`` (str).
        Deduplicated by normalised name.
    """
    seen_normalised: set[str] = set()
    candidates: list[dict] = []

    for section_name, section_text in sections.items():
        if not section_text or not section_text.strip():
            continue

        doc = _nlp(section_text)

        # Collect spans from PhraseMatcher
        phrase_spans: list[str] = []
        for _match_id, start, end in _matcher(doc):
            phrase_spans.append(doc[start:end].text)

        # Collect spans from NER (SKILL or ORG labels)
        ner_spans: list[str] = [
            ent.text
            for ent in doc.ents
            if ent.label_ in ("SKILL", "ORG")
        ]

        for raw_text in phrase_spans + ner_spans:
            normalised = normalise_skill(raw_text)
            if normalised in seen_normalised:
                continue
            seen_normalised.add(normalised)
            candidates.append({"raw_text": raw_text, "section": section_name})

    return candidates


def compute_confidence(raw_text: str, section: str) -> float:
    """
    Compute a confidence score for a skill mention.

    Base confidence is determined by the section the skill was found in:
      - "skills":     0.90
      - "experience": 0.75
      - "education":  0.65
      - "other":      0.55

    An additional 0.08 is added when the raw_text exactly matches a taxonomy
    entry (case-insensitive).  The result is clamped to [0.0, 1.0].

    Args:
        raw_text: The raw skill text as extracted from the document.
        section:  The section name where the skill was found.

    Returns:
        Confidence score in [0.0, 1.0].
    """
    base = _SECTION_BASE.get(section, _SECTION_BASE["other"])

    if raw_text.strip().lower() in _taxonomy_lower:
        base += 0.08

    # ML-based refinement: blend in the skill relevance probability
    try:
        from ml_service import MLService
        ml_score = MLService.score_skill(raw_text)
        # Weighted blend: 70% rule-based base, 30% ML score
        base = 0.70 * base + 0.30 * ml_score
    except Exception:
        pass  # ML not available — use rule-based score only

    return max(0.0, min(1.0, base))


def extract_and_score_skills(sections: dict[str, str]) -> list[ExtractedSkill]:
    """
    Extract skill candidates from CV sections, normalise them, compute
    confidence scores, deduplicate by normalised name (keeping the highest
    confidence), and return a list of :class:`ExtractedSkill` objects.

    Args:
        sections: Mapping of section name → section text.

    Returns:
        Deduplicated list of :class:`ExtractedSkill` objects.
    """
    raw_candidates = extract_skills(sections)

    # Map normalised_name → best ExtractedSkill so far
    best: dict[str, ExtractedSkill] = {}

    for candidate in raw_candidates:
        raw_text = candidate["raw_text"]
        section = candidate["section"]

        normalised = normalise_skill(raw_text)
        confidence = compute_confidence(raw_text, section)

        if normalised not in best or confidence > best[normalised].confidence_score:
            best[normalised] = ExtractedSkill(
                raw_skill_text=raw_text,
                normalised_name=normalised,
                confidence_score=confidence,
            )

    return list(best.values())
