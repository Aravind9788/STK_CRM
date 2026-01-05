from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User, TeamLeadStaff, StoreManagerStaff
from utils.security import verify_password, create_access_token, create_refresh_token, verify_refresh_token
from schemas import LoginSchema
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth")

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    """
    Check multiple tables for user authentication:
    1. User table (for SALES_EXECUTIVE and DIRECTOR roles)
    2. TeamLeadStaff table (for TEAM_LEAD role)
    3. StoreManagerStaff table (for STORE_MANAGER role)
    """
    user_record = None
    user_role = None
    user_id = None
    username = None
    hashed_pwd = None
    refresh_token_field = None
    
    print("data:",data)
    # 1. Check User table first
    try:
        user = db.query(User).filter_by(username=data.username).first()
        print("user_details:",user)
        if user and verify_password(data.password, user.hashed_password):
            print("user")
            user_record = user
            user_role = user.role  # Use role from database (SALES_EXECUTIVE, DIRECTOR, etc.)
            user_id = user.id
            username = user.username
            hashed_pwd = user.hashed_password
            refresh_token_field = "user"
    except Exception as e:
        print(f"Error checking User table: {e}")
    
    # 2. Check TeamLeadStaff table if not found in User
    if not user_record:
        try:
            team_lead = db.query(TeamLeadStaff).filter_by(staff_id=data.username).first()
            print("team_lead_details:",team_lead)
            if team_lead and verify_password(data.password, team_lead.hashed_password):
                print("team_lead")
                user_record = team_lead
                user_role = "TEAM_LEAD"
                user_id = team_lead.id
                username = team_lead.staff_id
                hashed_pwd = team_lead.hashed_password
                refresh_token_field = "team_lead"
        except Exception as e:
            print(f"Error checking TeamLeadStaff table (table may not exist): {e}")
    
    # 3. Check StoreManagerStaff table if still not found
    if not user_record:
        try:
            store_manager = db.query(StoreManagerStaff).filter_by(staff_id=data.username).first()
            print("store_manager_details:",store_manager)
            if store_manager and verify_password(data.password, store_manager.hashed_password):
                print("store_manager")
                user_record = store_manager
                user_role = "STORE_MANAGER"
                user_id = store_manager.id
                username = store_manager.staff_id
                hashed_pwd = store_manager.hashed_password
                refresh_token_field = "store_manager"
        except Exception as e:
            print(f"Error checking StoreManagerStaff table (table may not exist): {e}")
    
    # If no match found in any table, raise error
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create both access and refresh tokens
    access_token = create_access_token({
        "sub": username,
        "role": user_role,
        "user_id": user_id,
        "sales_executive_id": username 
    })
    
    refresh_token = create_refresh_token({
        "sub": username,
        "user_id": user_id,
        "table": refresh_token_field  # Track which table this user is from
    })
    
    # Store refresh token in appropriate table
    if refresh_token_field == "user":
        user_record.refresh_token = refresh_token
        db.commit()
    # Note: TeamLeadStaff and StoreManagerStaff don't have refresh_token column yet
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user_role  # Include role in response for frontend
    }




@router.post("/token/refresh")
async def refresh_token(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    token = body.get("refresh_token")

    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")

    payload = verify_refresh_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")

    username = payload.get("sub")
    table_type = payload.get("table", "user")  # Default to user table
    
    # Find user in appropriate table
    user_record = None
    user_role = None
    
    if table_type == "team_lead":
        user_record = db.query(TeamLeadStaff).filter_by(staff_id=username).first()
        user_role = "TEAM_LEAD"
    elif table_type == "store_manager":
        user_record = db.query(StoreManagerStaff).filter_by(staff_id=username).first()
        user_role = "STORE_MANAGER"
    else:
        user_record = db.query(User).filter_by(username=username).first()
        if user_record:
            user_role = user_record.role

    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify the refresh token matches what's stored (only for User table)
    if table_type == "user" and hasattr(user_record, 'refresh_token'):
        if user_record.refresh_token != token:
            raise HTTPException(status_code=403, detail="Invalid refresh token")

    # Create new access token
    new_access_token = create_access_token({
        "sub": username,
        "role": user_role,
        "user_id": user_record.id,
        "sales_executive_id": username
    })

    # Check if refresh token is close to expiry
    exp_timestamp = payload["exp"]
    expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    remaining = expires_at - datetime.now(timezone.utc)
    
    # Rotate refresh token if less than 2 days remaining
    if remaining < timedelta(days=2):
        new_refresh_token = create_refresh_token({
            "sub": username,
            "user_id": user_record.id,
            "table": table_type
        })
        # Only store in User table (others don't have refresh_token column)
        if table_type == "user":
            user_record.refresh_token = new_refresh_token
            db.commit()
    else:
        new_refresh_token = token  # Reuse existing token

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
    }
