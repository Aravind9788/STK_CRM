"""
Add refresh_token column to users table
"""
import sys
sys.path.append('.')

from sqlalchemy import text
from database import engine

# Add refresh_token column to users table
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN refresh_token VARCHAR(500)"))
        conn.commit()
        print("✓ Added refresh_token column to users table")
    except Exception as e:
        if "already exists" in str(e) or "duplicate column" in str(e).lower():
            print("✓ refresh_token column already exists in users table")
        else:
            print(f"✗ Error: {e}")

print("\nDatabase migration completed!")
