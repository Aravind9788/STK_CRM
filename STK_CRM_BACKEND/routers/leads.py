from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Lead, FollowUp
from schemas import LeadCreateSchema
from datetime import datetime
from utils.security import get_current_user

router = APIRouter(prefix="/leads", tags=["Leads"])

def generate_lead_code(db):
    last_lead = db.query(Lead).order_by(Lead.id.desc()).first()
    next_number = 1 if not last_lead else last_lead.id + 1
    year = datetime.now().year
    return f"L-{year}-{str(next_number).zfill(4)}"

@router.post("")
def create_lead(data: LeadCreateSchema, db: Session = Depends(get_db)):
    lead_code = generate_lead_code(db)

    lead = Lead(
    created_at=data.timestamp,
    lead_code=lead_code,
    customer_name=data.customer_name,
    phone=data.phone,
    source=data.source,
    location=data.location,
    district=data.district,
    profile=data.profile,
    process_type=data.process_type,
    area_sqft=data.area_sqft,
    category_interest=data.category_interest,
    product_interest=data.product_interest,
    suggest_product=data.suggest_product,
    material_category=data.material_category,
    brand_preference=data.brand_preference,
    material_quantity=data.material_quantity,
    urgency=data.urgency,
    follow_up_date=data.follow_up_date,
    sales_executive_id=data.sales_executive_id,
    status="Open"
)


    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        "message": "Lead created successfully",
        "lead_id": lead.lead_code,
        "status": lead.status
    }

@router.get("/follow-up-leads")
def get_followup_leads(
    db: Session = Depends(get_db),
):
    leads = db.query(Lead).filter(
        Lead.sales_executive_id == 'SE-001'
    ).all()

    return [
        {
            "lead_id": l.lead_code,
            "customer_name": l.customer_name,
            "status": l.status,
            "last_action": "Quotation Sent",  # can be dynamic later
            "next_followup": l.follow_up_date.date(),
            "district": l.district
        }
        for l in leads
    ]

@router.get("/customers/lookup")
def lookup_customer(phone: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.phone == phone).first()

    if not lead:
        return {
            "found": False,
            "message": "No customer found. Redirect to Create Lead."
        }

    return {
        "found": True,
        "customer_details": {
            "lead_id": lead.lead_code,
            "source": lead.source,
            "name": lead.customer_name,
            "location": lead.location,
            "district": lead.district,
            "profile": lead.profile,
        }
    }


@router.post("/follow-up-lead-update")
def add_followup(data: dict, db: Session = Depends(get_db)):

    next_followup = datetime.fromisoformat(
        data["next_followup_date"].replace("Z", "")
    )

    followup = FollowUp(
        lead_id=data["lead_id"],
        status_update=data["status_update"],
        next_followup_date=next_followup
    )

    db.add(followup)

    db.query(Lead).filter(
        Lead.lead_code == data["lead_id"]
    ).update({
        "status": data["status_update"],
        "follow_up_date": next_followup
    })

    db.commit()

    return {"message": "Follow-up added"}

@router.get("/{lead_id}")
def get_quotation_details(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.lead_code == lead_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Quotation not found")

    return {
        "lead_id": lead.lead_code,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        "status": lead.status,
        "source": lead.source,
        "location": lead.location,
        "district": lead.district,
        "profile": lead.profile,
        "estimated_value": 450000,   # can be dynamic later
        "project_type": lead.process_type,
        "quotation_status": "Quotation Sent",
        "timeline": [
            {
                "date": lead.created_at.date(),
                "label": "Quotation Sent"
            }
        ]
    }