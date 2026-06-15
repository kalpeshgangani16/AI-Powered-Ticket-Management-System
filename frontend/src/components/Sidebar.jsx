import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiPlusSquare, FiInbox, FiUsers, FiLogOut, FiActivity, FiX } from 'react-icons/fi';

const Sidebar = ({ showMobile, toggleMobile }) => {
  const { user, handleLogout } = useAuth();
  
  if (!user) return null;

  const isStaff = user.role === 'ROLE_ADMIN' || user.role === 'ROLE_SUPPORT_ENGINEER';
  const isAdmin = user.role === 'ROLE_ADMIN';

  const linkClass = ({ isActive }) => 
    `d-flex align-items-center gap-3 px-4 py-3 text-decoration-none rounded-3 mb-2 transition-all ${
      isActive 
        ? 'bg-primary text-white font-weight-bold shadow-sm' 
        : 'text-muted hover-bg-opacity-5'
    }`;

  const navHoverStyle = `
    .hover-bg-opacity-5:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main) !important;
    }
    .transition-all {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  const getRoleBadgeClass = () => {
    if (user.role === 'ROLE_ADMIN') return 'badge-role-admin';
    if (user.role === 'ROLE_SUPPORT_ENGINEER') return 'badge-role-engineer';
    return 'badge-role-user';
  };

  const getRoleLabel = () => {
    if (user.role === 'ROLE_ADMIN') return 'Admin';
    if (user.role === 'ROLE_SUPPORT_ENGINEER') return 'Support Engineer';
    return 'Employee';
  };

  return (
    <>
      <style>{navHoverStyle}</style>
      <div className={`sidebar ${showMobile ? 'show' : ''} d-flex flex-column p-4`}>
        {/* Brand Logo & Close Button */}
        <div className="d-flex align-items-center justify-content-between mb-5">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <FiActivity size={22} />
            </div>
            <div>
              <h5 className="m-0 font-weight-bold text-gradient">DeskFlow AI</h5>
              <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enterprise Support</small>
            </div>
          </div>
          <button 
            onClick={toggleMobile} 
            className="btn text-muted p-1 border-0 d-md-none"
            aria-label="Close Sidebar"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow-1">
          <small className="text-uppercase text-muted font-weight-bold d-block mb-3 px-2" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
            Navigation
          </small>

          {!isStaff ? (
            <>
              <NavLink to="/dashboard" onClick={toggleMobile} className={linkClass}>
                <FiHome size={18} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/tickets/create" onClick={toggleMobile} className={linkClass}>
                <FiPlusSquare size={18} />
                <span>Create Ticket</span>
              </NavLink>
              <NavLink to="/tickets/my" onClick={toggleMobile} className={linkClass}>
                <FiInbox size={18} />
                <span>My Tickets</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/admin/dashboard" onClick={toggleMobile} className={linkClass}>
                <FiHome size={18} />
                <span>{user.role === 'ROLE_ADMIN' ? 'Admin Dashboard' : 'Engineer Dashboard'}</span>
              </NavLink>
              <NavLink to="/admin/tickets" onClick={toggleMobile} className={linkClass}>
                <FiInbox size={18} />
                <span>Manage Tickets</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin/users" onClick={toggleMobile} className={linkClass}>
                  <FiUsers size={18} />
                  <span>User Management</span>
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* User Profile Card & Logout */}
        <div className="border-top pt-4" style={{ borderColor: 'var(--border-color) !important' }}>
          <div className="d-flex align-items-center gap-3 mb-4 px-2">
            <div className="bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center" 
                 style={{ 
                   width: '42px', 
                   height: '42px',
                   background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' 
                 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h6 className="m-0 text-truncate font-weight-bold" style={{ fontSize: '0.9rem' }}>{user.name}</h6>
              <span className={`badge px-2 py-0.5 rounded-pill ${getRoleBadgeClass()}`} style={{ fontSize: '0.65rem' }}>
                {getRoleLabel()}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn w-100 d-flex align-items-center justify-content-center gap-2 btn-outline-danger border-0 hover-bg-danger-opacity rounded-3 py-2.5">
            <FiLogOut size={16} />
            <span className="font-weight-bold" style={{ fontSize: '0.9rem' }}>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
