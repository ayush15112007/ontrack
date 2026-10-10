import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

def get_database_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "postgres")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "5432")
        dbname = os.getenv("DB_NAME", "ontrack")
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    return db_url

def create_tables():
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'student',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS student_profiles (
                    id SERIAL PRIMARY KEY,
                    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                    phone VARCHAR(50),
                    city VARCHAR(100),
                    bio TEXT,
                    college VARCHAR(255),
                    degree VARCHAR(255),
                    branch VARCHAR(255),
                    academic_year VARCHAR(50),
                    graduation_year VARCHAR(50),
                    career_goal TEXT,
                    preferred_role VARCHAR(255),
                    courses JSONB DEFAULT '[]'::jsonb,
                    projects JSONB DEFAULT '[]'::jsonb
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS student_tasks (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    due_date VARCHAR(50),
                    status VARCHAR(50) DEFAULT 'pending'
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS learning_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    session_date VARCHAR(50),
                    topic VARCHAR(255) NOT NULL,
                    duration_minutes INT NOT NULL,
                    notes TEXT
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS student_skills (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    skill_name VARCHAR(100) NOT NULL,
                    proficiency VARCHAR(50) DEFAULT 'Beginner'
                );
            """)
            conn.commit()
    print("Database tables initialized successfully via lifespan!")
