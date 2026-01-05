"""
Script to create database tables for staff management
"""
import sys
sys.path.append('.')

from database import engine, Base
import models

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✓ Tables created successfully!")

# Verify the tables were created
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()

print("\nExisting tables:")
for table in tables:
    print(f"  - {table}")

# Check if our new tables exist
if 'team_lead_staff' in tables:
    print("\n✓ team_lead_staff table created")
else:
    print("\n✗ team_lead_staff table NOT created")

if 'store_manager_staff' in tables:
    print("✓ store_manager_staff table created")
else:
    print("✗ store_manager_staff table NOT created")
