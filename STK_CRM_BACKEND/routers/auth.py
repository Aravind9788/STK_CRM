from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from utils.security import verify_password, create_access_token
from schemas import LoginSchema

router = APIRouter(prefix="/auth")

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
            "sub": user.username,
            "role": user.role,
            "sales_executive_id": user.username 
        })
    return {"access_token": token, "token_type": "bearer"}
