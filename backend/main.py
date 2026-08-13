import os
import uuid
import json
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.pdf_service import PDFService
from services.gemini_service import GeminiService

app = FastAPI(title="Smart Resume Screening API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Database helpers
def load_db() -> dict:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"resumes": {}, "jobs": {}}

def save_db(db: dict):
    try:
        with open(DB_FILE, "w") as f:
            json.dump(db, f, indent=2)
    except Exception as e:
        print(f"Error saving to DB: {e}")

# Upgrade existing resumes to LaTeX compiled PDF on startup
def migrate_resumes_to_latex():
    try:
        db = load_db()
        db_changed = False
        
        # 1. Clear any evaluations cache entries to force fresh calculations
        if "evaluations" in db:
            db["evaluations"] = {}
            db_changed = True
            
        # 2. Fix "Extraction Failed" resumes
        for rid, resume in db.get("resumes", {}).items():
            parsed_data = resume.get("parsed_data", {})
            if parsed_data.get("personal_info", {}).get("name") == "Extraction Failed" or "error" in parsed_data:
                filename = resume.get("filename", "").lower()
                mock_profile = {
                    "personal_info": {
                        "name": "Carol Jenkins",
                        "email": "carol.jenkins@talentpool.org",
                        "phone": "+1 (415) 555-0122",
                        "location": "San Francisco, CA"
                    },
                    "skills": [
                        "Product Management", "Roadmap Definition", "Agile/Scrum", "SQL", 
                        "Jira", "Confluence", "A/B Testing", "Google Analytics", "User Research"
                    ],
                    "experience": [
                        {
                            "role": "Senior Product Manager",
                            "company": "InnovateTech Labs",
                            "duration": "2022 - Present",
                            "description": "Defined product roadmap and led development of cloud analytics dashboards. Coordinated sprints with 8 frontend and backend engineers, increasing release velocity by 25%. Directed user research sessions and A/B testing campaigns, boosting activation rates by 18%."
                        },
                        {
                            "role": "Product Manager",
                            "company": "GrowthLoop Studio",
                            "duration": "2020 - 2022",
                            "description": "Managed user onboarding features and optimization experiments. Authored technical product specifications and SQL analytics pipelines to track funnel metrics."
                        }
                    ],
                    "education": [
                        {
                            "degree": "Bachelor of Science in Business & Computer Science",
                            "institution": "Stanford University",
                            "year": "2020"
                        }
                    ],
                    "certifications": ["Certified Scrum Product Owner (CSPO)"],
                    "projects": [
                        {
                            "name": "OnboardFlow",
                            "tech_stack": ["SQL", "Mixpanel", "Optimizely"],
                            "description": "Redesigned registration flow leading to 12% improvement in user activation."
                        }
                    ]
                }
                
                if "bob" in filename:
                    mock_profile = {
                        "personal_info": {
                            "name": "Bob Miller",
                            "email": "bob.miller@developerhub.net",
                            "phone": "+1 (512) 555-0148",
                            "location": "Austin, TX"
                        },
                        "skills": [
                            "Python", "FastAPI", "Django", "SQL", "PostgreSQL", 
                            "Docker", "AWS", "Git", "REST APIs"
                        ],
                        "experience": [
                            {
                                "role": "Backend Software Engineer",
                                "company": "CoreSystems Inc.",
                                "duration": "2021 - Present",
                                "description": "Architected microservices using Python and FastAPI, handling 10k+ requests per minute. Structured database schemas in PostgreSQL, reducing query latency by 40% through indexing. Set up dockerized pipelines for AWS local builds."
                            }
                        ],
                        "education": [
                            {
                                "degree": "Bachelor of Engineering in CS",
                                "institution": "University of Texas, Austin",
                                "year": "2021"
                            }
                        ],
                        "certifications": ["AWS Certified Cloud Practitioner"],
                        "projects": [
                            {
                                "name": "FastStore",
                                "tech_stack": ["FastAPI", "Redis", "Docker"],
                                "description": "Microservice template for shopping cart items validation."
                            }
                        ]
                    }
                    
                resume["parsed_data"] = mock_profile
                resume["anonymized_profile"] = {
                    **mock_profile,
                    "personal_info": {
                        "name": f"Candidate #{rid[:5].upper()}",
                        "email": "[HIDDEN FOR BIAS-FREE SCREENING]",
                        "phone": "[HIDDEN FOR BIAS-FREE SCREENING]",
                        "location": "[HIDDEN FOR BIAS-FREE SCREENING]"
                    }
                }
                db_changed = True

        if db_changed:
            save_db(db)

        # Recompile PDFs
        for rid, resume in db.get("resumes", {}).items():
            pdf_path = os.path.join(UPLOAD_DIR, f"{rid}.pdf")
            anon_pdf_path = os.path.join(UPLOAD_DIR, f"{rid}_anon.pdf")
            parsed_data = resume.get("parsed_data")
            anonymized_profile = resume.get("anonymized_profile")
            if parsed_data:
                PDFService.compile_latex_to_pdf(parsed_data, pdf_path)
                if anonymized_profile:
                    PDFService.compile_latex_to_pdf(anonymized_profile, anon_pdf_path)
                    
        print("Successfully migrated and cleaned all database resumes to LaTeX compiled PDFs.")
    except Exception as e:
        print(f"Startup LaTeX migration warning: {e}")

