"""
Model Utilities for Loading Compressed Models
Supports both regular and compressed model files with strict static type annotations.
"""

import gzip
import logging
import os
import pickle
from typing import Any, Dict, Optional, Tuple

import joblib

logger = logging.getLogger(__name__)


def load_model_smart(model_path: str) -> Any:
    """
    Smart model loader that handles:
    - Regular .pkl files
    - Compressed .pkl.gz files
    - Optimized joblib files
    """
    if not os.path.exists(model_path):
        # Try with .gz extension
        gz_path = model_path + ".gz"
        if os.path.exists(gz_path):
            model_path = gz_path
        else:
            raise FileNotFoundError(f"Model file not found: {model_path}")

    file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
    logger.info(f"📦 Loading model: {model_path} ({file_size_mb:.2f} MB)")

    try:
        if model_path.endswith(".gz"):
            # Load gzipped model
            logger.info("🔓 Decompressing gzipped model...")
            with gzip.open(model_path, "rb") as f:
                model = pickle.load(f)
            logger.info("✅ Gzipped model loaded successfully")
        else:
            # Load regular joblib model (may be internally compressed)
            model = joblib.load(model_path)
            logger.info("✅ Model loaded successfully")

        return model

    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        raise


def get_model_info(model_path: str) -> Optional[Dict[str, Any]]:
    """Get information about a model file"""
    if not os.path.exists(model_path):
        return None

    file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
    is_compressed = model_path.endswith(".gz")

    return {
        "path": model_path,
        "size_mb": round(file_size_mb, 2),
        "compressed": is_compressed,
        "exists": True,
    }


def load_adr_models(model_dir: str = ".") -> Tuple[Any, Any]:
    """
    Load ADR prediction models with automatic compression detection

    Tries to load in this order:
    1. Optimized compressed versions
    2. Gzipped versions
    3. Original versions
    """
    model_variants = [
        ("adr_model_optimized.pkl", "adr_preprocessor_optimized.pkl"),
        ("adr_model.pkl.gz", "adr_preprocessor.pkl.gz"),
        ("adr_model.pkl", "adr_preprocessor.pkl"),
    ]

    for model_file, preprocessor_file in model_variants:
        model_path = os.path.join(model_dir, model_file)
        preprocessor_path = os.path.join(model_dir, preprocessor_file)

        if os.path.exists(model_path) and os.path.exists(preprocessor_path):
            logger.info(f"✅ Found model variant: {model_file}")

            try:
                model = load_model_smart(model_path)
                preprocessor = load_model_smart(preprocessor_path)

                logger.info("✅ Models loaded successfully")
                return model, preprocessor

            except Exception as e:
                logger.warning(f"⚠️ Failed to load {model_file}: {e}")
                continue

    raise FileNotFoundError(
        "No valid model files found. Please run compress_model.py or download from Kaggle."
    )


if __name__ == "__main__":
    # Test the loader
    logging.basicConfig(level=logging.INFO)

    try:
        model, preprocessor = load_adr_models()
        print("\n✅ Models loaded successfully!")
        print(f"Model type: {type(model)}")
        print(f"Preprocessor type: {type(preprocessor)}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
