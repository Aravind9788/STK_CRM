# schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LoginSchema(BaseModel):
    username: str
    password: str

class LeadCreateSchema(BaseModel):
    lead_created_at: Optional[datetime] = None

    source: str
    customer_name: str
    phone: str
    location: str
    district: str

    profile: str
    area_sqft: Optional[int] = None

    project_type: Optional[str] = None
    board_type: Optional[str] = None
    material_brand: Optional[str] = None
    channel: Optional[str] = None
    channel_thickness: Optional[str] = None

    material_category: Optional[str] = None
    material_quantity: Optional[int] = None
    accessory_name: Optional[str] = None
    accessory_qty: Optional[int] = None
    urgency: Optional[str] = "Normal"    
    # Fixed Typos
    lead_ended_at: Optional[datetime] = None

    quotation_created_at: Optional[datetime] = None
    quotation_id: Optional[str] = None
    total_estimated_cost: Optional[int] = None
    quotation_ended_at: Optional[datetime] = None
    
    approver_request_at: Optional[datetime] = None
    approver_status: Optional[str] = None

    class Config:
        orm_mode = True

class LeadCreateResponseSchema(BaseModel):
    message: str
    lead_code: str
    qoutaion_id: Optional[str] = None
    status: str

class QuotationItemSchema(BaseModel):
    name: str
    quantity: int
    unit_price: int
    total: int

class QuotationSnapshotSchema(BaseModel):
    items: List[QuotationItemSchema]
    subtotal: int
    tax: Optional[int] = None
    grand_total: int

class SubmitQuotationApprovalToTeamLead(BaseModel):
    lead_id: str
    quotation_id: str
    sent_at: datetime 

class TeamleadResponseToApproval(BaseModel):
    status: str
    message: str

class PendingApprovalListResponse(BaseModel):
    lead_id: int
    quotation_id: Optional[str]
    client_name: str
    amount: int
    sales_rep_name: str
    priority: str
    submitted_at: Optional[datetime]

class PendingApprovalDetailResponse(BaseModel):
    lead_id: int
    quotation_id: Optional[str]
    client_name: str
    sales_rep_name: str
    submitted_at: Optional[datetime]
    total_estimated_cost: int
    quotation: Optional[QuotationSnapshotSchema]

class SendQuotationToCustomerRequest(BaseModel):
    lead_id: str
    method: str 
    sent_at: datetime 

class SendQuotationToCustomerResponse(BaseModel):
    status: str
    message: str

class PendingApprovalDetailResponse(BaseModel):
    lead_id: str
    customer_name: str
    phone: str
    total_estimated_cost: int
    quotation: QuotationSnapshotSchema

class LeadHandoverToStoreRequest(BaseModel):
    lead_id: int
    store_name: str
    advance_received_amount: Optional[int] = None
    advance_received_amount_at: Optional[datetime] = None    
    payment_mode:str
    handover_at: datetime

class GetPendingLeadsResponse(BaseModel):
    lead_id: str
    quotation_id: str
    phone: str
    lead_name: str
    estimated_cost: int
    handover_at: datetime
    advance_received:int

class PendingLeadDetailResponse(BaseModel):
    lead_id: int
    lead_code: str
    quotation_id: str
    customer_name: str
    phone: str
    address: str
    
    source: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    profile: Optional[str] = None
    area_sqft: Optional[int] = None
    project_type: Optional[str] = None
    board_type: Optional[str] = None
    material_brand: Optional[str] = None
    channel: Optional[str] = None
    channel_thickness: Optional[str] = None
    material_category: Optional[str] = None
    material_quantity: Optional[int] = None
    accessory_name: str
    accessory_qty: int
    urgency: Optional[str] = None
    status :str
    total_estimated_cost: int
    advance_paid: int
    balance_remaining: int
    payment_mode_handover: str
    quotation: Optional[QuotationSnapshotSchema] = None 

# 2. DISPATCH STAGE
class DispatchOrderRequest(BaseModel):
    lead_id: str
    driver_name: str
    driver_phone: str
    vehicle_number: str
    payment_mode: str 
    payment_received_amount: int
    expected_delivery_at: datetime
    dispatch_timestamp: datetime

