from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Category

router = APIRouter()

@router.get("/master-data")
def get_master_data(db: Session = Depends(get_db)):

    data = {
        "categories": [],
        "sources": ["Indiamart", "Walk-In", "Google", "JustDial", "Site Visit"]
    }

    categories = db.query(Category).all()

    # 🔹 These are for DUMMY FORMAT (frontend use)
    materials = []
    accessories = []

    material_id = 1
    accessory_id = 1

    for cat in categories:
        cat_dict = {
            "name": cat.name,
            "sub_categories": []
        }

        for sub in cat.sub_categories:
            sub_dict = {
                "name": sub.name,
                "Suggested_product": [],
                "channel": [],
                "accessories": [],
                "gridtype": []
            }

            # -----------------------
            # Suggested Products
            # -----------------------
            for prod in sub.products:
                sub_dict["Suggested_product"].append({
                    "name": prod.name,
                    "price": prod.price_str,
                    "price_bar": prod.price_bar
                })

                # ➕ Dummy MATERIAL format
                materials.append({
                    "id": material_id,
                    "name": prod.name,
                    "brand": "Standard",
                    "price": int(prod.price_str),
                    "unit": "per sheet"
                })
                material_id += 1

            # -----------------------
            # Components
            # -----------------------
            for comp in sub.components:

                variants = []
                for v in comp.variants:
                    variants.append({
                        "brand": v.brand_name,
                        "variant": v.variant,
                        "price_bar": v.price_range
                    })

                    # ➕ Dummy ACCESSORY format
                    accessories.append({
                        "id": accessory_id,
                        "name": f"{comp.name} ({v.variant})",
                        "price": int(v.price_range.split("-")[0]),
                        "unit": "per piece"
                    })
                    accessory_id += 1

                item_entry = {
                    "name": comp.name,
                    "variants": variants
                }

                if comp.type == "CHANNEL":
                    sub_dict["channel"].append(item_entry)

                elif comp.type == "GRID_TYPE":
                    sub_dict["gridtype"].append(item_entry)

                elif comp.type == "ACCESSORY":
                    sub_dict["accessories"].append(item_entry)

            cat_dict["sub_categories"].append(sub_dict)

        data["categories"].append(cat_dict)

    # 🔹 Attach dummy-format arrays WITHOUT breaking existing response
    data["materials"] = materials
    data["accessories"] = accessories

    return data
