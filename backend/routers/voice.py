"""Voice endpoints — /voice-input, /text-output, and /menu."""

import os
import uuid
import traceback
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select

from database.engine import async_session
from database.models import MenuItem
from services import stt, tts, llm
from session import session_manager
from schemas import VoiceInputResponse, TextOutputResponse

router = APIRouter(tags=["voice"])

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.post("/voice-input", response_model=VoiceInputResponse)
async def voice_input(
    audio: UploadFile = File(..., description="Audio file from the frontend"),
    session_id: str = Form(default=""),
    role: str = Form(default="customer"),
):
    """
    Receive an audio file, run the full inner pipeline:
    STT → LLM (with tool-calling) → TTS → store result.
    """
    try:
        print(f"\n{'='*60}")
        print(f"[PIPELINE] New request — role={role}, session_id={session_id or '(new)'}")
        print(f"[PIPELINE] Audio file: {audio.filename}, content_type={audio.content_type}")

        # --- 1. Session setup ---
        session = session_manager.get_or_create(session_id or None, role)
        sid = session.session_id
        print(f"[PIPELINE] Session ID: {sid}")

        # --- 2. Read audio bytes ---
        audio_bytes = await audio.read()
        print(f"[PIPELINE] Audio size: {len(audio_bytes)} bytes")
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file.")

        # --- 3. Speech-to-Text ---
        transcript = await stt.transcribe(audio_bytes, filename=audio.filename or "audio.webm")

        if not transcript.strip():
            print("[PIPELINE] ⚠ Empty transcript — no speech detected")
            session_manager.set_result(sid, {
                "transcript": "",
                "response_text": "I couldn't hear anything. Could you try again?",
                "audio_url": None,
            })
            return VoiceInputResponse(status="processing_complete", session_id=sid)

        print(f"[PIPELINE] 🗣️ Transcript: \"{transcript}\"")

        # --- 4. Add user message to history ---
        session_manager.add_message(sid, "user", transcript)

        # --- 5. LLM orchestration ---
        async with async_session() as db:
            response_text, actions, placed_order = await llm.orchestrate(
                transcript=transcript,
                role=role,
                history=session_manager.get_history(sid)[:-1],
                db=db,
            )

        print(f"[PIPELINE] 🤖 Response: \"{response_text[:150]}...\"")
        if actions:
            print(f"[PIPELINE] 🔧 Actions: {actions}")        # --- 6. Add assistant response to history ---
        session_manager.add_message(sid, "assistant", response_text)

        # --- 7. Text-to-Speech ---
        audio_url = None
        try:
            tts_audio = await tts.synthesize(response_text)
            audio_filename = f"{sid}_{uuid.uuid4().hex[:8]}.mp3"
            audio_path = os.path.join(AUDIO_DIR, audio_filename)
            with open(audio_path, "wb") as f:
                f.write(tts_audio)
            audio_url = f"/static/audio/{audio_filename}"
            print(f"[PIPELINE] 🔊 Audio saved: {audio_url}")
        except Exception as e:
            print(f"[PIPELINE] ⚠ TTS failed (non-fatal): {e}")

        # --- 8. Store result ---
        session_result = {
            "transcript": transcript,
            "response_text": response_text,
            "audio_url": audio_url,
        }
        if placed_order and "order_id" in placed_order:
            session_result["order_id"] = placed_order["order_id"]
            session_result["order_total"] = placed_order.get("total_amount")
            session_result["order_items"] = placed_order.get("items_ordered", [])
        session_manager.set_result(sid, session_result)

        print(f"[PIPELINE] ✅ Done!")
        print(f"{'='*60}\n")
        return VoiceInputResponse(status="processing_complete", session_id=sid)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[PIPELINE] ❌ UNHANDLED ERROR: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Pipeline error: {str(e)}"},
        )


@router.get("/text-output", response_model=TextOutputResponse)
async def text_output(
    session_id: str = Query(..., description="Session ID to fetch results for"),
):
    """
    Retrieve the latest result (transcript + LLM response + audio URL)
    for a given session.
    """
    result = session_manager.get_result(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="No result found for this session.")

    return TextOutputResponse(
        session_id=session_id,
        transcript=result.get("transcript", ""),
        response_text=result.get("response_text", ""),
        audio_url=result.get("audio_url"),
        order_id=result.get("order_id"),
        order_total=result.get("order_total"),
        order_items=result.get("order_items"),
    )


@router.get("/menu", tags=["menu"])
async def get_menu():
    """Return all available menu items grouped by category."""
    async with async_session() as db:
        result = await db.execute(
            select(MenuItem).where(MenuItem.is_available == True).order_by(MenuItem.category, MenuItem.name)
        )
        items = result.scalars().all()

    grouped: dict[str, list] = {}
    for item in items:
        grouped.setdefault(item.category, []).append(item.to_dict())

    return {"categories": grouped}
