// API Helper Module
const API = {
    baseUrl: '/api',
    
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Set auth token
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // Remove auth token
    removeToken() {
        localStorage.removeItem('token');
    },

    // Create headers with auth if available
    getHeaders(includeAuth = true, isFormData = false) {
        const headers = {};
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (includeAuth && this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
        }
        
        return headers;
    },

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const isFormData = options.body instanceof FormData;
        
        const config = {
            method: options.method || 'GET',
            headers: this.getHeaders(options.auth !== false, isFormData),
        };

        if (options.body) {
            config.body = isFormData ? options.body : JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.error || data.errors?.[0]?.msg || 'An error occurred',
                    errors: data.errors
                };
            }

            return data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw { status: 0, message: 'Network error. Please check your connection.' };
        }
    },

    // Auth endpoints
    auth: {
        register(data) {
            return API.request('/auth/register', { method: 'POST', body: data, auth: false });
        },
        login(data) {
            return API.request('/auth/login', { method: 'POST', body: data, auth: false });
        },
        getProfile() {
            return API.request('/auth/profile');
        },
        updateProfile(data) {
            return API.request('/auth/profile', { method: 'PUT', body: data });
        },
        changePassword(data) {
            return API.request('/auth/password', { method: 'PUT', body: data });
        },
        getArtists() {
            return API.request('/auth/artists', { auth: false });
        },
        getAllUsers() {
            return API.request('/auth/users');
        },
        updateUserRole(userId, role) {
            return API.request(`/auth/users/${userId}/role`, { method: 'PUT', body: { role } });
        },
        deleteUser(userId) {
            return API.request(`/auth/users/${userId}`, { method: 'DELETE' });
        }
    },

    // Artwork endpoints
    artworks: {
        getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return API.request(`/artworks${queryString ? '?' + queryString : ''}`, { auth: false });
        },
        getFeatured(limit = 8) {
            return API.request(`/artworks/featured?limit=${limit}`, { auth: false });
        },
        getById(id) {
            return API.request(`/artworks/${id}`, { auth: false });
        },
        getMyArtworks() {
            return API.request('/artworks/artist/me');
        },
        create(formData) {
            return API.request('/artworks', { method: 'POST', body: formData });
        },
        update(id, formData) {
            return API.request(`/artworks/${id}`, { method: 'PUT', body: formData });
        },
        delete(id) {
            return API.request(`/artworks/${id}`, { method: 'DELETE' });
        }
    },

    // Category endpoints
    categories: {
        getAll() {
            return API.request('/categories', { auth: false });
        },
        getById(id) {
            return API.request(`/categories/${id}`, { auth: false });
        },
        create(data) {
            return API.request('/categories', { method: 'POST', body: data });
        },
        update(id, data) {
            return API.request(`/categories/${id}`, { method: 'PUT', body: data });
        },
        delete(id) {
            return API.request(`/categories/${id}`, { method: 'DELETE' });
        }
    },

    // Favorite endpoints
    favorites: {
        getAll() {
            return API.request('/favorites');
        },
        add(artworkId) {
            return API.request('/favorites', { method: 'POST', body: { artworkId } });
        },
        remove(artworkId) {
            return API.request(`/favorites/${artworkId}`, { method: 'DELETE' });
        },
        check(artworkId) {
            return API.request(`/favorites/check/${artworkId}`);
        }
    }
};
