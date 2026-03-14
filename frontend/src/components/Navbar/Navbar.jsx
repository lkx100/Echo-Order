import './Navbar.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Chat from '../Chat/Chat.jsx';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", link: "#hero" },
    { name: "About", link: "#about" },
    { name: "Contact", link: "#contact" },
  ];

  const handleScroll = () => {
    setIsOpen(false);
  };

  return (
    <nav className="floating-navbar" id="navbar">
      <div className="navbar__logo">
        Echo.<span>Order</span>
      </div>
      <div className={`floating-capsule ${isOpen ? 'active' : ''}`}>
        <li><Link to="/chat" className="navbar__link">Chat</Link></li>
        <div className="capsule-inner">
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
        <button className="navbar__login">Login</button>
        <button className="navbar__signup">Sign Up</button>
      </div>
    </nav>
  );
};

export default Navbar;
