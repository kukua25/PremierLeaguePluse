/**
 * Footer.jsx
 * - Gives you credit and a LinkedIn button.
 * - Entirely semantic: <footer> + accessible link.
 * - Edit the linkedinUrl to your profile handle.
 */
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  // TODO: replace with your real LinkedIn URL
  const linkedinUrl = "https://www.linkedin.com/in/amulugeta/";

  return (
    <footer className="footer" role="contentinfo">
      {/* Thin accent bar that matches the hero color */}
      <div className="footer-accent" aria-hidden="true" />

      <div className="footer-inner">
        <p className="credits">
          © {year} PL Pulse • Built by <strong>Aron Mulugeta</strong>
        </p>

        <nav className="links" aria-label="Profile links">
          <a
            className="btn-link"
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open LinkedIn profile in a new tab"
          >
            {/* Inline SVG so we avoid any icon libs */}
            <svg
              className="icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 5 2.12 5 3.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.1h.05c.53-1 1.82-2.1 3.75-2.1C19.9 8 22 10 22 13.7V23h-4v-8c0-1.9-.03-4.3-2.6-4.3-2.6 0-3 2-3 4.1V23H8V8z"/>
            </svg>
            <span>LinkedIn</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
