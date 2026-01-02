import React from 'react';
import LinkGenerator from './LinkGenerator';

function App() {
  return (
    <div className="layout">
      
      {/* HEADER: Clean, Functional, Links to YOU */}
      <header className="site-header">
        <div className="header-container">
          <div className="brand-logo">
            <span className="accent">Link</span>Executor
          </div>
          
          <ul className="nav-links">
            <li className="nav-item">
              <a href="https://github.com/shakeeb-sa" target="_blank" rel="noreferrer">My GitHub</a>
            </li>
            <li className="nav-item">
              {/* Replace with your actual portfolio link */}
              <a href="https://shakeeb-sa.github.io/" target="_blank" rel="noreferrer">Portfolio</a>
            </li>
          </ul>

          <div className="header-actions">
            <a 
              href="https://github.com/shakeeb-sa/link-building-execution-generator" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-outline"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-wrapper">
        <LinkGenerator />
      </main>

      {/* FOOTER: Minimal & Trustworthy */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} LinkExecutor. Open Source Tool.</p>
            <p className="footer-note">
              This tool runs entirely in your browser. No data is sent to any server.
            </p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/shakeeb-sa" target="_blank" rel="noreferrer">Created by Shakeeb Ahmed</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;