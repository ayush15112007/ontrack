import psycopg
from app.db.database import get_database_url

def init_db():
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            # Users table
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

            # Student profiles table (resume-style)
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
                    percentage_10th VARCHAR(50),
                    percentage_12th VARCHAR(50),
                    cgpa VARCHAR(50),
                    career_goal TEXT,
                    preferred_role VARCHAR(255),
                    areas_of_interest TEXT,
                    courses JSONB DEFAULT '[]'::jsonb,
                    projects JSONB DEFAULT '[]'::jsonb
                );
            """)

            # Student tasks table
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

            # Learning sessions table
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

            # Student skills table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS student_skills (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    skill_name VARCHAR(100) NOT NULL,
                    proficiency VARCHAR(50) DEFAULT 'Beginner'
                );
            """)
            conn.commit()
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    init_db()