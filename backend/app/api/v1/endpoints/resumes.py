from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.api.dependencies import get_current_user, get_supabase_client
from app.models.user import User
import pdfplumber
import io
import re

router = APIRouter()

@router.post("/parse")
async def parse_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Parses a PDF resume to extract skills using NLP/Regex matching against the SkillBridge taxonomy.
    """
    if current_user.role != "seeker":
        raise HTTPException(status_code=403, detail="Only candidates can parse resumes")
        
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read file upload")
        
    # Extract text using pdfplumber
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in the PDF")
        
    # Fetch all skills from the taxonomy
    all_skills_res = supabase.table("skills").select("id, name, category").execute()
    if not all_skills_res.data:
        return {"extracted_skills": []}
        
    extracted_skills = []
    text_lower = text.lower()
    
    for skill in all_skills_res.data:
        skill_name = skill["name"].lower()
        # Ensure we match whole words to prevent partial matching (e.g. 'c' matching inside 'react')
        # We escape the skill name but handle special characters carefully.
        # Simple \b boundary might fail if skill_name has special chars like .js or C++
        
        # Safe regex construction for technology names
        escaped_skill = re.escape(skill_name)
        
        # Word boundary \b works well for letters/numbers, but for C++ or .NET we need special handling
        if re.search(r'(?:\b|\s|^)' + escaped_skill + r'(?:\b|\s|$)', text_lower):
            extracted_skills.append({
                "id": skill["id"],
                "name": skill["name"],
                "category": skill["category"]
            })
            
    return {
        "message": "Resume parsed successfully",
        "extracted_skills": extracted_skills
    }
