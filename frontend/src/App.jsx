import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import UserTickets from './pages/UserTickets';
import TicketDetails from './pages/TicketDetails';
import AdminDashboard from './pages/AdminDashboard';
import TicketManagement from './pages/TicketManagement';
import UserManagement from './pages/UserManagement';

// Private Route Guard (Authenticated Users Only)
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/login" replace />;
};

// Staff Route Guard (Admins & Support Engineers Only)
const StaffRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" replace />;
  const isStaff = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPPORT_ENGINEER';
  return isStaff ? children : <Navigate to="/dashboard" replace />;
};

// Admin Route Guard (Admins Only)
const AdminRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'ROLE_ADMIN' ? children : <Navigate to="/dashboard" replace />;
};

// Employee Route Guard (Employees Only)
const EmployeeRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'ROLE_USER' ? children : <Navigate to="/admin/dashboard" replace />;
};

// Default Route Redirector (Redirect based on Auth status and Role)
const DefaultRedirect = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  const isStaff = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPPORT_ENGINEER';
  return isStaff 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User Support Portal Routes */}
      <Route path="/dashboard" element={
        <EmployeeRoute>
          <Dashboard />
        </EmployeeRoute>
      } />
      <Route path="/tickets/create" element={
        <EmployeeRoute>
          <CreateTicket />
        </EmployeeRoute>
      } />
      <Route path="/tickets/my" element={
        <EmployeeRoute>
          <UserTickets />
        </EmployeeRoute>
      } />

      {/* Shared Route (both Employee and Admin/Support Engineer) */}
      <Route path="/tickets/:id" element={
        <PrivateRoute>
          <TicketDetails />
        </PrivateRoute>
      } />

      {/* Admin Panel Routes */}
      <Route path="/admin/dashboard" element={
        <StaffRoute>
          <AdminDashboard />
        </StaffRoute>
      } />
      <Route path="/admin/tickets" element={
        <StaffRoute>
          <TicketManagement />
        </StaffRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      } />

      {/* Default Catch-all */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

export default App;
