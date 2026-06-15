import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization header automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ticket_system_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);
export const getUserProfile = () => API.get('/users/profile');

// Ticket endpoints
export const getTickets = () => API.get('/tickets');
export const getTicketDetails = (id) => API.get(`/tickets/${id}`);
export const createTicket = (ticketData) => API.post('/tickets', ticketData);
export const updateTicket = (id, ticketData) => API.put(`/tickets/${id}`, ticketData);
export const deleteTicket = (id) => API.delete(`/tickets/${id}`);
export const getUserStats = () => API.get('/tickets/stats');

// Admin endpoints
export const adminGetUsers = () => API.get('/admin/users');
export const adminGetTickets = () => API.get('/admin/tickets');
export const adminCreateUser = (userData) => API.post('/admin/users', userData);
export const adminDeleteUser = (id) => API.delete(`/admin/users/${id}`);
export const adminAssignTicket = (assignment) => API.put('/admin/assign-ticket', assignment);
export const adminUpdateTicketStatus = (statusUpdate) => API.put('/admin/update-status', statusUpdate);
export const adminGetStats = () => API.get('/admin/stats');

// AI endpoints
export const aiClassify = (classifyData) => API.post('/ai/classify', classifyData);

// Comments endpoints
export const getComments = (ticketId) => API.get(`/tickets/${ticketId}/comments`);
export const createComment = (ticketId, commentData) => API.post(`/tickets/${ticketId}/comments`, commentData);

// Attachments endpoints
export const uploadAttachment = (ticketId, formData) => API.post(`/tickets/${ticketId}/attachments`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const downloadAttachment = (id) => API.get(`/attachments/${id}`, { responseType: 'blob' });

export default API;
