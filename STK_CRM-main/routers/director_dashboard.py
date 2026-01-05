from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Lead, StoreManagerDashboard, TeamLeadStaff, StoreManagerStaff
from schemas import CreateStaffRequest, StaffResponse, StaffListItem
from utils.security import get_current_user
from passlib.context import CryptContext
from datetime import datetime
import re

router = APIRouter(prefix="/director-dashboard", tags=["Director Dashboard"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper function to generate location code from store name
def get_location_code(store_name: str) -> str:
    """Extract location code from store name (first 3 letters uppercase)"""
    # Remove common words and get the main location name
    cleaned = re.sub(r'\b(store|branch|office)\b', '', store_name, flags=re.IGNORECASE).strip()
    # Take first 3 letters and uppercase
    location_code = cleaned[:3].upper()
    return location_code if location_code else "GEN"

# Helper function to generate staff ID
def generate_staff_id(role_code: str, store_name: str, db: Session, model_class) -> str:
    """
    Generate staff ID in format: {ROLE}-{LOCATION}-{NUMBER}
    Example: TL-PLK-001, SM-THR-002
    """
    location_code = get_location_code(store_name)
    
    # Find the highest existing number for this role and location
    prefix = f"{role_code}-{location_code}-"
    existing_staff = db.query(model_class).filter(
        model_class.staff_id.like(f"{prefix}%")
    ).order_by(model_class.staff_id.desc()).first()
    
    if existing_staff:
        # Extract the number from the last staff ID
        last_id = existing_staff.staff_id
        last_number = int(last_id.split('-')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    # Format with zero padding (001, 002, etc.)
    staff_id = f"{prefix}{new_number:03d}"
    return staff_id

# Optional: Helper to restrict access to Directors only
def verify_director(user: dict):
    if user.get("role") != "director":
        raise HTTPException(403, "Access Denied")

@router.get("/stats")
def get_director_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns high-level stats for the Director:
    1. Total Delivered Count (Store Manager success)
    2. Pending Delivers Count (Orders in Store pipeline)
    3. Leads Completed (Sales success)
    4. Leads Pending (Active Sales pipeline)
    """
    # verify_director(current_user) # Uncomment if you have a director role

    # --- 1. STORE METRICS ---
    
    # Orders successfully delivered to customer
    total_delivered = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.status == "Delivered"
    ).count()

    # Orders currently with the Store Manager (Pending or Dispatched)
    pending_deliveries = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.status.in_(["Pending", "Dispatched"])
    ).count()

    # Leads that were successfully converted/closed
    # We check for all "Won" statuses used in your system
    leads_completed = db.query(Lead).filter(
        Lead.status.in_(["Delivered"])
    ).count()

    # Leads currently active in the sales pipeline
    # We exclude Final states (Won or Lost) to find what is "Pending"
    leads_pending = db.query(Lead).filter(
        Lead.status.notin_(["Delivered"])
    ).count()

    return {
        "total_delivered_count": total_delivered,
        "pending_deliveries_count": pending_deliveries,
        "leads_completed_count": leads_completed,
        "leads_pending_count": leads_pending
    }

# ============= TEAM LEAD MANAGEMENT =============

@router.post("/create-team-lead", response_model=StaffResponse)
def create_team_lead(
    request: CreateStaffRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new Team Lead with auto-generated staff ID
    Format: TL-{LOCATION}-{SEQ} (e.g., TL-PLK-001)
    """
    # Generate staff ID
    staff_id = generate_staff_id("TL", request.store_assigned, db, TeamLeadStaff)
    
    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Create team lead
    new_staff = TeamLeadStaff(
        staff_id=staff_id,
        full_name=request.full_name,
        hashed_password=hashed_password,
        plain_password=request.password,  # Store plain password
        store_assigned=request.store_assigned,
        created_at=datetime.now()
    )
    
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    
    return StaffResponse(
        staff_id=new_staff.staff_id,
        full_name=new_staff.full_name,
        store_assigned=new_staff.store_assigned,
        created_at=new_staff.created_at
    )

@router.get("/team-leads", response_model=list[StaffListItem])
def get_team_leads(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of all Team Leads
    """
    team_leads = db.query(TeamLeadStaff).order_by(TeamLeadStaff.created_at.desc()).all()
    
    return [
        StaffListItem(
            id=tl.id,
            staff_id=tl.staff_id,
            full_name=tl.full_name,
            password=tl.plain_password if tl.plain_password else "********",
            store_assigned=tl.store_assigned
        )
        for tl in team_leads
    ]

# ============= STORE MANAGER MANAGEMENT =============

@router.post("/create-store-manager", response_model=StaffResponse)
def create_store_manager(
    request: CreateStaffRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new Store Manager with auto-generated staff ID
    Format: SM-{LOCATION}-{SEQ} (e.g., SM-PLK-001)
    """
    # Generate staff ID
    staff_id = generate_staff_id("SM", request.store_assigned, db, StoreManagerStaff)
    
    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Create store manager
    new_staff = StoreManagerStaff(
        staff_id=staff_id,
        full_name=request.full_name,
        hashed_password=hashed_password,
        plain_password=request.password,  # Store plain password
        store_assigned=request.store_assigned,
        created_at=datetime.now()
    )
    
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    
    return StaffResponse(
        staff_id=new_staff.staff_id,
        full_name=new_staff.full_name,
        store_assigned=new_staff.store_assigned,
        created_at=new_staff.created_at
    )

@router.get("/store-managers", response_model=list[StaffListItem])
def get_store_managers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of all Store Managers
    """
    store_managers = db.query(StoreManagerStaff).order_by(StoreManagerStaff.created_at.desc()).all()
    
    return [
        StaffListItem(
            id=sm.id,
            staff_id=sm.staff_id,
            full_name=sm.full_name,
            password=sm.plain_password if sm.plain_password else "********",
            store_assigned=sm.store_assigned
        )
        for sm in store_managers
    ]