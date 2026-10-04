import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""
    jwt_secret: str = ""
    cors_origins: str = "http://localhost:5500,http://127.0.0.1:5500,https://curiousparc-trinity-coders.onrender.com"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
