// Centralized API service — attaches Authorization header from localStorage
import API_URL from '../config/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const api = {
    async get(path) {
        const response = await fetch(`${API_URL}${path}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },

    async post(path, data) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },

    async put(path, data) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },

    async del(path) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },

    async patch(path, data) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },
};

export { getAuthHeaders };
export default api;
