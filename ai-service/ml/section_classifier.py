"""
CV Section Classifier

Classifies text blocks into one of four CV sections:
  - skills
  - experience
  - education
  - other

Uses TF-IDF features + Logistic Regression (fast, interpretable, production-safe).
"""

from __future__ import annotations

import os
import pickle
import logging
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

logger = logging.getLogger(__name__)

SECTION_LABELS = ["skills", "experience", "education", "other"]


class SectionClassifier:
    """
    Classifies a text block into a CV section category.

    Wraps a sklearn Pipeline (TF-IDF → LogisticRegression) with
    save/load support and a predict interface matching the MLService pattern.
    """

    def __init__(self, model_path: Optional[str] = None):
        self._pipeline: Optional[Pipeline] = None

        if model_path and os.path.exists(model_path):
            self.load(model_path)
            logger.info(f"SectionClassifier loaded from {model_path}")
        else:
            logger.info("SectionClassifier: no saved model found, will need training.")

    # ── Training ──────────────────────────────────────────────────────────────

    def train(self, texts: list[str], labels: list[str]) -> dict:
        """
        Train the section classifier.

        Args:
            texts:  List of text samples.
            labels: Corresponding section labels.

        Returns:
            dict with training metrics.
        """
        from sklearn.model_selection import train_test_split

        logger.info(f"Training SectionClassifier on {len(texts)} samples...")

        X_train, X_val, y_train, y_val = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        self._pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3),
                max_features=15_000,
                sublinear_tf=True,
                min_df=1,
                analyzer="word",
                token_pattern=r"(?u)\b\w[\w.+#]*\b",  # keep dots/plus for e.g. C++, .NET
            )),
            ("clf", LogisticRegression(
                C=5.0,
                max_iter=1000,
                solver="lbfgs",
                class_weight="balanced",
                random_state=42,
            )),
        ])

        self._pipeline.fit(X_train, y_train)

        # Evaluate on validation set
        y_pred = self._pipeline.predict(X_val)
        report = classification_report(y_val, y_pred, output_dict=True)
        accuracy = report["accuracy"]

        logger.info(f"SectionClassifier validation accuracy: {accuracy:.3f}")
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
        Predict the section category for a text block.

        Args:
            text: Input text.

        Returns:
            dict with keys: category (str), confidence (float), probabilities (dict).
        """
        if self._pipeline is None:
            raise RuntimeError("SectionClassifier is not trained. Call train() or load() first.")

        proba = self._pipeline.predict_proba([text])[0]
        classes = self._pipeline.classes_
        best_idx = int(np.argmax(proba))

        return {
            "category": classes[best_idx],
            "confidence": float(proba[best_idx]),
            "probabilities": {cls: float(p) for cls, p in zip(classes, proba)},
        }

    def predict_batch(self, texts: list[str]) -> list[dict]:
        """Predict section categories for a list of texts."""
        if self._pipeline is None:
            raise RuntimeError("SectionClassifier is not trained.")

        probas = self._pipeline.predict_proba(texts)
        classes = self._pipeline.classes_
        results = []
        for proba in probas:
            best_idx = int(np.argmax(proba))
            results.append({
                "category": classes[best_idx],
                "confidence": float(proba[best_idx]),
                "probabilities": {cls: float(p) for cls, p in zip(classes, proba)},
            })
        return results

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self, path: str) -> None:
        """Save the trained pipeline to disk."""
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self._pipeline, f)
        logger.info(f"SectionClassifier saved to {path}")

    def load(self, path: str) -> None:
        """Load a trained pipeline from disk."""
        with open(path, "rb") as f:
            self._pipeline = pickle.load(f)

    @property
    def is_trained(self) -> bool:
        return self._pipeline is not None
