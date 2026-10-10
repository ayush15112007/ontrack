import json
import psycopg
from fastapi import APIRouter, HTTPException, Cookie
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from app.db.database import get_database_url
from app.core.security import verify_access_token

router = APIRouter(prefix="/api/student", tags=["Student"])

def get_user_from_cookie(ontrack_session: Optional[str]) -> int:
    if not ontrack_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_access_token(ontrack_session)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session")
    try:
        return int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid session")

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

class TaskModel(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = ""
    due_date: Optional[str] = ""
    status: Optional[str] = "pending"

class SessionModel(BaseModel):
    session_date: str
    topic: str = Field(min_length=1, max_length=255)
    duration_minutes: int = Field(ge=1, le=1440)
    notes: Optional[str] = ""

class SkillModel(BaseModel):
    skill_name: str = Field(min_length=1, max_length=100)
    proficiency: str = "Beginner"

@router.get("/profile")
def get_profile(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("""SELECT phone, city, bio, college, degree, branch, academic_year,
                graduation_year, career_goal, preferred_role, courses, projects
                FROM student_profiles WHERE user_id = %s""", (user_id,))
            row = cur.fetchone()
            if not row:
                return {}
            return {"phone": row[0] or "", "city": row[1] or "", "bio": row[2] or "",
                "college": row[3] or "", "degree": row[4] or "", "branch": row[5] or "",
                "academic_year": row[6] or "", "graduation_year": row[7] or "",
                "career_goal": row[8] or "", "preferred_role": row[9] or "",
                "courses": row[10] or [], "projects": row[11] or []}

@router.post("/profile")
def save_profile(data: ProfileModel, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("""INSERT INTO student_profiles
                (user_id, phone, city, bio, college, degree, branch, academic_year,
                 graduation_year, career_goal, preferred_role, courses, projects)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
                ON CONFLICT (user_id) DO UPDATE SET
                 phone=EXCLUDED.phone, city=EXCLUDED.city, bio=EXCLUDED.bio,
                 college=EXCLUDED.college, degree=EXCLUDED.degree, branch=EXCLUDED.branch,
                 academic_year=EXCLUDED.academic_year, graduation_year=EXCLUDED.graduation_year,
                 career_goal=EXCLUDED.career_goal, preferred_role=EXCLUDED.preferred_role,
                 courses=EXCLUDED.courses, projects=EXCLUDED.projects""",
                (user_id, data.phone or "", data.city or "", data.bio or "", data.college or "",
                 data.degree or "", data.branch or "", data.academic_year or "",
                 data.graduation_year or "", data.career_goal or "", data.preferred_role or "",
                 json.dumps(data.courses or []), json.dumps(data.projects or [])))
            conn.commit()
    return {"message": "Profile saved successfully"}

@router.get("/dashboard")
def get_dashboard(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(SUM(duration_minutes),0) FROM learning_sessions WHERE user_id=%s", (user_id,))
            total_hours = round(cur.fetchone()[0] / 60, 1)
            cur.execute("SELECT COUNT(*) FROM student_tasks WHERE user_id=%s", (user_id,))
            total_tasks = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM student_tasks WHERE user_id=%s AND status='completed'", (user_id,))
            completed_tasks = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM student_skills WHERE user_id=%s", (user_id,))
            skills_count = cur.fetchone()[0]
    return {"total_learning_hours": total_hours, "total_tasks": total_tasks,
            "tasks_completed": completed_tasks, "skills_recorded": skills_count,
            "progress_percentage": int(completed_tasks / total_tasks * 100) if total_tasks else 0}

@router.get("/tasks")
def get_tasks(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id,title,description,due_date,status FROM student_tasks WHERE user_id=%s ORDER BY id DESC", (user_id,))
            return [{"id": r[0], "title": r[1], "description": r[2] or "", "due_date": r[3] or "", "status": r[4] or "pending"} for r in cur.fetchall()]

@router.post("/tasks")
def create_task(data: TaskModel, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO student_tasks (user_id,title,description,due_date,status) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                        (user_id, data.title.strip(), data.description or "", data.due_date or "", data.status or "pending"))
            task_id = cur.fetchone()[0]
            conn.commit()
    return {"id": task_id, "message": "Task created"}

@router.put("/tasks/{task_id}")
def update_task(task_id: int, data: TaskModel, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE student_tasks SET title=%s,description=%s,due_date=%s,status=%s WHERE id=%s AND user_id=%s",
                        (data.title.strip(), data.description or "", data.due_date or "", data.status or "pending", task_id, user_id))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Task not found")
            conn.commit()
    return {"message": "Task updated"}

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM student_tasks WHERE id=%s AND user_id=%s", (task_id, user_id))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Task not found")
            conn.commit()
    return {"message": "Task deleted"}

@router.get("/sessions")
def get_sessions(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id,session_date,topic,duration_minutes,notes FROM learning_sessions WHERE user_id=%s ORDER BY id DESC", (user_id,))
            return [{"id": r[0], "session_date": r[1] or "", "topic": r[2], "duration_minutes": r[3], "notes": r[4] or ""} for r in cur.fetchall()]

@router.post("/sessions")
def create_session(data: SessionModel, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO learning_sessions (user_id,session_date,topic,duration_minutes,notes) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                        (user_id, data.session_date, data.topic.strip(), data.duration_minutes, data.notes or ""))
            session_id = cur.fetchone()[0]
            conn.commit()
    return {"id": session_id, "message": "Learning session created"}

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM learning_sessions WHERE id=%s AND user_id=%s", (session_id, user_id))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Learning session not found")
            conn.commit()
    return {"message": "Learning session deleted"}

@router.get("/skills")
def get_skills(ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id,skill_name,proficiency FROM student_skills WHERE user_id=%s ORDER BY id DESC", (user_id,))
            return [{"id": r[0], "skill_name": r[1], "proficiency": r[2] or "Beginner"} for r in cur.fetchall()]

@router.post("/skills")
def create_skill(data: SkillModel, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO student_skills (user_id,skill_name,proficiency) VALUES (%s,%s,%s) RETURNING id",
                        (user_id, data.skill_name.strip(), data.proficiency))
            skill_id = cur.fetchone()[0]
            conn.commit()
    return {"id": skill_id, "message": "Skill created"}

@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, ontrack_session: str = Cookie(None)):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM student_skills WHERE id=%s AND user_id=%s", (skill_id, user_id))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Skill not found")
            conn.commit()
    return {"message": "Skill deleted"}

# Career opportunities are stored in PostgreSQL and scoped by account role.
def _career_user(ontrack_session):
    user_id = get_user_from_cookie(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT role FROM users WHERE id=%s", (user_id,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Account not found")
    return user_id, row[0]

def _career_tables(cur):
    cur.execute("""CREATE TABLE IF NOT EXISTS career_jobs (
        id BIGSERIAL PRIMARY KEY, title VARCHAR(180) NOT NULL, company VARCHAR(180) NOT NULL,
        opportunity_type VARCHAR(40) NOT NULL DEFAULT 'Internship', location VARCHAR(180) NOT NULL DEFAULT 'Remote',
        description TEXT NOT NULL, apply_url TEXT NOT NULL DEFAULT '', created_by BIGINT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())""")
    cur.execute("""CREATE TABLE IF NOT EXISTS career_applications (
        id BIGSERIAL PRIMARY KEY, job_id BIGINT NOT NULL REFERENCES career_jobs(id) ON DELETE CASCADE,
        student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, cover_note TEXT NOT NULL DEFAULT '',
        status VARCHAR(30) NOT NULL DEFAULT 'submitted', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(job_id, student_id))""")

class CareerJobModel(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    company: str = Field(min_length=2, max_length=180)
    opportunity_type: str = "Internship"
    location: str = "Remote"
    description: str = Field(min_length=5, max_length=6000)
    apply_url: Optional[str] = ""

class CareerApplicationModel(BaseModel):
    cover_note: Optional[str] = Field(default="", max_length=2000)

@router.get("/careers/jobs")
def list_career_jobs(ontrack_session: str = Cookie(None)):
    _, role = _career_user(ontrack_session)
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            _career_tables(cur)
            if role == "company_hr":
                cur.execute("""SELECT id,title,company,opportunity_type,location,description,apply_url,created_at
                    FROM career_jobs WHERE created_by=%s ORDER BY created_at DESC""", (get_user_from_cookie(ontrack_session),))
            else:
                cur.execute("""SELECT id,title,company,opportunity_type,location,description,apply_url,created_at
                    FROM career_jobs ORDER BY created_at DESC""")
            rows = cur.fetchall()
        conn.commit()
    return [{"id":r[0],"title":r[1],"company":r[2],"opportunity_type":r[3],"location":r[4],"description":r[5],"apply_url":r[6],"created_at":r[7].isoformat() if r[7] else None} for r in rows]

@router.post("/careers/jobs")
def create_career_job(data: CareerJobModel, ontrack_session: str = Cookie(None)):
    user_id, role = _career_user(ontrack_session)
    if role != "company_hr":
        raise HTTPException(status_code=403, detail="Only verified HR accounts can publish opportunities")
    if data.opportunity_type not in ("Internship", "Full-time job", "Part-time job", "Apprenticeship"):
        raise HTTPException(status_code=400, detail="Choose a supported opportunity type")
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            _career_tables(cur)
            cur.execute("""INSERT INTO career_jobs (title,company,opportunity_type,location,description,apply_url,created_by)
                VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""", (data.title.strip(),data.company.strip(),data.opportunity_type,data.location.strip(),data.description.strip(),data.apply_url or "",user_id))
            job_id = cur.fetchone()[0]
        conn.commit()
    return {"id":job_id,"message":"Opportunity published"}

@router.post("/careers/jobs/{job_id}/apply")
def apply_to_career_job(job_id: int, data: CareerApplicationModel, ontrack_session: str = Cookie(None)):
    user_id, role = _career_user(ontrack_session)
    if role != "student":
        raise HTTPException(status_code=403, detail="Only student accounts can apply through OnTrack")
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            _career_tables(cur)
            cur.execute("SELECT id FROM career_jobs WHERE id=%s", (job_id,))
            if not cur.fetchone(): raise HTTPException(status_code=404, detail="Opportunity not found")
            cur.execute("""INSERT INTO career_applications (job_id,student_id,cover_note) VALUES (%s,%s,%s)
                ON CONFLICT (job_id,student_id) DO NOTHING RETURNING id""", (job_id,user_id,data.cover_note or ""))
            inserted = cur.fetchone()
        conn.commit()
    if not inserted: raise HTTPException(status_code=409, detail="You have already applied to this opportunity")
    return {"message":"Application submitted"}

@router.get("/careers/applications")
def list_career_applications(ontrack_session: str = Cookie(None)):
    user_id, role = _career_user(ontrack_session)
    if role != "company_hr": raise HTTPException(status_code=403, detail="Only verified HR accounts can view applications")
    with psycopg.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            _career_tables(cur)
            cur.execute("""SELECT a.id,a.cover_note,a.status,a.created_at,u.full_name,u.email,j.title,j.company
                FROM career_applications a JOIN career_jobs j ON j.id=a.job_id JOIN users u ON u.id=a.student_id
                WHERE j.created_by=%s ORDER BY a.created_at DESC""", (user_id,))
            rows=cur.fetchall()
        conn.commit()
    return [{"id":r[0],"cover_note":r[1],"status":r[2],"created_at":r[3].isoformat() if r[3] else None,"full_name":r[4],"email":r[5],"job_title":r[6],"company":r[7]} for r in rows]

