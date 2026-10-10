import psycopg
from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.db.database import get_database_url
from app.core.security import get_password_hash, verify_password, create_access_token, verify_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class UserRegister(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8)
    branch: Optional[str] = ""
    college: Optional[str] = ""
    degree: Optional[str] = ""
    academic_year: Optional[str] = ""
    graduation_year: Optional[str] = ""
    # Kept for compatibility with older frontend builds. Public registration is always student.

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AccessRequestModel(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    organization: str = Field(min_length=1, max_length=255)
    requested_role: str

@router.post("/request-access")
def request_access(data: AccessRequestModel):
    if data.requested_role not in ("company_hr", "class_coordinator"):
        raise HTTPException(status_code=400, detail="Unsupported requested role")
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("""CREATE TABLE IF NOT EXISTS role_access_requests (
                id BIGSERIAL PRIMARY KEY, full_name VARCHAR(255) NOT NULL, email VARCHAR(320) NOT NULL,
                organization VARCHAR(255) NOT NULL, requested_role VARCHAR(40) NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())""")
            cur.execute("""INSERT INTO role_access_requests (full_name,email,organization,requested_role)
                VALUES (%s,%s,%s,%s)""", (data.full_name.strip(), str(data.email).lower(), data.organization.strip(), data.requested_role))
        conn.commit()
    return {"message": "Access request received. Administrator verification is required."}

@router.post("/register")
def register(data: UserRegister):
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            hashed_pw = get_password_hash(data.password)
            cur.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
                (data.full_name.strip(), data.email, hashed_pw, "student"),
            )
            user_id = cur.fetchone()[0]
            cur.execute(
                """INSERT INTO student_profiles (user_id, college, degree, branch, academic_year, graduation_year)
                   VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (user_id) DO NOTHING""",
                (user_id, data.college or "", data.degree or "", data.branch or "", data.academic_year or "", data.graduation_year or ""),
            )
            conn.commit()
    return {"message": "Account created successfully"}

@router.post("/login")
def login(data: UserLogin, response: Response):
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, full_name, email, password_hash, role FROM users WHERE email = %s", (data.email,))
            user = cur.fetchone()
            if not user or not verify_password(data.password, user[3]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            token = create_access_token({"sub": str(user[0]), "role": user[4]})
            response.set_cookie(
                key="ontrack_session", value=token, httponly=True,
                max_age=604800, samesite="lax", path="/",
            )
            return {"message": "Login successful", "role": user[4], "full_name": user[1]}

@router.get("/me")
def get_me(ontrack_session: str = Cookie(None)):
    if not ontrack_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_access_token(ontrack_session)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session")
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, full_name, email, role FROM users WHERE id = %s", (payload.get("sub"),))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return {"id": user[0], "full_name": user[1], "email": user[2], "role": user[3]}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="ontrack_session", path="/")
    return {"message": "Logged out successfully"}
