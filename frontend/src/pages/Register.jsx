import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/api';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiCheckCircle, FiActivity } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiRegister({ name, email, password });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error("Registration failed", err);
      const errorMsg = err.response?.data?.message || 'Registration failed. Email might be in use.';
      setError(errorMsg);
      setLoading(false);
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
          <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Create your IT service desk account</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
            <FiAlertCircle size={18} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 border-0 rounded-3 mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <FiCheckCircle size={18} />
            <span style={{ fontSize: '0.85rem' }}>{success}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit}>
          {/* Hidden dummy fields to capture aggressive browser autofill */}
          <input type="text" style={{ display: 'none' }} name="chrome-dummy-username" />
          <input type="password" style={{ display: 'none' }} name="chrome-dummy-password" />

          <div className="mb-3">
            <label className="form-label-premium">FULL NAME</label>
            <div className="position-relative">
              <input 
                type="text" 
                name="register-name-input"
                className="form-control form-control-premium ps-5"
                placeholder=""
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="one-time-code"
                required
              />
              <FiUser className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label-premium">EMAIL ADDRESS</label>
            <div className="position-relative">
              <input 
                type="email" 
                name="register-email-input"
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
            <label className="form-label-premium">PASSWORD</label>
            <div className="position-relative">
              <input 
                type="password" 
                name="register-password-input"
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
            ) : 'Sign Up'}
          </button>
        </form>

        {/* Login Redirect */}
        <div className="text-center">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Already have an account? </span>
          <Link to="/login" className="text-decoration-none text-white font-weight-bold" style={{ fontSize: '0.85rem' }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
