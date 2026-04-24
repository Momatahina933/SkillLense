"""
Training script for SkillLens ML models.

Run from the ai-service directory:
    python -m ml.train

Trains and saves:
  - ml_models/section_classifier.pkl
  - ml_models/skill_relevance_model.pkl
"""

from __future__ import annotations

import os
import sys
import json
import logging
import argparse

# Ensure ai-service root is on the path when run as a module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.training_data import generate_section_training_data, generate_skill_relevance_data
from ml.section_classifier import SectionClassifier
from ml.skill_relevance_model import SkillRelevanceModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

DEFAULT_MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ml_models",
)


def train_section_classifier(model_dir: str, augment_factor: int = 5) -> dict:
    """Train and save the section classifier."""
    logger.info("=" * 60)
    logger.info("Training Section Classifier")
    logger.info("=" * 60)

    texts, labels = generate_section_training_data(augment_factor=augment_factor)
    logger.info(f"Generated {len(texts)} training samples")

    # Label distribution
    from collections import Counter
    dist = Counter(labels)
    for label, count in sorted(dist.items()):
        logger.info(f"  {label}: {count} samples")

    classifier = SectionClassifier()
    metrics = classifier.train(texts, labels)

    save_path = os.path.join(model_dir, "section_classifier.pkl")
    classifier.save(save_path)

    logger.info(f"Section Classifier accuracy: {metrics['accuracy']:.3f}")
    return metrics


def train_skill_relevance_model(model_dir: str) -> dict:
    """Train and save the skill relevance model."""
    logger.info("=" * 60)
    logger.info("Training Skill Relevance Model")
    logger.info("=" * 60)

    texts, labels = generate_skill_relevance_data()
    logger.info(f"Generated {len(texts)} training samples")

    from collections import Counter
    dist = Counter(labels)
    logger.info(f"  Skill (1): {dist[1]} samples")
    logger.info(f"  Non-skill (0): {dist[0]} samples")

    model = SkillRelevanceModel()
    metrics = model.train(texts, labels)

    save_path = os.path.join(model_dir, "skill_relevance_model.pkl")
    model.save(save_path)

    logger.info(f"Skill Relevance Model accuracy: {metrics['accuracy']:.3f}")
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train SkillLens ML models")
    parser.add_argument(
        "--model-dir",
        default=DEFAULT_MODEL_DIR,
        help="Directory to save trained models (default: ai-service/ml_models/)",
    )
    parser.add_argument(
        "--augment-factor",
        type=int,
        default=5,
        help="Augmentation factor for section classifier training data (default: 5)",
    )
    parser.add_argument(
        "--model",
        choices=["all", "section", "skill"],
        default="all",
        help="Which model to train (default: all)",
    )
    args = parser.parse_args()

    os.makedirs(args.model_dir, exist_ok=True)
    logger.info(f"Model directory: {args.model_dir}")

    results = {}

    if args.model in ("all", "section"):
        results["section_classifier"] = train_section_classifier(
            args.model_dir, augment_factor=args.augment_factor
        )

    if args.model in ("all", "skill"):
        results["skill_relevance_model"] = train_skill_relevance_model(args.model_dir)

    # Save training summary
    summary_path = os.path.join(args.model_dir, "training_summary.json")
    with open(summary_path, "w") as f:
        # Convert numpy floats to Python floats for JSON serialisation
        def _convert(obj):
            if isinstance(obj, float):
                return round(obj, 4)
            if isinstance(obj, dict):
                return {k: _convert(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_convert(i) for i in obj]
            return obj

        json.dump(_convert(results), f, indent=2)

    logger.info(f"Training summary saved to {summary_path}")
    logger.info("=" * 60)
    logger.info("Training complete!")

    for model_name, metrics in results.items():
        logger.info(f"  {model_name}: accuracy={metrics['accuracy']:.3f}")

    logger.info("=" * 60)


if __name__ == "__main__":
    main()
