from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import datetime, date, timedelta

from database import get_db
from models import Lead, User, StoreManagerDashboard
from schemas import (
    TeamleadResponseToApproval, 
    PendingApprovalDetailResponse,
    TeamLeadDashboardStats,
    CreateStaffRequest,
    TeamStatsResponse,
    SalesMemberStats,
    SalesExecutiveListItem,
    IndividualPerformanceResponse,
    GraphDataPoint,
    PerformanceMetrics,
    PendingApprovalListResponse,
    PendingLeadsOverviewResponse, 
    ExecutivePendingStats,
    TimelineFilterRequest, 
    TimelineEventItem,
    PendingLeadTrackerItem,  
    LeadTimeTrackingResponse,
    TimeLogEvent,
    StoreManagerOverviewResponse,
    StorePendingBreakdown,
    TodayAttendanceSummary,
    AttendanceLogItem,
    MonthlyAttendanceReport,
    LeaveHistoryItem,
    LateHistoryItem
)

from utils.security import get_current_user, get_password_hash

router = APIRouter(prefix="/team-lead", tags=["Team Lead"])


# ==========================================
# HELPER: Validate Team Lead Role
# ==========================================
def verify_team_lead(current_user: dict):
    user_role = current_user.get("role", "")
    if user_role != "TEAM_LEAD":
        raise HTTPException(
            status_code=403, 
            detail=f"Access denied. Required role: 'TEAM_LEAD', but you are: '{user_role}'"
        )



# ==========================================
# 1. FETCH PENDING APPROVALS
# ==========================================
@router.get("/pending-approvals", response_model=List[PendingApprovalListResponse])
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth

    leads = db.query(Lead).filter(Lead.approver_status == "PENDING").all()
    if not leads: return []

    # Batch fetch User Names to avoid N+1 problem
    user_ids = {int(lead.sales_executive_id) for lead in leads if lead.sales_executive_id and lead.sales_executive_id.isdigit()}
    
    users_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        # Prefer Full Name, fallback to Username (SE-ID)
        users_map = {u.id: (u.full_name if u.full_name else u.username) for u in users}

    response_list = []
    for lead in leads:
        se_id = int(lead.sales_executive_id) if lead.sales_executive_id and lead.sales_executive_id.isdigit() else 0
        se_name = users_map.get(se_id, "Unknown")

        response_list.append({
            "lead_id": lead.id,
            "quotation_id": lead.quotation_id or "N/A",
            "client_name": lead.customer_name,
            "amount": lead.total_estimated_cost or 0,
            "sales_rep_name": se_name,
            "priority": lead.urgency or "Normal",
            "submitted_at": lead.approver_request_at
        })
    return response_list


# ==========================================
# 2. GET APPROVAL DETAIL
# ==========================================
@router.get("/pending-approvals/{lead_id}", response_model=PendingApprovalDetailResponse)
def get_pending_approval_detail(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_team_lead(current_user)
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id, 
        Lead.approver_status == "PENDING"
    ).first()
    
    if not lead: 
        raise HTTPException(status_code=404, detail="Quotation not found or not pending")

    se_name = "Unknown"
    if lead.sales_executive_id and lead.sales_executive_id.isdigit():
        user = db.query(User).filter(User.id == int(lead.sales_executive_id)).first()
        if user: 
            se_name = user.full_name if user.full_name else user.username

    return {
        "lead_id": lead.id,
        "quotation_id": lead.quotation_id,
        "client_name": lead.customer_name,
        "sales_rep_name": se_name,
        "submitted_at": lead.approver_request_at,
        "total_estimated_cost": lead.total_estimated_cost or 0,
        "quotation": lead.quotation_snapshot
    }


