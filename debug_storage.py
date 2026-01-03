import os
from supabase import create_client, Client

# ================= CONFIGURATION =================
# OLD PROJECT (Source)
OLD_URL = "https://difcwmsemzihueilyipz.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZmN3bXNlbXppaHVlaWx5aXB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgwMTUwOCwiZXhwIjoyMDgwMzc3NTA4fQ.5o4O0wBt632_2wdu17-KiY4xKBBICGQmhyKkyosqCZs" 

# NEW PROJECT (Destination)
NEW_URL = "https://flpbvurtkdnluyoqqtgn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscGJ2dXJ0a2RubHV5b3FxdGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM2MzUxOSwiZXhwIjoyMDgyOTM5NTE5fQ.yfTzhQT3GpmRIWyh_kFe1pdFq66mCC10LtQTOLH274s" 

# BUCKETS = ["timeline-media", "hero-videos"]
BUCKETS = ["timeline-media"] # Test one bucket first
# =================================================

def debug_files():
    print("🚀 Starting Debug...")
    
    old_db: Client = create_client(OLD_URL, OLD_SERVICE_KEY)

    for bucket in BUCKETS:
        print(f"\n📂 Processing bucket: [{bucket}]")
        
        try:
            # Listing files in root folder
            files = old_db.storage.from_(bucket).list()
            
            if not files:
                print(f"   (Empty bucket)")
                continue

            print(f"   Found {len(files)} items:")
            for file in files:
                print(f"   - Name: {file.get('name')}")
                print(f"     ID: {file.get('id')}")
                print(f"     Metadata: {file.get('metadata')}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    debug_files()
