from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import Database and Models
from database import engine, Base
import models  # <--- CRITICAL: Registers your new tables (Store, TeamMember) with Base

# Import Routers
from routers import auth, dashboard, leads, master_data, quotations, catalog

# Create tables
# This will now see the new tables in models.py and create them in Postgres
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRM Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(leads.router)
app.include_router(master_data.router)
app.include_router(quotations.router)
app.include_router(catalog.router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )