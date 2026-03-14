"""Text-to-Speech service using ElevenLabs."""

import asyncio
from elevenlabs.client import ElevenLabs
from config import settings


_client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)


def _synthesize_sync(text: str) -> bytes:
    """Blocking call — runs in thread pool."""
    audio_iterator = _client.text_to_speech.convert(
        text=text,
        voice_id=settings.ELEVENLABS_VOICE_ID,
        model_id=settings.ELEVENLABS_MODEL_ID,
        output_format="mp3_44100_128",
    )

    # The SDK returns a generator; collect all chunks into bytes
    audio_bytes = b""
    for chunk in audio_iterator:
        audio_bytes += chunk
    return audio_bytes


async def synthesize(text: str) -> bytes:
    """
    Convert text to speech audio via ElevenLabs.
    Runs the sync SDK call in a thread pool.
    """
    print(f"[TTS] Synthesizing {len(text)} chars...")
    loop = asyncio.get_event_loop()
    audio_bytes = await loop.run_in_executor(None, _synthesize_sync, text)
    print(f"[TTS] Generated {len(audio_bytes)} bytes of audio")
    return audio_bytes
