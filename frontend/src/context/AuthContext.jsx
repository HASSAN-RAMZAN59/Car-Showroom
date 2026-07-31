import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('erp_access_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      setUser(response.data);
      localStorage.setItem('erp_user_data', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch current user session:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { access_token } = response.data;
      
      localStorage.setItem('erp_access_token', access_token);
      setToken(access_token);

      // Fetch logged-in user profile
      const userRes = await axiosInstance.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      setUser(userRes.data);
      localStorage.setItem('erp_user_data', JSON.stringify(userRes.data));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check credentials.';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
