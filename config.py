"""
Configuration Module for PhenoRx Service
Manages environments (Development, Production, Testing) and runtime settings.
"""

import logging
import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base application configuration"""

    APP_NAME = "PhenoRx Adverse Drug Reaction Engine"
    APP_VERSION = "2.1.0"
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

    # Model Artifact Paths
    MODEL_PATH = os.environ.get("MODEL_PATH", "models/adr_model.pkl")
    PREPROCESSOR_PATH = os.environ.get("PREPROCESSOR_PATH", "models/adr_preprocessor.pkl")

    # NVIDIA NIM settings (OpenAI-compatible endpoint)
    NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
    NVIDIA_BASE_URL = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_MODEL_NAME = os.environ.get(
        "NVIDIA_MODEL_NAME", "nvidia/nemotron-3-ultra-550b-a55b"
    )
    # Used when the primary model errors or is overloaded. Set to "" to disable.
    NVIDIA_FALLBACK_MODEL = os.environ.get(
        "NVIDIA_FALLBACK_MODEL", "nvidia/nemotron-3-super-120b-a12b"
    )

    # Logging & Monitoring
    LOG_LEVEL = logging.INFO
    ENV_NAME = "production"
    TESTING = False
    DEBUG = False


class DevelopmentConfig(Config):
    """Development environment settings"""

    DEBUG = True
    ENV_NAME = "development"
    LOG_LEVEL = logging.DEBUG


class TestingConfig(Config):
    """Testing environment settings with mock defaults"""

    TESTING = True
    DEBUG = True
    ENV_NAME = "testing"
    LOG_LEVEL = logging.WARNING
    NVIDIA_API_KEY = ""
    NVIDIA_FALLBACK_MODEL = ""


class ProductionConfig(Config):
    """Production environment settings"""

    DEBUG = False
    TESTING = False
    ENV_NAME = "production"
    LOG_LEVEL = logging.INFO


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(env_name: str | None = None) -> Config:
    """Retrieve appropriate configuration instance based on environment"""
    if env_name is None:
        env_name = os.environ.get("FLASK_ENV", "production").lower()
    config_class = CONFIG_MAP.get(env_name, ProductionConfig)
    return config_class()