class DispatchListResponse(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    amount: int
    driver_name: str
    vehicle_number: str
    dispatched_at: datetime

class DispatchDetailResponse(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    phone: Optional[str] = None
    driver_name: str
    vehicle_number: str
    driver_phone: str
    
    source: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    profile: Optional[str] = None
    process_type: Optional[str] = None
    area_sqft: Optional[int] = None
    project_type: Optional[str] = None
    board_type: Optional[str] = None
    material_brand: Optional[str] = None
    channel: Optional[str] = None
    channel_thickness: Optional[str] = None
    material_category: Optional[str] = None
    material_quantity: Optional[int] = None
    acessories_list: Optional[str] = None
    urgency: Optional[str] = None
    
    advance_paid: int  # Standardized field matching pending
    payment_mode_handover: Optional[str] = None  # Standardized field matching pending
    payment_mode: Optional[str] = None
    payment_mode_dispatch: str
    dispatch_amount: int
    
    total_estimated_cost: int
    total_paid_so_far: int
    balance_remaining: int
    
    expected_delivery_at: Optional[datetime]
    dispatched_at: datetime
    quotation: Optional[QuotationSnapshotSchema] = None 

# 3. DELIVERY STAGE
class DeliverOrderRequest(BaseModel):
    lead_id: int
    feedback: str
    payment_mode: str
    payment_received_amount: int

class DeliveredListResponse(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    total_estimated_cost: int
    final_balance: int 
    delivered_at: datetime

class DeliveredDetailResponse(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    phone: Optional[str] = None
    
    source: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    profile: Optional[str] = None
    process_type: Optional[str] = None
    area_sqft: Optional[int] = None
    project_type: Optional[str] = None
    board_type: Optional[str] = None
    material_brand: Optional[str] = None
    channel: Optional[str] = None
    channel_thickness: Optional[str] = None
    material_category: Optional[str] = None
    material_quantity: Optional[int] = None
    acessories_list: Optional[str] = None
    urgency: Optional[str] = None

    payment_mode_handover: Optional[str] = None
    dispatch_feedback: str
    payment_mode_delivery: str
    
    advance_received_amount: int 
    
    total_estimated_cost: int
    final_balance: int
    delivered_at: datetime
    quotation: Optional[QuotationSnapshotSchema] = None

class TeamLeadDashboardStats(BaseModel):
    leads_pending_followup: int
    leads_total_active: int
    deliveries_completed: int
    deliveries_total: int
    team_goal_percentage: int
    
class CreateStaffRequest(BaseModel):
    full_name: str          # e.g. "Rahul Sharma"
    password: str
    store_assigned: str
    # sales_executive_id is auto-generated by backend

class SalesMemberStats(BaseModel):
    id: int
    name: str
    
    # Follow-Ups
    pending_leads_count: int
    total_leads_assigned: int
    
    # Deliveries (From their sales)
    deliveries_completed: int
    deliveries_total_handover: int
    
    # Performance (Revenue or Count)
    daily_revenue_achieved: int
    daily_revenue_target: int # We will set a default target for now

class TeamStatsResponse(BaseModel):
    team_members: List[SalesMemberStats]
    overall_conversion_rate: int

class SalesExecutiveListItem(BaseModel):
    user_id: int
    username: str
    employee_id: str  # e.g., "SE-101"
    status: str       # "Active"

# Individual Performance Detail
class GraphDataPoint(BaseModel):
    label: str  # e.g., "9 AM" or "1st Dec"
    value: int  # Revenue amount

class PerformanceMetrics(BaseModel):
    pending_followups: int
    daily_quotations_created: int
    daily_quotations_target: int
    leads_completed_count: int
    leads_completed_target: int
    
    # Daily revenue for donut chart
    daily_revenue: int
    daily_revenue_target: int
    
    # The calculated score (0-100) for the bottom slider
    performance_score: int 
    performance_rating: str # "Low", "Average", "Good", "Excellent"

class IndividualPerformanceResponse(BaseModel):
    user_id: int
    username: str
    role: str
    
    # For the Graph
    revenue_graph_data: List[GraphDataPoint] 
    
    # For the Cards & Slider
    metrics: PerformanceMetrics

class ExecutivePendingStats(BaseModel):
    user_id: int
    name: str
    pending_count: int
    percentage: int  # For the Donut Chart (e.g., 42%)

class PendingLeadsOverviewResponse(BaseModel):
    total_pending: int       # The "12"
    total_active_leads: int  # The "18"
    breakdown: List[ExecutivePendingStats]

class TimelineFilterRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    sales_executive_id: Optional[int] = None # If None, fetch ALL

class TimelineEventItem(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    sales_executive_name: str
    
    event_type: str   # "Lead Created", "Quotation Generated", "Sent for Approval", "Quotation Sent"
    timestamp: datetime
    amount: Optional[int] = 0 # Shows "₹ -" or "₹ 3.9L"
    status: str       # "Completed"


class CheckInRequest(BaseModel):
    location: str # "Office" or "Client Site"
    # latitude/longitude can be added here

class AttendanceLogItem(BaseModel):
    user_id: int
    name: str
    role: str
    status: str     # Present, Absent, Late
    check_in: Optional[str] = None # "09:30 AM"
    check_out: Optional[str] = "--"
    location: Optional[str] = "--"

class TodayAttendanceSummary(BaseModel):
    present_count: int
    absent_count: int
    late_count: int
    logs: List[AttendanceLogItem]

class LeaveWorkloadPreview(BaseModel):
    total_pending_leads: int
    suggested_reassignment: List[dict] # [{"name": "Rahul", "leads_to_take": 8}]

class PendingLeaveListItem(BaseModel):
    leave_id: int
    user_name: str
    role: str
    start_date: datetime
    end_date: datetime
    days_count: int
    pending_leads_count: int
    reason: str

class LeaveDetailResponse(BaseModel):
    leave_id: int
    user_name: str
    start_date: datetime
    end_date: datetime
    days: int
    reason: str
    handover_summary: List[dict] 

# Pending Leads Tracking (List View)
class PendingLeadTrackerItem(BaseModel):
    lead_id: int
    lead_code: str
    client_name: str
    sales_rep_name: str
    amount: int
    time_ago: str  # "2 hours ago"
    
    # For the UI Progress Bar (1=New, 2=Contact, 3=Visit, 4=Quote, 5=Close)
    current_stage_step: int 
    current_stage_name: str # "Quote"

# Time Tracking Detail (Timeline View)
class TimeLogEvent(BaseModel):
    title: str          # "Lead Created", "Quotation Time"
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration_str: str   # "05:30 min" or "19:30 min"
    is_completed: bool

class LeadTimeTrackingResponse(BaseModel):
    lead_code: str
    client_name: str
    events: List[TimeLogEvent]
    total_process_duration: str # "01:08:20 hours"

class StorePendingBreakdown(BaseModel):
    name: str  # "John Smith"
    count: int # 16 Leads

class StoreManagerOverviewResponse(BaseModel):
    store_name: str
    pincode: str
    
    # 1. Orders Completed Alerts (Green Card)
    orders_completed_count: int
    
    # 2. Orders Pending Alerts (Orange Card)
    orders_pending_count: int
    orders_pending_breakdown: List[StorePendingBreakdown]
    
    # 3. No Action Alerts (Red Card - >24 hrs pending)
    no_action_count: int
    
    # 4. Store Deliveries Status (Progress Bar)
    deliveries_completed: int
    deliveries_total: int
    
    # 5. Performance Monitor (Score)
    performance_score: int

class FolowupLeadUpdateRequest(BaseModel):
    lead_code: str
    update_stage: str
    next_followup: Optional[datetime] = None
    reason: Optional[str] = None
    stage_selected_at: datetime
    followup_updated_at: datetime

class FollowUpDetailResponse(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    phone: str
    quotation_status: str
    approver_status: str
    # Header Data
    estimated_value: int
    project_type: str

    current_stage: str 
    next_followup_date: Optional[datetime] = None
    last_remarks: Optional[str] = None

class HandoverAssignment(BaseModel):
    lead_id: int
    to_user_id: int # The Colleague's ID

class CreateLeaveRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: str
    handovers: List[HandoverAssignment] = []

class HandoverCandidateResponse(BaseModel):
    lead_id: int
    lead_code: str
    customer_name: str
    status: str

class ColleagueResponse(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str]

class LeaveHistoryItem(BaseModel):
    date_str: str  # e.g. "12 Oct"
    reason: str    # e.g. "Viral Fever"

class LateHistoryItem(BaseModel):
    date_str: str  # e.g. "02 Oct"
    time_str: str  # e.g. "10:05 AM"

class MonthlyAttendanceReport(BaseModel):
    user_id: int
    user_name: str
    role: str
    score_percentage: int
    
    # Summary Cards
    leaves_taken_count: int
    days_present_count: int
    late_marks_count: int
    
    # Detailed History Lists (For dropdowns)
    leave_history: List[LeaveHistoryItem]
    late_history: List[LateHistoryItem]

# Pending Leads Tracking Schema
class PendingLeadTrackerItem(BaseModel):
    id: str                # Lead Code
    name: str              # Customer Name
    value: str             # Formatted amount
    salesPerson: str
    currentStageIndex: int # 0-9 for 10 stages
    lastUpdate: str        # "2 hours ago"

# Staff Management Schemas
class CreateStaffRequest(BaseModel):
    full_name: str
    password: str
    store_assigned: str

class StaffResponse(BaseModel):
    staff_id: str
    full_name: str
    store_assigned: str
    created_at: datetime

class StaffListItem(BaseModel):
    id: int
    staff_id: str
    full_name: str
    password: str  # Will be masked in frontend
    store_assigned: str