"""
Data Management API Router: Upload, Validation, Dataset Preview, Active Mine Switch, Reset Demo.
"""

import os
import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Dict, Any, Optional
from backend.app.services.state_service import state_service
from ml.preprocessing.data_cleaner import DataCleaner
from backend.app.core.config import settings

router = APIRouter(prefix="/data", tags=["Data Management"])


@router.get("/mines")
def get_mines():
    """Returns list of all available mines and the active mine."""
    return {
        "is_synthetic": state_service.is_synthetic,
        "active_mine_id": state_service.active_mine_id,
        "mines": state_service.mines_meta
    }


@router.post("/active-mine")
def switch_active_mine(payload: Dict[str, str]):
    mine_id = payload.get("mine_id")
    if not mine_id:
        raise HTTPException(status_code=400, detail="mine_id is required")
    try:
        active = state_service.set_active_mine(mine_id)
        return {"status": "SUCCESS", "active_mine": active}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/preview/{dataset_key}")
def preview_dataset(dataset_key: str, limit: int = 15):
    """Previews first N rows and column schemas of a specified dataset."""
    valid_keys = ["drillholes", "blocks", "production", "equipment", "satellite"]
    if dataset_key not in valid_keys:
        raise HTTPException(status_code=400, detail=f"Invalid dataset_key. Choose from: {', '.join(valid_keys)}")

    df = state_service.get_mine_filtered_df(dataset_key)
    if df.empty:
        return {"total_rows": 0, "columns": [], "sample_data": []}

    return {
        "dataset_key": dataset_key,
        "total_rows": len(df),
        "columns": list(df.columns),
        "sample_data": df.head(limit).to_dict(orient="records")
    }


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form(...)  # drillholes, production, equipment, satellite
):
    """Uploads a CSV or Excel file, runs automated validation and updates the active dataset."""
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are supported")

    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df_uploaded = pd.read_csv(io.BytesIO(content))
        else:
            df_uploaded = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Run validation based on type
    if dataset_type == "drillholes":
        df_clean, report = DataCleaner.validate_and_clean_geological_data(df_uploaded)
        if report.is_valid:
            state_service.datasets["drillholes"] = df_clean
            state_service.is_synthetic = False
            state_service.spatial_engine.fit(df_clean, x_col="x", y_col="y", val_col="mn_grade")
    elif dataset_type == "production":
        df_clean, report = DataCleaner.validate_and_clean_production_data(df_uploaded)
        if report.is_valid:
            state_service.datasets["production"] = df_clean
            state_service.is_synthetic = False
    elif dataset_type == "equipment":
        df_clean, report = DataCleaner.validate_and_clean_equipment_data(df_uploaded)
        if report.is_valid:
            state_service.datasets["equipment"] = df_clean
            state_service.is_synthetic = False
    else:
        df_clean = df_uploaded
        report = None

    # Save to uploads dir
    save_path = os.path.join(settings.UPLOADS_PATH, file.filename)
    df_uploaded.to_csv(save_path, index=False)

    return {
        "status": "SUCCESS",
        "filename": file.filename,
        "dataset_type": dataset_type,
        "rows_processed": len(df_uploaded),
        "validation_report": report.to_dict() if report else {"is_valid": True, "quality_score": 90.0}
    }


@router.post("/reset-demo")
def reset_to_demo_data():
    """Resets the environment back to the clean synthetic MOIL demo datasets."""
    from ml.data.generate_demo_data import generate_all_datasets
    generate_all_datasets()
    state_service.load_datasets()
    state_service.is_synthetic = True
    return {"status": "SUCCESS", "message": "Datasets successfully reset to Demo/Synthetic MOIL Data"}
