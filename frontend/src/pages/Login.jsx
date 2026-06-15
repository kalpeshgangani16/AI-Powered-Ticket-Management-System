import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiActivity } from 'react-icons/fi';

const Login = () => {
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    const res = await handleLogin({ email, password });
    setLoading(false);

    if (res.success) {
      if (res.role === 'ROLE_ADMIN' || res.role === 'ROLE_SUPPORT_ENGINEER') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center min-vh-100 px-3">
      <div className="glass-panel p-5 w-100 shadow-lg" style={{ maxWidth: '440px' }}>
        
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="bg-primary text-white rounded-3 p-2 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '50px', height: '50px' }}>
            <FiActivity size={28} />
          </div>
          <h2 className="font-weight-bold text-gradient">DeskFlow AI</h2>
          <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Login to manage enterprise support requests</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
            <FiAlertCircle size={18} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Hidden dummy fields to capture aggressive browser autofill */}
          <input type="text" style={{ display: 'none' }} name="chrome-dummy-username" />
          <input type="password" style={{ display: 'none' }} name="chrome-dummy-password" />

          <div className="mb-4">
            <label className="form-label-premium">EMAIL ADDRESS</label>
            <div className="position-relative">
              <input 
                type="email" 
                name="login-email-input"
                className="form-control form-control-premium ps-5"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="one-time-code"
                required
              />
              <FiMail className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label className="form-label-premium m-0">PASSWORD</label>
              <a href="#" className="text-decoration-none text-muted" style={{ fontSize: '0.75rem' }}>Forgot password?</a>
            </div>
            <div className="position-relative">
              <input 
                type="password" 
                name="login-password-input"
                className="form-control form-control-premium ps-5"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="one-time-code"
                required
              />
              <FiLock className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-premium w-100 py-2.5 mb-4"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Register Redirect */}
        <div className="text-center">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Don't have an account? </span>
          <Link to="/register" className="text-decoration-none text-white font-weight-bold" style={{ fontSize: '0.85rem' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
