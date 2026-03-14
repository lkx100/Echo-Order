"""In-memory session manager for multi-turn conversations."""

from __future__ import annotations
import uuid
from dataclasses import dataclass, field


@dataclass
class Session:
    session_id: str
    role: str = "customer"
    history: list[dict] = field(default_factory=list)
    last_result: dict = field(default_factory=dict)


class SessionManager:
    """Stores conversation sessions keyed by session_id."""

    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}

    def get_or_create(self, session_id: str | None, role: str = "customer") -> Session:
        if not session_id:
            session_id = uuid.uuid4().hex[:12]
        if session_id not in self._sessions:
            self._sessions[session_id] = Session(session_id=session_id, role=role)
        return self._sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str) -> None:
        session = self._sessions.get(session_id)
        if session:
            session.history.append({"role": role, "content": content})

    def set_result(self, session_id: str, result: dict) -> None:
        session = self._sessions.get(session_id)
        if session:
            session.last_result = result

    def get_result(self, session_id: str) -> dict:
        session = self._sessions.get(session_id)
        if session:
            return session.last_result
        return {}

    def get_history(self, session_id: str) -> list[dict]:
        session = self._sessions.get(session_id)
        if session:
            return session.history
        return []


# Singleton instance used across the app
session_manager = SessionManager()
