import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">

        {/* Brand column */}
        <div className="footer-brand">
          <div className="footer-brand-row">
            <img
              src="https://www.techligence.in/logo.png"
              alt="Techligence"
              className="footer-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="footer-brand-name">TECHLIGENCE</span>
          </div>

          <p className="footer-tagline">
            Revolutionizing industries with AI-powered service robots and intelligent automation solutions.
          </p>

          <div className="footer-contact">
            <div className="footer-contact-row">
              <span className="footer-icon">✉</span>
              <div>
                <p><strong>General:</strong> info@techligence.net</p>
                <p><strong>Book Demo:</strong> outreach@techligence.net</p>
                <p><strong>Support:</strong> support@techligence.net</p>
              </div>
            </div>
            <div className="footer-contact-row">
              <span className="footer-icon">📞</span>
              <p>+91 70208 12247</p>
            </div>
          </div>

          <div className="footer-offices">
            <div className="footer-office">
              <p className="footer-office-label">MUMBAI OFFICE:</p>
              <p>D9-802, Lokdhara, Phase-3, Kalyan - 421306</p>
            </div>
            <div className="footer-office">
              <p className="footer-office-label">PUNE OFFICE:</p>
              <p>Shop 1/2/3, Selenia Housing Society, Jadhavwadi, Chikhali, Pimpri-Chinchwad, Pune - 411062</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="https://www.techligence.in" target="_blank" rel="noreferrer">Home</a></li>
            <li><a href="https://www.techligence.in/robots" target="_blank" rel="noreferrer">Robots</a></li>
            <li><a href="https://www.techligence.in/solutions" target="_blank" rel="noreferrer">Solutions</a></li>
            <li><a href="https://www.techligence.in/company" target="_blank" rel="noreferrer">Company</a></li>
            <li><a href="https://www.techligence.in/contact" target="_blank" rel="noreferrer">Contact</a></li>
          </ul>
        </div>

        {/* Products */}
        <div className="footer-col">
          <h4>Products</h4>
          <ul className="footer-links">
            <li><a href="https://www.techligence.in" target="_blank" rel="noreferrer">T2 Mini</a></li>
            <li><span className="footer-product">Joy A-01 <em>Soon</em></span></li>
            <li><span className="footer-product">Tella S <em>Soon</em></span></li>
            <li><span className="footer-product">Andy R1 <em>Soon</em></span></li>
            <li><span className="footer-product">T2 Max <em>Soon</em></span></li>
            <li><span className="footer-product">Nova M1 <em>Soon</em></span></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 Techligence Robotics. All rights reserved.</p>
        <div className="footer-socials">
          <a href="https://x.com/techligence" target="_blank" rel="noreferrer" aria-label="X">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.904-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://linkedin.com/company/techligence" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="https://instagram.com/techligence" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
