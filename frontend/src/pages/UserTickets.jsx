import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../services/api';
import { FiInbox, FiSearch, FiSliders, FiPlus, FiArrowLeft } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const UserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await getTickets();
      setTickets(res.data);
      setFilteredTickets(res.data);
    } catch (err) {
      console.error("Error loading tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Filter application
  useEffect(() => {
    let result = tickets;

    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query) ||
        t.id.toString().includes(query)
      );
    }

    setFilteredTickets(result);
  }, [search, statusFilter, tickets]);

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
              <span className="visually-hidden">Loading tickets...</span>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Header row */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h3 className="m-0 font-weight-bold">My Tickets</h3>
                <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Track all support issues submitted by you</p>
              </div>
              <Link to="/tickets/create" className="btn btn-premium d-flex align-items-center gap-2">
                <FiPlus />
                <span>Create Ticket</span>
              </Link>
            </div>

            {/* Filter and Search Bar */}
            <div className="glass-panel p-4 mb-4">
              <div className="row g-3 align-items-center">
                {/* Search */}
                <div className="col-12 col-md-6 col-lg-5">
                  <div className="position-relative">
                    <input 
                      type="text" 
                      placeholder="Search by ID, title, description, category..." 
                      className="form-control form-control-premium ps-5"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <FiSearch className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
                  <div className="position-relative">
                    <select 
                      className="form-select form-control-premium"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by Status"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Results Count */}
                <div className="col-12 col-sm-6 col-md-3 col-lg-4 text-sm-end text-muted" style={{ fontSize: '0.85rem' }}>
                  Showing {filteredTickets.length} of {tickets.length} tickets
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
                        <th>CATEGORY</th>
                        <th>PRIORITY</th>
                        <th>STATUS</th>
                        <th>SUBMITTED</th>
                        <th className="text-end">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((t) => (
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

export default UserTickets;
