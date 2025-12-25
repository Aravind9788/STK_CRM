from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime,timezone

class LoginSchema(BaseModel):
    username: str
    password: str

class LeadCreateSchema(BaseModel):
    timestamp: datetime = datetime.now(timezone.utc)

    source: str
    customer_name: str
    phone: str
    location: str
    district: str

    profile: str
    process_type: str

    area_sqft: Optional[int] = None

    category_interest: Optional[str] = None
    product_interest: Optional[str] = None
    suggest_product: Optional[str] = None

    material_category: Optional[str] = None
    brand_preference: Optional[str] = None
    material_quantity: Optional[int] = None

    urgency: Optional[str] = "Normal"
    follow_up_date: Optional[datetime] = datetime.utcnow()
    sales_executive_id: Optional[str] = "SYSTEM"

class QuotationItemSchema(BaseModel):
    category: str
    sub_category: str
    product_name: str
    area_sqft: int
    brand: str

class QuotationCalculateSchema(BaseModel):
    lead_id: str
    items: list[QuotationItemSchema]