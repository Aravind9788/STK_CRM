from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    hashed_password = Column(String(255))
    role = Column(String(30))
    store_assigned = Column(String(50))

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

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    id = Column(Integer, primary_key=True, index=True)

    lead_code = Column(String(20), unique=True, index=True)  # ✅ REQUIRED

    customer_name = Column(String(100))
    phone = Column(String(20))
    source = Column(String(50))
    location = Column(String(100))
    district = Column(String(50))

    profile = Column(String(50))              # Contractor / Retailer / Owner
    process_type = Column(String(20))         # AREA | MATERIAL

    area_sqft = Column(Integer, nullable=True)

    category_interest = Column(String(100), nullable=True)
    product_interest = Column(String(100), nullable=True)
    suggest_product = Column(String(100), nullable=True)

    material_category = Column(String(100), nullable=True)
    brand_preference = Column(String(100), nullable=True)
    material_quantity = Column(Integer, nullable=True)

    urgency = Column(String(50))
    follow_up_date = Column(DateTime)

    sales_executive_id = Column(String(50))

    status = Column(String(20), default="Open")

class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True)
    lead_id = Column(String(20))
    activity_type = Column(String(50))
    outcome = Column(String(50))
    remarks = Column(String(255))
    next_followup_date = Column(DateTime)
    status_update = Column(String(20))