import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: { 'Content-Type': 'application/json' },
});
api.interceptors.response.use((res) => res, (err) => Promise.reject(err));
export { api };
