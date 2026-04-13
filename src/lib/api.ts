import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});


// Request interceptor: attach token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwraps the { status, data, message } envelope
api.interceptors.response.use((response) => {
  const { data } = response;
  
  // Extract token
  const token = data?.data?.token || data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }

  // If the backend returned an envelope, unwrap it into response.data
  if (data && typeof data === 'object' && 'status' in data && 'data' in data) {
    response.data = data.data;
  }

  return response;
}, (error) => {


  if (error.response?.status === 401) {
    localStorage.removeItem('token');
  }
  return Promise.reject(error);
});

export default api;
