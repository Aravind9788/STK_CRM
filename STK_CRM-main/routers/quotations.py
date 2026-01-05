# routers/quotations.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Lead
from schemas import (
    SubmitQuotationApprovalToTeamLead,
    TeamleadResponseToApproval, 
    SendQuotationToCustomerRequest, 
    SendQuotationToCustomerResponse
)
from utils.security import get_current_user

router = APIRouter(prefix="/quotations", tags=["Quotations"])

# 1. SUBMIT FOR APPROVAL (Sales Exec Action)
@router.post("/submit-quotation-approval", response_model=TeamleadResponseToApproval)
def submit_for_approval(
    data: SubmitQuotationApprovalToTeamLead,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Find the Lead by lead_code (string like "L-2026-0001")
    lead = db.query(Lead).filter(Lead.lead_code == data.lead_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # 2. Prevent Duplicate Requests
    if lead.approver_status == "PENDING":
        raise HTTPException(status_code=400, detail="Quotation already sent for approval")

    # 3. Update Lead Status & Save ID
    lead.approver_request_at = data.sent_at
    lead.approver_status = "PENDING"
    lead.quotation_id = data.quotation_id  # ✅ Saves "#Q-1001" correctly now

    db.commit()

    return {
        "status": "PENDING",
        "message": "Quotation sent to Team Lead for approval"
    }

# 2. SEND TO CUSTOMER (Sales Exec Action)
@router.post("/send-customer", response_model=SendQuotationToCustomerResponse)
def send_to_customer(
    data: SendQuotationToCustomerRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.lead_code == data.lead_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Only approved quotations can be sent
    if lead.approver_status != "APPROVED":
        raise HTTPException(status_code=400, detail="Quotation is not approved yet. Cannot send.")

    lead.customer_quotation_sent_at = data.sent_at
    lead.last_action = "Quotation Sent"

    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Quotation sent to customer via {data.method}"
    }