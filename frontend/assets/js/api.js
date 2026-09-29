const API_BASE_URL = "http://localhost:8000/api/v1";

class ApiClient {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        // Setup headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Inject JWT token if exists
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // Auto-logout if token is expired/invalid (401)
                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    window.location.href = '/login.html';
                }
                throw new Error(data?.detail || data?.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    static post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

window.ApiClient = ApiClient;
