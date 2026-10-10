import psycopg
from fastapi import Cookie, Depends, HTTPException, status
from app.db.database import get_database_url
from app.core.security import verify_access_token

def get_current_user(ontrack_session: str = Cookie(None)):
    if not ontrack_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = verify_access_token(ontrack_session)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    user_id = payload.get("sub")
    role = payload.get("role")
    
    url = get_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, full_name, email, role FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            return {
                "id": user[0],
                "full_name": user[1],
                "email": user[2],
                "role": user[3]
            }

def require_student(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to students only"
        )
    return user