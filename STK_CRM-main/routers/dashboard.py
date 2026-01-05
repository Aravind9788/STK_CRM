from fastapi import APIRouter
from utils.security import get_current_user
from fastapi import Depends
router = APIRouter(prefix="/dashboard")

@router.get("/metrics")
def metrics(current_user: dict = Depends(get_current_user)):    return {
        "daily_goal_amount": 50000,
        "daily_achieved_amount": 15000,
        "monthly_goal_amount": 1500000
    }
