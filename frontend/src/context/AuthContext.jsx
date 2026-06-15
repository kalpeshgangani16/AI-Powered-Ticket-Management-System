import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, getUserProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ticket_system_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const res = await getUserProfile();
          setUser(res.data);
        } catch (err) {
          console.error("Failed to load user profile on startup", err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [token]);

  const handleLogin = async (credentials) => {
    try {
      const res = await apiLogin(credentials);
      const { token: jwtToken, name, email, role } = res.data;
      
      localStorage.setItem('ticket_system_token', jwtToken);
      setToken(jwtToken);
      setUser({ name, email, role });
      return { success: true, role };
    } catch (err) {
      console.error("Login failed", err);
      const errorMsg = err.response?.data?.message || 'Invalid email or password';
      return { success: false, error: errorMsg };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ticket_system_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
