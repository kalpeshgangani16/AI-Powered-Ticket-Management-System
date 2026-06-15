import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminGetTickets } from '../services/api';
import { FiInbox, FiSearch, FiSliders, FiActivity, FiTag, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const TicketManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);

  const loadAllTickets = async () => {
    try {
      setLoading(true);
      const res = await adminGetTickets();
      setTickets(res.data);
      setFilteredTickets(res.data);
    } catch (err) {
      console.error("Error fetching all tickets for admin", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTickets();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let result = tickets;

    if (assignedToMeFilter) {
      result = result.filter(t => t.assignedTo?.email === user?.email);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query) || 
        t.createdBy.name.toLowerCase().includes(query) || 
        t.createdBy.email.toLowerCase().includes(query) || 
        (t.assignedTo && t.assignedTo.name.toLowerCase().includes(query)) ||
        t.id.toString().includes(query)
      );
    }

    setFilteredTickets(result);
  }, [search, statusFilter, priorityFilter, categoryFilter, assignedToMeFilter, tickets, user]);

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
              <span className="visually-hidden">Loading ticket management...</span>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Header row */}
            <div className="mb-4">
              <h3 className="m-0 font-weight-bold">Enterprise Ticket Control</h3>
              <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Overview, search, assign and transition support requests</p>
            </div>

            {/* Admin Filters Grid */}
            <div className="glass-panel p-4 mb-4">
              <div className="row g-3 align-items-center">
                {/* Search query */}
                <div className="col-12 col-lg-4">
                  <div className="position-relative">
                    <input 
                      type="text" 
                      placeholder="Search title, details, owner, support engineer..." 
                      className="form-control form-control-premium ps-5"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <FiSearch className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Status select */}
                <div className="col-12 col-sm-4 col-lg-2">
                  <select 
                    className="form-select form-control-premium"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by Status"
                  >
                    <option value="ALL">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Priority select */}
                <div className="col-12 col-sm-4 col-lg-2">
                  <select 
                    className="form-select form-control-premium"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    aria-label="Filter by Priority"
                  >
                    <option value="ALL">All Priority</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                {/* Category select */}
                <div className="col-12 col-sm-4 col-lg-2">
                  <select 
                    className="form-select form-control-premium"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter by Category"
                  >
                    <option value="ALL">All Category</option>
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="NETWORK">Network</option>
                    <option value="DATABASE">Database</option>
                    <option value="SECURITY">Security</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Assigned to Me filter (Support Engineer/Admin Only) */}
                {user?.role !== 'ROLE_USER' && (
                  <div className="col-12 col-sm-4 col-lg-2 d-flex align-items-center">
                    <div className="form-check d-flex align-items-center">
                      <input 
                        type="checkbox" 
                        id="assigned-to-me"
                        className="form-check-input"
                        style={{ cursor: 'pointer', width: '18px', height: '18px', backgroundColor: 'transparent', borderColor: 'var(--border-color)' }}
                        checked={assignedToMeFilter}
                        onChange={(e) => setAssignedToMeFilter(e.target.checked)}
                      />
                      <label htmlFor="assigned-to-me" className="form-check-label text-white ms-2" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                        Assigned to Me
                      </label>
                    </div>
                  </div>
                )}

                {/* Count indicator */}
                <div className="col-12 col-lg-2 text-lg-end text-muted" style={{ fontSize: '0.85rem' }}>
                  Found {filteredTickets.length} tickets
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="glass-panel p-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-5">
                  <FiInbox size={48} className="text-muted mb-3" />
                  <p className="text-muted m-0">No matching tickets found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium m-0">
                    <thead>
                      <tr>
                        <th>TICKET</th>
                        <th>SUBMITTED BY</th>
                        <th>CATEGORY</th>
                        <th>PRIORITY</th>
                        <th>STATUS</th>
                        <th>ASSIGNED TO</th>
                        <th className="text-end">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((t) => (
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
          </div>
        )}
      </main>
    </div>
  );
};

export default TicketManagement;
