import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
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
