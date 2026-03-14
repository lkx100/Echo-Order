import './Navbar.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Chat from '../Chat/Chat.jsx';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", link: "#hero" },
    { name: "About", link: "#about" },
    { name: "Contact", link: "#contact" },
  ];

  const handleScroll = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="floating-navbar" id="navbar">
      <div className="navbar__logo">
      <Link to="/" className="navbar__home-link" title="Home">Echo.<span>Order</span></Link>
      </div>
      <div className={`floating-capsule ${isOpen ? 'active' : ''}`}>
        <div className="capsule-inner">
          <Link to="/chat" className="nav-item" onClick={handleScroll} title="Chat">
            <span className="nav-text">Chat</span>
          </Link>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="nav-item"
              onClick={handleScroll}
              title={item.name}
            >
              <span className="nav-text">{item.name}</span>
            </a>
          ))}
        </div>
      </div>
      <div className="navbar__auth">
        {isAuthenticated ? (
          <div className="user-menu">
            <button
              className="navbar__user"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-icon">{user?.username?.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user?.username}</span>
              {user?.role === 'admin' && <span className="admin-badge">Admin</span>}
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <p className="user-email">{user?.email}</p>
                  <p className="user-role">Role: {user?.role}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="navbar__login">Login</Link>
            <Link to="/register" className="navbar__signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
