"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Groq ---
    GROQ_API_KEY: str = ""
    GROQ_STT_MODEL: str = "whisper-large-v3-turbo"
    GROQ_LLM_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    # --- ElevenLabs ---
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "JBFqnCBsd6RMkjVDRZzb"
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./echo_order.db"

    # --- App ---
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "https://echo-order-backend.onrender.com"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
