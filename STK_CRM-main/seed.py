import pandas as pd
import os
from database import SessionLocal, engine, Base
from models import (
    Category,
    SubCategory,
    Product,
    Component,
    ComponentVariant,
    User
)
from utils.security import get_password_hash

# Ensure tables exist
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

CSV_FILE = "clean_products.csv"


def seed_data():

    if not os.path.exists(CSV_FILE):
        print(f"❌ CSV file not found: {CSV_FILE}")
        return

    df = pd.read_csv(CSV_FILE)

    # -----------------------------
    # 1️⃣ Create default user
    # -----------------------------
    if not db.query(User).filter_by(username="baskar").first():
        user = User(
            username="baskar",
            hashed_password=get_password_hash("password123"),
            role="sales_executive",
            store_assigned="Palakkad"
        )
        db.add(user)
        db.commit()
        print("✅ Default user created")

    # -----------------------------
    # 2️⃣ Process CSV rows
    # -----------------------------
    for _, row in df.iterrows():

        # ---------- Category ----------
        category_name = str(row["Category"]).strip()
        category = db.query(Category).filter_by(name=category_name).first()
        if not category:
            category = Category(name=category_name)
            db.add(category)
            db.commit()

        # ---------- Sub Category ----------
        sub_name = str(row["Sub Category"]).strip()
        sub = db.query(SubCategory).filter_by(
            name=sub_name,
            category_id=category.id
        ).first()

        if not sub:
            sub = SubCategory(
                name=sub_name,
                category_id=category.id
            )
            db.add(sub)
            db.commit()

        # ---------- Item Group ----------
        item_group = str(row["Item Group"]).strip().upper()
        item_name = str(row["Item Name"]).strip()

        # ---------- Suggested Products ----------
        if item_group == "SUGGESTED_PRODUCT":

            exists = db.query(Product).filter_by(
                name=item_name,
                sub_category_id=sub.id
            ).first()

            if not exists:
                product = Product(
                    name=item_name,
                    sub_category_id=sub.id,
                    price_str=str(row.get("Price", "")),
                    price_bar=str(row.get("Price Bar", ""))
                )
                db.add(product)

        # ---------- Components (Channel / Accessory / Grid Type) ----------
        else:
            component = db.query(Component).filter_by(
                name=item_name,
                type=item_group,
                sub_category_id=sub.id
            ).first()

            if not component:
                component = Component(
                    name=item_name,
                    type=item_group,
                    sub_category_id=sub.id
                )
                db.add(component)
                db.commit()  # need ID

            # ---------- Component Variant ----------
            
            brand = str(row.get("Brand", "")).strip()
            variant = str(row.get("Variant", "")).strip()
            price_bar = str(row.get("Price Bar", "")).strip()

            # avoid duplicate variants
            variant_exists = db.query(ComponentVariant).filter_by(
                component_id=component.id,
                brand_name=brand,
                variant=variant,
                price_range=price_bar
            ).first()

            if not variant_exists:
                comp_variant = ComponentVariant(
                    component_id=component.id,
                    brand_name=brand,
                    variant=variant,
                    price_range=price_bar
                )
                db.add(comp_variant)

    db.commit()
    print("✅ Database seeded successfully!")


if __name__ == "__main__":
    seed_data()
