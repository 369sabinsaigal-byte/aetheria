import axios from 'axios';

// Point to your local backend
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'}/api`;

export const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging and authentication
API.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    
    // Add authentication headers for demo mode
    if (!config.headers['Authorization'] && !config.headers['x-user-id']) {
      config.headers['x-user-id'] = 'demo-user-id';
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    console.log(`Response received:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);