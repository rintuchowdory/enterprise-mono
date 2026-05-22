import axios from 'axios';
import type { ApiResponse, ApiError } from '@repo/shared';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const apiErr: ApiError = err.response?.data ?? {
      error: 'Network error',
      code: 'NETWORK_ERROR',
    };
    return Promise.reject(apiErr);
  }
);

export async function get<T>(url: string): Promise<ApiResponse<T>> {
  const { data } = await apiClient.get<ApiResponse<T>>(url);
  return data;
}
export async function post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const { data } = await apiClient.post<ApiResponse<T>>(url, body);
  return data;
}
export async function patch<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const { data } = await apiClient.patch<ApiResponse<T>>(url, body);
  return data;
}
export async function del(url: string): Promise<void> {
  await apiClient.delete(url);
}