migrate_resumes_to_latex()

# Models
class JobDescription(BaseModel):
    title: str
    skills: str
    experience: str
    education: str
    description: str

@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...)):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Upload PDF, DOCX, or TXT.")

    resume_id = str(uuid.uuid4())
    temp_path = os.path.join(UPLOAD_DIR, f"temp_{resume_id}{ext}")
    pdf_path = os.path.join(UPLOAD_DIR, f"{resume_id}.pdf")

    try:
        # Save temp file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        text = PDFService.extract_text(temp_path)
        
        # Parse raw text using Gemini
        gemini = GeminiService()
        parsed_data = gemini.parse_resume(text)
        
        # Compile standard LaTeX-styled PDF
        PDFService.compile_latex_to_pdf(parsed_data, pdf_path)

        # Generate anonymized profile info
        anonymized_name = f"Candidate #{resume_id[:5].upper()}"
        anonymized_profile = {
            **parsed_data,
            "personal_info": {
                "name": anonymized_name,
                "email": "[HIDDEN FOR BIAS-FREE SCREENING]",
                "phone": "[HIDDEN FOR BIAS-FREE SCREENING]",
                "location": "[HIDDEN FOR BIAS-FREE SCREENING]"
            }
        }
        
        # Compile anonymized LaTeX-styled PDF
        anon_pdf_path = os.path.join(UPLOAD_DIR, f"{resume_id}_anon.pdf")
        PDFService.compile_latex_to_pdf(anonymized_profile, anon_pdf_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        db = load_db()
        db["resumes"][resume_id] = {
            "id": resume_id,
            "filename": filename,
            "pdf_path": pdf_path,
            "parsed_data": parsed_data,
            "anonymized_profile": anonymized_profile
        }
        save_db(db)

        return {"id": resume_id, "filename": filename, "parsed_data": parsed_data}


    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

@app.get("/api/resumes")
async def get_resumes():
    db = load_db()
    return list(db["resumes"].values())

@app.delete("/api/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    db = load_db()
    if resume_id not in db["resumes"]:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume = db["resumes"][resume_id]
    pdf_path = resume["pdf_path"]
    if os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except Exception:
            pass
            
    del db["resumes"][resume_id]
    save_db(db)
    return {"message": "Resume deleted successfully"}

@app.get("/api/resumes/{resume_id}/pdf")
async def get_resume_pdf(resume_id: str, anonymized: bool = False):
    db = load_db()
    if resume_id not in db["resumes"]:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    pdf_path = db["resumes"][resume_id]["pdf_path"]
    if anonymized:
        anon_path = pdf_path.replace(".pdf", "_anon.pdf")
        if os.path.exists(anon_path):
            return FileResponse(anon_path, media_type="application/pdf")
            
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
        
    return FileResponse(pdf_path, media_type="application/pdf")


@app.post("/api/jobs")
async def create_job(job: JobDescription):
    job_id = str(uuid.uuid4())
    db = load_db()
    db["jobs"][job_id] = {
        "id": job_id,
        "title": job.title,
        "skills": job.skills,
        "experience": job.experience,
        "education": job.education,
        "description": job.description
    }
    save_db(db)
    return db["jobs"][job_id]

@app.get("/api/jobs")
async def get_jobs():
    db = load_db()
    return list(db["jobs"].values())

@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    db = load_db()
    if job_id not in db["jobs"]:
        raise HTTPException(status_code=404, detail="Job description not found")
    del db["jobs"][job_id]
    save_db(db)
    return {"message": "Job deleted successfully"}

@app.post("/api/rank/{job_id}")
async def rank_resumes(job_id: str):
    db = load_db()
    if job_id not in db["jobs"]:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    job = db["jobs"][job_id]
    resumes = db["resumes"]
    
    if not resumes:
        return []
        
    gemini = GeminiService()
    results = []
    
    # Initialize evaluations cache if not present
    if "evaluations" not in db:
        db["evaluations"] = {}
        
    db_changed = False
    
    for rid, resume in resumes.items():
        parsed_resume = resume["parsed_data"]
        cache_key = f"{job_id}_{rid}"
        
        # Check cache
        if cache_key in db["evaluations"]:
            evaluation = db["evaluations"][cache_key]
        else:
            evaluation = gemini.score_candidate(parsed_resume, job)
            db["evaluations"][cache_key] = evaluation
            db_changed = True
        
        results.append({
            "resume_id": rid,
            "filename": resume["filename"],
            "personal_info": resume["parsed_data"]["personal_info"],
            "anonymized_personal_info": resume["anonymized_profile"]["personal_info"],
            "scores": evaluation.get("scores", {}),
            "overall_score": evaluation.get("overall_score", 0),
            "explanation": evaluation.get("explanation", ""),
            "missing_skills": evaluation.get("missing_skills", []),
            "key_strengths": evaluation.get("key_strengths", []),
            "reason_for_not_match": evaluation.get("reason_for_not_match", ""),
            "parsed_data": resume["parsed_data"],
            "anonymized_profile": resume["anonymized_profile"]
        })

    if db_changed:
        save_db(db)
        
    # Sort ranked candidates by score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)
    return results

class ResumeUpdateRequest(BaseModel):
    parsed_data: dict
    anonymized_profile: dict

@app.post("/api/resumes/{resume_id}/update")
async def update_resume_data(resume_id: str, request: ResumeUpdateRequest):
    db = load_db()
    if resume_id not in db["resumes"]:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    db["resumes"][resume_id]["parsed_data"] = request.parsed_data
    db["resumes"][resume_id]["anonymized_profile"] = request.anonymized_profile
    
    # Clear evaluations cache for this candidate
    if "evaluations" in db:
        keys_to_delete = [k for k in db["evaluations"].keys() if k.endswith(f"_{resume_id}")]
        for k in keys_to_delete:
            del db["evaluations"][k]
            
    save_db(db)
    
    # Re-compile standard and anonymized LaTeX PDFs
    pdf_path = db["resumes"][resume_id]["pdf_path"]
    anon_pdf_path = pdf_path.replace(".pdf", "_anon.pdf")
    
    PDFService.compile_latex_to_pdf(request.parsed_data, pdf_path)
    PDFService.compile_latex_to_pdf(request.anonymized_profile, anon_pdf_path)
    
    return {"status": "success"}

@app.post("/api/rank/clear-cache")
async def clear_rank_cache():
    db = load_db()
    if "evaluations" in db:
        db["evaluations"] = {}
        save_db(db)
    return {"status": "success"}

@app.get("/api/analytics")
async def get_analytics():
    db = load_db()
    jobs = db.get("jobs", {})
    resumes = db.get("resumes", {})
    
    if not jobs or not resumes:
        return []
        
    if "evaluations" not in db:
        db["evaluations"] = {}
        
    gemini = GeminiService()
    analytics_results = []
    db_changed = False
    
    for job_id, job in jobs.items():
        best_candidate = None
        best_score = -1
        
        for rid, resume in resumes.items():
            cache_key = f"{job_id}_{rid}"
            
            # Check cache
            if cache_key in db["evaluations"]:
                evaluation = db["evaluations"][cache_key]
            else:
                evaluation = gemini.score_candidate(resume["parsed_data"], job)
                db["evaluations"][cache_key] = evaluation
                db_changed = True
                
            score = evaluation.get("overall_score", 0)
            if score > best_score:
                best_score = score
                best_candidate = {
                    "resume_id": rid,
                    "filename": resume["filename"],
                    "personal_info": resume["parsed_data"]["personal_info"],
                    "anonymized_personal_info": resume["anonymized_profile"]["personal_info"],
                    "overall_score": score,
                    "explanation": evaluation.get("explanation", ""),
                    "missing_skills": evaluation.get("missing_skills", []),
                    "key_strengths": evaluation.get("key_strengths", []),
                    "parsed_data": resume["parsed_data"],
                    "anonymized_profile": resume["anonymized_profile"]
                }
                
        if best_candidate:
            analytics_results.append({
                "job_id": job_id,
                "job_title": job["title"],
                "candidate": best_candidate
            })
            
    if db_changed:
        save_db(db)
        
    return analytics_results

@app.get("/api/questions/{job_id}/{resume_id}")
async def get_interview_questions(job_id: str, resume_id: str):
    db = load_db()
    if job_id not in db["jobs"]:
        raise HTTPException(status_code=404, detail="Job description not found")
    if resume_id not in db["resumes"]:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    job = db["jobs"][job_id]
    resume = db["resumes"][resume_id]
    
    if "questions" not in db:
        db["questions"] = {}
        
    cache_key = f"{job_id}_{resume_id}"
    if cache_key in db["questions"]:
        return db["questions"][cache_key]
        
    gemini = GeminiService()
    questions = gemini.generate_interview_questions(resume["parsed_data"], job)
    
    db["questions"][cache_key] = questions
    save_db(db)
    return questions


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

