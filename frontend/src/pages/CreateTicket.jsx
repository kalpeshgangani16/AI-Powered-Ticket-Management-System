import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTicket, aiClassify, uploadAttachment } from '../services/api';
import { FiPlusSquare, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiCpu } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const CreateTicket = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  // AI preview states
  const [aiPreview, setAiPreview] = useState(null);

  const handleAiPreview = async () => {
    if (!description.trim()) {
      setError('Please provide a ticket description to get AI predictions');
      return;
    }
    setError('');
    setAiLoading(true);
    setAiPreview(null);

    try {
      const res = await aiClassify({ description });
      setAiPreview({
        category: res.data.category,
        priority: res.data.priority
      });
    } catch (err) {
      console.error("AI classification failed", err);
      setError('AI could not classify. Standard rules will apply.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await createTicket({ title, description });
      const createdTicket = res.data;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await uploadAttachment(createdTicket.id, formData);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error("Create ticket failed", err);
      const errorMsg = err.response?.data?.message || 'Failed to create support ticket. Please try again.';
      setError(errorMsg);
      setLoading(false);
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

  return (
    <div className="app-container">
      <Sidebar showMobile={sidebarMobile} toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

      <main className="main-content">
        <Header toggleMobile={() => setSidebarMobile(!sidebarMobile)} />

        <div className="fade-in">
          {/* Breadcrumb row */}
          <div className="d-flex align-items-center gap-2 mb-4">
            <Link to="/dashboard" className="btn text-muted p-1 border-0">
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h3 className="m-0 font-weight-bold">Create Support Ticket</h3>
              <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Submit a new technical request to IT service desk</p>
            </div>
          </div>

          <div className="row g-4">
            {/* Form Column */}
            <div className="col-12 col-lg-8">
              <div className="glass-panel p-5">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    <FiAlertCircle size={18} />
                    <span style={{ fontSize: '0.85rem' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label-premium">TICKET SUBJECT / TITLE</label>
                    <input 
                      type="text" 
                      className="form-control form-control-premium"
                      placeholder="e.g. VPN not connecting on home network"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label-premium">DETAILED DESCRIPTION</label>
                    <textarea 
                      className="form-control form-control-premium"
                      rows={6}
                      placeholder="Explain the problem in detail. Include any error codes, steps to reproduce, or actions taken. The AI assistant will use this description to auto-classify category and priority."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (aiPreview) setAiPreview(null); // Clear preview when description changes
                      }}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label-premium">ATTACH FILE (OPTIONAL)</label>
                    <div className="custom-file-upload border border-dashed rounded-3 p-3 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <input 
                        type="file" 
                        id="ticket-file" 
                        className="d-none" 
                        onChange={(e) => setSelectedFile(e.target.files[0])} 
                      />
                      <label htmlFor="ticket-file" style={{ cursor: 'pointer', margin: 0, display: 'block' }} className="text-muted">
                        {selectedFile ? (
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <span className="text-white font-weight-bold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                            <button type="button" className="btn btn-sm btn-outline-danger py-0.5 px-2" onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span>Drag and drop or <strong className="text-primary">browse</strong> to attach a file (max 10MB)</span>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <button 
                      type="button" 
                      onClick={handleAiPreview} 
                      className="btn btn-premium-outline d-flex align-items-center gap-2"
                      disabled={aiLoading || !description.trim()}
                    >
                      {aiLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <FiCpu />
                      )}
                      <span>AI Analyze Predict</span>
                    </button>
                    
                    <button 
                      type="submit" 
                      className="btn btn-premium d-flex align-items-center gap-2"
                      disabled={loading}
                    >
                      <FiPlusSquare />
                      <span>Submit Ticket</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* AI Assistant Info Card */}
            <div className="col-12 col-lg-4">
              <div className="glass-panel p-4 mb-4" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <h5 className="font-weight-bold d-flex align-items-center gap-2 mb-3">
                  <FiCpu className="text-primary" />
                  <span>Gemini AI Engine</span>
                </h5>
                <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                  Our service desk leverages Google's Gemini AI to automatically process and route tickets. 
                  Based on the text you write in the description, the AI model predicts:
                </p>
                <ul className="text-muted ps-3 mb-4" style={{ fontSize: '0.85rem' }}>
                  <li className="mb-2"><strong>Category:</strong> Assigns to Hardware, Software, Network, Database, Security, or Other.</li>
                  <li><strong>Priority:</strong> Flags Low, Medium, High, or Critical.</li>
                </ul>

                {aiPreview ? (
                  <div className="glass-panel p-3 border-primary-glow" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}>
                    <div className="d-flex align-items-center gap-2 text-primary mb-3" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      <FiCheckCircle />
                      <span>AI Predictions Ready</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Category:</span>
                      <span className="text-white font-weight-bold" style={{ fontSize: '0.85rem' }}>{aiPreview.category}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Priority:</span>
                      <span className={`badge-premium px-2 py-0.5 ${getPriorityBadgeClass(aiPreview.priority)}`} style={{ fontSize: '0.75rem' }}>
                        {aiPreview.priority}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 border border-dashed rounded-3" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Write description & click Analyze to view AI prediction.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateTicket;
