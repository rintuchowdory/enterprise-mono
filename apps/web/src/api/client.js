import axios from 'axios';
const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: { 'Content-Type': 'application/json' },
});
api.interceptors.response.use((res) => res, (err) => Promise.reject(err));
export const get = (url) => api.get(url);
export const post = (url, data) => api.post(url, data);
export const patch = (url, data) => api.patch(url, data);
export const del = (url) => api.delete(url);
