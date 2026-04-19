import axios from 'axios';

/**
 * FlatSell Axios Instance
 * withCredentials: true  ← sends HttpOnly JWT cookie on every request automatically
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Response interceptor — handle auth errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) window.dispatchEvent(new CustomEvent('auth:expired'));
    if (status === 403) window.dispatchEvent(new CustomEvent('auth:forbidden'));
    return Promise.reject(error);
  }
);

export default axiosInstance;
