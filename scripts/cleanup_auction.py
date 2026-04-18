import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def cleanup_auction_data():
    print("Deleting records with source_type = 'auction'...")
    try:
        # Delete from court_notices
        result = supabase.table("court_notices").delete().eq("source_type", "auction").execute()
        print(f"Deleted {len(result.data) if hasattr(result, 'data') else 'some'} records from court_notices.")
        
        # Delete from court_notices_history if it exists
        try:
            result_hist = supabase.table("court_notices_history").delete().eq("source_type", "auction").execute()
            print(f"Deleted records from court_notices_history.")
        except:
            pass
            
        print("Cleanup finished.")
    except Exception as e:
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    cleanup_auction_data()
