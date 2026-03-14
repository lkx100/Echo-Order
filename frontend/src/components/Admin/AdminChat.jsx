import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import '../Chat/Chat.css';
import './AdminChat.css';

const API_BASE = 'http://localhost:8000';

const AdminChat = () => {
  const [sessionId, setSessionId] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const messagesEndRef = useRef(null);
  const groqClient = useRef(new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [results, loading]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        audioChunks.current = [];
        await sendAudio(blob);
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch {
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setLoading(true);
    }
  };

  const playGroqAudio = async (text) => {
    try {
      const response = await groqClient.current.audio.speech.create({
        model: 'canopylabs/orpheus-v1-english',
        voice: 'hannah',
        input: text,
        response_format: 'wav',
      });
      const buf = await response.arrayBuffer();
      const blob = new Blob([buf], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      new Audio(url).play();
      return url;
    } catch {
      return null;
    }
  };

  const sendAudio = async (blob) => {
    const fd = new FormData();
    fd.append('audio', blob, 'recording.webm');
    fd.append('role', 'admin'); // locked to admin
    if (sessionId) fd.append('session_id', sessionId);

    try {
      const res = await fetch(`${API_BASE}/voice-input`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      const sid = data.session_id;
      if (sid && !sessionId) setSessionId(sid);

      const outRes = await fetch(`${API_BASE}/text-output?session_id=${sid}`);
      const textData = await outRes.json();
      if (!outRes.ok) throw new Error(JSON.stringify(textData));

      const groqUrl = await playGroqAudio(textData.response_text);
      if (groqUrl) textData.audio_url = groqUrl;

      setResults((prev) => [...prev, textData]);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-chat-wrap">
      <div className="admin-chat-container">

        {/* Header */}
        <div className="admin-chat-header">
          <div className="admin-chat-header__info">
            <div className="admin-chat-header__title">Echo.<span>Order</span></div>
            <div className="admin-chat-header__session">
              Session: <em>{sessionId || 'new'}</em>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="admin-chat-badge">🔐 Admin Mode</span>
            <button
              className="reset-btn"
              onClick={() => { setSessionId(''); setResults([]); }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1 }}>
          {results.length === 0 && !loading && (
            <div className="chat-empty">
              <div className="chat-empty__icon">🎙️</div>
              <div className="chat-empty__title">Admin voice interface</div>
              <div className="chat-empty__sub">Use the mic to manage orders, update status, and query restaurant data.</div>
            </div>
          )}

          {results.map((r, i) => (
            <div key={i} className="chat-turn">
              <div className="msg-user">
                <div className="bubble">
                  <div className="bubble__label">You</div>
                  <div className="bubble__text">{r.transcript}</div>
                </div>
                <div className="msg-avatar">👤</div>
              </div>
              <div className="msg-echo">
                <div className="msg-avatar">🤖</div>
                <div className="bubble">
                  <div className="bubble__label">Echo</div>
                  <div className="bubble__text">{r.response_text}</div>
                  {r.audio_url && (
                    <div className="bubble__audio">
                      <audio controls src={r.audio_url.startsWith('blob:') ? r.audio_url : `${API_BASE}${r.audio_url}`} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-echo">
              <div className="msg-avatar">🤖</div>
              <div className="bubble">
                <div className="bubble__label">Echo</div>
                <div className="bubble__text" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Thinking…</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action bar */}
        <div className="chat-action-bar">
          <div className="mic-btn-wrap">
            {recording && <div className="mic-ring" />}
            {recording && <div className="mic-ring" />}
            <button
              className={`mic-btn ${recording ? 'mic-btn--recording' : 'mic-btn--idle'}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
            >
              {recording ? '⏹️' : '🎤'}
            </button>
          </div>
          <div className={`mic-status ${recording ? 'mic-status--recording' : loading ? 'mic-status--loading' : ''}`}>
            {recording && 'Recording — tap to stop'}
            {loading && <><span className="dot-spin" /> Processing…</>}
            {!recording && !loading && 'Tap to speak'}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminChat;
