from fastapi import APIRouter

router = APIRouter(prefix="/dashboard")

@router.get("/metrics")
def metrics():
    return {
        "daily_goal_amount": 50000,
        "daily_achieved_amount": 15000,
        "monthly_goal_amount": 1500000
    }
