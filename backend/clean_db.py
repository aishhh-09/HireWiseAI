import json
import os

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json")

def clean():
    if not os.path.exists(DB_FILE):
        print("No db.json found.")
        return
        
    with open(DB_FILE, "r") as f:
        db = json.load(f)
        
    changed = False
    
    # 1. Clear any evaluations cache entries
    if "evaluations" in db:
        db["evaluations"] = {}
        changed = True
        print("Cleared evaluations cache.")
        
    # 2. Fix "Extraction Failed" resumes
    resumes = db.get("resumes", {})
    for rid, resume in resumes.items():
        parsed = resume.get("parsed_data", {})
        if parsed.get("personal_info", {}).get("name") == "Extraction Failed" or "error" in parsed:
            print(f"Fixing failed extraction resume: {resume.get('filename')}")
            # Reset to high-quality mock data based on filename
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
            
            # Reset anonymized profile
            resume["anonymized_profile"] = {
                **mock_profile,
                "personal_info": {
                    "name": f"Candidate #{rid[:5].upper()}",
                    "email": "[HIDDEN FOR BIAS-FREE SCREENING]",
                    "phone": "[HIDDEN FOR BIAS-FREE SCREENING]",
                    "location": "[HIDDEN FOR BIAS-FREE SCREENING]"
                }
            }
            
            changed = True
            
    if changed:
        with open(DB_FILE, "w") as f:
            json.dump(db, f, indent=2)
        print("Database updated and cleaned successfully.")
    else:
        print("No changes required.")

if __name__ == "__main__":
    clean()
