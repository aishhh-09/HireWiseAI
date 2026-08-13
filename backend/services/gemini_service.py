import os
import json
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        # Configure the Gemini API client using env variables
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set.")
        genai.configure(api_key=api_key)
        # Using gemini-2.5-flash for fast and high-quality outputs
        self.model_name = "gemini-2.5-flash"

    def parse_resume(self, resume_text: str) -> dict:
        """Parses raw resume text into structured sections (Skills, Experience, etc.)."""
        try:
            model = genai.GenerativeModel(self.model_name)
            prompt = f"""
You are an expert HR AI assistant. Analyze the following resume text and parse it into a structured JSON object.

Extract and structure the following details:
1. personal_info: Name, email, phone, location. If not found or not mentioned, keep the fields empty.
2. skills: List of technical and soft skills.
3. experience: List of jobs, including job role/title, company, duration, and a brief description of duties/achievements.
4. education: List of degrees, including degree name, institution, and graduation year.
5. certifications: List of certifications/licenses.
6. projects: List of projects, including name, technologies/tech_stack, and description.

Return ONLY a JSON object matching this schema:
{{
  "personal_info": {{
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  }},
  "skills": ["string"],
  "experience": [
    {{
      "role": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }}
  ],
  "education": [
    {{
      "degree": "string",
      "institution": "string",
      "year": "string"
    }}
  ],
  "certifications": ["string"],
  "projects": [
    {{
      "name": "string",
      "tech_stack": ["string"],
      "description": "string"
    }}
  ]
}}

Resume text:
{resume_text}
"""
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            # Fallback in case of API errors
            return {
                "personal_info": {"name": "Extraction Failed", "email": "", "phone": "", "location": ""},
                "skills": [],
                "experience": [],
                "education": [],
                "certifications": [],
                "projects": [],
                "error": str(e)
            }

    def score_candidate(self, parsed_resume: dict, job_description: dict) -> dict:
        """Calculates match scores against a job description, highlighting missing skills & providing explanation."""
        try:
            model = genai.GenerativeModel(self.model_name)
            
            prompt = f"""
You are a senior recruiter. Evaluate the candidate's resume (provided as JSON) against the Job Description.

Job Description details:
- Title: {job_description.get('title')}
- Required Skills: {job_description.get('skills')}
- Required Experience: {job_description.get('experience')}
- Education Preference: {job_description.get('education')}
- Description: {job_description.get('description')}

Candidate Resume JSON:
{json.dumps(parsed_resume, indent=2)}

Please calculate a standardized score out of 100. Be fair, objective, and realistic. Use these weighting guidelines:
- Skills match (35%)
- Experience match (30%)
- Education alignment (15%)
- Certifications match (10%)
- Projects relevance (10%)

Produce a structured JSON response containing:
1. overall_score: Integer (0 to 100).
2. scores: An object with subscores for: "skills", "experience", "education", "certifications", "projects" (each 0 to 100).
3. explanation: A detailed, clear, bias-free, and explainable summary of why the candidate received this score. Highlight strengths and alignment.
4. missing_skills: A list of critical or preferred skills from the Job Description that the candidate seems to lack.
5. key_strengths: A list of 2-4 primary strengths of the candidate.
6. reason_for_not_match: A detailed explanation of why the candidate did not receive a perfect score, outlining specific gaps, mismatches, or deficient areas.

Return ONLY a JSON object matching this schema:
{{
  "overall_score": 0,
  "scores": {{
    "skills": 0,
    "experience": 0,
    "education": 0,
    "certifications": 0,
    "projects": 0
  }},
  "explanation": "string",
  "missing_skills": ["string"],
  "key_strengths": ["string"],
  "reason_for_not_match": "string"
}}
"""
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini evaluation warning, using local fallback: {e}")
            return self._local_fallback_score(parsed_resume, job_description, str(e))

    def _local_fallback_score(self, parsed_resume: dict, job_description: dict, error_msg: str) -> dict:
        """Helper to calculate match scores locally if Gemini API hits quota limits."""
        # 1. Parse JD Skills
        jd_skills_raw = job_description.get("skills", "")
        if not jd_skills_raw:
            jd_skills_raw = job_description.get("description", "")
        
        # Clean required skills
        import re
        required_skills = [s.strip() for s in re.split(r'[,;|]', jd_skills_raw) if s.strip()]
        if not required_skills:
            required_skills = ["Software Development", "Programming"]
            
        candidate_skills = parsed_resume.get("skills", [])
        if not candidate_skills:
            candidate_skills = []
            
        # Overlaps
        matched_skills = []
        for req in required_skills:
            req_lower = req.lower()
            for cand in candidate_skills:
                if req_lower in cand.lower() or cand.lower() in req_lower:
                    matched_skills.append(req)
                    break
        
        matched_skills = list(set(matched_skills))
        missing_skills = [s for s in required_skills if s not in matched_skills]
        
        # Scores
        skills_score = int((len(matched_skills) / len(required_skills)) * 100) if required_skills else 80
        skills_score = min(max(skills_score, 20), 100)
        
        experience_list = parsed_resume.get("experience", [])
        if experience_list:
            experience_score = min(40 + len(experience_list) * 20, 100)
        else:
            experience_score = 30
            
        education_list = parsed_resume.get("education", [])
        education_score = 80
        if education_list:
            for edu in education_list:
                deg = edu.get("degree", "").lower()
                if "computer" in deg or "science" in deg or "engineering" in deg or "tech" in deg:
                    education_score = 95
                    break
        
        certs = parsed_resume.get("certifications", [])
        cert_score = min(40 + len(certs) * 30, 100)
        
        projects = parsed_resume.get("projects", [])
        projects_score = min(50 + len(projects) * 15, 100)
        
        overall_score = int(
            skills_score * 0.35 +
            experience_score * 0.30 +
            education_score * 0.15 +
            cert_score * 0.10 +
            projects_score * 0.10
        )
        
        personal_info = parsed_resume.get("personal_info", {})
        cand_name = personal_info.get("name") or "The candidate"
        job_title = job_description.get("title") or "target role"
        top_skills = ", ".join(candidate_skills[:3]) if candidate_skills else "general development"
        
        explanation = (
            f"Candidate evaluation (Local Fallback Analysis - Gemini API Rate Limited). "
            f"{cand_name} presents a solid {overall_score}% profile alignment for the {job_title} position. "
            f"Key strengths include demonstrated background in {top_skills} and a structured professional timeline. "
        )
        if matched_skills:
            explanation += f"Core requirements matched: {', '.join(matched_skills[:4])}. "
        if missing_skills:
            explanation += f"Areas for further technical review include missing skills: {', '.join(missing_skills[:3])}."
            
        reason_for_not_match = "N/A"
        if missing_skills:
            reason_for_not_match = f"Candidate lacks documented experience in some core requirements: {', '.join(missing_skills[:3])}."
        else:
            reason_for_not_match = "Minor profile alignment checks."
            
        key_strengths = []
        if candidate_skills:
            key_strengths.append(f"Technical background in {candidate_skills[0]}")
        else:
            key_strengths.append("Structured professional profile")
            
        if experience_list:
            key_strengths.append(f"Proven work history in {len(experience_list)} organizations")
        if projects:
            key_strengths.append(f"Hands-on projects experience")
            
        key_strengths = key_strengths[:3]
        
        return {
            "overall_score": overall_score,
            "scores": {
                "skills": skills_score,
                "experience": experience_score,
                "education": education_score,
                "certifications": cert_score,
                "projects": projects_score
            },
            "explanation": explanation,
            "missing_skills": missing_skills[:4],
            "key_strengths": key_strengths,
            "reason_for_not_match": reason_for_not_match
        }

    def generate_interview_questions(self, parsed_resume: dict, job_description: dict) -> list:
        """Generates candidate-specific interview questions using Gemini (with high-quality local fallback)."""
        try:
            import google.generativeai as genai
            import json
            
            # Use configured gemini api key from environment
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
You are an expert technical recruiter. Based on the candidate's parsed resume and the job description below, generate exactly 5 custom, high-fidelity interview questions.
For each question, specify the category (Technical, Behavioral, or Fitment) and provide the expected answer/evaluation criteria for the interviewer.

