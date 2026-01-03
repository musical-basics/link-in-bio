import os
from supabase import create_client, Client

# ================= CONFIGURATION =================
OLD_URL = "https://difcwmsemzihueilyipz.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZmN3bXNlbXppaHVlaWx5aXB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgwMTUwOCwiZXhwIjoyMDgwMzc3NTA4fQ.5o4O0wBt632_2wdu17-KiY4xKBBICGQmhyKkyosqCZs" 

NEW_URL = "https://flpbvurtkdnluyoqqtgn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscGJ2dXJ0a2RubHV5b3FxdGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM2MzUxOSwiZXhwIjoyMDgyOTM5NTE5fQ.yfTzhQT3GpmRIWyh_kFe1pdFq66mCC10LtQTOLH274s" 

BUCKETS = ["timeline-media", "hero-videos"]
# =================================================

def migrate_recursive(old_db, new_db, bucket, path=""):
    print(f"   📂 Listing folder: {bucket}/{path}")
    
    try:
        items = old_db.storage.from_(bucket).list(path)
        
        for item in items:
            name = item.get('name')
            full_path = f"{path}/{name}" if path else name
            
            # Check if it's a folder (no metadata/id usually implies folder in some versions, 
            # or if it has no metadata but we can list inside it).
            # Reliable check: if 'metadata' is None, it's a folder or placeholder.
            if item.get('metadata') is None:
                print(f"   Found folder: {full_path}, recursing...")
                migrate_recursive(old_db, new_db, bucket, full_path)
            else:
                # It is a file
                migrate_file(old_db, new_db, bucket, full_path, item)

    except Exception as e:
        print(f"❌ Error listing {bucket}/{path}: {e}")

def migrate_file(old_db, new_db, bucket, full_path, item_metadata):
    print(f"   --> Moving: {full_path}...", end=" ", flush=True)
    try:
        # Download
        file_data = old_db.storage.from_(bucket).download(full_path)
        
        # Upload
        content_type = item_metadata.get('metadata', {}).get('mimetype', 'application/octet-stream')
        new_db.storage.from_(bucket).upload(
            path=full_path, 
            file=file_data, 
            file_options={"content-type": content_type, "upsert": "true"}
        )
        print("✅ Done")
    except Exception as e:
         print(f"❌ FAILED: {str(e)}")

def migrate_files():
    print("🚀 Starting Recursive Migration...")
    
    old_db: Client = create_client(OLD_URL, OLD_SERVICE_KEY)
    new_db: Client = create_client(NEW_URL, NEW_SERVICE_KEY)

    for bucket in BUCKETS:
        print(f"\nProcessing bucket: [{bucket}]")
        migrate_recursive(old_db, new_db, bucket)

    print("\n✨ Migration Complete!")

if __name__ == "__main__":
    migrate_files()
