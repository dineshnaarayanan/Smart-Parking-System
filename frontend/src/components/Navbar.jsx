import React from 'react';

export default function Navbar({ user, onLogout, theme, onToggleTheme, activeTab, setActiveTab }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-icon">P</div>
        <span>SmartPark</span>
      </div>

      {user && (
        <div className="nav-actions">
          {user.role === 'admin' ? (
            <div className="segmented-control" style={{ marginBottom: 0 }}>
              <button
                className={`segmented-tab ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin Panel
              </button>
              <button
                className={`segmented-tab ${activeTab === 'customer' ? 'active' : ''}`}
                onClick={() => setActiveTab('customer')}
              >
                User View
              </button>
            </div>
          ) : (
            <div className="segmented-control" style={{ marginBottom: 0 }}>
              <button
                className={`segmented-tab ${activeTab === 'customer' ? 'active' : ''}`}
                onClick={() => setActiveTab('customer')}
              >
                Book Spots
              </button>
            </div>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={onToggleTheme} 
            title="Toggle Theme"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div className="nav-user">
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <span className="badge badge-handicapped" style={{ textTransform: 'capitalize', fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
              {user.role}
            </span>
          </div>

          <button className="btn btn-secondary" onClick={onLogout} title="Logout">
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
