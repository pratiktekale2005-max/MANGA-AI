"""
Master Application Launcher for MOIL Mine Intelligence System
Starts both FastAPI backend and React frontend development server concurrently.
"""

import subprocess
import sys
import os
import time

def main():
    print("=" * 70)
    print("LAUNCHING MOIL AI MINE INTELLIGENCE PLATFORM")
    print("=" * 70)

    # 1. Verify models exist
    registry_file = os.path.join(os.path.dirname(__file__), "ml", "model_registry", "pipeline_summary.json")
    if not os.path.exists(registry_file):
        print("Model registry not found. Running training pipeline first...")
        subprocess.run([sys.executable, "-m", "ml.train_all_models"], check=True)

    print("\n[1/2] Starting FastAPI Backend on http://localhost:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    )

    time.sleep(2)

    print("\n[2/2] Starting React + Vite Frontend on http://localhost:5173 ...")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"], cwd=frontend_dir, shell=True
    )

    print("\n" + "=" * 70)
    print("MOIL PLATFORM ONLINE!")
    print(" -> Frontend Dashboard: http://localhost:5173")
    print(" -> Backend API Docs:   http://localhost:8000/docs")
    print("=" * 70 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()


if __name__ == "__main__":
    main()
