"""
MOIL AI Mine Intelligence Platform - Main FastAPI Application Entrypoint
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.services.state_service import state_service

from backend.app.api.auth import router as auth_router
from backend.app.api.data import router as data_router
from backend.app.api.eda import router as eda_router
from backend.app.api.satellite import router as sat_router
from backend.app.api.geology import router as geo_router
from backend.app.api.grade_prediction import router as grade_router
from backend.app.api.spatial_estimation import router as spatial_router
from backend.app.api.reserve_estimation import router as reserve_router
from backend.app.api.exploration import router as exp_router
from backend.app.api.production import router as prod_router
from backend.app.api.equipment import router as eq_router
from backend.app.api.anomaly_risk import router as risk_router
from backend.app.api.optimization import router as opt_router
from backend.app.api.scenarios import router as scen_router
from backend.app.api.recommendations import router as rec_router
from backend.app.api.reports import router as rep_router
from backend.app.api.dashboard import router as dash_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database
    init_db()
    # Ensure state service initialized
    _ = state_service.get_active_mine()
    print("=" * 60)
    print("MOIL MANGANESE MINE INTELLIGENCE BACKEND READY")
    print("=" * 60)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI/ML + Satellite-Based Manganese Reserve Intelligence & Production Planning System for MOIL Limited",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All 15 API Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(data_router, prefix=settings.API_PREFIX)
app.include_router(dash_router, prefix=settings.API_PREFIX)
app.include_router(eda_router, prefix=settings.API_PREFIX)
app.include_router(sat_router, prefix=settings.API_PREFIX)
app.include_router(geo_router, prefix=settings.API_PREFIX)
app.include_router(grade_router, prefix=settings.API_PREFIX)
app.include_router(spatial_router, prefix=settings.API_PREFIX)
app.include_router(reserve_router, prefix=settings.API_PREFIX)
app.include_router(exp_router, prefix=settings.API_PREFIX)
app.include_router(prod_router, prefix=settings.API_PREFIX)
app.include_router(eq_router, prefix=settings.API_PREFIX)
app.include_router(risk_router, prefix=settings.API_PREFIX)
app.include_router(opt_router, prefix=settings.API_PREFIX)
app.include_router(scen_router, prefix=settings.API_PREFIX)
app.include_router(rec_router, prefix=settings.API_PREFIX)
app.include_router(rep_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "code": settings.PROJECT_CODE,
        "version": settings.VERSION,
        "status": "ONLINE",
        "active_mine": state_service.get_active_mine()["name"],
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX
    }


@app.get("/health")
def health():
    return {
        "status": "HEALTHY",
        "active_mine_id": state_service.active_mine_id,
        "is_synthetic_dataset": state_service.is_synthetic,
        "models_loaded": True
    }
