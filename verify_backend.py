import os
import sys
import json

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from services.pdf_service import PDFService
from services.gemini_service import GeminiService

def test_pipeline():
    print("=== Start Backend Service Tests ===")
    
    # 1. Test Text Extraction and PDF Conversion
    sample_txt = os.path.join("samples", "alice_fullstack.txt")
    output_pdf = os.path.join("backend", "uploads", "test_alice.pdf")
    
    print(f"Reading sample txt: {sample_txt}")
    if not os.path.exists(sample_txt):
        print(f"ERROR: {sample_txt} not found.")
        return
        
    text = PDFService.extract_text(sample_txt)
    print(f"Extracted {len(text)} characters of text.")
    
    print(f"Converting text to PDF at: {output_pdf}")
    PDFService.convert_to_pdf(sample_txt, output_pdf)
    if os.path.exists(output_pdf):
        print(f"SUCCESS: Generated PDF exists. Size: {os.path.getsize(output_pdf)} bytes.")
    else:
        print("ERROR: PDF was not generated.")
        return

    # 2. Test Gemini Resume Parsing
    print("\nInitializing Gemini Service...")
    try:
        gemini = GeminiService()
    except Exception as e:
        print(f"ERROR initializing Gemini: {e}")
        print("Please check if GEMINI_API_KEY or GOOGLE_API_KEY is set in environment.")
        return

    print("Sending resume text to Gemini for parsing (JSON Mode)...")
    parsed_resume = gemini.parse_resume(text)
    print("SUCCESS: Parsed Resume Output:")
    print(json.dumps(parsed_resume, indent=2))

    # 3. Test Gemini Scoring
    sample_jd = {
        "title": "Senior Full Stack Engineer",
        "skills": "React, Node.js, Python, FastAPI, PostgreSQL, AWS, Docker",
        "experience": "3+ years",
        "education": "Bachelor's in Computer Science",
        "description": "Develop client-side and server-side components using React and Python/FastAPI. Deploy dockerized containers to AWS."
    }
    
    print("\nEvaluating candidate against sample Job Description...")
    evaluation = gemini.score_candidate(parsed_resume, sample_jd)
    print("SUCCESS: Evaluation Output:")
    print(json.dumps(evaluation, indent=2))
    
    print("\n=== Backend Service Tests Complete ===")

if __name__ == "__main__":
    test_pipeline()
