import os
from supabase import create_client, Client
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "")

    class Config:
        env_file = ".env"

settings = Settings()

def get_supabase_client() -> Client:
    """
    Returns a Supabase client configured with the anon key.
    Used for standard user interactions where RLS policies apply.
    """
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("Supabase URL and Key must be set in the environment variables.")
    return create_client(settings.supabase_url, settings.supabase_key)

def get_supabase_admin_client() -> Client:
    """
    Returns a Supabase client configured with the service role key.
    Used for admin operations that bypass RLS (use with caution).
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ValueError("Supabase URL and Service Role Key must be set in the environment variables.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
