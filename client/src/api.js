import axios from 'axios';

// Get base URL from environment variables, or default to local backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: API_BASE_URL,
});

export default API;