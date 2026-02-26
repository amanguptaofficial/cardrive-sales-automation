import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.agent) {
        setAgent(response.data.agent);
        localStorage.setItem('agent', JSON.stringify(response.data.agent));
        localStorage.setItem('token', token);
      } else {
        const storedAgent = localStorage.getItem('agent');
        if (storedAgent) {
          try {
            setAgent(JSON.parse(storedAgent));
          } catch (e) {
            console.error('Error parsing stored agent:', e);
          }
        }
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('agent');
          setAgent(null);
        } else {
          const storedAgent = localStorage.getItem('agent');
          if (storedAgent) {
            try {
              setAgent(JSON.parse(storedAgent));
            } catch (e) {
              console.error('Error parsing stored agent:', e);
            }
          }
        }
      } else {
        const storedAgent = localStorage.getItem('agent');
        const storedToken = localStorage.getItem('token');
        if (storedAgent && storedToken) {
          try {
            setAgent(JSON.parse(storedAgent));
          } catch (e) {
            console.error('Error parsing stored agent:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedAgent = localStorage.getItem('agent');

    if (token) {
      if (storedAgent) {
        try {
          const parsedAgent = JSON.parse(storedAgent);
          setAgent(parsedAgent);
        } catch (e) {
          console.error('Error parsing stored agent:', e);
        }
      }
      checkAuth();
    } else {
      setAgent(null);
      setLoading(false);
    }
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('agent', JSON.stringify(response.data.agent));
        setAgent(response.data.agent);
        return response.data;
      }
      throw new Error('Login failed');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('agent');
        setAgent(null);
      }
      throw error;
    }
  };

  const signup = async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('agent');
      setAgent(null);
    }
  };

  const refreshAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ agent, login, signup, logout, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
