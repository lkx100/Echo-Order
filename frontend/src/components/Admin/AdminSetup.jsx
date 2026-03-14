import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Auth/Auth.css';

const API_BASE = 'http://localhost:8000';

const AdminSetup = () => {
  const { user, sessionToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    restaurant_name: '',
    tagline: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from DB if profile already exists
  useEffect(() => {
    if (!sessionToken) { setFetching(false); return; }
    fetch(`${API_BASE}/admin-api/profile`, {
      headers: { Authorization: sessionToken },
    })
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setForm({
            restaurant_name: data.profile.restaurant_name || '',
            tagline: data.profile.tagline || '',
            phone: data.profile.phone || '',
            address: data.profile.address || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [sessionToken]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionToken,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save profile');
      }
      // Mark setup as complete so Login redirect works correctly
      localStorage.setItem('echoorder_admin_profile', '1');
      setSaved(true);
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="auth-page" style={{ padding: '40px 20px' }}>
        <div className="auth-card auth-card--admin" style={{ alignItems: 'center', padding: '48px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ padding: '40px 20px' }}>
      <div className="auth-card auth-card--admin">

        <div className="auth-brand">
          <div className="auth-brand__logo">Echo.<span>Order</span></div>
          <div className="auth-brand__tagline">Restaurant Settings</div>
        </div>

        <div className="auth-heading">Restaurant Profile</div>
        <div className="auth-subtitle">
          Help Echo understand your restaurant. Update this anytime from Settings in the sidebar.
        </div>

        {error && <div className="auth-error">{error}</div>}
        {saved && <div className="auth-success">Profile saved! Redirecting to dashboard…</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="restaurant_name">Restaurant Name *</label>
            <input
              type="text"
              id="restaurant_name"
              name="restaurant_name"
              value={form.restaurant_name}
              placeholder="e.g. The Golden Fork"
              onChange={handleChange}
              required
              disabled={loading || saved}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tagline">Tagline</label>
            <input
              type="text"
              id="tagline"
              name="tagline"
              value={form.tagline}
              placeholder="e.g. Fresh food, fast service"
              onChange={handleChange}
              disabled={loading || saved}
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Contact Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              placeholder="e.g. +1 (555) 000-1234"
              onChange={handleChange}
              required
              disabled={loading || saved}
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              placeholder="e.g. 42 Main Street, New York"
              onChange={handleChange}
              disabled={loading || saved}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading || saved}>
            {loading ? 'Saving…' : saved ? 'Saved ✓' : 'Save & Continue'}
          </button>
        </form>

        {user && (
          <p className="auth-footer">
            Logged in as{' '}
            <strong style={{ color: 'var(--accent-orange)' }}>{user.username}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;
