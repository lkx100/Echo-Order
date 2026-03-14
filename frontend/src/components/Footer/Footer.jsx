import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer__top-border"></div>

      <div className="footer__container">
        {/* Brand column */}
        <div className="footer__brand">
          <div className="footer__logo">
            Echo.<span className="footer__logo-accent">Order</span>
          </div>
          <p className="footer__tagline">
            Voice-powered AI ordering for the modern restaurant. Speak, order, enjoy.
          </p>
          <div className="footer__socials">
            <a href="#" className="footer__social" aria-label="Twitter">𝕏</a>
            <a href="#" className="footer__social" aria-label="Instagram">▷</a>
            <a href="#" className="footer__social" aria-label="LinkedIn">in</a>
            <a href="#" className="footer__social" aria-label="GitHub">⌨</a>
          </div>
        </div>

        {/* Product links */}
        <div className="footer__col">
          <h4 className="footer__col-title">Product</h4>
          <ul className="footer__links">
            <li><a href="#how-it-works" className="footer__link">How It Works</a></li>
            <li><a href="#pricing" className="footer__link">Pricing</a></li>
            <li><Link to="/chat" className="footer__link">Try Demo</Link></li>
            <li><a href="#" className="footer__link">Changelog</a></li>
          </ul>
        </div>

        {/* Company links */}
        <div className="footer__col">
          <h4 className="footer__col-title">Company</h4>
          <ul className="footer__links">
            <li><a href="#" className="footer__link">About</a></li>
            <li><a href="#" className="footer__link">Blog</a></li>
            <li><a href="#" className="footer__link">Careers</a></li>
            <li><a href="#" className="footer__link">Contact</a></li>
          </ul>
        </div>

        {/* Legal links */}
        <div className="footer__col">
          <h4 className="footer__col-title">Legal</h4>
          <ul className="footer__links">
            <li><a href="#" className="footer__link">Privacy Policy</a></li>
            <li><a href="#" className="footer__link">Terms of Service</a></li>
            <li><a href="#" className="footer__link">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© 2025 EchoOrder. All rights reserved.</span>
        <span className="footer__bottom-right">
          Built with 🎤 &amp; AI
        </span>
      </div>
    </footer>
  );
};

export default Footer;
