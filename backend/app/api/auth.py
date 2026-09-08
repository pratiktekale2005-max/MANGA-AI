"""
Auth API Router: User registration, login, JWT token issuance, and profile.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from backend.app.core.database import get_db_connection
from backend.app.core.security import verify_password, get_password_hash, create_access_token, get_current_user_optional

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "Mining Engineer"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    full_name: str


@router.post("/register", response_model=TokenResponse)
def register(user: UserRegister):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (user.username, user.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_pw = get_password_hash(user.password)
    cursor.execute(
        "INSERT INTO users (username, email, hashed_password, full_name, role) VALUES (?, ?, ?, ?, ?)",
        (user.username, user.email, hashed_pw, user.full_name, user.role)
    )
    conn.commit()
    conn.close()

    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, username=user.username, role=user.role, full_name=user.full_name)


@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, hashed_password, full_name, role FROM users WHERE username = ?", (creds.username,))
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(creds.password, row["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token({"sub": row["username"], "role": row["role"]})
    return TokenResponse(access_token=token, username=row["username"], role=row["role"], full_name=row["full_name"])


@router.get("/me")
def get_me(user: dict = Depends(get_current_user_optional)):
    if not user:
        return {"authenticated": False, "role": "Guest / Anonymous", "username": "guest"}
    return {"authenticated": True, "username": user["username"], "role": user["role"]}
