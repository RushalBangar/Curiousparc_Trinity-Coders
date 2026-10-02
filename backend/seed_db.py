import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import random

# Load env manually
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_KEY in backend/.env")
    sys.exit(1)

supabase: Client = create_client(url, key)

print("Seeding Skills...")
skills_data = [
    {"name": "Python", "category": "Languages"},
    {"name": "JavaScript", "category": "Languages"},
    {"name": "TypeScript", "category": "Languages"},
    {"name": "Go", "category": "Languages"},
    {"name": "Java", "category": "Languages"},
    {"name": "React", "category": "Frameworks"},
    {"name": "Vue.js", "category": "Frameworks"},
    {"name": "FastAPI", "category": "Frameworks"},
    {"name": "Node.js", "category": "Frameworks"},
    {"name": "Django", "category": "Frameworks"},
    {"name": "PostgreSQL", "category": "Databases"},
    {"name": "MongoDB", "category": "Databases"},
    {"name": "Redis", "category": "Databases"},
    {"name": "Docker", "category": "DevOps"},
    {"name": "Kubernetes", "category": "DevOps"},
    {"name": "AWS", "category": "DevOps"},
    {"name": "CI/CD", "category": "DevOps"}
]

# Insert skills (upsert based on name might need a constraint, but we can just insert and ignore conflicts if we had one. 
# Since we don't, we'll fetch existing first to avoid unique constraint errors)
existing_skills = supabase.table("skills").select("name").execute()
existing_names = [s["name"] for s in existing_skills.data]

skills_to_insert = [s for s in skills_data if s["name"] not in existing_names]
if skills_to_insert:
    supabase.table("skills").insert(skills_to_insert).execute()
    print(f"Inserted {len(skills_to_insert)} new skills.")
else:
    print("Skills already populated.")

# Fetch all skills to get their IDs
all_skills = supabase.table("skills").select("*").execute().data

# Fetch existing profiles to assign jobs
profiles = supabase.table("profiles").select("id, full_name").execute().data
if not profiles:
    print("No profiles found. You need to log in at least once so a profile exists to assign jobs to!")
    sys.exit(1)

recruiter_id = profiles[0]["id"]
print(f"Using profile '{profiles[0]['full_name']}' as the recruiter for sample jobs.")

print("Seeding Jobs...")
jobs_data = [
    {
        "recruiter_id": recruiter_id,
        "title": "Senior Full Stack Engineer",
        "company_name": "TechFlow Innovations",
        "description": "We are looking for a Senior Full Stack Engineer to lead our core product development. You will architect scalable backend services and build highly responsive frontend applications.",
        "location": "Remote - US",
        "employment_type": "full-time",
        "is_active": True
    },
    {
        "recruiter_id": recruiter_id,
        "title": "Backend Python Developer",
        "company_name": "DataSphere AI",
        "description": "Join our AI team to build high-performance data pipelines and APIs using Python and FastAPI.",
        "location": "New York, NY (Hybrid)",
        "employment_type": "full-time",
        "is_active": True
    },
    {
        "recruiter_id": recruiter_id,
        "title": "Frontend React Specialist",
        "company_name": "Creative Pixel Agency",
        "description": "We need a frontend wizard who breathes React and CSS to create pixel-perfect, accessible web interfaces.",
        "location": "San Francisco, CA",
        "employment_type": "contract",
        "is_active": True
    },
    {
        "recruiter_id": recruiter_id,
        "title": "DevOps Cloud Engineer",
        "company_name": "CloudScale Systems",
        "description": "Help us scale our infrastructure to millions of users. You'll be managing Kubernetes clusters and CI/CD pipelines on AWS.",
        "location": "Remote - Global",
        "employment_type": "full-time",
        "is_active": True
    }
]

# Check existing jobs
existing_jobs_res = supabase.table("jobs").select("title").execute()
existing_job_titles = {j["title"] for j in existing_jobs_res.data}

jobs_to_insert = [j for j in jobs_data if j["title"] not in existing_job_titles]

if jobs_to_insert:
    jobs_res = supabase.table("jobs").insert(jobs_to_insert).execute()
    inserted_jobs = jobs_res.data
    print(f"Inserted {len(inserted_jobs)} jobs.")
else:
    inserted_jobs = []
    print("Jobs already populated.")

# Assign skills to jobs
print("Assigning skills to jobs...")
job_skills_data = []

# Map skill names to IDs
skill_map = {s["name"]: s["id"] for s in all_skills}

job_requirements = {
    "Senior Full Stack Engineer": ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
    "Backend Python Developer": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    "Frontend React Specialist": ["JavaScript", "TypeScript", "React", "Vue.js"],
    "DevOps Cloud Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Python"]
}

for job in inserted_jobs:
    req_skills = job_requirements.get(job["title"], [])
    for skill_name in req_skills:
        if skill_name in skill_map:
            job_skills_data.append({
                "job_id": job["id"],
                "skill_id": skill_map[skill_name],
                "is_required": random.choice([True, True, False]), # 66% mandatory
                "weight": round(random.uniform(1.0, 1.8), 2)
            })

if job_skills_data:
    supabase.table("job_skills").insert(job_skills_data).execute()
    print(f"Assigned {len(job_skills_data)} skills to the new jobs.")

print("Database seeding complete!")
