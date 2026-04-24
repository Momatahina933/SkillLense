"""
MLService — SkillLens document analysis service.

Mirrors the MLService pattern from ML.py reference:
  - Thread-safe singleton initialisation
  - classify_document()  → section classification
  - detect_skills()      → ML-filtered skill extraction
  - score_skill()        → single-span skill relevance score
  - analyze_document()   → full pipeline (section → skills → confidence)

Usage:
    from ml_service import MLService

    MLService.initialize()                          # once at startup
    result = MLService.analyze_document(sections)   # per CV
"""

from __future__ import annotations

import os
import threading
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_models")


class MLService:
    """
    Main ML service for SkillLens document analysis.

    Thread-safe singleton — call MLService.initialize() once at startup,
    then use the class methods from any thread.
    """

    _section_classifier = None
    _skill_relevance_model = None
    _initialized: bool = False
    _lock = threading.Lock()

    # ── Initialisation ────────────────────────────────────────────────────────

    @classmethod
    def initialize(cls, model_dir: str = _DEFAULT_MODEL_DIR) -> None:
        """
        Initialise ML models (thread-safe, idempotent).

        Args:
            model_dir: Directory containing trained .pkl model files.
                       If models don't exist, falls back to rule-based defaults.
        """
        if cls._initialized:
            return

        with cls._lock:
            if cls._initialized:
                return

            logger.info("Initialising MLService...")

            try:
                from ml.section_classifier import SectionClassifier
                from ml.skill_relevance_model import SkillRelevanceModel

                section_path = os.path.join(model_dir, "section_classifier.pkl")
                skill_path = os.path.join(model_dir, "skill_relevance_model.pkl")

                cls._section_classifier = SectionClassifier(
                    model_path=section_path if os.path.exists(section_path) else None
                )
                cls._skill_relevance_model = SkillRelevanceModel(
                    model_path=skill_path if os.path.exists(skill_path) else None
                )

                if cls._section_classifier.is_trained:
                    logger.info("SectionClassifier: loaded from disk")
                else:
                    logger.warning(
                        "SectionClassifier: no saved model found. "
                        "Run 'python -m ml.train' to train models."
                    )

                if cls._skill_relevance_model.is_trained:
                    logger.info("SkillRelevanceModel: loaded from disk")
                else:
                    logger.warning(
                        "SkillRelevanceModel: no saved model found. "
                        "Run 'python -m ml.train' to train models."
                    )

                cls._initialized = True
                logger.info("MLService initialised successfully.")

            except Exception as e:
                logger.error(f"Error initialising MLService: {e}", exc_info=True)
                cls._initialized = False
                raise

    @classmethod
    def _ensure_initialized(cls) -> None:
        if not cls._initialized:
            cls.initialize()

    # ── Section Classification ────────────────────────────────────────────────

    @classmethod
    def classify_document_section(cls, text: str) -> dict:
        """
        Classify a text block into a CV section category.

        Args:
            text: Text block from a CV.

        Returns:
            dict with keys:
              - category (str): one of skills/experience/education/other
              - confidence (float): 0.0–1.0
              - probabilities (dict): per-class probabilities
        """
        cls._ensure_initialized()

        if not cls._section_classifier or not cls._section_classifier.is_trained:
            # Fallback: rule-based heuristic
            return cls._rule_based_section(text)

        try:
            return cls._section_classifier.predict(text)
        except Exception as e:
            logger.warning(f"Section classifier error: {e}. Using rule-based fallback.")
            return cls._rule_based_section(text)

    @classmethod
    def classify_sections_batch(cls, texts: list[str]) -> list[dict]:
        """Classify multiple text blocks in one call."""
        cls._ensure_initialized()

        if not cls._section_classifier or not cls._section_classifier.is_trained:
            return [cls._rule_based_section(t) for t in texts]

        try:
            return cls._section_classifier.predict_batch(texts)
        except Exception as e:
            logger.warning(f"Batch section classifier error: {e}. Using fallback.")
            return [cls._rule_based_section(t) for t in texts]

    # ── Skill Relevance Scoring ───────────────────────────────────────────────

    @classmethod
    def score_skill(cls, text: str) -> float:
        """
        Return the ML-based skill probability for a text span.

        Args:
            text: A candidate skill span (e.g. "React", "machine learning").

        Returns:
            float in [0.0, 1.0] — probability that the span is a genuine skill.
        """
        cls._ensure_initialized()

        if not cls._skill_relevance_model or not cls._skill_relevance_model.is_trained:
            return 0.7  # neutral fallback

        try:
            return cls._skill_relevance_model.score_span(text)
        except Exception as e:
            logger.warning(f"Skill relevance scoring error: {e}. Using fallback.")
            return 0.7

    @classmethod
    def detect_skills(cls, candidates: list[str]) -> list[dict]:
        """
        Filter a list of candidate skill spans using the ML model.

        Args:
            candidates: List of raw text spans from spaCy/PhraseMatcher.

        Returns:
            List of dicts: [{text, is_skill, skill_probability, confidence}]
        """
        cls._ensure_initialized()

        if not candidates:
            return []

        if not cls._skill_relevance_model or not cls._skill_relevance_model.is_trained:
            # Fallback: accept all candidates with neutral confidence
            return [
                {"text": c, "is_skill": True, "skill_probability": 0.7, "confidence": 0.7}
                for c in candidates
            ]

        try:
            results = cls._skill_relevance_model.predict_batch(candidates)
            return [
                {
                    "text": candidate,
                    "is_skill": r["is_skill"],
                    "skill_probability": r["skill_probability"],
                    "confidence": r["confidence"],
                }
                for candidate, r in zip(candidates, results)
            ]
        except Exception as e:
            logger.warning(f"Skill detection error: {e}. Using fallback.")
            return [
                {"text": c, "is_skill": True, "skill_probability": 0.7, "confidence": 0.7}
                for c in candidates
            ]

    # ── Full Document Analysis Pipeline ──────────────────────────────────────

    @classmethod
    def analyze_document(cls, sections: dict[str, str]) -> dict:
        """
        Full ML analysis pipeline for a parsed CV.

        Args:
            sections: Dict mapping section name → text content.
                      Keys: skills, experience, education, other.

        Returns:
            dict with:
              - section_classifications: per-section ML predictions
              - ml_confidence_boosts: per-section confidence adjustment
              - summary: plain-English summary
        """
        cls._ensure_initialized()

        section_classifications: dict[str, dict] = {}
        ml_confidence_boosts: dict[str, float] = {}

        for section_name, text in sections.items():
            if not text or not text.strip():
                continue

            prediction = cls.classify_document_section(text)
            section_classifications[section_name] = prediction

            # Compute confidence boost:
            # If ML agrees with the section label → boost confidence
            # If ML disagrees → slight penalty
            ml_label = prediction["category"]
            ml_conf = prediction["confidence"]

            if ml_label == section_name:
                # ML confirms the section — boost by up to 0.05
                boost = 0.05 * ml_conf
            else:
                # ML disagrees — small penalty
                boost = -0.03 * ml_conf

            ml_confidence_boosts[section_name] = round(boost, 4)

        summary = cls._generate_analysis_summary(section_classifications)

        return {
            "section_classifications": section_classifications,
            "ml_confidence_boosts": ml_confidence_boosts,
            "summary": summary,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    @classmethod
    def _rule_based_section(cls, text: str) -> dict:
        """Simple keyword-based section fallback when model is not trained."""
        text_lower = text.lower()

        skill_keywords = {"python", "javascript", "react", "docker", "aws", "sql", "git"}
        exp_keywords = {"experience", "worked", "developed", "led", "managed", "engineer"}
        edu_keywords = {"university", "degree", "bsc", "msc", "phd", "college", "certification"}

        skill_hits = sum(1 for kw in skill_keywords if kw in text_lower)
        exp_hits = sum(1 for kw in exp_keywords if kw in text_lower)
        edu_hits = sum(1 for kw in edu_keywords if kw in text_lower)

        scores = {"skills": skill_hits, "experience": exp_hits, "education": edu_hits, "other": 0}
        best = max(scores, key=lambda k: scores[k])
        total = sum(scores.values()) or 1
        confidence = scores[best] / total

        return {
            "category": best if scores[best] > 0 else "other",
            "confidence": min(confidence, 0.85),
            "probabilities": {k: v / total for k, v in scores.items()},
        }

    @classmethod
    def _generate_analysis_summary(cls, section_classifications: dict[str, dict]) -> str:
        """Generate a plain-English summary of the ML analysis."""
        if not section_classifications:
            return "No sections analysed."

        lines = []
        for section, pred in section_classifications.items():
            ml_label = pred["category"]
            conf = pred["confidence"]
            match = "✓" if ml_label == section else f"→ classified as '{ml_label}'"
            lines.append(f"  {section}: {match} (confidence: {conf:.0%})")

        return "ML section analysis:\n" + "\n".join(lines)

    # ── Status ────────────────────────────────────────────────────────────────

    @classmethod
    def status(cls) -> dict:
        """Return the current initialisation status of all models."""
        return {
            "initialized": cls._initialized,
            "section_classifier": (
                cls._section_classifier.is_trained
                if cls._section_classifier
                else False
            ),
            "skill_relevance_model": (
                cls._skill_relevance_model.is_trained
                if cls._skill_relevance_model
                else False
            ),
        }
