from fastapi import APIRouter
from utils.calculator import calculate_material
from schemas import QuotationCalculateSchema
router = APIRouter(prefix="/quotations")

@router.post("/calculate")
def calculate_quote(data: QuotationCalculateSchema):
    line_items = []
    total = 0

    for item in data.items:
        qty = item.area_sqft // 32
        unit_price = 695
        item_total = qty * unit_price
        total += item_total

        line_items.append({
            "item": f"{item.brand} {item.product_name}",
            "quantity": qty,
            "unit_price": unit_price,
            "total": item_total
        })

        channel_qty = item.area_sqft // 16
        channel_total = channel_qty * 140
        total += channel_total

        line_items.append({
            "item": "GI Channel (Calculated)",
            "quantity": channel_qty,
            "unit_price": 140,
            "total": channel_total,
            "note": f"Auto-added based on {item.area_sqft}sqft"
        })

    return {
        "quote_id": "TEMP-Q-101",
        "total_estimated_cost": total,
        "line_items": line_items
    }

@router.post("/submit-approval")
def submit_for_approval(data: dict):
    return {
        "status": "Pending Approval",
        "message": "Sent to Team Lead for review."
    }

@router.post("/send-customer")
def send_to_customer(data: dict):
    return {
        "message": f"Quotation sent via {data['method']}"
    }

