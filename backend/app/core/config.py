"""
Application Configuration and Environment Settings
"""

import os
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(BASE_DIR, "ml", "data", "synthetic_store")
MODEL_REGISTRY_DIR = os.path.join(BASE_DIR, "ml", "model_registry")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
REPORTS_DIR = os.path.join(BASE_DIR, "reports_output")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)


class Settings(BaseModel):
    PROJECT_NAME: str = "MOIL Manganese Reserve Intelligence & Production Planning Platform"
    PROJECT_CODE: str = "MOIL-MINEAI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = "moil-manganese-super-secret-jwt-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATA_STORE_PATH: str = DATA_DIR
    REGISTRY_PATH: str = MODEL_REGISTRY_DIR
    UPLOADS_PATH: str = UPLOADS_DIR
    REPORTS_PATH: str = REPORTS_DIR
    CORS_ORIGINS: list = ["*"]


settings = Settings()
