import psycopg
from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.database import get_database_url
from app.core.security import get_password_hash, verify_password, create_access_token, verify_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    branch: Optional[str] = ""
    academic_year: Optional[str] = ""
    graduation_year: Optional[str] = ""
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(data: UserRegister):
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            hashed_pw = get_password_hash(data.password)
            cur.execute("INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id", 
                        (data.full_name, data.email, hashed_pw, data.role))
            user_id = cur.fetchone()[0]

            if data.role == "student":
                cur.execute("INSERT INTO student_profiles (user_id, branch, academic_year, graduation_year) VALUES (%s, %s, %s, %s) ON CONFLICT (user_id) DO NOTHING",
                            (user_id, data.branch, data.academic_year, data.graduation_year))
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
            response.set_cookie(key="ontrack_session", value=token, httponly=True, max_age=604800, samesite="lax")
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
    response.delete_cookie(key="ontrack_session")
    return {"message": "Logged out successfully"}
