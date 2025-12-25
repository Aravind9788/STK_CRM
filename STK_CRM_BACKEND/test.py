from database import engine


try:
    connection = engine.connect()
    print("✅ MySQL Connected Successfully")
    connection.close()
except Exception as e:
    print("❌ Connection Failed:", e)
