from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from supabase import Client
from app.core.database import get_supabase_client
from app.models.user import ProfileCreate

router = APIRouter()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(ProfileCreate):
    password: str

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, supabase: Client = Depends(get_supabase_client)):
    try:
        # 1. Register with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="User registration failed")
            
        user_id = auth_response.user.id
        
        # 2. Create the user profile
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role,
            "bio": user_data.bio,
            "headline": user_data.headline,
            "location": user_data.location,
            "resume_url": user_data.resume_url
        }
        
        profile_response = supabase.table("profiles").insert(profile_data).execute()
        
        return {
            "message": "User registered successfully",
            "user_id": user_id,
            "session": auth_response.session
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(credentials: UserLogin, supabase: Client = Depends(get_supabase_client)):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        return {
            "message": "Login successful",
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "user": auth_response.user
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@router.get("/google")
def login_google(redirect_url: str = None):
    try:
        import urllib.parse
        from app.core.database import settings
        
        # Default to frontend production URL if no redirect_url is provided
        frontend_url = redirect_url or "https://curiousparc-trinity-coders.onrender.com/auth-callback.html"
        
        # Manually construct the URL for Implicit Flow. 
        # We avoid supabase-py here because it forces PKCE, which requires a stateful client 
        # and returns a ?code= instead of #access_token=, breaking our stateless frontend architecture.
        encoded_redirect = urllib.parse.quote(frontend_url)
        oauth_url = f"{settings.supabase_url}/auth/v1/authorize?provider=google&redirect_to={encoded_redirect}"
        
        return {"url": oauth_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth failed: {str(e)}")
