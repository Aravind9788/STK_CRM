"""
Script to add plain_password column to existing staff tables
"""
import sys
sys.path.append('.')

from sqlalchemy import text
from database import engine

# Add plain_password column to team_lead_staff table
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE team_lead_staff ADD COLUMN plain_password VARCHAR(100)"))
        conn.commit()
        print("✓ Added plain_password column to team_lead_staff")
    except Exception as e:
        if "already exists" in str(e) or "duplicate column" in str(e).lower():
            print("✓ plain_password column already exists in team_lead_staff")
        else:
            print(f"✗ Error adding column to team_lead_staff: {e}")
    
    try:
        conn.execute(text("ALTER TABLE store_manager_staff ADD COLUMN plain_password VARCHAR(100)"))
        conn.commit()
        print("✓ Added plain_password column to store_manager_staff")
    except Exception as e:
        if "already exists" in str(e) or "duplicate column" in str(e).lower():
            print("✓ plain_password column already exists in store_manager_staff")
        else:
            print(f"✗ Error adding column to store_manager_staff: {e}")

print("\nDatabase migration completed!")
