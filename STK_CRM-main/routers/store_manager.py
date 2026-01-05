from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from database import get_db
from models import Lead, StoreManagerDashboard, User
from schemas import (
    LeadHandoverToStoreRequest, 
    GetPendingLeadsResponse,
    PendingLeadDetailResponse,
    DispatchOrderRequest,
    DispatchListResponse,
    DispatchDetailResponse,
    DeliverOrderRequest,
    DeliveredListResponse,
    DeliveredDetailResponse
)
from utils.security import get_current_user

router = APIRouter(prefix="/store-manager", tags=["Store Manager"])

def get_my_store(db: Session, username: str) -> str:
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.store_assigned:
        raise HTTPException(status_code=403, detail="User not assigned to any store")
    return user.store_assigned

# ==========================================
# 1. PENDING STAGE
# ==========================================

@router.post("/handover-lead-store-manager")
def handover_lead_to_store(
    data: LeadHandoverToStoreRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    existing_entry = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.lead_code == lead.lead_code
    ).first()

    if existing_entry:
        raise HTTPException(status_code=400, detail="Lead already handed over to store")

    store_entry = StoreManagerDashboard(
        lead_code=lead.lead_code,
        store_name=data.store_name,
        payment_mode=data.payment_mode,
        advance_received_amount=data.advance_received_amount or 0,
        advance_received_amount_at=data.advance_received_amount_at,
        handover_at=data.handover_at,
        status="Pending" 
    )

    lead.status = "Handover_Pending"

    db.add(store_entry)
    db.commit()

    return {"message": f"Lead successfully handed over to {data.store_name} Store Manager"}


