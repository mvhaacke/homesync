from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str  # used server-side (bypasses RLS when needed)


settings = Settings()  # type: ignore[call-arg]
