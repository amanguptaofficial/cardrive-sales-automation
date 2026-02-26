import axios from 'axios';
import { env } from '../config/env.js';

const api = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthRoute = url.includes('/auth/login') || 
                       url.includes('/auth/signup') || 
                       url.includes('/auth/me') ||
                       url.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        if (isAdminRoute) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminAgent');
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('agent');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${env.API_URL}/auth/refresh`, {
          refreshToken
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        
        if (isAdminRoute) {
          localStorage.setItem('adminToken', token);
          localStorage.setItem('adminRefreshToken', newRefreshToken);
        } else {
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${token}`;
        isRefreshing = false;
        processQueue(null, token);
        
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        if (isAdminRoute) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminAgent');
          localStorage.removeItem('adminRefreshToken');
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('agent');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
