import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminGetStats, adminGetTickets } from '../services/api';
import { FiUsers, FiFileText, FiInbox, FiRefreshCw, FiCheckCircle, FiChevronRight, FiCpu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([adminGetStats(), adminGetTickets()]);
      setStats(statsRes.data);
      // Keep recent 5 tickets
      setTickets(ticketsRes.data.slice(0, 5));
    } catch (err) {
      console.error("Error loading admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'priority-critical';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-in_progress';
      case 'RESOLVED': return 'status-resolved';
      default: return 'status-closed';
    }
  };

  return (
    <div className="app-container">
      <Sidebar showMobile={sidebarMobile} toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

      <main className="main-content">
        <Header toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Admin Dashboard...</span>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h3 className="m-0 font-weight-bold">
                  {user?.role === 'ROLE_ADMIN' ? 'System Administration' : 'Support Desk Operations'}
                </h3>
                <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>
                  {user?.role === 'ROLE_ADMIN' 
                    ? 'Monitor and manage global IT operations' 
                    : 'Track and resolve your assigned incoming support requests'}
                </p>
              </div>
              <div className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2" style={{ fontSize: '0.8rem' }}>
                {user?.role === 'ROLE_ADMIN' ? 'Admin Dashboard' : 'Support Engineer Dashboard'}
              </div>
            </div>

            {/* Admin Grid Cards */}
            <div className="row g-4 mb-5">
              {user?.role === 'ROLE_ADMIN' && (
                <div className="col-6 col-md-6 col-lg-five">
                  <div className="glass-panel glass-panel-hover p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted font-weight-bold d-block mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>TOTAL USERS</span>
                      <h2 className="m-0 font-weight-bold">{stats.totalUsers}</h2>
                    </div>
                    <div className="rounded-3 p-3 d-flex align-items-center justify-content-center icon-box-indigo" style={{ width: '54px', height: '54px' }}>
                      <FiUsers size={24} />
                    </div>
                  </div>
                </div>
              )}

              <div className={user?.role === 'ROLE_ADMIN' ? "col-6 col-md-6 col-lg-five" : "col-6 col-md-6 col-lg-3"}>
                <div className="glass-panel glass-panel-hover p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted font-weight-bold d-block mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>TOTAL TICKETS</span>
                    <h2 className="m-0 font-weight-bold">{stats.totalTickets}</h2>
                  </div>
                  <div className="rounded-3 p-3 d-flex align-items-center justify-content-center icon-box-gray" style={{ width: '54px', height: '54px' }}>
                    <FiFileText size={24} />
                  </div>
                </div>
              </div>

              <div className={user?.role === 'ROLE_ADMIN' ? "col-6 col-md-6 col-lg-five" : "col-6 col-md-6 col-lg-3"}>
                <div className="glass-panel glass-panel-hover p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted font-weight-bold d-block mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>OPEN ISSUES</span>
                    <h2 className="m-0 font-weight-bold">{stats.openTickets}</h2>
                  </div>
                  <div className="rounded-3 p-3 d-flex align-items-center justify-content-center icon-box-sky" style={{ width: '54px', height: '54px' }}>
                    <FiInbox size={24} />
                  </div>
                </div>
              </div>

              <div className={user?.role === 'ROLE_ADMIN' ? "col-6 col-md-6 col-lg-five" : "col-6 col-md-6 col-lg-3"}>
                <div className="glass-panel glass-panel-hover p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted font-weight-bold d-block mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>IN PROGRESS</span>
                    <h2 className="m-0 font-weight-bold">{stats.inProgressTickets}</h2>
                  </div>
                  <div className="rounded-3 p-3 d-flex align-items-center justify-content-center icon-box-warning" style={{ width: '54px', height: '54px' }}>
                    <FiRefreshCw size={24} />
                  </div>
                </div>
              </div>

              <div className={user?.role === 'ROLE_ADMIN' ? "col-6 col-md-6 col-lg-five" : "col-6 col-md-6 col-lg-3"}>
                <div className="glass-panel glass-panel-hover p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted font-weight-bold d-block mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>RESOLVED</span>
                    <h2 className="m-0 font-weight-bold">{stats.resolvedTickets}</h2>
                  </div>
                  <div className="rounded-3 p-3 d-flex align-items-center justify-content-center icon-box-success" style={{ width: '54px', height: '54px' }}>
                    <FiCheckCircle size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* CSS hack for 5 columns */}
            <style>{`
              @media(min-width: 992px) {
                .col-lg-five {
                  width: 20% !important;
                  flex: 0 0 20% !important;
                }
              }
            `}</style>

            {/* My Assigned Tickets (Support Engineer Only) */}
            {user?.role === 'ROLE_SUPPORT_ENGINEER' && (
              <div className="glass-panel p-4 mb-4" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="m-0 font-weight-bold text-primary">Tickets Assigned to Me</h5>
                  <span className="badge bg-primary px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
                    {tickets.filter(t => t.assignedTo?.email === user?.email).length} Active
                  </span>
                </div>

                {tickets.filter(t => t.assignedTo?.email === user?.email).length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '0.85rem' }}>
                    No tickets currently assigned to you.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-premium m-0">
                      <thead>
                        <tr>
                          <th>TICKET</th>
                          <th>SUBMITTED BY</th>
                          <th>PRIORITY</th>
                          <th>STATUS</th>
                          <th className="text-end">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets
                          .filter(t => t.assignedTo?.email === user?.email)
                          .map((t) => (
                            <tr key={t.id}>
                              <td>
                                <div className="font-weight-bold">{t.title}</div>
                                <small className="text-muted d-block text-truncate" style={{ maxWidth: '240px', fontSize: '0.75rem' }}>
                                  #{t.id} • {t.description}
                                </small>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.createdBy.name}</div>
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>{t.createdBy.email}</small>
                              </td>
                              <td>
                                <span className={`badge-premium ${getPriorityBadgeClass(t.priority)}`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-premium ${getStatusBadgeClass(t.status)}`}>
                                  {t.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="text-end">
                                <Link to={`/tickets/${t.id}`} className="btn btn-premium btn-sm py-1.5 px-3 rounded-pill" style={{ fontSize: '0.75rem' }}>
                                  Resolve
                                </Link>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recent Global Tickets */}
            {user?.role === 'ROLE_ADMIN' && (
              <div className="glass-panel p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="m-0 font-weight-bold">Recent Incoming Tickets</h5>
                  <Link to="/admin/tickets" className="text-decoration-none text-primary font-weight-bold d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                    <span>Manage all tickets</span>
                    <FiChevronRight />
                  </Link>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-5">
                    <FiInbox size={48} className="text-muted mb-3" />
                    <p className="text-muted m-0">No tickets submitted yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-premium m-0">
                      <thead>
                        <tr>
                          <th>TICKET</th>
                          <th>SUBMITTED BY</th>
                          <th>PRIORITY</th>
                          <th>STATUS</th>
                          <th>ASSIGNED TO</th>
                          <th className="text-end">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t) => (
                          <tr key={t.id} className={t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? 'glow-critical' : ''}>
                            <td>
                              <div className="font-weight-bold">{t.title}</div>
                              <small className="text-muted d-block text-truncate" style={{ maxWidth: '240px', fontSize: '0.75rem' }}>
                                #{t.id} • {t.description}
                              </small>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.createdBy.name}</div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>{t.createdBy.email}</small>
                            </td>
                            <td>
                              <span className={`badge-premium ${getPriorityBadgeClass(t.priority)}`}>
                                {t.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-premium ${getStatusBadgeClass(t.status)}`}>
                                {t.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              {t.assignedTo ? (
                                <span style={{ fontSize: '0.85rem' }}>{t.assignedTo.name}</span>
                              ) : (
                                <span className="text-muted-50 italic" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </td>
                            <td className="text-end">
                              <Link to={`/tickets/${t.id}`} className="btn btn-premium-outline btn-sm py-1.5 px-3 rounded-pill" style={{ fontSize: '0.75rem' }}>
                                Manage
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
