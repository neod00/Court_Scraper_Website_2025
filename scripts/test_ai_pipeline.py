"""
Test Script: AI Report Pipeline
================================
Tests the full pipeline on a single notice:
1. Fetches a notice with file_info from Supabase
2. Downloads the attachment
3. Extracts text from PDF
4. Generates AI summary
5. Saves back to DB

Usage: python scripts/test_ai_pipeline.py
"""

import os
import sys

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_report_generator import (
    download_attachment,
    extract_text_from_pdf,
    generate_ai_summary,
    process_notices_without_summary,
    supabase,
    TARGET_CATEGORIES
)


def test_pipeline():
    print("=" * 60)
    print("🧪 AI Report Pipeline Test")
    print("=" * 60)
    
    # Step 1: Find a notice with attachments in target categories
    print("\n📋 Step 1: Finding a notice with attachments...")
    result = supabase.table("court_notices") \
        .select("id, title, category, department, file_info") \
        .in_("category", TARGET_CATEGORIES) \
        .not_.is_("file_info", "null") \
        .order("date_posted", desc=True) \
        .limit(1) \
        .execute()
    
    if not result.data:
        print("❌ No notices with attachments found in target categories.")
        print("   Trying without file_info filter...")
        
        result = supabase.table("court_notices") \
            .select("id, title, category, department, file_info") \
            .in_("category", TARGET_CATEGORIES) \
            .order("date_posted", desc=True) \
            .limit(1) \
            .execute()
    
    if not result.data:
        print("❌ No notices found in target categories at all!")
        return
    
    notice = result.data[0]
    print(f"   Found: {notice['title']}")
    print(f"   ID: {notice['id']}")
    print(f"   Category: {notice['category']}")
    print(f"   File Info: {notice.get('file_info')}")
    
    # Step 2: Test file download
    file_info = notice.get('file_info')
    extracted_text = ""
    
    if file_info and isinstance(file_info, list) and len(file_info) > 0:
        print(f"\n📥 Step 2: Testing file download ({len(file_info)} file(s))...")
        for fi in file_info:
            server_fn = fi.get('server_filename', '')
            original_fn = fi.get('original_filename', '')
            ext = os.path.splitext(original_fn)[1].lower()
            
            print(f"   File: {original_fn} (ext: {ext})")
            
            local_path = download_attachment(server_fn, original_fn)
            if local_path:
                # Step 3: Test text extraction
                print(f"\n📄 Step 3: Testing text extraction...")
                file_text = extract_text_from_pdf(local_path)
                print(f"   Extracted text length: {len(file_text)} chars")
                if file_text:
                    print(f"   Preview: {file_text[:300]}...")
                    extracted_text += file_text
                
                # Clean up
                try:
                    os.unlink(local_path)
                except:
                    pass
            else:
                print("   ⚠️ File download failed, will use fallback prompt")
    else:
        print("\n📥 Step 2: No attachments to download")
    
    # Step 4: Test AI summary generation
    print(f"\n🤖 Step 4: Testing AI summary generation...")
    summary = generate_ai_summary(
        title=notice['title'],
        category=notice['category'],
        department=notice.get('department', ''),
        extracted_text=extracted_text
    )
    
    if summary:
        print(f"\n{'='*60}")
        print("📊 Generated AI Summary:")
        print("=" * 60)
        print(summary)
        print("=" * 60)
        
        # Step 5: Save to DB (optional - ask user)
        print(f"\n💾 Step 5: Saving to database...")
        try:
            save_result = supabase.table("court_notices").update({
                "ai_summary": summary
            }).eq("id", notice['id']).execute()
            
            if save_result.data:
                print(f"   ✅ Saved successfully!")
                print(f"   View at: https://courtauction.site/notice/{notice['id']}")
            else:
                print(f"   ❌ Save failed - no data returned")
        except Exception as e:
            print(f"   ❌ Save failed: {e}")
            print(f"   💡 Did you run the SQL migration? Check scripts/add_ai_summary_column.sql")
    else:
        print("❌ AI summary generation failed!")
    
    print(f"\n{'='*60}")
    print("🏁 Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    test_pipeline()
