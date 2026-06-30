import axios from 'axios';

// Relative path: in dev this is proxied by Vite to the local API (see
// vite.config.ts), and in production it resolves to the same Vercel
// deployment's serverless function — no hardcoded host, no CORS issue.
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res: any) => res,
  (err: any) => Promise.reject(err),
);

export const get = <T>(url: string) => api.get<T>(url);
export const post = <T>(url: string, data: unknown) => api.post<T>(url, data);
export const patch = <T>(url: string, data: unknown) => api.patch<T>(url, data);
export const del = (url: string) => api.delete(url);