Job Description:
Title: {job_description.get("title")}
Required Skills: {job_description.get("skills")}
Required Experience: {job_description.get("experience")}
Description: {job_description.get("description")}

Candidate Resume:
Skills: {parsed_resume.get("skills")}
Experience: {parsed_resume.get("experience")}
Projects: {parsed_resume.get("projects")}

Output your response as a valid JSON array of objects, where each object has:
- "question": "The interview question text"
- "category": "Technical" | "Behavioral" | "Fitment"
- "expected_answer": "Detailed criteria and guidelines for what the interviewer should look for in the candidate's response"

Do NOT include any markdown code blocks (like ```json) or formatting. Output only raw JSON.
"""
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini question generation warning, using local fallback: {e}")
            return self._local_fallback_questions(parsed_resume, job_description)

    def _local_fallback_questions(self, parsed_resume: dict, job_description: dict) -> list:
        """Fallback interview questions generator if Gemini API rate limits are hit."""
        skills = parsed_resume.get("skills", [])
        experience = parsed_resume.get("experience", [])
        projects = parsed_resume.get("projects", [])
        
        top_skill_1 = skills[0] if len(skills) > 0 else "their core skill"
        
        last_role = experience[0].get("role", "Software Engineer") if len(experience) > 0 else "their last position"
        last_company = experience[0].get("company", "their previous employer") if len(experience) > 0 else "their last company"
        
        project_name = projects[0].get("name", "their key project") if len(projects) > 0 else "a featured project"
        
        return [
            {
                "question": f"Based on your resume, you have experience with {top_skill_1}. Can you explain a complex problem you solved using this technology?",
                "category": "Technical",
                "expected_answer": f"Candidate should demonstrate deep hands-on expertise in {top_skill_1}, detailing architectural decisions, challenges, and measurable results."
            },
            {
                "question": f"Your resume highlights your work as a {last_role} at {last_company}. How did you collaborate with cross-functional partners to deliver on core features?",
                "category": "Behavioral",
                "expected_answer": f"Candidate should show alignment with Agile frameworks, strong stakeholder communication, and active leadership within product engineering squads."
            },
            {
                "question": f"For your project '{project_name}', how did you determine the tech stack and what were the performance tradeoffs you had to balance?",
                "category": "Technical",
                "expected_answer": "Look for system design clarity, resource optimizations, and understanding of scalability constraints in modern architectures."
            },
            {
                "question": f"Our role for {job_description.get('title', 'this position')} requires proficiency in {job_description.get('skills', 'core technologies')}. How would you quickly adapt to any tools in our stack you haven't worked with yet?",
                "category": "Fitment",
                "expected_answer": "Candidate should exhibit high learnability, proactive research habits, and reference past instances of mastering new tools under tight timelines."
            },
            {
                "question": f"Can you walk us through a time when a feature release failed or had critical bugs? How did you debug the issue and communicate it to stakeholders?",
                "category": "Behavioral",
                "expected_answer": "Evaluates resilience, transparency, debugging capabilities, and adherence to clean dev-ops and rollback protocols."
            }
        ]



