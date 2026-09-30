class Auth {
    static async login(email, password) {
        const data = await window.ApiClient.post('/auth/login', { email, password });
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            // Fetch user profile to know redirect path
            await this.fetchAndStoreProfile();
        }
        return true;
    }

    static async register(userData) {
        const data = await window.ApiClient.post('/auth/signup', userData);
        if (data.session && data.session.access_token) {
            localStorage.setItem('access_token', data.session.access_token);
            await this.fetchAndStoreProfile();
        }
        return true;
    }

    static async fetchAndStoreProfile() {
        try {
            const profile = await window.ApiClient.get('/users/me');
            localStorage.setItem('user_profile', JSON.stringify(profile));
            
            // Redirect based on role
            if (profile.role === 'recruiter') {
                window.location.href = 'recruiter-dashboard.html';
            } else {
                window.location.href = 'candidate-dashboard.html';
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    }

    static logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_profile');
        window.location.href = 'index.html';
    }

    static getProfile() {
        const profileData = localStorage.getItem('user_profile');
        return profileData ? JSON.parse(profileData) : null;
    }
    
    static isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }
    
    static protectRoute(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        const profile = this.getProfile();
        if (profile && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
            window.location.href = 'index.html'; // Or forbidden page
        }
    }
}

window.Auth = Auth;