# ==========================================
# 3. APPROVAL ACTION
# ==========================================
@router.post("/approval-action", response_model=TeamleadResponseToApproval)
def approval_action(
    lead_id: int = Body(..., embed=True),
    action: str = Body(..., embed=True),
    remarks: str = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_team_lead(current_user)
    
    if action.upper() not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead: 
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead.approver_status != "PENDING": 
        raise HTTPException(status_code=400, detail="Quotation already reviewed")

    lead.approver_status = action.upper()
    lead.approver_response_at = datetime.now()
    
    db.commit()
    return {"status": action.upper(), "message": f"Quotation {action.lower()} successfully"}


# ==========================================
# 4. DASHBOARD STATS
# ==========================================
@router.get("/dashboard-stats", response_model=TeamLeadDashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_team_lead(current_user)  # Commented out for testing without auth

    total_leads = db.query(Lead).count()
    # Pending leads are those with active follow-ups needed
    pending_leads = db.query(Lead).filter(Lead.status.in_(["Today", "Upcoming"])).count()
    
    total_deliveries = db.query(StoreManagerDashboard).count()
    completed_deliveries = db.query(StoreManagerDashboard).filter(StoreManagerDashboard.status == "Delivered").count()

    goal_percent = 0
    if total_leads > 0:
        # Assuming "Delivered" is the success state for conversion
        delivered_count = db.query(Lead).filter(Lead.status == "Delivered").count()
        goal_percent = int((delivered_count / total_leads) * 100)

    return {
        "leads_pending_followup": pending_leads,
        "leads_total_active": total_leads,
        "deliveries_completed": completed_deliveries,
        "deliveries_total": total_deliveries,
        "team_goal_percentage": goal_percent
    }


# ==========================================
# HELPER: Generate Sales Executive ID
# ==========================================
def generate_sales_executive_id(store_name: str, db: Session) -> str:
    """
    Generates unique Sales Executive ID in format: SE-{STORE_CODE}-{NUMBER}
    Example: SE-PLK-001 for Palakkad
    """
    # Store code mapping
    store_codes = {
        "palakkad": "PLK",
        "ernakulam": "ERN",
        "azhapula": "AZH",
        "trissur": "TRS"
    }
    
    store_code = store_codes.get(store_name.lower(), "UNK")
    
    # Find highest number for this store
    prefix = f"SE-{store_code}-"
    existing = db.query(User).filter(
        User.username.like(f"{prefix}%"),
        User.role == "sales_executive"
    ).all()
    
    # Extract numbers and find max
    numbers = []
    for user in existing:
        try:
            num_str = user.username.split("-")[-1]
            numbers.append(int(num_str))
        except:
            pass
    
    next_num = max(numbers) + 1 if numbers else 1
    return f"{prefix}{next_num:03d}"


# ==========================================
# 5. ADD STAFF
# ==========================================
@router.post("/add-staff")
def add_new_staff(
    data: CreateStaffRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)
    
    team_lead = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not team_lead or not team_lead.store_assigned:
         raise HTTPException(status_code=400, detail="Team Lead not assigned to a store.")
    
    my_store = team_lead.store_assigned

    # Auto-generate Sales Executive ID
    auto_generated_id = generate_sales_executive_id(my_store, db)
    
    # Double-check for collision (unlikely but safe)
    if db.query(User).filter(User.username == auto_generated_id).first():
        raise HTTPException(status_code=500, detail="ID collision detected, please retry")

    hashed_pwd = get_password_hash(data.password)
    
    new_user = User(
        username=auto_generated_id,  # Using auto-generated ID as username for login
        full_name=data.full_name,
        hashed_password=hashed_pwd,
        role="sales_executive",
        store_assigned=my_store
    )
    
    db.add(new_user)
    db.commit()

    return {
        "message": f"Staff '{data.full_name}' created successfully.",
        "sales_executive_id": auto_generated_id
    }


@router.get("/staff-list")
def get_staff_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get list of all staff members for the team lead's store"""
    verify_team_lead(current_user)
    
    team_lead = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not team_lead or not team_lead.store_assigned:
        return []
    
    my_store = team_lead.store_assigned
    
    # Get all sales executives in the store
    staff = db.query(User).filter(
        User.store_assigned == my_store,
        User.role == "sales_executive"
    ).order_by(User.id.desc()).all()
    
    return [{
        "id": s.id,
        "username": s.username,
        "full_name": s.full_name,
        "role": s.role
        # Note: password is NOT returned for security
    } for s in staff]


@router.get("/low-performers")
def get_low_performers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns sales executives with low performance metrics
    Criteria: Low conversion rate, high pending leads ratio
    """
    # verify_team_lead(current_user)  # Commented out for testing
    my_store = current_user.get("store_assigned")
    
    sales_team = db.query(User).filter(
        User.store_assigned == my_store,
        User.role == "sales_executive"
    ).all()
    
    low_performers = []
    
    for se in sales_team:
        se_id_str = str(se.id)
        
        # Calculate metrics
        total_leads = db.query(Lead).filter(Lead.sales_executive_id == se_id_str).count()
        
        if total_leads == 0:
            continue  # Skip if no leads assigned
        
        pending_leads = db.query(Lead).filter(
            Lead.sales_executive_id == se_id_str,
            Lead.status.in_(["Today", "Upcoming"])
        ).count()
        
        delivered = db.query(Lead).filter(
            Lead.sales_executive_id == se_id_str,
            Lead.status == "Delivered"
        ).count()
        
        # Calculate performance metrics
        conversion_rate = (delivered / total_leads) * 100 if total_leads > 0 else 0
        pending_ratio = (pending_leads / total_leads) * 100 if total_leads > 0 else 0
        
        # Low performer criteria:
        # - Conversion rate < 30% AND
        # - Pending ratio > 50%
        # OR has more than 10 pending leads
        is_low_performer = (conversion_rate < 30 and pending_ratio > 50) or pending_leads > 10
        
        if is_low_performer:
            low_performers.append({
                "id": str(se.id),
                "name": se.full_name if se.full_name else se.username,
                "role": "Sales Executive",
                "icon": "account-tie",
                "conversion_rate": round(conversion_rate, 1),
                "pending_count": pending_leads,
                "total_leads": total_leads
            })
    
    return low_performers


@router.get("/pending-leads-tracking", response_model=List[PendingLeadTrackerItem])
def get_pending_leads_tracking(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of pending leads with current stage tracking
    Stages: 0=New, 1=Quotation Generated, 2=Sent to Approval, 3=Approved, 
            4=Send to Customer, 5=In Followup, 6=Assigned To Store, 
            7=Dispatched, 8=Delivered, 9=Close
    """
    # verify_team_lead(current_user)  # Commented for testing
    
    # Get all pending leads (not in final closed state)
    pending_leads = db.query(Lead).filter(
        Lead.status.notin_(["Closed", "Rejected"])
    ).all()
    
    result = []
    for lead in pending_leads:
        # Get sales executive name
        se = db.query(User).filter(User.id == int(lead.sales_executive_id)).first()
        se_name = se.full_name if se and se.full_name else (se.username if se else "Unknown")
        
        # Determine current stage index based on lead progress
        # Stage mapping based on available timestamps and status
        stage_index = 0  # Default: New
        
        # Check store manager dashboard for delivery stages
        store_entry = db.query(StoreManagerDashboard).filter(
            StoreManagerDashboard.lead_code == lead.lead_code
        ).first()
        
        if store_entry:
            if store_entry.status == "Delivered":
                stage_index = 8  # Delivered
            elif store_entry.status == "Dispatched":
                stage_index = 7  # Dispatched
            elif store_entry.handover_at:
                stage_index = 6  # Assigned To Store
        
        # Check lead status and timestamps
        if stage_index < 6:  # Only check if not already in store stages
            if lead.status in ["FollowUp", "Today", "Upcoming"]:
                stage_index = 5  # In Followup
            elif lead.customer_quotation_sent_at:
                stage_index = 4  # Send to Customer
            elif lead.approver_response_at and lead.approver_status == "APPROVED":
                stage_index = 3  # Approved
            elif lead.approver_request_at:
                stage_index = 2  # Sent to Approval
            elif lead.quotation_created_at:
                stage_index = 1  # Quotation Generated
            elif lead.lead_created_at:
                stage_index = 0  # New
        
        # Format amount
        amount_str = f"₹{lead.total_estimated_cost:,}" if lead.total_estimated_cost else "₹0"
        
        # Calculate last update time
        last_update_time = (
            store_entry.delivered_at if store_entry and store_entry.delivered_at else
            lead.customer_quotation_sent_at or 
            lead.quotation_created_at or 
            lead.lead_created_at
        )
        
        if last_update_time:
            time_diff = datetime.now() - last_update_time.replace(tzinfo=None)
            if time_diff.days > 0:
                last_update = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds // 3600 > 0:
                hours = time_diff.seconds // 3600
                last_update = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                last_update = "Just now"
        else:
            last_update = "Unknown"
        
        result.append({
            "id": lead.lead_code,
            "name": lead.customer_name,
            "value": amount_str,
            "salesPerson": se_name,
            "currentStageIndex": stage_index,
            "lastUpdate": last_update
        })
    
    return result


# ==========================================
# 6. TEAM STATS (List View)
# ==========================================
@router.get("/team-stats", response_model=TeamStatsResponse)
def get_team_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth
    my_store = current_user.get("store_assigned") if current_user else "Palakad"  # Default for testing

    sales_team = db.query(User).filter(User.store_assigned == my_store, User.role == "sales_executive").all()
    team_data = []
    today = datetime.now().date()

    for se in sales_team:
        se_id_str = str(se.id)
        
        total_leads = db.query(Lead).filter(Lead.sales_executive_id == se_id_str).count()
        pending_leads = db.query(Lead).filter(Lead.sales_executive_id == se_id_str, Lead.status.in_(["Today", "Upcoming"])).count()

        handover_query = db.query(StoreManagerDashboard).join(Lead).filter(Lead.sales_executive_id == se_id_str)
        total_handover = handover_query.count()
        completed_delivery = handover_query.filter(StoreManagerDashboard.status == "Delivered").count()

        daily_revenue = db.query(func.sum(Lead.total_estimated_cost)).filter(
            Lead.sales_executive_id == se_id_str, func.date(Lead.lead_created_at) == today
        ).scalar() or 0

        member_stats = SalesMemberStats(
            id=se.id,
            name=se.full_name if se.full_name else se.username, # Prefer Full Name for display
            pending_leads_count=pending_leads,
            total_leads_assigned=total_leads,
            deliveries_completed=completed_delivery,
            deliveries_total_handover=total_handover,
            daily_revenue_achieved=int(daily_revenue),
            daily_revenue_target=50000 
        )
        team_data.append(member_stats)

    return {"team_members": team_data, "overall_conversion_rate": 57}


# ==========================================
# 7. INDIVIDUAL PERFORMANCE (LIST VIEW)
# ==========================================
@router.get("/individual-performance-list", response_model=List[SalesExecutiveListItem])
def get_sales_executives_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth
    my_store = current_user.get("store_assigned") if current_user else "Palakad"  # Default for testing
    
    sales_team = db.query(User).filter(User.store_assigned == my_store, User.role == "sales_executive").all()
    
    return [
        SalesExecutiveListItem(
            user_id=u.id,
            username=u.full_name if u.full_name else u.username,
            employee_id=u.username, # Display the SE-ID (username)
            status="Active"
        ) for u in sales_team
    ]


# ==========================================
# 8. INDIVIDUAL PERFORMANCE (DETAIL VIEW)
# ==========================================
@router.get("/individual-performance/{user_id}", response_model=IndividualPerformanceResponse)
def get_sales_executive_performance(
    user_id: int,
    period: str = "monthly",
    date_filter: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth
    se = db.query(User).filter(User.id == user_id).first()
    if not se: raise HTTPException(404, "User not found")

    se_id_str = str(se.id)
    today = date.today()
    target_date = today
    if date_filter:
        try: target_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
        except: pass

    # Metrics Calculation
    pending_count = db.query(Lead).filter(
        Lead.sales_executive_id == se_id_str, 
        Lead.status.in_(["Today", "Upcoming"])
    ).count()
    
    quotations_today = db.query(Lead).filter(
        Lead.sales_executive_id == se_id_str, 
        Lead.quotation_id.isnot(None), 
        func.date(Lead.quotation_created_at) == target_date
    ).count()
    
    completed_count = db.query(Lead).filter(
        Lead.sales_executive_id == se_id_str, 
        Lead.status == "Delivered", 
        extract('month', Lead.lead_created_at) == target_date.month
    ).count()
    
    # Daily revenue calculation for donut chart
    daily_revenue = db.query(func.sum(Lead.total_estimated_cost)).filter(
        Lead.sales_executive_id == se_id_str, 
        func.date(Lead.lead_created_at) == target_date
    ).scalar() or 0
    
    # Score logic
    completed_target = 10
    quotation_target = 10
    daily_revenue_target = 50000  # Target revenue per day
    score_completion = min((completed_count / completed_target) * 100, 100) if completed_target else 0
    score_quotation = min((quotations_today / quotation_target) * 100, 100) if quotation_target else 0
    final_score = int((score_completion * 0.6) + (score_quotation * 0.4))
    
    rating = "Excellent" if final_score >= 80 else "Good" if final_score >= 60 else "Average" if final_score >= 40 else "Low"

    # Graph Data Logic
    revenue_data_points = []
    
    if period == "daily":
        results = db.query(
            extract('hour', Lead.lead_created_at).label("hour"),
            func.sum(Lead.total_estimated_cost).label("revenue")
        ).filter(
            Lead.sales_executive_id == se_id_str,
            func.date(Lead.lead_created_at) == target_date
        ).group_by(extract('hour', Lead.lead_created_at)).all()
        
        hourly_data = {int(r.hour): int(r.revenue or 0) for r in results}
        for hour in range(9, 20):
            display_hour = hour if hour <= 12 else hour - 12
            am_pm = "AM" if hour < 12 else "PM"
            revenue_data_points.append(GraphDataPoint(label=f"{display_hour} {am_pm}", value=hourly_data.get(hour, 0)))

    elif period == "weekly":
        start_date = target_date - timedelta(days=6)
        results = db.query(
            func.date(Lead.lead_created_at).label("date"),
            func.sum(Lead.total_estimated_cost).label("revenue")
        ).filter(
            Lead.sales_executive_id == se_id_str,
            func.date(Lead.lead_created_at) >= start_date,
            func.date(Lead.lead_created_at) <= target_date
        ).group_by(func.date(Lead.lead_created_at)).all()
        
        daily_data = {str(r.date): int(r.revenue or 0) for r in results}
        for i in range(7):
            d = start_date + timedelta(days=i)
            revenue_data_points.append(GraphDataPoint(label=d.strftime("%a"), value=daily_data.get(str(d), 0)))

    elif period == "monthly":
        results = db.query(
            func.date(Lead.lead_created_at).label("date"),
            func.sum(Lead.total_estimated_cost).label("revenue")
        ).filter(
            Lead.sales_executive_id == se_id_str,
            extract('month', Lead.lead_created_at) == target_date.month,
            extract('year', Lead.lead_created_at) == target_date.year
        ).group_by(func.date(Lead.lead_created_at)).all()
        
        weeks = {"Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0}
        for r in results:
            if not r.date: continue
            day = r.date.day
            if day <= 7: weeks["Week 1"] += int(r.revenue or 0)
            elif day <= 14: weeks["Week 2"] += int(r.revenue or 0)
            elif day <= 21: weeks["Week 3"] += int(r.revenue or 0)
            else: weeks["Week 4"] += int(r.revenue or 0)
        
        for w, val in weeks.items():
            revenue_data_points.append(GraphDataPoint(label=w, value=val))

    if not revenue_data_points:
        revenue_data_points = [GraphDataPoint(label="No Data", value=0)]

    return IndividualPerformanceResponse(
        user_id=se.id,
        username=se.username,
        role="Sales Executive",
        revenue_graph_data=revenue_data_points,
        metrics=PerformanceMetrics(
            pending_followups=pending_count,
            daily_quotations_created=quotations_today,
            daily_quotations_target=10,
            leads_completed_count=completed_count,
            leads_completed_target=10,
            daily_revenue=int(daily_revenue),
            daily_revenue_target=daily_revenue_target,
            performance_score=final_score,
            performance_rating=rating
        )
    )


# ==========================================
# 9. PENDING LEADS OVERVIEW
# ==========================================
@router.get("/pending-leads-overview", response_model=PendingLeadsOverviewResponse)
def get_pending_leads_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth
    my_store = current_user.get("store_assigned") if current_user else "Palakad"  # Default for testing
    sales_team = db.query(User).filter(User.store_assigned == my_store, User.role == "sales_executive").all()

    breakdown_data = []
    store_total_pending = 0
    store_total_active = 0

    for se in sales_team:
        se_id_str = str(se.id)
        # Pending logic: Open or FollowUp
        pending_count = db.query(Lead).filter(
            Lead.sales_executive_id == se_id_str, 
            Lead.status.in_(["Open", "FollowUp", "Today", "Upcoming"])
        ).count()
        
        # Active logic: Not in final states
        active_count = db.query(Lead).filter(
            Lead.sales_executive_id == se_id_str, 
            Lead.status.notin_(["Delivered", "Closed", "Rejected", "Converted"])
        ).count()
        
        store_total_pending += pending_count
        store_total_active += active_count
        
        breakdown_data.append({
            "user_id": se.id,
            "name": se.full_name or se.username,
            "pending_count": pending_count,
            "percentage": 0
        })

    if store_total_pending > 0:
        for item in breakdown_data:
            item["percentage"] = int((item["pending_count"] / store_total_pending) * 100)
    
    breakdown_data.sort(key=lambda x: x["pending_count"], reverse=True)

    return {
        "total_pending": store_total_pending,
        "total_active_leads": store_total_active,
        "breakdown": [ExecutivePendingStats(**item) for item in breakdown_data]
    }


# ==========================================
# 10. TIMELINE REPORT
# ==========================================
@router.post("/time-logs/report", response_model=List[TimelineEventItem])
def get_timeline_report(
    filter_data: TimelineFilterRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth
    my_store = current_user.get("store_assigned") if current_user else "Palakad"  # Default for testing
    
    store_se_ids = db.query(User.id).filter(User.store_assigned == my_store, User.role == "sales_executive").all()
    allowed_ids = [str(uid[0]) for uid in store_se_ids]
    
    query = db.query(Lead).filter(Lead.sales_executive_id.in_(allowed_ids))
    if filter_data.sales_executive_id:
        query = query.filter(Lead.sales_executive_id == str(filter_data.sales_executive_id))
    
    leads = query.all()
    user_map = {str(u.id): u.username for u in db.query(User).all()}
    timeline_events = []
    
    # Remove timezone info to match database timestamps (which are naive)
    start_ts = filter_data.start_date.replace(tzinfo=None) if filter_data.start_date else None
    end_ts = filter_data.end_date.replace(tzinfo=None) if filter_data.end_date else None

    for lead in leads:
        se_name = user_map.get(lead.sales_executive_id, "Unknown")
        
        def add_event(evt_type, ts, amount=0, status="Completed"):
            if ts and start_ts and end_ts and start_ts <= ts <= end_ts:
                timeline_events.append(TimelineEventItem(
                    lead_id=lead.id, lead_code=lead.lead_code, customer_name=lead.customer_name,
                    sales_executive_name=se_name, event_type=evt_type, timestamp=ts, amount=amount, status=status
                ))

        add_event("Lead Created", lead.lead_created_at)
        add_event("Quotation Generated", lead.quotation_created_at, lead.total_estimated_cost or 0)
        add_event("Sent for Approval", lead.approver_request_at, lead.total_estimated_cost or 0, "Pending" if lead.approver_status == "PENDING" else "Completed")
        add_event("Quotation Sent", lead.customer_quotation_sent_at, lead.total_estimated_cost or 0)

    timeline_events.sort(key=lambda x: x.timestamp, reverse=True)
    return timeline_events


# ==========================================
# 11. PENDING LEADS TRACKING (5-Step)
# ==========================================
@router.get("/pending-leads-tracking", response_model=List[PendingLeadTrackerItem])
def get_pending_leads_tracking(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing without auth
    my_store = current_user.get("store_assigned") if current_user else "Palakad"  # Default for testing
    
    sales_team_ids = db.query(User.id).filter(User.store_assigned == my_store, User.role == "sales_executive").all()
    allowed_ids = [str(i[0]) for i in sales_team_ids]

    leads = db.query(Lead).filter(
        Lead.sales_executive_id.in_(allowed_ids), 
        Lead.status.notin_(["Delivered", "Rejected", "Closed"])
    ).all()
    
    user_map = {str(u.id): u.username for u in db.query(User).all()}
    response = []

    for lead in leads:
        step = 1
        stage_name = "Pending"
        
        # 5-Step Logic
        if lead.status in ["Pending", "Open", "New"]: step, stage_name = 1, "Pending"
        elif lead.status in ["Contacted", "Not Picked"]: step, stage_name = 2, "Attempted"
        elif lead.status == "In Discussion": step, stage_name = 3, "Discussion"
        elif lead.status == "Follow-up / Retention": step, stage_name = 4, "Follow-up"
        elif lead.status in ["Converted", "Won"]: step, stage_name = 5, "Closed"

        time_ago_str = "Just now"
        if lead.lead_created_at:
            diff = datetime.now() - lead.lead_created_at
            time_ago_str = f"{diff.days} days ago" if diff.days > 0 else f"{diff.seconds // 3600} hours ago"

        response.append(PendingLeadTrackerItem(
            lead_id=lead.id, lead_code=lead.lead_code, client_name=lead.customer_name,
            sales_rep_name=user_map.get(lead.sales_executive_id, "Unknown"), amount=lead.total_estimated_cost or 0,
            time_ago=time_ago_str, current_stage_step=step, current_stage_name=stage_name
        ))
    return response


# ==========================================
# 12. TIME TRACKING DETAIL (Lifecycle)
# ==========================================
@router.get("/lead-time-tracking/{lead_id}", response_model=LeadTimeTrackingResponse)
def get_lead_time_tracking(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_team_lead(current_user)
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead: raise HTTPException(404, "Lead not found")
    events = []

    def calc_event(title, start, end):
        if not start: return None
        is_done = end is not None
        actual_end = end if end else datetime.now()
        if actual_end < start: actual_end = start
        duration = actual_end - start
        
        hours, remainder = divmod(int(duration.total_seconds()), 3600)
        minutes, seconds = divmod(remainder, 60)
        dur_str = f"{minutes:02}:{seconds:02} min" if hours == 0 else f"{hours:02}:{minutes:02} hr"

        return TimeLogEvent(title=title, start_time=start, end_time=end, duration_str=dur_str, is_completed=is_done)

    events.append(calc_event("LEAD CREATED", lead.lead_created_at, lead.lead_created_at))
    if lead.quotation_created_at: events.append(calc_event("QUOTATION PREP", lead.lead_created_at, lead.quotation_created_at))
    if lead.approver_request_at: events.append(calc_event("APPROVAL TIME", lead.approver_request_at, lead.approver_response_at))
    if lead.customer_quotation_sent_at:
        start_t = lead.approver_response_at or lead.quotation_created_at
        events.append(calc_event("QUOTATION SENDING", start_t, lead.customer_quotation_sent_at))
    
    store_entry = db.query(StoreManagerDashboard).filter(StoreManagerDashboard.lead_code == lead.lead_code).first()
    if store_entry and store_entry.delivered_at:
         events.append(calc_event("DELIVERY DURATION", store_entry.pending_to_dispatched_at, store_entry.delivered_at))
    
    # NEW: Total Lifecycle event
    if lead.status in ["Delivered", "Closed", "Rejected", "Converted"] and lead.lead_ended_at:
        events.append(calc_event("TOTAL LIFECYCLE", lead.lead_created_at, lead.lead_ended_at))

    valid_events = [e for e in events if e]
    total_dur_str = "00:00:00"
    if valid_events:
        total_seconds = int((valid_events[-1].end_time or datetime.now() - valid_events[0].start_time).total_seconds())
        h, r = divmod(total_seconds, 3600)
        m, s = divmod(r, 60)
        total_dur_str = f"{h:02}:{m:02}:{s:02} hours"

    return {"lead_code": lead.lead_code, "client_name": lead.customer_name, "events": valid_events, "total_process_duration": total_dur_str}


# ==========================================
# 13. STORE MANAGER OVERVIEW
# ==========================================
@router.get("/store-manager-overview", response_model=StoreManagerOverviewResponse)
def get_store_manager_overview(
    pincode: str = "palakkad",  # Default to palakkad if not provided
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # verify_team_lead(current_user)  # Commented out for testing
    
    # Map pincode to store_name
    pincode_to_store_map = {
        "palakkad": "Palakad",
        "ernakulam": "Ernakulam",
        "azhapula": "Azhapula",
        "salem": "Salem"
    }
    
    target_store = pincode_to_store_map.get(pincode.lower(), "Palakad")  # Default to Palakad if invalid pincode
    entries = db.query(StoreManagerDashboard).filter(StoreManagerDashboard.store_name == target_store).all()

    completed_count = 0
    pending_count = 0
    no_action_count = 0
    breakdown_map = {}
    now = datetime.now()

    for entry in entries:
        if entry.status == "Delivered": completed_count += 1
        elif entry.status == "Pending":
            pending_count += 1
            lead = db.query(Lead).filter(Lead.lead_code == entry.lead_code).first()
            if lead:
                se = db.query(User).filter(User.id == int(lead.sales_executive_id)).first() if lead.sales_executive_id.isdigit() else None
                se_name = se.full_name if se and se.full_name else (se.username if se else "Unknown")
                breakdown_map[se_name] = breakdown_map.get(se_name, 0) + 1
            
            if entry.handover_at and (now - entry.handover_at > timedelta(hours=24)):
                no_action_count += 1

    breakdown_list = [StorePendingBreakdown(name=k, count=v) for k, v in breakdown_map.items()]
    breakdown_list.sort(key=lambda x: x.count, reverse=True)

    return {
        "store_name": target_store,
        "pincode": pincode,  # Return the selected pincode
        "orders_completed_count": completed_count,
        "orders_pending_count": pending_count,
        "orders_pending_breakdown": breakdown_list,
        "no_action_count": no_action_count,
        "deliveries_completed": completed_count,
        "deliveries_total": len(entries),
        # Assuming simple calculation for score
        "performance_score": int((completed_count / len(entries)) * 100) if len(entries) > 0 else 0
    }

