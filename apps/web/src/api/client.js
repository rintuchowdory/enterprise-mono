import axios from 'axios';
export const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
});
apiClient.interceptors.response.use((res) => res, (err) => {
    const apiErr = err.response?.data ?? {
        error: 'Network error',
        code: 'NETWORK_ERROR',
    };
    return Promise.reject(apiErr);
});
export async function get(url) {
    const { data } = await apiClient.get(url);
    return data;
}
export async function post(url, body) {
    const { data } = await apiClient.post(url, body);
    return data;
}
export async function patch(url, body) {
    const { data } = await apiClient.patch(url, body);
    return data;
}
export async function del(url) {
    await apiClient.delete(url);
}
