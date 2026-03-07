"""
AI Report Generator for Court Asset Sale Notices
=================================================
Downloads PDF attachments from court notices, extracts text content,
and generates AI analysis reports using GPT-4o-mini.

Usage:
    python scripts/ai_report_generator.py          # Process all unanalyzed notices
    python scripts/ai_report_generator.py --limit 5  # Process up to 5 notices
"""

import os
import sys
import time
import json
import base64
import tempfile
import argparse
import traceback
from typing import Optional, List, Dict
from urllib.parse import quote

import requests
import pdfplumber
import fitz  # pymupdf
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# ── Environment Setup ──────────────────────────────────────────────
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    sys.exit(1)
if not OPENAI_API_KEY:
    print("Error: OPENAI_API_KEY not found in environment variables.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Target categories for AI report generation
TARGET_CATEGORIES = ['real_estate', 'vehicle']

# Minimum text length to consider text extraction successful
MIN_TEXT_LENGTH = 50


# ── 1. File Download ───────────────────────────────────────────────
def download_attachment(server_filename: str, original_filename: str, path: str = '011') -> Optional[str]:
    """
    Downloads an attachment from the court file server.
    Returns the local temporary file path, or None on failure.
    """
    try:
        encoded_server = quote(server_filename)
        
        # Encode original filename to EUC-KR then URL-encode (mirroring api/download/route.ts)
        try:
            euc_kr_bytes = original_filename.encode('euc-kr')
            encoded_original = ''.join(f'%{byte:02X}' for byte in euc_kr_bytes)
        except (UnicodeEncodeError, UnicodeDecodeError):
            encoded_original = quote(original_filename)
        
        court_url = f"https://file.scourt.go.kr/AttachDownload?path={path}&file={encoded_server}&downFile={encoded_original}"
        
        print(f"  📥 Downloading: {original_filename}")
        response = requests.get(court_url, verify=False, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code != 200:
            print(f"  ❌ Download failed: HTTP {response.status_code}")
            return None
        
        if len(response.content) < 100:
            print(f"  ❌ Downloaded file too small ({len(response.content)} bytes)")
            return None
        
        # Determine file extension from original filename
        ext = os.path.splitext(original_filename)[1].lower() or '.pdf'
        
        # Save to temp file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        tmp.write(response.content)
        tmp.close()
        
        print(f"  ✅ Downloaded: {len(response.content):,} bytes → {tmp.name}")
        return tmp.name
        
    except Exception as e:
        print(f"  ❌ Download error: {e}")
        return None


# ── 2. Text Extraction ────────────────────────────────────────────
def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file.
    First tries pdfplumber (for text-based PDFs).
    Falls back to pymupdf image extraction + OpenAI Vision (for image-based PDFs).
    """
    text = ""
    
    # Strategy 1: pdfplumber (text-based PDF)
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"  ⚠️ pdfplumber failed: {e}")
    
    # If we got enough text, return it
    if len(text.strip()) >= MIN_TEXT_LENGTH:
        print(f"  📄 Text extracted (pdfplumber): {len(text)} chars")
        return text.strip()
    
    # Strategy 2: Image-based PDF → render pages as images → OpenAI Vision
    print(f"  🖼️ Text too short ({len(text.strip())} chars), trying image-based OCR via GPT Vision...")
    try:
        text = extract_text_from_image_pdf(file_path)
        if text and len(text.strip()) >= MIN_TEXT_LENGTH:
            print(f"  📄 Text extracted (Vision OCR): {len(text)} chars")
            return text.strip()
    except Exception as e:
        print(f"  ⚠️ Vision OCR failed: {e}")
    
    return text.strip()


def extract_text_from_image_pdf(file_path: str, max_pages: int = 5) -> str:
    """
    For image-based PDFs: renders pages as images using pymupdf,
    then uses OpenAI GPT-4o-mini Vision to extract text.
    """
    doc = fitz.open(file_path)
    all_text = []
    pages_to_process = min(len(doc), max_pages)
    
    for page_num in range(pages_to_process):
        page = doc[page_num]
        # Render page as image (2x zoom for better OCR quality)
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        img_b64 = base64.b64encode(img_bytes).decode('utf-8')
        
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "이 이미지는 한국 법원의 자산매각 공고 첨부파일 중 한 페이지입니다. 이미지에 있는 모든 한국어 텍스트를 정확하게 그대로 추출해주세요. 표가 있으면 표 형식도 유지해주세요. 텍스트만 반환하고 다른 설명은 불필요합니다."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{img_b64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000
            )
            page_text = response.choices[0].message.content
            if page_text:
                all_text.append(page_text)
        except Exception as e:
            print(f"  ⚠️ Vision OCR page {page_num + 1} failed: {e}")
        
        # Rate limiting: small delay between API calls
        time.sleep(0.5)
    
    doc.close()
    return "\n\n".join(all_text)


# ── 3. AI Summary Generation ──────────────────────────────────────
PROMPTS = {
    "real_estate": """아래는 법원 회생·파산 자산매각 공고의 첨부파일에서 추출한 부동산 관련 원문 텍스트입니다.

[공고 제목]: {title}
[관할 법원]: {department}
[추출된 첨부파일 내용]:
{extracted_text}

위 첨부파일 내용을 아래 항목 순서로 **사실만 정리**하여 요약해주세요.
문서에 명시되어 있지 않은 정보는 "기재 없음"으로 표시하세요.
절대로 추측, 의견, 평가, 투자 조언을 넣지 마세요. 오직 문서에 적힌 사실만 정리합니다.

1. **매각 대상**: 소재지, 물건 종류(토지/건물/아파트 등), 면적, 지목 등
2. **매각 가격**: 최저매각가격(최저입찰가), 감정가(있는 경우), 회차별 가격 변동
3. **입찰 방법**: 입찰 방식(공개/밀봉/우편 등), 입찰 기한, 입찰 장소
4. **보증금 및 대금 납부**: 입찰보증금 금액 또는 비율, 잔금 납부 기한 및 방법
5. **매각 조건 및 유의사항**: 인수 조건, 하자 담보 책임, 권리 제한 사항 등 문서에 기재된 조건
6. **문의처**: 담당자, 전화번호, 법률사무소 등 연락처

※ 일반인이 읽기 쉽도록 간결하게 정리하되, 원문의 핵심 수치와 조건을 정확히 반영하세요.
※ 마크다운 형식으로 작성하되, 제목(#)은 사용하지 마세요.""",

    "vehicle": """아래는 법원 회생·파산 자산매각 공고의 첨부파일에서 추출한 차량/중기 관련 원문 텍스트입니다.

[공고 제목]: {title}
[관할 법원]: {department}
[추출된 첨부파일 내용]:
{extracted_text}

위 첨부파일 내용을 아래 항목 순서로 **사실만 정리**하여 요약해주세요.
문서에 명시되어 있지 않은 정보는 "기재 없음"으로 표시하세요.
절대로 추측, 의견, 평가, 투자 조언을 넣지 마세요. 오직 문서에 적힌 사실만 정리합니다.

1. **매각 대상**: 차종, 차량번호, 연식(최초등록일), 주행거리, 색상 등
2. **매각 가격**: 최저매각가격(최저입찰가), 감정가(있는 경우)
3. **차량 상태**: 검사 유효기간, 사고 이력, 압류/저당 현황 등 문서에 기재된 사항
4. **입찰 방법**: 입찰 방식, 입찰 기한, 입찰 장소, 차량 확인(열람) 일정
5. **보증금 및 대금 납부**: 입찰보증금 금액 또는 비율, 잔금 납부 기한
6. **매각 조건 및 유의사항**: 명의이전 조건, 인도 방법, 기타 문서에 기재된 조건
7. **문의처**: 담당자, 전화번호, 법률사무소 등 연락처

※ 일반인이 읽기 쉽도록 간결하게 정리하되, 원문의 핵심 수치와 조건을 정확히 반영하세요.
※ 마크다운 형식으로 작성하되, 제목(#)은 사용하지 마세요."""
}

# Fallback prompt when no attachment text could be extracted
FALLBACK_PROMPT = """아래는 법원 회생·파산 자산매각 공고의 기본 정보입니다.
첨부파일 내용을 추출하지 못하여, 공고 제목에서 파악 가능한 정보만 정리합니다.

[공고 제목]: {title}
[관할 법원]: {department}
[카테고리]: {category_name}

공고 제목에서 확인 가능한 정보(매각 대상 종류, 관할 법원)만 간략히 안내해주세요.
**150~250자 분량**으로 작성하고, 반드시 아래 문구를 포함하세요:
"상세 매각 조건 및 입찰 방법은 원본 첨부파일을 직접 확인하시기 바랍니다."
절대로 추측이나 의견을 넣지 마세요.
마크다운 형식으로 작성하되, 제목(#)은 사용하지 마세요."""


def generate_ai_summary(title: str, category: str, department: str, extracted_text: str) -> Optional[str]:
    """
    Generates an AI analysis report for a court notice using GPT-4o-mini.
    """
    category_name = '부동산' if category == 'real_estate' else '차량/중기'
    
    # Choose prompt based on whether we have extracted text
    if extracted_text and len(extracted_text) >= MIN_TEXT_LENGTH:
        prompt_template = PROMPTS.get(category, PROMPTS['real_estate'])
        prompt = prompt_template.format(
            title=title,
            department=department or '정보 없음',
            extracted_text=extracted_text[:6000]  # Limit to ~6000 chars to control token usage
        )
    else:
        prompt = FALLBACK_PROMPT.format(
            title=title,
            department=department or '정보 없음',
            category_name=category_name
        )
    
    try:
        print(f"  🤖 Generating AI summary...")
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 법원 회생·파산 자산매각 공고문 전문 정리사입니다. 첨부파일에 기재된 사실 정보만 정확하게 정리하며, 절대 추측·의견·투자 조언을 하지 않습니다."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        summary = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else 0
        print(f"  ✅ Summary generated: {len(summary)} chars (tokens: {tokens_used})")
        return summary
        
    except Exception as e:
        print(f"  ❌ AI summary generation failed: {e}")
        return None


# ── 4. Main Pipeline ──────────────────────────────────────────────
def process_single_notice(notice: Dict) -> bool:
    """
    Processes a single notice: downloads attachments, extracts text,
    generates AI summary, and saves to database.
    Returns True if successful.
    """
    notice_id = notice['id']
    title = notice['title']
    category = notice.get('category', 'etc')
    department = notice.get('department', '')
    file_info = notice.get('file_info')
    
    print(f"\n{'='*60}")
    print(f"📋 Processing: {title}")
    print(f"   Category: {category} | Dept: {department}")
    
    # Skip non-target categories
    if category not in TARGET_CATEGORIES:
        print(f"  ⏭️ Skipping: category '{category}' not in target list")
        return False
    
    # Extract text from attachments
    extracted_text = ""
    temp_files = []
    
    if file_info and isinstance(file_info, list) and len(file_info) > 0:
        # Try to download and extract text from each PDF attachment
        for file_entry in file_info:
            server_fn = file_entry.get('server_filename', '')
            original_fn = file_entry.get('original_filename', '')
            ext = os.path.splitext(original_fn)[1].lower()
            
            # Only process PDF files for now
            if ext not in ['.pdf', '']:
                print(f"  ⏭️ Skipping non-PDF file: {original_fn}")
                continue
            
            local_path = download_attachment(server_fn, original_fn)
            if local_path:
                temp_files.append(local_path)
                file_text = extract_text_from_pdf(local_path)
                if file_text:
                    extracted_text += f"\n--- {original_fn} ---\n{file_text}\n"
    else:
        print(f"  ℹ️ No attachments found for this notice")
    
    # Generate AI summary
    summary = generate_ai_summary(title, category, department, extracted_text)
    
    # Clean up temp files
    for tmp_path in temp_files:
        try:
            os.unlink(tmp_path)
        except:
            pass
    
    if not summary:
        print(f"  ❌ Failed to generate summary for {notice_id}")
        return False
    
    # Save to database
    try:
        result = supabase.table("court_notices").update({
            "ai_summary": summary
        }).eq("id", notice_id).execute()
        
        if result.data:
            print(f"  💾 Saved AI summary to DB for notice {notice_id}")
            return True
        else:
            print(f"  ❌ DB update returned no data for {notice_id}")
            return False
    except Exception as e:
        print(f"  ❌ DB save error: {e}")
        return False


def process_notices_without_summary(limit: int = 50):
    """
    Finds all notices without AI summaries (in target categories)
    and processes them.
    """
    print("\n" + "=" * 60)
    print("🚀 AI Report Generator - Starting")
    print("=" * 60)
    
    try:
        # Query notices that need AI summary
        result = supabase.table("court_notices") \
            .select("id, title, category, department, file_info") \
            .is_("ai_summary", "null") \
            .in_("category", TARGET_CATEGORIES) \
            .order("date_posted", desc=True) \
            .limit(limit) \
            .execute()
        
        notices = result.data or []
        print(f"\n📊 Found {len(notices)} notices without AI summary")
        
        if not notices:
            print("✅ All target notices already have AI summaries!")
            return
        
        success_count = 0
        fail_count = 0
        
        for i, notice in enumerate(notices):
            print(f"\n[{i+1}/{len(notices)}]", end="")
            
            if process_single_notice(notice):
                success_count += 1
            else:
                fail_count += 1
            
            # Rate limiting between notices
            if i < len(notices) - 1:
                time.sleep(1)
        
        print(f"\n\n{'='*60}")
        print(f"🏁 Processing Complete!")
        print(f"   ✅ Success: {success_count}")
        print(f"   ❌ Failed:  {fail_count}")
        print(f"   📊 Total:   {len(notices)}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        traceback.print_exc()


# ── CLI Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate AI analysis reports for court notices")
    parser.add_argument("--limit", type=int, default=50, help="Maximum number of notices to process (default: 50)")
    args = parser.parse_args()
    
    process_notices_without_summary(limit=args.limit)
