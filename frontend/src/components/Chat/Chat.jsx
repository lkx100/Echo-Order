import { useState, useRef } from 'react';
import Groq from 'groq-sdk';

const API_BASE = 'http://localhost:8000';

const Chat = () => {
    const [role, setRole] = useState('customer');
    const [sessionId, setSessionId] = useState('');
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    // Note: dangerouslyAllowBrowser is required when using the Groq SDK on the frontend
    const groqClient = useRef(new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
    }));

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                audioChunks.current = []; // reset
                await sendAudio(audioBlob);
            };

            mediaRecorder.current.start();
            setRecording(true);
            console.log('🎤 [APP] Recording started');
        } catch (error) {
            console.error('Error accessing microphone', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
            setRecording(false);
            setLoading(true);
            console.log('⏹️ [APP] Recording stopped, processing...');
        }
    };

    const playGroqAudio = async (text) => {
        try {
            console.log('🔊 [APP] Generating Groq Orpheus Audio...');
            const response = await groqClient.current.audio.speech.create({
                model: "canopylabs/orpheus-v1-english",
                voice: "hannah",
                input: text,
                response_format: "wav"
            });

            // Convert the fetch Response arrayBuffer into a Blob
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            audio.play();
            return url;
        } catch (error) {
            console.error('❌ [APP] Groq TTS Error:', error);
            return null;
        }
    };

    const sendAudio = async (blob) => {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('role', role);
        if (sessionId) formData.append('session_id', sessionId);

        try {
            console.log('📤 [APP] Sending Voice Input to Server...');
            const res = await fetch(`${API_BASE}/voice-input`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(`Server Error: ${JSON.stringify(data)}`);
            }
            console.log('📥 [APP] Voice Input Response:', data);

            const activeSessionId = data.session_id;
            if (activeSessionId && !sessionId) {
                setSessionId(activeSessionId);
            }

            console.log(`🔍 [APP] Fetching Text Output for session ${activeSessionId}...`);
            const resOutput = await fetch(`${API_BASE}/text-output?session_id=${activeSessionId}`);
            const textData = await resOutput.json();


            if (!resOutput.ok) {
                throw new Error(`Output Fetch Error: ${JSON.stringify(textData)}`);
            }

            console.log('📥 [APP] Output Response:', textData);

            // Play the Groq Orpheus audio visually updating it dynamically in the array
            const groqUrl = await playGroqAudio(textData.response_text);
            if (groqUrl) {
                textData.audio_url = groqUrl; // override backend audio url
            }

            setResults((prev) => [...prev, textData]);
        } catch (error) {
            console.error('❌ [APP] Error:', error);
            alert(`Failed to send audio: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 700, margin: '0 auto' }}>
            <h2>🧪 Echo-Order — Test Harness</h2>

            {/* Role selector */}
            <div style={{ marginBottom: 16 }}>
                <label>Role: </label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                </select>
                <span style={{ marginLeft: 12, color: '#888' }}>
                    Session: {sessionId || '(new)'}
                </span>
            </div>

            {/* Record button */}
            <div style={{ marginBottom: 16 }}>
                {!recording ? (
                    <button onClick={startRecording} disabled={loading} style={{ fontSize: 16, padding: '8px 20px' }}>
                        🎤 Start Recording
                    </button>
                ) : (
                    <button onClick={stopRecording} style={{ fontSize: 16, padding: '8px 20px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: 4 }}>
                        ⏹️ Stop & Send
                    </button>
                )}
                {loading && <span style={{ marginLeft: 12 }}>⏳ Processing...</span>}
            </div>

            {/* Reset session */}
            <button onClick={() => { setSessionId(''); setResults([]); console.log('🔄 [SESSION] Reset') }} style={{ marginBottom: 20, fontSize: 12 }}>
                Reset Session
            </button>

            {/* Results */}
            <hr />
            <h3>Conversation ({results.length} turns)</h3>
            {results.map((r, i) => (
                <div key={i} style={{ borderLeft: '3px solid #4CAF50', paddingLeft: 12, marginBottom: 16 }}>
                    <p><strong>You:</strong> {r.transcript}</p>
                    <p><strong>Echo:</strong> {r.response_text}</p>
                    {/* Render new internal blob url OR fallback to initial local audio endpoint */}
                    {r.audio_url && <audio controls src={r.audio_url.startsWith('blob:') ? r.audio_url : `${API_BASE}${r.audio_url}`} style={{ width: '100%' }} />}
                </div>
            ))}
        </div>
    );
};

export default Chat;
