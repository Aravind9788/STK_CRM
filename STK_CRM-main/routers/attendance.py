from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import datetime, time, date

from database import get_db
from models import User, Attendance, LeaveRequest, Lead
from schemas import (
    CheckInRequest, 
    TodayAttendanceSummary, 
    AttendanceLogItem,
    CreateLeaveRequest,
    LeaveDetailResponse,
    PendingLeaveListItem,
    MonthlyAttendanceReport,
    HandoverCandidateResponse,
    ColleagueResponse,
    LeaveHistoryItem,
    LateHistoryItem
)
from utils.security import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance & Leaves"])

OFFICE_START_TIME = time(9, 30) # 9:30 AM is the cutoff for "Late"

# ==========================================
# 1. SALES EXECUTIVE: Check-In / Check-Out
# ==========================================

@router.post("/check-in")
def mark_check_in(
    data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    today = datetime.now().date()
    now = datetime.now()

    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        func.date(Attendance.date) == today
    ).first()

    if existing:
        return {"message": "Already checked in today", "status": existing.status}

    is_late = now.time() > OFFICE_START_TIME
    status = "Late" if is_late else "Present"

    attendance = Attendance(
        user_id=user_id,
        date=today,
        check_in=now,
        location=data.location,
        status=status,
        is_late=is_late
    )
    db.add(attendance)
    db.commit()

    return {"message": f"Checked in successfully at {now.strftime('%I:%M %p')}", "status": status}


@router.post("/check-out")
def mark_check_out(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    today = datetime.now().date()

    entry = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        func.date(Attendance.date) == today
    ).first()

    if not entry:
        raise HTTPException(400, "You haven't checked in yet")

    entry.check_out = datetime.now()
    db.commit()
    return {"message": "Checked out successfully"}


# ==========================================
# 2. TEAM LEAD: Monitor (Today)
# ==========================================

@router.get("/monitor-today", response_model=TodayAttendanceSummary)
def get_todays_attendance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    my_store = current_user.get("store_assigned")
    today = datetime.now().date()

    staff = db.query(User).filter(
        User.store_assigned == my_store,
        User.role == "sales_executive"
    ).all()

    logs = []
    present_count = 0
    late_count = 0
    absent_count = 0

    for se in staff:
        att = db.query(Attendance).filter(
            Attendance.user_id == se.id,
            func.date(Attendance.date) == today
        ).first()

        on_leave = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == se.id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= datetime.now(),
            LeaveRequest.end_date >= datetime.now()
        ).first()

        status = "Absent"
        check_in_str = "--"
        check_out_str = "--"
        location_str = "--"

        if att:
            status = att.status 
            check_in_str = att.check_in.strftime("%I:%M %p")
            if att.check_out:
                check_out_str = att.check_out.strftime("%I:%M %p")
            location_str = att.location
            
            if att.is_late: late_count += 1
            else: present_count += 1
        
        elif on_leave:
            status = "On Leave"
            location_str = "Leave"
            absent_count += 1 
        else:
            absent_count += 1 

        logs.append(AttendanceLogItem(
            user_id=se.id,
            name=se.username,
            role="Sales Executive",
            status=status,
            check_in=check_in_str,
            check_out=check_out_str,
            location=location_str
        ))

    return {
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": absent_count,
        "logs": logs
    }


# ==========================================
# 3. LEAVES: Application & Handover Helpers
# ==========================================

