import React from 'react';

export default function Header({ view, setView, onNewJob, companyName }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon"><span>⊞</span></div>
        {companyName || 'Steel Estimator'}
      </div>
      <nav className="header-nav">
        {view === 'estimate' && (
          <button className="nav-btn" onClick={onNewJob}>
            + New Job
          </button>
        )}
        <button
          className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView(view === 'settings' ? (window._prevView || 'upload') : 'settings')}
          onMouseDown={() => { window._prevView = view; }}
        >
          Settings
        </button>
      </nav>
    </header>
  );
}
