import axios from 'axios';

// Dynamically determine API base URL
const getBaseURL = () => {
  // 1. Explicit environment variable (e.g. set in Vercel Dashboard)
  if (import.meta.env.VITE_API_URL) {
    const customUrl = import.meta.env.VITE_API_URL.trim();
    return customUrl.endsWith('/api') ? customUrl : `${customUrl.replace(/\/$/, '')}/api`;
  }

  // 2. Local development on localhost or 127.0.0.1
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }

  // 3. Production (Vercel, etc.) - use relative /api
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Provide friendly error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      if (error.code === 'ERR_NETWORK') {
        error.message = 'Backend connection error. Please ensure the server is running or Vercel API is configured.';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
