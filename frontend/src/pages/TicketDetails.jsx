import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getTicketDetails, 
  updateTicket, 
  deleteTicket, 
  adminGetUsers, 
  adminAssignTicket, 
  adminUpdateTicketStatus,
  getComments,
  createComment,
  downloadAttachment
} from '../services/api';
import { 
  FiArrowLeft, FiEdit, FiTrash2, FiUserCheck, FiRefreshCw, FiAlertCircle, 
  FiUser, FiMail, FiCpu, FiTag, FiClock, FiFileText, FiCheckCircle,
  FiPaperclip, FiDownload, FiSend, FiMessageSquare
} from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarMobile, setSidebarMobile] = useState(false);

  // Edit Mode (User only)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Admin Assignment and Status States
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // New Comments and Attachments States
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitCommentLoading, setSubmitCommentLoading] = useState(false);

  const isStaff = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPPORT_ENGINEER';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await getComments(id);
      setComments(res.data);
    } catch (err) {
      console.error("Error loading comments", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await getTicketDetails(id);
      setTicket(res.data);
      setEditTitle(res.data.title);
      setEditDescription(res.data.description);
      setSelectedStatus(res.data.status);
      setSelectedAssignee(res.data.assignedTo?.id || '');

      // Load users list for assign dropdown if Admin only
      if (isAdmin) {
        const usersRes = await adminGetUsers();
        setAdminUsers(usersRes.data);
      }

      await loadComments();
    } catch (err) {
      console.error("Error loading ticket details", err);
      setError('Could not retrieve ticket details. You may not have permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setError('');
    setSubmitCommentLoading(true);
    try {
      const res = await createComment(id, { text: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error("Failed to add comment", err);
      setError(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setSubmitCommentLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      setError('');
      const res = await downloadAttachment(attachmentId);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      setError("Failed to download file attachment.");
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEditLoading(true);

    try {
      const res = await updateTicket(id, { title: editTitle, description: editDescription });
      setTicket(res.data);
      setIsEditing(false);
      setSuccess('Ticket updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Update failed", err);
      setError(err.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }
    setError('');

    try {
      await deleteTicket(id);
      navigate('/dashboard');
    } catch (err) {
      console.error("Delete failed", err);
      setError(err.response?.data?.message || 'Failed to delete ticket.');
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;
    setError('');
    setSuccess('');

    try {
      const res = await adminAssignTicket({ ticketId: ticket.id, userId: selectedAssignee });
      setTicket(res.data);
      setSelectedStatus(res.data.status); // Auto transitions status to IN_PROGRESS in backend
      setSuccess('Ticket assigned successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Assignment failed", err);
      setError(err.response?.data?.message || 'Failed to assign ticket.');
    }
  };

  const handleStatusChange = async (statusVal) => {
    setError('');
    setSuccess('');

    try {
      const res = await adminUpdateTicketStatus({ ticketId: ticket.id, status: statusVal });
      setTicket(res.data);
      setSelectedStatus(statusVal);
      setSuccess('Status updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Status update failed", err);
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

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
              <span className="visually-hidden">Loading ticket details...</span>
            </div>
          </div>
        ) : error && !ticket ? (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-3 border-0 rounded-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : (
          <div className="fade-in">
            {/* Header row */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <button onClick={() => navigate(-1)} className="btn text-muted p-1 border-0">
                  <FiArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="m-0 font-weight-bold">Ticket #{ticket.id}</h3>
                  <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Track, view details and coordinate support request</p>
                </div>
              </div>

              {/* Edit/Delete Actions for Owners in OPEN state */}
              {!isStaff && ticket.status === 'OPEN' && !isEditing && (
                <div className="d-flex gap-2">
                  <button onClick={() => setIsEditing(true)} className="btn btn-premium-outline d-flex align-items-center gap-2">
                    <FiEdit size={16} />
                    <span>Edit</span>
                  </button>
                  <button onClick={handleDelete} className="btn btn-outline-danger d-flex align-items-center gap-2">
                    <FiTrash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error and Success Alerts */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                <FiAlertCircle size={18} />
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <FiCheckCircle size={18} />
                <span style={{ fontSize: '0.85rem' }}>{success}</span>
              </div>
            )}

            <div className="row g-4">
              {/* Primary ticket info details */}
              <div className="col-12 col-lg-8">
                {isEditing ? (
                  <div className="glass-panel p-5">
                    <h5 className="font-weight-bold mb-4">Edit Ticket Information</h5>
                    <form onSubmit={handleUpdate}>
                      <div className="mb-4">
                        <label className="form-label-premium">TICKET SUBJECT / TITLE</label>
                        <input 
                          type="text" 
                          className="form-control form-control-premium"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label-premium">DETAILED DESCRIPTION</label>
                        <textarea 
                          className="form-control form-control-premium"
                          rows={6}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          required
                        ></textarea>
                      </div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-premium" disabled={editLoading}>
                          {editLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-premium-outline">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="glass-panel p-5">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
                      <span className={`badge badge-premium ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`badge-premium ${getPriorityBadgeClass(ticket.priority)}`}>
                        {ticket.priority} Priority
                      </span>
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 rounded-3 d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                        <FiTag size={12} />
                        {ticket.category}
                      </span>
                    </div>

                    <h4 className="font-weight-bold mb-4 text-white">{ticket.title}</h4>
                    
                    <h6 className="form-label-premium font-weight-bold border-bottom pb-2 mb-3" style={{ borderColor: 'var(--border-color) !important' }}>
                      DESCRIPTION
                    </h6>
                    <p className="text-white-50" style={{ fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {ticket.description}
                    </p>
                  </div>
                )}

                {/* Attachments Section */}
                <div className="glass-panel p-4 mt-4">
                  <h5 className="font-weight-bold d-flex align-items-center gap-2 border-bottom pb-2 mb-3" style={{ borderColor: 'var(--border-color) !important' }}>
                    <FiPaperclip className="text-primary" />
                    <span>Attachments ({ticket.attachments?.length || 0})</span>
                  </h5>
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {ticket.attachments.map(att => (
                        <div key={att.id} className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border w-100" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                          <div className="d-flex align-items-center gap-2.5">
                            <FiFileText className="text-primary" size={20} />
                            <div className="text-start">
                              <span className="text-white d-block text-truncate" style={{ fontSize: '0.85rem', maxWidth: '250px', fontWeight: 500 }}>
                                {att.fileName}
                              </span>
                              <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                {att.fileType} • {new Date(att.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownloadAttachment(att.id, att.fileName)} 
                            className="btn btn-sm btn-premium-outline py-1.5 px-3 d-flex align-items-center gap-1.5"
                            title="Download file"
                          >
                            <FiDownload size={14} />
                            <span style={{ fontSize: '0.75rem' }}>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted m-0 italic text-center py-2" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                      No attachments uploaded.
                    </p>
                  )}
                </div>

                {/* AI Triaging & Diagnostic Report Card */}
                {ticket.department && (
                  <div className="glass-panel p-4.5 mt-4" style={{ borderLeft: '4px solid #6366f1', background: 'rgba(99, 102, 241, 0.03)' }}>
                    <h5 className="font-weight-bold d-flex align-items-center gap-2 border-bottom pb-2.5 mb-4" style={{ borderColor: 'var(--border-color) !important', color: '#a5b4fc' }}>
                      <FiCpu className="animate-pulse" />
                      <span>AI Triage & Operations Diagnostic</span>
                    </h5>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-sm-6">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                          <span className="text-muted d-block mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em' }}>ROUTED DEPARTMENT</span>
                          <strong className="text-white" style={{ fontSize: '0.88rem' }}>{ticket.department.replace('_', ' ')}</strong>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                          <span className="text-muted d-block mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em' }}>REQUIRED ENGINEER SKILLSET</span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style={{ fontSize: '0.75rem', whiteSpace: 'normal', textAlign: 'left', lineHeight: '1.3' }}>
                            {ticket.engineerSkill || 'General support'}
                          </span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                          <span className="text-muted d-block mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em' }}>ASSIGNMENT HINT</span>
                          <strong className="text-white" style={{ fontSize: '0.88rem' }}>{ticket.assignmentHint || 'Regular assignment queue'}</strong>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                          <span className="text-muted d-block mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em' }}>PREDICTED ROOT CAUSE</span>
                          <p className="text-white-50 m-0" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>{ticket.rootCause || 'Under investigation.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggested Troubleshooting */}
                    {ticket.aiResolution && ticket.aiResolution.length > 0 && (
                      <div className="pt-3 border-top" style={{ borderColor: 'var(--border-color) !important' }}>
                        <h6 className="font-weight-bold text-white mb-3" style={{ fontSize: '0.85rem', letterSpacing: '0.03em' }}>AI RECOMMENDATIONS & TROUBLESHOOTING GUIDE</h6>
                        <div className="d-flex flex-column gap-2">
                          {ticket.aiResolution.map((step, idx) => (
                            <div key={idx} className="d-flex align-items-start gap-2.5 p-2 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                              <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                                    style={{ width: '22px', height: '22px', fontSize: '0.75rem', fontWeight: 600, marginTop: '2px', backgroundColor: 'rgba(99, 102, 241, 0.25)' }}>
                                {idx + 1}
                              </span>
                              <p className="text-white-50 m-0" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div className="glass-panel p-4 mt-4">
                  <h5 className="font-weight-bold d-flex align-items-center gap-2 border-bottom pb-2 mb-4" style={{ borderColor: 'var(--border-color) !important' }}>
                    <FiMessageSquare className="text-primary" />
                    <span>Discussion Thread ({comments.length})</span>
                  </h5>

                  {/* Comments Timeline */}
                  <div className="comments-timeline mb-4 pe-1" style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {commentsLoading ? (
                      <div className="text-center py-3">
                        <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                        <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>Loading messages...</span>
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map(c => {
                        const isMe = c.user.email === user?.email;
                        return (
                          <div key={c.id} className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="font-weight-bold text-white" style={{ fontSize: '0.8rem' }}>
                                {c.user.name}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(c.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div 
                              className={`p-3 rounded-3 ${isMe ? 'bg-primary text-white' : 'glass-panel text-white-50'}`} 
                              style={{ 
                                maxWidth: '85%', 
                                fontSize: '0.88rem', 
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                backgroundColor: isMe ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                                border: isMe ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)'
                              }}
                            >
                              {c.text}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted m-0 italic text-center py-4" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                        No messages yet. Send a message to start the conversation.
                      </p>
                    )}
                  </div>

                  {/* Send Comment Form */}
                  <form onSubmit={handleCommentSubmit} className="d-flex gap-2">
                    <textarea
                      className="form-control form-control-premium py-2"
                      rows={2}
                      placeholder="Type your message here..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      style={{ resize: 'none' }}
                    ></textarea>
                    <button 
                      type="submit" 
                      className="btn btn-premium px-4 d-flex align-items-center justify-content-center"
                      disabled={submitCommentLoading || !newComment.trim()}
                    >
                      {submitCommentLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <FiSend size={18} />
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar metadata column */}
              <div className="col-12 col-lg-4">
                {/* Admin Actions Panel */}
                {isStaff && (
                  <div className="glass-panel p-4 mb-4">
                    <h5 className="font-weight-bold border-bottom pb-2 mb-3" style={{ borderColor: 'var(--border-color) !important' }}>
                      Ticket Actions
                    </h5>

                    {/* Status Select */}
                    <div className="mb-4">
                      <label className="form-label-premium">UPDATE STATUS</label>
                      <div className="d-flex gap-2">
                        <select 
                          className="form-select form-control-premium py-1.5"
                          value={selectedStatus}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          aria-label="Select Ticket Status"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    </div>

                    {/* Assignee Select - Admin Only */}
                    {isAdmin && (
                      <div className="mb-2">
                        <label className="form-label-premium">ASSIGN TICKET</label>
                        <div className="d-flex gap-2">
                          <select 
                            className="form-select form-control-premium py-1.5"
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            aria-label="Select Assignee"
                          >
                            <option value="">-- Select Support Engineer --</option>
                            {adminUsers
                              .filter(u => u.role === 'ROLE_ADMIN' || u.role === 'ROLE_SUPPORT_ENGINEER')
                              .map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.role === 'ROLE_ADMIN' ? 'Admin' : 'Support Engineer'}{u.department ? ` - ${u.department.replace('_', ' ')}` : ''})
                                </option>
                              ))
                            }
                          </select>
                          <button onClick={handleAssign} className="btn btn-premium py-1.5 px-3 d-flex align-items-center justify-content-center">
                            <FiUserCheck size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata Panel */}
                <div className="glass-panel p-4">
                  <h5 className="font-weight-bold border-bottom pb-2 mb-3" style={{ borderColor: 'var(--border-color) !important' }}>
                    Metadata
                  </h5>

                  {/* Owner */}
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <FiUser className="text-muted mt-1" size={16} />
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>CREATED BY</span>
                      <strong className="text-white d-block" style={{ fontSize: '0.85rem' }}>{ticket.createdBy.name}</strong>
                      <span className="text-muted text-break" style={{ fontSize: '0.75rem' }}>{ticket.createdBy.email}</span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="d-flex align-items-start gap-3 mb-3 border-top pt-3" style={{ borderColor: 'var(--border-color) !important' }}>
                    <FiUserCheck className="text-muted mt-1" size={16} />
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>ASSIGNED TO</span>
                      {ticket.assignedTo ? (
                        <>
                          <strong className="text-white d-block" style={{ fontSize: '0.85rem' }}>{ticket.assignedTo.name}</strong>
                          <span className="text-muted text-break" style={{ fontSize: '0.75rem' }}>{ticket.assignedTo.email}</span>
                        </>
                      ) : (
                        <span className="text-muted-50 d-block italic" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="d-flex align-items-start gap-3 mb-3 border-top pt-3" style={{ borderColor: 'var(--border-color) !important' }}>
                    <FiClock className="text-muted mt-1" size={16} />
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>CREATED</span>
                      <span className="text-white d-block" style={{ fontSize: '0.85rem' }}>
                        {new Date(ticket.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>LAST UPDATED</span>
                      <span className="text-white d-block" style={{ fontSize: '0.85rem' }}>
                        {new Date(ticket.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* AI Classification Tag */}
                  <div className="d-flex align-items-start gap-3 border-top pt-3" style={{ borderColor: 'var(--border-color) !important' }}>
                    <FiCpu className="text-muted mt-1" size={16} />
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>AI CLASSIFIER ROUTE</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle mt-1.5 px-2.5 py-1" style={{ fontSize: '0.7rem' }}>
                        Gemini Automatic
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TicketDetails;
