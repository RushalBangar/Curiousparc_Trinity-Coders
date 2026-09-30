// Replace this with your actual Render backend URL once deployed
const PROD_API_URL = "https://your-backend-url.onrender.com/api/v1";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocal ? "http://localhost:8000/api/v1" : PROD_API_URL;

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
                    localStorage.removeItem('user_profile');
                    window.location.href = 'login.html';
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

// Modern, Non-blocking Toast Notification Service
class ToastService {
    static getContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    static show(message, type = 'info', title = null) {
        const container = this.getContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            info: 'Notice',
            warning: 'Warning'
        };

        const iconSymbol = icons[type] || 'ℹ';
        const displayTitle = title || titles[type] || 'Notice';

        toast.innerHTML = `
            <div class="toast-icon" style="color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'}">${iconSymbol}</div>
            <div class="toast-content">
                <div class="toast-title">${displayTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button type="button" class="btn-ghost" style="padding: 0.2rem 0.4rem; font-size: 0.85rem;" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        // Auto remove after 4.5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px) scale(0.95)';
            setTimeout(() => toast.remove(), 250);
        }, 4500);
    }

    static success(msg, title) { this.show(msg, 'success', title); }
    static error(msg, title) { this.show(msg, 'error', title); }
    static info(msg, title) { this.show(msg, 'info', title); }
}

window.ApiClient = ApiClient;
window.Toast = ToastService;
