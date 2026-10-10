import psycopg
from fastapi import APIRouter, HTTPException, Cookie
from pydantic import BaseModel
from typing import Optional, List, Any
from app.db.database import get_database_url
from app.core.security import verify_access_token

router = APIRouter(prefix="/api/student", tags=["Student"])

def get_user_from_cookie(ontrack_session: str) -> int:
    if not ontrack_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_access_token(ontrack_session)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session")
    return int(payload.get("sub"))

class ProfileModel(BaseModel):
    phone: Optional[str] = ""
    city: Optional[str] = ""
    bio: Optional[str] = ""
    college: Optional[str] = ""
    degree: Optional[str] = ""
    branch: Optional[str] = ""
    academic_year: Optional[str] = ""
    graduation_year: Optional[str] = ""
    career_goal: Optional[str] = ""
    preferred_role: Optional[str] = ""
    courses: Optional[List[Any]] = []
    projects: Optional[List[Any]] = []

@router.get("/profile")
def get_profile(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT phone, city, bio, college, degree, branch, academic_year, graduation_year, career_goal, preferred_role, courses, projects FROM student_profiles WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return {}
            return {
                "phone": row[0], "city": row[1], "bio": row[2], "college": row[3],
                "degree": row[4], "branch": row[5], "academic_year": row[6], "graduation_year": row[7],
                "career_goal": row[8], "preferred_role": row[9], "courses": row[10] or [], "projects": row[11] or []
            }

@router.post("/profile")
def save_profile(data: ProfileModel, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO student_profiles (user_id, phone, city, bio, college, degree, branch, academic_year, graduation_year, career_goal, preferred_role, courses, projects)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
                ON CONFLICT (user_id) DO UPDATE SET
                    phone = EXCLUDED.phone, city = EXCLUDED.city, bio = EXCLUDED.bio,
                    college = EXCLUDED.college, degree = EXCLUDED.degree, branch = EXCLUDED.branch,
                    academic_year = EXCLUDED.academic_year, graduation_year = EXCLUDED.graduation_year,
                    career_goal = EXCLUDED.career_goal, preferred_role = EXCLUDED.preferred_role,
                    courses = EXCLUDED.courses, projects = EXCLUDED.projects
            """, (user_id, data.phone, data.city, data.bio, data.college, data.degree, data.branch, data.academic_year, data.graduation_year, data.career_goal, data.preferred_role, str(data.courses), str(data.projects)))
            conn.commit()
    return {"message": "Profile saved successfully"}

@router.get("/dashboard")
def get_dashboard(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(SUM(duration_minutes), 0) FROM learning_sessions WHERE user_id = %s", (user_id,))
            total_mins = cur.fetchone()[0]
            total_hours = round(total_mins / 60, 1)

            cur.execute("SELECT COUNT(*) FROM student_tasks WHERE user_id = %s", (user_id,))
            total_tasks = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM student_tasks WHERE user_id = %s AND status = 'completed'", (user_id,))
            completed_tasks = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM student_skills WHERE user_id = %s", (user_id,))
            skills_count = cur.fetchone()[0]

            progress_pct = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

            return {
                "total_learning_hours": total_hours,
                "total_tasks": total_tasks,
                "tasks_completed": completed_tasks,
                "skills_recorded": skills_count,
                "progress_percentage": progress_pct
            }
