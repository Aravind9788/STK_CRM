# routers/leads.py

from fastapi import APIRouter, Depends, HTTPException ,Query
from sqlalchemy.orm import Session
from database import get_db
from models import Lead, FollowUp
from schemas import FollowUpDetailResponse, FolowupLeadUpdateRequest, LeadCreateSchema, LeadCreateResponseSchema
from datetime import datetime
from utils.security import get_current_user
from typing import List

router = APIRouter(prefix="/leads", tags=["Leads"])

def generate_lead_code(db):
    last_lead = db.query(Lead).order_by(Lead.id.desc()).first()
    next_number = 1 if not last_lead else last_lead.id + 1
    year = datetime.now().year
    return f"L-{year}-{str(next_number).zfill(4)}"


@router.post("/create-lead", response_model=LeadCreateResponseSchema)
def create_lead(
    data: LeadCreateSchema, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    lead_code = generate_lead_code(db)
    # Storing Integer ID as string for consistency with DB schema
    sales_executive_db_id = str(current_user["user_id"])
    
    lead = Lead(
        lead_code=lead_code,
        lead_created_at=data.lead_created_at or datetime.now(),
        sales_executive_id=sales_executive_db_id,
        status="Today",
        
        customer_name=data.customer_name,
        phone=data.phone,
        source=data.source,
        location=data.location,
        district=data.district,
        profile=data.profile,
        
        area_sqft=data.area_sqft,
        project_type=data.project_type,
        board_type=data.board_type,
        material_brand=data.material_brand,
        channel=data.channel,
        channel_thickness=data.channel_thickness,
        material_category=data.material_category,
        material_quantity=data.material_quantity,
        accessory_name=data.accessory_name,
        accessory_qty=data.accessory_qty,
        urgency=data.urgency,

        quotation_created_at=data.quotation_created_at,
        quotation_id=data.quotation_id,
        total_estimated_cost=data.total_estimated_cost,
        quotation_ended_at=data.quotation_ended_at,
        
        approver_request_at=data.approver_request_at,
        approver_status="PENDING" if data.approver_request_at else None,
        last_action="Lead Created"
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        "message": "Lead created successfully",
        "lead_id": lead.id,
        "lead_code": lead.lead_code,
        "qoutaion_id": lead.quotation_id,
        "status": lead.status
    }

@router.get("/follow-up-leads")
def get_followup_leads(
    tab: str = Query("today", regex="^(today|upcoming|delivered)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["user_id"])
    today = datetime.now().date()

    query = db.query(Lead).filter(
        Lead.sales_executive_id == user_id
    )

    # --- STATUS FILTER BASED ON TAB ---
    if tab == "delivered":
        leads = query.filter(Lead.status == "Delivered").all()

    elif tab == "upcoming":
        leads = query.filter(Lead.status.notin_(["Delivered"])).all()

    else:  # today
        leads = query.filter(Lead.status.notin_(["Delivered"])).all()

    final_list = []

    for l in leads:
        last_fu = db.query(FollowUp).filter(
            FollowUp.lead_code == l.lead_code
        ).order_by(FollowUp.id.desc()).first()

        if last_fu and last_fu.next_followup_date:
            target_date = last_fu.next_followup_date.date()
        else:
            target_date = l.lead_created_at.date()

        if tab == "today" and target_date <= today:
            final_list.append(l)

        elif tab == "upcoming" and target_date > today:
            final_list.append(l)

        elif tab == "delivered":
            final_list.append(l)

    return [
        {
            "lead_id": l.id,
            "lead_code": l.lead_code,
            "customer_name": l.customer_name,
            "status": l.status,
            "district": l.district,
            "phone": l.phone,
            "last_action": l.last_action,
            "next_followup": (
                last_fu.next_followup_date if last_fu else l.lead_created_at
            )
        }
        for l in final_list
    ]


@router.get("/follow-up-leads/{lead_id}", response_model=FollowUpDetailResponse)
def get_followup_detail(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.lead_code == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    last_fu = db.query(FollowUp).filter(
        FollowUp.lead_code == lead.lead_code
    ).order_by(FollowUp.id.desc()).first()

    return {
        "lead_id": lead.id, # Added this to match schema
        "lead_code": lead.lead_code,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        "quotation_status":lead.last_action or "N/A",
        "approver_status": lead.approver_status or "N/A",

        # FollowUpDetailResponse schema fields
        "estimated_value": lead.total_estimated_cost or 0,
        "project_type": lead.project_type or "General",
        
        "current_stage": last_fu.current_stage if last_fu else "Pending",
        "next_followup_date": last_fu.next_followup_date if last_fu else None,
        "last_remarks": last_fu.reasons if last_fu else ""
    }

@router.get("/customers/lookup")
def lookup_customer(
    phone: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.phone == phone).first()

    if not lead:
        return {
            "found": False,
            "message": "No customer found. Redirect to Create Lead."
        }

    return {
        "found": True,
        "customer_details": {
            "lead_id": lead.id,
            "lead_code": lead.lead_code,
            "source": lead.source,
            "name": lead.customer_name,
            "location": lead.location,
            "district": lead.district,
            "profile": lead.profile,
        }
    }


@router.post("/follow-up-lead-update")
def add_followup(
    data: FolowupLeadUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    clean_date = data.next_followup or datetime.utcnow()

    followup = FollowUp(
        lead_code=data.lead_code,
        current_stage=data.update_stage,
        next_followup_date=clean_date,
        reasons=data.reason,
        followup_updated_at=data.followup_updated_at,
        stage_selected_at=data.stage_selected_at
    )

    db.add(followup)

    db.query(Lead).filter(
        Lead.lead_code == data.lead_code
    ).update({
        "status": "Upcoming"
    })

    db.commit()

    return {"message": "Follow-up added successfully"}
