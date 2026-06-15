import React, { useState, useEffect } from 'react';
import { adminGetUsers, adminCreateUser, adminDeleteUser } from '../services/api';
import { FiUsers, FiSearch, FiSliders, FiClock, FiUserPlus, FiX, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal and form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('ROLE_SUPPORT_ENGINEER');
  const [newDepartment, setNewDepartment] = useState('IT_SUPPORT');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [pageSuccess, setPageSuccess] = useState('');
  const [pageError, setPageError] = useState('');

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This will delete all tickets created by them and remove them from the system.`)) {
      try {
        setPageSuccess('');
        setPageError('');
        setLoading(true);
        await adminDeleteUser(userId);
        setPageSuccess(`User "${userName}" was successfully deleted from the system.`);
        setTimeout(() => setPageSuccess(''), 4000);
        await loadUsers();
      } catch (err) {
        console.error("Failed to delete user", err);
        setPageError(err.response?.data?.message || 'Failed to delete user.');
        setLoading(false);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !newRole) {
      setAddError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setAddError('Password must be at least 6 characters');
      return;
    }

    setAddError('');
    setAddSuccess('');
    setAddLoading(true);

    try {
      await adminCreateUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: (newRole === 'ROLE_SUPPORT_ENGINEER' || newRole === 'ROLE_ADMIN') ? newDepartment : null
      });
      
      setAddSuccess('User created successfully!');
      
      // Reset form fields
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('ROLE_SUPPORT_ENGINEER');
      setNewDepartment('IT_SUPPORT');
      
      // Reload user list
      await loadUsers();
      
      // Close modal after delay
      setTimeout(() => {
        setAddSuccess('');
        setShowAddModal(false);
      }, 1500);

    } catch (err) {
      console.error("Failed to add user", err);
      setAddError(err.response?.data?.message || 'Failed to create user. Email might be in use.');
    } finally {
      setAddLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminGetUsers();
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error loading users list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter application
  useEffect(() => {
    if (search.trim()) {
      const query = search.toLowerCase();
      const result = users.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) || 
        u.role.toLowerCase().includes(query) ||
        u.id.toString().includes(query)
      );
      setFilteredUsers(result);
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  return (
    <div className="app-container">
      <Sidebar showMobile={sidebarMobile} toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

      <main className="main-content">
        <Header toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading users list...</span>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Page Title */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div>
                <h3 className="m-0 font-weight-bold">User Directory</h3>
                <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>View and audit registered employee and administrator accounts</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn btn-premium d-flex align-items-center gap-2 py-2.5 px-4"
              >
                <FiUserPlus size={18} />
                <span>Add User / Support Engineer</span>
              </button>
            </div>

            {/* Page Alerts */}
            {pageSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4 animate-fade-in" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <FiPlusCircle size={18} />
                <span style={{ fontSize: '0.85rem' }}>{pageSuccess}</span>
              </div>
            )}
            {pageError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4 animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                <FiX size={18} />
                <span style={{ fontSize: '0.85rem' }}>{pageError}</span>
              </div>
            )}

            {/* Filter controls */}
            <div className="glass-panel p-4 mb-4">
              <div className="row g-3 align-items-center">
                <div className="col-12 col-md-6 col-lg-5">
                  <div className="position-relative">
                    <input 
                      type="text" 
                      placeholder="Search users by ID, name, email, role..." 
                      className="form-control form-control-premium ps-5"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <FiSearch className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-7 text-md-end text-muted" style={{ fontSize: '0.85rem' }}>
                  Showing {filteredUsers.length} of {users.length} registered accounts
                </div>
              </div>
            </div>

            {/* Users Directory Table */}
            <div className="glass-panel p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <FiUsers size={48} className="text-muted mb-3" />
                  <p className="text-muted m-0">No matching user accounts found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium m-0">
                    <thead>
                      <tr>
                        <th>USER ID</th>
                        <th>NAME</th>
                        <th>EMAIL ADDRESS</th>
                        <th>ROLE</th>
                        <th>DEPARTMENT</th>
                        <th>JOIN DATE</th>
                        <th className="text-end">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <span className="font-weight-bold text-muted">#{u.id}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div className="bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center" 
                                   style={{ 
                                     width: '36px', 
                                     height: '36px',
                                     background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                                     fontSize: '0.85rem',
                                     fontWeight: 600
                                   }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-weight-bold">{u.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-white-50">{u.email}</span>
                          </td>
                          <td>
                            {u.role === 'ROLE_ADMIN' ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                Administrator
                              </span>
                            ) : u.role === 'ROLE_SUPPORT_ENGINEER' ? (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                Support Engineer
                              </span>
                            ) : (
                              <span className="badge bg-info-subtle text-info border border-info-subtle px-2.5 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                Employee User
                              </span>
                            )}
                          </td>
                          <td>
                            {u.department ? (
                              <span className="badge bg-secondary-subtle text-white border border-secondary px-2.5 py-1 rounded-pill" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                {u.department.replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-muted italic" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className="text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                              <FiClock size={14} />
                              {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="text-end">
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.name)} 
                              className="btn btn-outline-danger btn-sm py-1.5 px-3 rounded-3 d-inline-flex align-items-center gap-1.5"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <FiTrash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal Overlay */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ zIndex: 1050, backgroundColor: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel p-5 w-100 shadow-2xl" style={{ maxWidth: '480px', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <h5 className="m-0 font-weight-bold text-white">Create New Account</h5>
              <button onClick={() => setShowAddModal(false)} className="btn text-muted p-1 border-0" aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            {addError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                <FiX size={18} />
                <span style={{ fontSize: '0.85rem' }}>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <FiPlusCircle size={18} />
                <span style={{ fontSize: '0.85rem' }}>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div className="mb-3">
                <label className="form-label-premium">FULL NAME</label>
                <input 
                  type="text" 
                  name="create-user-name"
                  className="form-control form-control-premium"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-premium">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  name="create-user-email"
                  className="form-control form-control-premium"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-premium">PASSWORD</label>
                <input 
                  type="password" 
                  name="create-user-password"
                  className="form-control form-control-premium"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label-premium">USER ROLE</label>
                <select 
                  className="form-select form-control-premium py-1.5"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  aria-label="Select User Role"
                >
                  <option value="ROLE_SUPPORT_ENGINEER">Support Engineer</option>
                  <option value="ROLE_USER">Employee User</option>
                  <option value="ROLE_ADMIN">Administrator</option>
                </select>
              </div>

              {(newRole === 'ROLE_SUPPORT_ENGINEER' || newRole === 'ROLE_ADMIN') && (
                <div className="mb-4">
                  <label className="form-label-premium">DEPARTMENT</label>
                  <select 
                    className="form-select form-control-premium py-1.5"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    aria-label="Select Department"
                  >
                    <option value="IT_SUPPORT">IT Support</option>
                    <option value="NETWORK_TEAM">Network Team</option>
                    <option value="SECURITY_TEAM">Security Team</option>
                    <option value="DATABASE_TEAM">Database Team</option>
                    <option value="INFRASTRUCTURE_TEAM">Infrastructure Team</option>
                    <option value="APPLICATION_SUPPORT">Application Support</option>
                  </select>
                </div>
              )}

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-premium-outline py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn btn-premium py-2 px-4" disabled={addLoading}>
                  {addLoading ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
