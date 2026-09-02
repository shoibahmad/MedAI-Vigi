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

    # Google GenAI Settings
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_API_KEY_DRUG_INTERACTIONS = os.environ.get("GEMINI_API_KEY_DRUG_INTERACTIONS", "")
    GEMINI_MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME", "gemini-2.5-flash")

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
    GEMINI_API_KEY = ""
    GEMINI_API_KEY_DRUG_INTERACTIONS = ""


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
