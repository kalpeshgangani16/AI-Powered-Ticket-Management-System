import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserStats, getTickets } from '../services/api';
import { FiFileText, FiInbox, FiRefreshCw, FiCheckCircle, FiChevronRight, FiPlus } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([getUserStats(), getTickets()]);
      setStats(statsRes.data);
      // Only keep the 5 most recent tickets for dashboard summary
      setTickets(ticketsRes.data.slice(0, 5));
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
      {/* Sidebar Navigation */}
      <Sidebar showMobile={sidebarMobile} toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

      {/* Main Panel Content */}
      <main className="main-content">
        <Header toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading dashboard...</span>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Page Header / Action Row */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h3 className="m-0 font-weight-bold">Helpdesk Dashboard</h3>
                <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Track and manage your IT support requests</p>
              </div>
              <Link to="/tickets/create" className="btn btn-premium d-flex align-items-center gap-2">
                <FiPlus />
                <span>New Ticket</span>
              </Link>
            </div>

            {/* Dashboard Metric Cards */}
            <div className="row g-4 mb-5">
              <div className="col-6 col-lg-3">
                <div className="glass-panel glass-panel-hover p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted font-weight-bold d-block mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>TOTAL TICKETS</span>
                    <h2 className="m-0 font-weight-bold">{stats.totalTickets}</h2>
                  </div>
                  <div className="rounded-3 p-3 d-flex align-items-center justify-content-center icon-box-indigo" style={{ width: '54px', height: '54px' }}>
                    <FiFileText size={24} />
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
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

              <div className="col-6 col-lg-3">
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

              <div className="col-6 col-lg-3">
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

            {/* Recent Tickets Table Section */}
            <div className="glass-panel p-4 mb-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="m-0 font-weight-bold">Recent Support Tickets</h5>
                <Link to="/tickets/my" className="text-decoration-none text-primary font-weight-bold d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                  <span>View all own tickets</span>
                  <FiChevronRight />
                </Link>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-5">
                  <FiInbox size={48} className="text-muted mb-3" />
                  <p className="text-muted m-0">No tickets found. Create your first support request!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium m-0">
                    <thead>
                      <tr>
                        <th>TICKET</th>
                        <th>CATEGORY</th>
                        <th>PRIORITY</th>
                        <th>STATUS</th>
                        <th>CREATED</th>
                        <th className="text-end">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id} className={t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? 'glow-critical' : ''}>
                          <td>
                            <div className="font-weight-bold">{t.title}</div>
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: '280px', fontSize: '0.75rem' }}>
                              #{t.id} • {t.description}
                            </small>
                          </td>
                          <td>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{t.category}</span>
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
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                              {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link to={`/tickets/${t.id}`} className="btn btn-premium-outline btn-sm py-1.5 px-3 rounded-pill" style={{ fontSize: '0.75rem' }}>
                              View
                            </Link>
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
    </div>
  );
};

export default Dashboard;
