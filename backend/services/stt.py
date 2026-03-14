"""Speech-to-Text service using Groq Whisper."""

import io
import asyncio
from groq import Groq
from config import settings


_client = Groq(api_key=settings.GROQ_API_KEY)


def _transcribe_sync(audio_bytes: bytes, filename: str) -> str:
    """Blocking call — runs in thread pool."""
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename  # Groq SDK reads .name for format detection

    transcription = _client.audio.transcriptions.create(
        model=settings.GROQ_STT_MODEL,
        file=audio_file,
        language="en",
    )
    return transcription.text


async def transcribe(audio_bytes: bytes, filename: str = "audio.mp3") -> str:
    """
    Transcribe audio bytes to text using Groq Whisper.
    Runs the sync SDK call in a thread pool to avoid blocking the event loop.
    """
    print(f"[STT] Transcribing {len(audio_bytes)} bytes ({filename})...")
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(None, _transcribe_sync, audio_bytes, filename)
    print(f"[STT] Result: \"{text}\"")
    return text
