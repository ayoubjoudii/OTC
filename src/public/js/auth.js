// Authentication Module
const Auth = {
    user: null,
    
    // Initialize auth state from localStorage
    init() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                this.user = JSON.parse(userData);
                this.updateUI();
            } catch (e) {
                this.logout();
            }
        }
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!this.user && !!API.getToken();
    },

    // Check if user has a specific role
    hasRole(...roles) {
        return this.isLoggedIn() && roles.includes(this.user.role);
    },

    // Login user
    async login(email, password) {
        try {
            const response = await API.auth.login({ email, password });
            this.user = response.user;
            API.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.updateUI();
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Register user
    async register(username, email, password, role = 'visitor') {
        try {
            const response = await API.auth.register({ username, email, password, role });
            this.user = response.user;
            API.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.updateUI();
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Logout user
    logout() {
        this.user = null;
        API.removeToken();
        localStorage.removeItem('user');
        this.updateUI();
        App.navigateTo('home');
    },

    // Update profile
    async updateProfile(data) {
        try {
            const response = await API.auth.updateProfile(data);
            this.user = { ...this.user, ...response.user };
            localStorage.setItem('user', JSON.stringify(this.user));
            this.updateUI();
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await API.auth.changePassword({ currentPassword, newPassword });
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Update UI based on auth state
    updateUI() {
        const navAuth = document.getElementById('nav-auth');
        const navUser = document.getElementById('nav-user');
        const usernameDisplay = document.getElementById('username-display');
        const dashboardLink = document.getElementById('dashboard-link');
        const adminLink = document.getElementById('admin-link');
        const mobileAuth = document.getElementById('mobile-auth');
        const mobileUser = document.getElementById('mobile-user');
        const mobileDashboard = document.querySelector('.mobile-dashboard');
        const mobileAdmin = document.querySelector('.mobile-admin');

        if (this.isLoggedIn()) {
            navAuth.classList.add('hidden');
            navUser.classList.remove('hidden');
            usernameDisplay.textContent = this.user.username;
            
            mobileAuth.classList.add('hidden');
            mobileUser.classList.remove('hidden');

            // Show dashboard for artists/admins
            if (this.hasRole('artist', 'admin')) {
                dashboardLink.classList.remove('hidden');
                mobileDashboard.classList.remove('hidden');
            } else {
                dashboardLink.classList.add('hidden');
                mobileDashboard.classList.add('hidden');
            }

            // Show admin link for admins
            if (this.hasRole('admin')) {
                adminLink.classList.remove('hidden');
                mobileAdmin.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
                mobileAdmin.classList.add('hidden');
            }
        } else {
            navAuth.classList.remove('hidden');
            navUser.classList.add('hidden');
            
            mobileAuth.classList.remove('hidden');
            mobileUser.classList.add('hidden');
        }
    }
};
