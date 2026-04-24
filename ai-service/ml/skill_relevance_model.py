"""
Skill Relevance Model

Binary classifier that scores whether a text span is a genuine skill mention.
Used to filter out false positives from spaCy NER and PhraseMatcher.

Uses TF-IDF + LinearSVC (fast, high-precision for short text classification).
"""

from __future__ import annotations

import os
import pickle
import logging
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report

logger = logging.getLogger(__name__)


class SkillRelevanceModel:
    """
    Binary classifier: is this text span a skill? (1 = skill, 0 = not a skill)

    Wraps TF-IDF + CalibratedLinearSVC so we get calibrated probabilities
    (needed for confidence scoring).
    """

    def __init__(self, model_path: Optional[str] = None):
        self._pipeline: Optional[Pipeline] = None

        if model_path and os.path.exists(model_path):
            self.load(model_path)
            logger.info(f"SkillRelevanceModel loaded from {model_path}")
        else:
            logger.info("SkillRelevanceModel: no saved model found, will need training.")

    # ── Training ──────────────────────────────────────────────────────────────

    def train(self, texts: list[str], labels: list[int]) -> dict:
        """
        Train the skill relevance classifier.

        Args:
            texts:  List of text spans.
            labels: 1 = skill, 0 = not a skill.

        Returns:
            dict with training metrics.
        """
        from sklearn.model_selection import train_test_split

        logger.info(f"Training SkillRelevanceModel on {len(texts)} samples...")

        X_train, X_val, y_train, y_val = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        base_svc = LinearSVC(
            C=1.0,
            max_iter=2000,
            class_weight="balanced",
            random_state=42,
        )

        self._pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=10_000,
                sublinear_tf=True,
                analyzer="word",
                token_pattern=r"(?u)\b\w[\w.+#]*\b",
            )),
            ("clf", CalibratedClassifierCV(base_svc, cv=3)),
        ])

        self._pipeline.fit(X_train, y_train)

        y_pred = self._pipeline.predict(X_val)
        report = classification_report(y_val, y_pred, output_dict=True)
        accuracy = report["accuracy"]

        logger.info(f"SkillRelevanceModel validation accuracy: {accuracy:.3f}")
        logger.info("\n" + classification_report(y_val, y_pred))

        return {
            "accuracy": accuracy,
            "classification_report": report,
            "train_size": len(X_train),
            "val_size": len(X_val),
        }

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict(self, text: str) -> dict:
        """
        Predict whether a text span is a skill.

        Args:
            text: Input text span.

        Returns:
            dict with keys: is_skill (bool), confidence (float).
        """
        if self._pipeline is None:
            raise RuntimeError("SkillRelevanceModel is not trained.")

        proba = self._pipeline.predict_proba([text])[0]
        # proba[1] = probability of class 1 (skill)
        skill_prob = float(proba[1])

        return {
            "is_skill": skill_prob >= 0.5,
            "confidence": skill_prob if skill_prob >= 0.5 else 1.0 - skill_prob,
            "skill_probability": skill_prob,
        }

    def predict_batch(self, texts: list[str]) -> list[dict]:
        """Predict skill relevance for a list of text spans."""
        if self._pipeline is None:
            raise RuntimeError("SkillRelevanceModel is not trained.")

        probas = self._pipeline.predict_proba(texts)
        results = []
        for proba in probas:
            skill_prob = float(proba[1])
            results.append({
                "is_skill": skill_prob >= 0.5,
                "confidence": skill_prob if skill_prob >= 0.5 else 1.0 - skill_prob,
                "skill_probability": skill_prob,
            })
        return results

    def score_span(self, text: str) -> float:
        """
        Return the skill probability score for a text span.
        Convenience method for use in confidence computation.

        Returns:
            float in [0.0, 1.0] — probability that the span is a skill.
        """
        if self._pipeline is None:
            return 0.5  # neutral fallback if not trained
        return float(self._pipeline.predict_proba([text])[0][1])

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self, path: str) -> None:
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self._pipeline, f)
        logger.info(f"SkillRelevanceModel saved to {path}")

    def load(self, path: str) -> None:
        with open(path, "rb") as f:
            self._pipeline = pickle.load(f)

    @property
    def is_trained(self) -> bool:
        return self._pipeline is not None
