import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const API_BASE = 'http://localhost:8000';

const AdminLayout = () => {
  const { user, logout, sessionToken } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!sessionToken) return;
    fetch(`${API_BASE}/admin-api/profile`, {
      headers: { Authorization: sessionToken },
    })
      .then(r => r.json())
      .then(data => { if (data.profile) setProfile(data.profile); })
      .catch(() => {});
  }, [sessionToken]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">Echo.<span>Order</span></div>
          <div className="admin-sidebar__sub">Admin Panel</div>
        </div>

        {profile ? (
          <div className="admin-sidebar__restaurant">
            <span className="admin-sidebar__restaurant-name">{profile.restaurant_name}</span>
            {profile.tagline && (
              <span className="admin-sidebar__restaurant-tag">{profile.tagline}</span>
            )}
          </div>
        ) : (
          <div className="admin-sidebar__restaurant">
            <span className="admin-sidebar__restaurant-tag">No profile yet — visit Setup</span>
          </div>
        )}

        <nav className="admin-sidebar__nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink
            to="/admin/chat"
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">🤖</span> Admin Chat
          </NavLink>
          <NavLink
            to="/admin/setup"
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">⚙️</span> Setup
          </NavLink>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="admin-sidebar__username">{user?.username}</div>
              <div className="admin-sidebar__role">Administrator</div>
            </div>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout}>
            ↩ Logout
          </button>
        </div>
      </aside>

      {/* Main content — child routes render here */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
