import React from 'react';
import { FiMenu, FiBell, FiSearch, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleMobile }) => {
  const { user } = useAuth();
  if (!user) return null;

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="glass-panel px-4 py-3 d-flex align-items-center justify-content-between mb-4">
      {/* Mobile Toggle & Greeting */}
      <div className="d-flex align-items-center gap-3">
        <button 
          onClick={toggleMobile} 
          className="btn text-white d-md-none p-1 border-0" 
          aria-label="Toggle Sidebar"
        >
          <FiMenu size={24} />
        </button>
        <div>
          <h5 className="m-0 font-weight-bold">{getGreeting()}, {user.name.split(' ')[0]}!</h5>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
            Welcome to the AI-Powered IT Helpdesk Portal.
          </small>
        </div>
      </div>

      {/* Header Utilities */}
      <div className="d-none d-lg-flex align-items-center gap-3">
        <div className="position-relative">
          <input 
            type="text" 
            placeholder="Search tickets..." 
            className="form-control form-control-premium py-1.5 ps-5"
            style={{ width: '240px', fontSize: '0.85rem' }}
          />
          <FiSearch className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <button className="btn text-muted p-2 hover-bg-opacity border-0" aria-label="Notifications">
          <FiBell size={20} />
        </button>
        <button className="btn text-muted p-2 hover-bg-opacity border-0" aria-label="Help">
          <FiHelpCircle size={20} />
        </button>
        
        <div className="border-start ps-3 d-flex align-items-center gap-2" style={{ borderColor: 'var(--border-color) !important' }}>
          <span className="d-inline-block rounded-circle bg-success animate-pulse" style={{ width: '8px', height: '8px', boxShadow: '0 0 8px #10b981' }}></span>
          <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
            Online
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