@router.get("/handover-candidates", response_model=List[HandoverCandidateResponse])
def get_leads_for_handover(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ Returns active leads belonging to current user for selection """
    user_id = str(current_user["user_id"])
    
    leads = db.query(Lead).filter(
        Lead.sales_executive_id == user_id,
        Lead.status.in_(["Open", "FollowUp", "Pending", "In Discussion"])
    ).all()

    return [
        {
            "lead_id": l.id,
            "lead_code": l.lead_code,
            "customer_name": l.customer_name,
            "status": l.status
        } for l in leads
    ]

@router.get("/colleagues", response_model=List[ColleagueResponse])
def get_available_colleagues(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ Returns other Sales Execs for dropdown """
    my_store = current_user.get("store_assigned")
    my_id = current_user["user_id"]

    colleagues = db.query(User).filter(
        User.store_assigned == my_store,
        User.role == "sales_executive",
        User.id != my_id 
    ).all()

    return [{
        "user_id": u.id, 
        "username": u.username,
        "full_name": u.full_name if u.full_name else u.username
    } for u in colleagues]


@router.post("/apply-leave")
def apply_leave(
    data: CreateLeaveRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    days = (data.end_date - data.start_date).days + 1
    
    # Dump Pydantic list to JSON list
    handover_data = [h.dict() for h in data.handovers] if data.handovers else []

    leave = LeaveRequest(
        user_id=current_user["user_id"],
        start_date=data.start_date,
        end_date=data.end_date,
        days_count=days,
        reason=data.reason,
        handover_plan=handover_data # ✅ Saves the plan
    )
    db.add(leave)
    db.commit()
    return {"message": "Leave request submitted"}


# ==========================================
# 4. LEAVES: Pending List & Approval Logic
# ==========================================

@router.get("/pending-leaves", response_model=List[PendingLeaveListItem])
def get_pending_leaves(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    my_store = current_user.get("store_assigned")
    
    # Get all pending leave requests
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.status == "Pending"
    ).all()
    
    result = []
    for leave in leaves:
        user = db.query(User).filter(User.id == leave.user_id).first()
        if user and user.store_assigned == my_store:
            # Count leads in handover plan
            pending_leads = len(leave.handover_plan) if leave.handover_plan else 0
            
            result.append({
                "leave_id": leave.id,
                "user_name": user.full_name if user.full_name else user.username,
                "role": user.role.replace("_", " ").title() if user.role else "Sales Executive",
                "start_date": leave.start_date,
                "end_date": leave.end_date,
                "days_count": leave.days_count,
                "pending_leads_count": pending_leads,
                "reason": leave.reason
            })
    
    return result


# ==========================================
# 5. LEAVES: Detail & Approval
# ==========================================

@router.get("/leave-request-detail/{leave_id}", response_model=LeaveDetailResponse)
def get_leave_detail(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave: raise HTTPException(404, "Not found")

    requester = db.query(User).filter(User.id == leave.user_id).first()

    # Format plan for display: "Amit": ["Lead A", "Lead B"]
    summary_display = []
    
    if leave.handover_plan:
        user_ids = {item['to_user_id'] for item in leave.handover_plan}
        lead_ids = {item['lead_id'] for item in leave.handover_plan}
        
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_map = {u.id: u.username for u in users}
        
        leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()
        lead_map = {l.id: l.customer_name for l in leads}

        grouped = {}
        for item in leave.handover_plan:
            uid = item['to_user_id']
            lid = item['lead_id']
            u_name = user_map.get(uid, "Unknown")
            l_name = lead_map.get(lid, "Unknown Lead")
            
            if u_name not in grouped: grouped[u_name] = []
            grouped[u_name].append(l_name)
        
        for name, l_list in grouped.items():
            summary_display.append({"assignee_name": name, "leads_assigned": l_list})

    return {
        "leave_id": leave.id,
        "user_name": requester.username,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "days": leave.days_count,
        "reason": leave.reason,
        "handover_summary": summary_display
    }


@router.post("/approve-leave")
def approve_leave_request(
    leave_id: int = Body(..., embed=True),
    action: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave: raise HTTPException(404, "Not found")

    if action == "Approve":
        leave.status = "Approved"
        leave.approved_by = current_user["user_id"]
        
        # ✅ EXECUTE TRANSFER
        if leave.handover_plan:
            for item in leave.handover_plan:
                lead_id_to_move = item['lead_id']
                new_sales_exec_id = str(item['to_user_id']) 
                
                # Update Lead Owner
                lead_to_update = db.query(Lead).filter(Lead.id == lead_id_to_move).first()
                if lead_to_update:
                    lead_to_update.sales_executive_id = new_sales_exec_id
                    
    elif action == "Reject":
        leave.status = "Rejected"
    
    db.commit()
    return {"message": f"Leave request {action}d successfully"}


# ==========================================
# 5. MONTHLY REPORT (Team Lead View)
# ==========================================

@router.get("/monitor-monthly", response_model=MonthlyAttendanceReport)
def get_monthly_report(
    user_id: int,          
    month: int,            
    year: int,             
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return generate_monthly_report(db, user_id, month, year)


@router.get("/monitor-monthly-list", response_model=List[MonthlyAttendanceReport])
def get_monthly_report_list(
    month: int,
    year: int,
    user_id: int = None, # Optional filter
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    my_store = current_user.get("store_assigned")
    
    query = db.query(User).filter(
        User.store_assigned == my_store,
        User.role == "sales_executive"
    )
    
    if user_id:
        query = query.filter(User.id == user_id)
        
    staff = query.all()
    reports = []
    
    for user in staff:
        reports.append(generate_monthly_report(db, user.id, month, year))
        
    return reports


def generate_monthly_report(db: Session, user_id: int, month: int, year: int) -> MonthlyAttendanceReport:
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user: raise HTTPException(404, "User not found")

    attendance_records = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        extract('month', Attendance.date) == month,
        extract('year', Attendance.date) == year
    ).all()

    leave_records = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == user_id,
        LeaveRequest.status == "Approved",
        extract('month', LeaveRequest.start_date) == month,
        extract('year', LeaveRequest.start_date) == year
    ).all()

    days_present = 0
    late_marks = 0
    late_history_list = []

    for att in attendance_records:
        if att.status in ["Present", "Late", "On Duty"]:
            days_present += 1
        
        if att.is_late:
            late_marks += 1
            late_history_list.append(LateHistoryItem(
                date_str=att.date.strftime("%d %b"), 
                time_str=att.check_in.strftime("%I:%M %p")
            ))

    leaves_taken = sum(l.days_count for l in leave_records)
    leave_history_list = [LeaveHistoryItem(
        date_str=l.start_date.strftime("%d %b"), 
        reason=l.reason
    ) for l in leave_records]

    raw_score =  (leaves_taken * 5) - (late_marks * 2)
    if raw_score <=0:
        score = 0
    else:
        score = 100 - raw_score
    score = max(0, score) 

    return MonthlyAttendanceReport(
        user_id=target_user.id,
        user_name=target_user.username,
        role="Sales Executive", # Could fetch from user role but stick to string for now
        score_percentage=score,
        leaves_taken_count=leaves_taken,
        days_present_count=days_present,
        late_marks_count=late_marks,
        leave_history=leave_history_list, 
        late_history=late_history_list    
    )