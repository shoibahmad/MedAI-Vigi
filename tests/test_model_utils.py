"""
Unit Tests for Model Loader Utilities
"""

import gzip
import os
import pickle
import tempfile

import joblib

from utils.model_utils import get_model_info, load_adr_models, load_model_smart


def test_load_model_smart_regular_and_gzipped() -> None:
    """Test smart loading of standard and gzip-compressed pickle files"""
    with tempfile.TemporaryDirectory() as tmp_dir:
        dummy_obj = {"name": "test_model", "weights": [1.0, 2.0, 3.0]}

        # Regular joblib file
        reg_file = os.path.join(tmp_dir, "model.pkl")
        joblib.dump(dummy_obj, reg_file)
        loaded_reg = load_model_smart(reg_file)
        assert loaded_reg == dummy_obj

        # Gzipped pickle file
        gz_file = os.path.join(tmp_dir, "model_gz.pkl.gz")
        with gzip.open(gz_file, "wb") as f:
            pickle.dump(dummy_obj, f)
        loaded_gz = load_model_smart(gz_file)
        assert loaded_gz == dummy_obj

        # Auto .gz discovery
        base_path = os.path.join(tmp_dir, "model_gz.pkl")
        loaded_auto = load_model_smart(base_path)
        assert loaded_auto == dummy_obj


def test_get_model_info() -> None:
    """Test model metadata extraction"""
    with tempfile.TemporaryDirectory() as tmp_dir:
        file_path = os.path.join(tmp_dir, "sample.pkl")
        joblib.dump([1, 2, 3], file_path)

        info = get_model_info(file_path)
        assert info is not None
        assert info["exists"] is True
        assert info["compressed"] is False

        # Non-existent file
        assert get_model_info("non_existent_file.pkl") is None


def test_load_adr_models_existing() -> None:
    """Test load_adr_models on models directory"""
    if os.path.exists("models/adr_model.pkl"):
        m, p = load_adr_models(model_dir="models")
        assert m is not None
        assert p is not None
