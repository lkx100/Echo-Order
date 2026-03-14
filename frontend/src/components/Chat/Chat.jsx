import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import './Chat.css';

const API_BASE = 'http://localhost:8000';

const Chat = () => {
    const [role, setRole] = useState('customer');
    const [sessionId, setSessionId] = useState('');
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [menuOpen, setMenuOpen] = useState(true);
    const [menuData, setMenuData] = useState({});
    const [menuLoading, setMenuLoading] = useState(true);

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    // Note: dangerouslyAllowBrowser is required when using the Groq SDK on the frontend
    const groqClient = useRef(new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
    }));

    const fetchMenu = () => {
        setMenuLoading(true);
        fetch(`${API_BASE}/menu`)
            .then(r => r.json())
            .then(data => setMenuData(data.categories || {}))
            .catch(() => setMenuData({}))
            .finally(() => setMenuLoading(false));
    };

    useEffect(() => { fetchMenu(); }, []);

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

            const groqUrl = await playGroqAudio(textData.response_text);
            if (groqUrl) {
                textData.audio_url = groqUrl;
            }

            setResults((prev) => [...prev, textData]);
        } catch (error) {
            console.error('❌ [APP] Error:', error);
            alert(`Failed to send audio: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [results, loading]);

    const categoryOrder = ['Pizza', 'Burger', 'Salad', 'Sides', 'Drinks', 'Dessert'];
    const sortedCategories = [
        ...categoryOrder.filter(c => menuData[c]),
        ...Object.keys(menuData).filter(c => !categoryOrder.includes(c)),
    ];

    return (
        <div className="chat-page">
            <div className={`chat-layout ${menuOpen ? 'chat-layout--with-menu' : ''}`}>

                {/* Menu Card Panel */}
                {menuOpen && (
                    <aside className="menu-panel">
                        <div className="menu-panel__header">
                            <div className="menu-panel__title">
                                <span className="menu-panel__icon">🍽</span>
                                <span>Menu</span>
                            </div>
                        <div className="menu-panel__actions">
                            <button className={`menu-refresh-btn ${menuLoading ? 'menu-refresh-btn--spinning' : ''}`} onClick={fetchMenu} disabled={menuLoading} title="Refresh menu">↻</button>
                            <button className="menu-close-btn" onClick={() => setMenuOpen(false)} title="Close menu">✕</button>
                        </div>
                        </div>

                        <div className="menu-panel__body">
                            {menuLoading ? (
                                <div className="menu-loading">
                                    <span className="dot-spin" /> Loading menu…
                                </div>
                            ) : sortedCategories.length === 0 ? (
                                <div className="menu-empty">No items available</div>
                            ) : (
                                sortedCategories.map(category => (
                                    <div key={category} className="menu-category">
                                        <div className="menu-category__header">
                                            <span className="menu-category__name">{category}</span>
                                            <span className="menu-category__line" />
                                        </div>
                                        <ul className="menu-items-list">
                                            {menuData[category].map(item => (
                                                <li key={item.id} className="menu-item">
                                                    <div className="menu-item__top">
                                                        <span className="menu-item__name">{item.name}</span>
                                                        <span className="menu-item__price">${item.price.toFixed(2)}</span>
                                                    </div>
                                                    {item.description && (
                                                        <p className="menu-item__desc">{item.description}</p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                )}

                {/* Chat Container */}
                <div className="chat-container">

                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header__left">
                            {!menuOpen && (
                                <button className="menu-toggle-btn" onClick={() => setMenuOpen(true)} title="Show menu">
                                    🍽
                                </button>
                            )}
                            <div className="chat-header__info">
                                <div className="chat-header__title">Echo.<span>Order</span></div>
                                <div className="chat-header__session">
                                    Session: <em>{sessionId || 'new'}</em>
                                </div>
                            </div>
                        </div>
                        <div className="chat-header__controls">
                            <select
                                className="role-selector"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button
                                className="reset-btn"
                                onClick={() => { setSessionId(''); setResults([]); console.log('🔄 [SESSION] Reset'); }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {results.length === 0 && !loading && (
                            <div className="chat-empty">
                                <div className="chat-empty__icon">🎙️</div>
                                <div className="chat-empty__title">Start a conversation</div>
                                <div className="chat-empty__sub">Press the mic button below and speak your order. Echo will respond.</div>
                            </div>
                        )}

                        {results.map((r, i) => (
                            <div key={i} className="chat-turn">
                                {/* User message */}
                                <div className="msg-user">
                                    <div className="bubble">
                                        <div className="bubble__label">You</div>
                                        <div className="bubble__text">{r.transcript}</div>
                                    </div>
                                    <div className="msg-avatar">👤</div>
                                </div>

                                {/* Echo response */}
                                <div className="msg-echo">
                                    <div className="msg-avatar">🤖</div>
                                    <div className="bubble">
                                        <div className="bubble__label">Echo</div>
                                        <div className="bubble__text">{r.response_text}</div>
                                        {r.audio_url && (
                                            <div className="bubble__audio">
                                                <audio
                                                    controls
                                                    src={r.audio_url.startsWith('blob:') ? r.audio_url : `${API_BASE}${r.audio_url}`}
                                                />
                                            </div>
                                        )}
                                        {r.order_id && (
                                            <div className="bubble__order">
                                                <div className="order-summary">
                                                    <span className="order-summary__id">Order #{r.order_id}</span>
                                                    <span className="order-summary__total">${r.order_total?.toFixed(2)}</span>
                                                </div>
                                                <button className="checkout-btn" onClick={() => window.print()}>
                                                    🧾 Checkout &amp; Print Bill
                                                </button>
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
                                title={recording ? 'Stop & send' : 'Start recording'}
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
        </div>
    );
};

export default Chat;