@router.get("/fetch-pending-leads", response_model=List[GetPendingLeadsResponse])
def fetch_pending_leads(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = "Palakad"

    items = db.query(StoreManagerDashboard).options(
        joinedload(StoreManagerDashboard.lead)
    ).filter(
        StoreManagerDashboard.store_name == my_store,
        StoreManagerDashboard.status == "Pending"
    ).all()

    return [{
        "lead_id": item.lead.lead_code,
        "quotation_id": item.lead.quotation_id,
        "phone": item.lead.phone,
        "lead_name": item.lead.customer_name,
        "estimated_cost": item.lead.total_estimated_cost or 0,
        "handover_at": item.handover_at,
        "advance_received":item.advance_received_amount
    } for item in items]


@router.get("/fetch-pending-leads/{lead_code}", response_model=PendingLeadDetailResponse)
def get_pending_lead_detail(
    lead_code: str,  # Corrected to str
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = 'Palakad'
    
    lead = db.query(Lead).filter(Lead.lead_code == lead_code).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    dashboard_entry = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.lead_code == lead.lead_code,
        StoreManagerDashboard.store_name == my_store
    ).first()

    if not dashboard_entry:
        raise HTTPException(status_code=404, detail="Lead not found in this store")

    total = lead.total_estimated_cost or 0
    paid = dashboard_entry.advance_received_amount or 0
    status = dashboard_entry.status

    return {
        "lead_id": lead.id,
        "lead_code": lead.lead_code,
        "quotation_id": lead.quotation_id,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        "address": f"{lead.location}, {lead.district}",
        
        "source": lead.source,
        "location": lead.location,
        "district": lead.district,
        "profile": lead.profile,
        "area_sqft": lead.area_sqft,
        "project_type": lead.project_type,
        "board_type": lead.board_type,
        "material_brand": lead.material_brand,
        "channel": lead.channel,
        "channel_thickness": lead.channel_thickness,
        "material_category": lead.material_category,
        "material_quantity": lead.material_quantity,
        "accessory_name": lead.accessory_name,
        "accessory_qty":lead.accessory_qty,
        "urgency": lead.urgency,
        "status": status,
        "total_estimated_cost": total,
        "advance_paid": paid,
        "balance_remaining": total - paid,
        "payment_mode_handover": dashboard_entry.payment_mode,
        "quotation": lead.quotation_snapshot 
    }


# ==========================================
# 2. DISPATCH STAGE
# ==========================================

@router.post("/pending-to-dispatch")
def move_to_dispatch(
    data: DispatchOrderRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = 'Palakad'
    
    lead = db.query(Lead).filter(Lead.lead_code == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    entry = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.lead_code == lead.lead_code,
        StoreManagerDashboard.store_name == my_store
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.status = "Dispatched"
    entry.driver_name = data.driver_name
    entry.driver_phone = data.driver_phone
    entry.vehicle_number = data.vehicle_number
    entry.dispatch_payment_mode = data.payment_mode
    entry.dispatch_received_amount = data.payment_received_amount
    entry.estimated_delivery_at = data.expected_delivery_at
    entry.pending_to_dispatched_at = data.dispatch_timestamp

    lead.status = "Dispatched"
    db.commit()

    return {"message": "Order Dispatched Successfully"}


@router.get("/fetch-dispatch-details", response_model=List[DispatchListResponse])
def fetch_dispatched_leads(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store= 'Palakad'

    items = db.query(StoreManagerDashboard).options(
        joinedload(StoreManagerDashboard.lead)
    ).filter(
        StoreManagerDashboard.store_name == my_store,
        StoreManagerDashboard.status == "Dispatched"
    ).all()

    return [{
        "lead_id": item.lead.id,
        "lead_code": item.lead.lead_code,
        "customer_name": item.lead.customer_name,
        "amount": item.lead.total_estimated_cost or 0,
        "driver_name": item.driver_name,
        "vehicle_number": item.vehicle_number,
        "dispatched_at": item.pending_to_dispatched_at
    } for item in items]


@router.get("/fetch-dispatch-details/{lead_id}", response_model=DispatchDetailResponse)
def get_dispatch_lead_detail(
    lead_id: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = 'Palakad'
    
    lead = db.query(Lead).filter(Lead.lead_code == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    entry = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.lead_code == lead.lead_code,
        StoreManagerDashboard.store_name == my_store
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    total = lead.total_estimated_cost or 0
    paid = (entry.advance_received_amount or 0) + (entry.dispatch_received_amount or 0)

    return {
        "lead_id": lead.id,
        "lead_code": lead.lead_code,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        "driver_name": entry.driver_name,
        "vehicle_number": entry.vehicle_number,
        "driver_phone": entry.driver_phone,
        
        "source": lead.source,
        "location": lead.location,
        "district": lead.district,
        "profile": lead.profile,
        "area_sqft": lead.area_sqft,
        "project_type": lead.project_type,
        "board_type": lead.board_type,
        "material_brand": lead.material_brand,
        "channel": lead.channel,
        "channel_thickness": lead.channel_thickness,
        "material_category": lead.material_category,
        "material_quantity": lead.material_quantity,
        "accessory_name": lead.accessory_name,
        "accessory_qty": lead.accessory_qty,
        "urgency": lead.urgency,

        "advance_paid": paid,  # Total of advance + dispatch for consistency with pending
        "payment_mode_handover": entry.payment_mode,  # Match pending field name
        "payment_mode": entry.payment_mode,  # Keep for backward compatibility
        "payment_mode_dispatch": entry.dispatch_payment_mode,
        "dispatch_amount": entry.dispatch_received_amount or 0,
        
        "total_estimated_cost": total,
        "total_paid_so_far": paid,
        "balance_remaining": total - paid,
        
        "expected_delivery_at": entry.estimated_delivery_at,
        "dispatched_at": entry.pending_to_dispatched_at,
        "quotation": lead.quotation_snapshot 
    }


# ==========================================
# 3. DELIVERY STAGE
# ==========================================

@router.post("/dispatch-to-delivered")
def move_to_delivered(
    data: DeliverOrderRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = 'Palakad'
    
    lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    entry = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.lead_code == lead.lead_code,
        StoreManagerDashboard.store_name == my_store
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.status = "Delivered"
    entry.feedback = data.feedback
    entry.delivery_payment_mode = data.payment_mode
    entry.delivery_received_amount = data.payment_received_amount
    entry.delivered_at = datetime.now()

    lead.status = "Delivered"
    lead.lead_ended_at = datetime.now()
    
    db.commit()

    return {"message": "Order Delivered Successfully"}


@router.get("/fetch-delivered-details", response_model=List[DeliveredListResponse])
def fetch_delivered_leads(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = 'Palakad'

    items = db.query(StoreManagerDashboard).options(
        joinedload(StoreManagerDashboard.lead)
    ).filter(
        StoreManagerDashboard.store_name == my_store,
        StoreManagerDashboard.status == "Delivered"
    ).all()

    results = []
    for item in items:
        total = item.lead.total_estimated_cost or 0
        paid = (item.advance_received_amount or 0) + \
               (item.dispatch_received_amount or 0) + \
               (item.delivery_received_amount or 0)
        
        results.append({
            "lead_id": item.lead.id,
            "lead_code": item.lead.lead_code,
            "customer_name": item.lead.customer_name,
            "total_estimated_cost": total,
            "final_balance": total - paid,
            "delivered_at": item.delivered_at
        })
    return results


@router.get("/fetch-delivered-details/{lead_id}", response_model=DeliveredDetailResponse)
def get_delivered_lead_detail(
    lead_id: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # my_store = get_my_store(db, current_user["username"])
    my_store = 'Palakad'
    
    lead = db.query(Lead).filter(Lead.lead_code == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    entry = db.query(StoreManagerDashboard).filter(
        StoreManagerDashboard.lead_code == lead.lead_code,
        StoreManagerDashboard.store_name == my_store
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    total = lead.total_estimated_cost or 0
    paid = (entry.advance_received_amount or 0) + \
           (entry.dispatch_received_amount or 0) + \
           (entry.delivery_received_amount or 0)

    return {
        "lead_id": lead.id,
        "lead_code": lead.lead_code,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        
        "source": lead.source,
        "location": lead.location,
        "district": lead.district,
        "profile": lead.profile,
        "area_sqft": lead.area_sqft,
        "project_type": lead.project_type,
        "board_type": lead.board_type,
        "material_brand": lead.material_brand,
        "channel": lead.channel,
        "channel_thickness": lead.channel_thickness,
        "material_category": lead.material_category,
        "material_quantity": lead.material_quantity,
        "acessories_list": f"{lead.accessory_name} (Qty: {lead.accessory_qty})" if lead.accessory_name else None,
        "urgency": lead.urgency,

        "payment_mode_handover": entry.payment_mode,
        "dispatch_feedback": entry.feedback,
        
        "payment_mode_delivery": entry.delivery_payment_mode,
        "advance_received_amount": entry.advance_received_amount or 0,
        
        "total_estimated_cost": total,
        "final_balance": total - paid,
        
        "delivered_at": entry.delivered_at,
        "quotation": lead.quotation_snapshot 
    }