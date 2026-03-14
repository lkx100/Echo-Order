import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [mode, setMode] = useState('customer'); // 'customer' | 'admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/chat';
  const isAdmin = mode === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/admin' ? '/chat' : from, { replace: true });
      }
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
            onClick={() => { setMode('customer'); setError(''); }}
          >
            Customer
          </button>
          <button
            type="button"
            className={`auth-toggle__btn${isAdmin ? ' auth-toggle__btn--active-admin' : ''}`}
            onClick={() => { setMode('admin'); setError(''); }}
          >
            Admin
          </button>
        </div>

        <div className="auth-heading">
          {isAdmin ? 'Admin Login' : 'Welcome back'}
        </div>
        <div className="auth-subtitle">
          {isAdmin
            ? 'Sign in to access the admin dashboard.'
            : 'Log in to place your order with Echo.'}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              placeholder="Enter your username"
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
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing in…' : isAdmin ? 'Sign in as Admin' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" state={{ defaultMode: mode }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
