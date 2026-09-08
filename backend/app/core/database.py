"""
Database Engine and SQLite Schema Initialization
"""

import sqlite3
import os
import json
from datetime import datetime
from backend.app.core.config import settings

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "moil_mine_ai.db")


def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Mining Engineer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Audit Logs / Activity
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Saved Scenarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mine_id TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        params_json TEXT NOT NULL,
        results_json TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Default Seed Admin User (admin / moil123)
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
    if cursor.fetchone()[0] == 0:
        from backend.app.core.security import get_password_hash
        cursor.execute(
            "INSERT INTO users (username, email, hashed_password, full_name, role) VALUES (?, ?, ?, ?, ?)",
            ("admin", "admin@moil.nic.in", get_password_hash("moil123"), "MOIL Chief Mining Engineer", "Administrator")
        )

    conn.commit()
    conn.close()
