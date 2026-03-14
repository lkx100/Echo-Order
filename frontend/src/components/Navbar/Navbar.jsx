import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar" id="navbar">
      <div className="navbar__logo">
        food.<span>Pi</span>
      </div>

      <ul className="navbar__links">
        <li><a href="#services" className="navbar__link">Service</a></li>
        <li><a href="#store" className="navbar__link">Store</a></li>
        <li><a href="#discount" className="navbar__link">Discount</a></li>
      </ul>

      <button className="navbar__hamburger" aria-label="Toggle menu" id="menu-toggle">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
};

export default Navbar;
