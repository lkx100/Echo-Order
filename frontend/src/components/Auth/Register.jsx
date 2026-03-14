import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Auth.css';

const Register = () => {
  const location = useLocation();
  const defaultMode = location.state?.defaultMode || 'customer';

  const [mode, setMode] = useState(defaultMode); // 'customer' | 'admin'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const isAdmin = mode === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await register(email, username, password, mode);
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card${isAdmin ? ' auth-card--admin' : ''}`}>

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand__logo">Echo.<span>Order</span></div>
          <div className="auth-brand__tagline">AI-powered restaurant ordering</div>
        </div>

        {/* Role toggle */}
        <div className="auth-toggle">
          <button
            type="button"
            className={`auth-toggle__btn${!isAdmin ? ' auth-toggle__btn--active-customer' : ''}`}
            onClick={() => { setMode('customer'); setError(''); setSuccess(''); }}
          >
            Customer
          </button>
          <button
            type="button"
            className={`auth-toggle__btn${isAdmin ? ' auth-toggle__btn--active-admin' : ''}`}
            onClick={() => { setMode('admin'); setError(''); setSuccess(''); }}
          >
            Admin
          </button>
        </div>

        <div className="auth-heading">
          {isAdmin ? 'Create Admin Account' : 'Create Account'}
        </div>
        <div className="auth-subtitle">
          {isAdmin
            ? 'Register an admin account to manage the restaurant.'
            : 'Join Echo.Order and start ordering!'}
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              placeholder="Choose a username"
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              placeholder="Create a password"
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading
              ? 'Creating account…'
              : isAdmin
                ? 'Create Admin Account'
                : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" state={{ defaultMode: mode }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
