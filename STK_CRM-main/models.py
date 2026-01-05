# models.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy import JSON   

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=True) 
    username = Column(String(50), unique=True) 
    hashed_password = Column(String(255))
    role = Column(String(30))
    store_assigned = Column(String(50))
    refresh_token = Column(String(500), nullable=True)  # Store refresh token

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)

    sub_categories = relationship("SubCategory", back_populates="category")

class SubCategory(Base):
    __tablename__ = "sub_categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="sub_categories")
    products = relationship("Product", back_populates="sub_category")
    components = relationship("Component", back_populates="sub_category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    price_str = Column(String(50))
    price_bar = Column(String(50))
    sub_category_id = Column(Integer, ForeignKey("sub_categories.id"))

    sub_category = relationship("SubCategory", back_populates="products")
class Component(Base):
    __tablename__ = "components"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    type = Column(String(30))  # CHANNEL / ACCESSORY / GRID_TYPE
    sub_category_id = Column(Integer, ForeignKey("sub_categories.id"))

    sub_category = relationship("SubCategory", back_populates="components")
    variants = relationship("ComponentVariant", back_populates="component")

class ComponentVariant(Base):
    __tablename__ = "component_variants"
    id = Column(Integer, primary_key=True)
    component_id = Column(Integer, ForeignKey("components.id"))
    brand_name = Column(String(100))
    variant = Column(String(50))
    price_range = Column(String(50))

    component = relationship("Component", back_populates="variants")

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_code = Column(String(20), unique=True, index=True)
    lead_created_at = Column(DateTime(timezone=True))
    customer_name = Column(String(100))
    phone = Column(String(20))
    source = Column(String(50))
    location = Column(String(100))
    district = Column(String(50))

    profile = Column(String(50))

    area_sqft = Column(Integer, nullable=True)

    project_type = Column(String(100), nullable=True)
    board_type = Column(String(100), nullable=True)
    material_brand = Column(String(100), nullable=True)
    channel = Column(String(100), nullable=True)
    channel_thickness = Column(String(100), nullable=True)
    material_category = Column(String(100), nullable=True)
    material_quantity = Column(Integer, nullable=True)
    accessory_name = Column(String(100), nullable=True)
    accessory_qty = Column(Integer, nullable=True)
    urgency = Column(String(50))
    sales_executive_id = Column(String(50))
    status = Column(String(20), default="Today")
    
    # --- Fixed Typos ---
    lead_ended_at = Column(DateTime(timezone=True))
    quotation_created_at =  Column(DateTime(timezone=True))
    quotation_id= Column(String(50), nullable=True)
    quotation_snapshot = Column(JSON, nullable=True)
    total_estimated_cost= Column(Integer, nullable=True)
    quotation_ended_at = Column(DateTime(timezone=True))

    approver_request_at = Column(DateTime(timezone=True))
    approver_status=Column(String(20), nullable=True)
    approver_response_at = Column(DateTime(timezone=True))
    customer_quotation_sent_at = Column(DateTime(timezone=True))
    last_action = Column(String(100), nullable=True)

class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    lead_code = Column(String(20))
    current_stage = Column(String(20))
    next_followup_date = Column(DateTime)
    reasons = Column(String(255))
    stage_selected_at = Column(DateTime(timezone=True))
    followup_updated_at = Column(DateTime(timezone=True))

class StoreManagerDashboard(Base):
    __tablename__ = "store_manager_dashboard"

    id = Column(Integer, primary_key=True)

    lead_code = Column(String(20), ForeignKey("leads.lead_code"))
    lead = relationship("Lead")

    store_name = Column(String(100))
    
    handover_at = Column(DateTime(timezone=True))
    payment_mode = Column(String(50)) 
    advance_received_amount = Column(Integer, nullable=True)
    advance_received_amount_at = Column(DateTime(timezone=True), nullable=True)

    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    vehicle_number = Column(String(50), nullable=True)
    
    estimated_delivery_at = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(String(20), default="Pending")
    
    pending_to_dispatched_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    feedback = Column(String(255), nullable=True)
    dispatch_payment_mode = Column(String(50), nullable=True)

    dispatch_received_amount = Column(Integer, nullable=True)
    delivery_received_amount = Column(Integer, nullable=True) # Money collected at doorstep
    delivery_payment_mode = Column(String(50), nullable=True) # Cash/Online

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    date = Column(DateTime) # Stores the date of attendance
    check_in = Column(DateTime)
    check_out = Column(DateTime, nullable=True)
    
    status = Column(String(20)) # "Present", "Late", "Half Day", "On Leave"
    location = Column(String(100)) # "Office", "Client Site"
    is_late = Column(Boolean, default=False)

    # Optional: Relationship back to User if needed
    # user = relationship("User") 

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    days_count = Column(Integer)
    
    reason = Column(String(255))
    status = Column(String(20), default="Pending") # "Pending", "Approved", "Rejected"
    
    handover_plan = Column(JSON, nullable=True)
    rejection_reason = Column(String(255), nullable=True)
    approved_by = Column(Integer, nullable=True) # ID of the Team Lead who approved it

class TeamLeadStaff(Base):
    __tablename__ = "team_lead_staff"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String(50), unique=True, index=True)  # e.g., TL-PLK-001
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    plain_password = Column(String(100), nullable=True)  # Store plain password for display
    store_assigned = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True))

class StoreManagerStaff(Base):
    __tablename__ = "store_manager_staff"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String(50), unique=True, index=True)  # e.g., SM-PLK-001
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    plain_password = Column(String(100), nullable=True)  # Store plain password for display
    store_assigned = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True))

