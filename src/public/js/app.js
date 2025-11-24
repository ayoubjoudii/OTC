// Main Application Module
const App = {
    currentPage: 'home',
    
    // Initialize the application
    init() {
        Auth.init();
        this.setupEventListeners();
        this.handleRoute();
    },

    // Setup event listeners
    setupEventListeners() {
        // Navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            }
        });

        // Event delegation for data-action attributes (secure handling of user data)
        document.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (actionEl) {
                const action = actionEl.dataset.action;
                
                switch (action) {
                    case 'navigate-gallery':
                        const category = actionEl.dataset.category;
                        const artist = actionEl.dataset.artist;
                        const params = {};
                        if (category) params.category = category;
                        if (artist) params.artist = artist;
                        this.navigateTo('gallery', params);
                        break;
                    case 'view-artwork':
                        const artworkId = actionEl.dataset.artworkId;
                        if (artworkId) this.navigateTo('artwork', artworkId);
                        break;
                    case 'toggle-favorite':
                        const favArtworkId = actionEl.dataset.artworkId;
                        if (favArtworkId) Pages.toggleFavorite(favArtworkId, actionEl);
                        break;
                    case 'edit-artwork':
                        const editArtworkId = actionEl.dataset.artworkId;
                        if (editArtworkId) Pages.showArtworkModal(editArtworkId);
                        break;
                    case 'delete-artwork':
                        const deleteArtworkId = actionEl.dataset.artworkId;
                        if (deleteArtworkId) Pages.deleteArtwork(deleteArtworkId);
                        break;
                    case 'edit-category':
                        const editCategoryId = actionEl.dataset.categoryId;
                        if (editCategoryId) Pages.showCategoryModal(editCategoryId);
                        break;
                    case 'delete-category':
                        const deleteCategoryId = actionEl.dataset.categoryId;
                        if (deleteCategoryId) Pages.deleteCategory(deleteCategoryId);
                        break;
                    case 'delete-user':
                        const deleteUserId = actionEl.dataset.userId;
                        if (deleteUserId) Pages.deleteUser(deleteUserId);
                        break;
                }
            }
        });

        // User menu toggle
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', () => {
                userDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-menu')) {
                    userDropdown.classList.remove('active');
                }
            });
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Logout buttons
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
        
        document.getElementById('mobile-logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });

        // Modal close
        document.querySelector('.modal-overlay')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });
    },

    // Navigate to a page
    navigateTo(page, params = null) {
        let url = `#${page}`;
        if (params) {
            if (typeof params === 'string') {
                url += `/${params}`;
            } else {
                const queryString = new URLSearchParams(params).toString();
                if (queryString) url += `?${queryString}`;
            }
        }
        
        window.history.pushState({}, '', url);
        this.handleRoute();
        
        // Close mobile menu
        document.getElementById('mobile-menu')?.classList.add('hidden');
        document.getElementById('user-dropdown')?.classList.remove('active');
    },

    // Handle route changes
    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [page, ...rest] = hash.split('/');
        const params = rest.join('/') || new URLSearchParams(window.location.hash.split('?')[1] || '');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Show loading
        mainContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            let content;
            
            switch (page) {
                case 'home':
                    content = await Pages.home();
                    break;
                case 'gallery':
                    content = await Pages.gallery(typeof params === 'object' ? Object.fromEntries(params) : {});
                    setTimeout(() => Pages.loadGallery(typeof params === 'object' ? Object.fromEntries(params) : {}), 0);
                    break;
                case 'artists':
                    content = await Pages.artists();
                    break;
                case 'login':
                    content = Pages.login();
                    break;
                case 'register':
                    content = Pages.register();
                    break;
                case 'profile':
                    content = await Pages.profile();
                    break;
                case 'favorites':
                    content = await Pages.favorites();
                    break;
                case 'dashboard':
                    content = await Pages.dashboard();
                    break;
                case 'admin':
                    content = await Pages.admin();
                    break;
                case 'artwork':
                    content = await Pages.artworkDetail(rest[0] || params);
                    break;
                default:
                    content = `
                        <div class="empty-state" style="padding: 6rem 1rem;">
                            <i class="fas fa-question-circle"></i>
                            <h3>Page not found</h3>
                            <p>The page you're looking for doesn't exist.</p>
                            <a href="#" data-page="home" class="btn btn-primary" style="margin-top: 1rem;">Go Home</a>
                        </div>
                    `;
            }

            mainContent.innerHTML = content;
            this.currentPage = page;
            
            // Scroll to top
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Error loading page:', error);
            mainContent.innerHTML = `
                <div class="empty-state" style="padding: 6rem 1rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading page</h3>
                    <p>${error.message}</p>
                    <a href="#" data-page="home" class="btn btn-primary" style="margin-top: 1rem;">Go Home</a>
                </div>
            `;
        }
    },

    // Handle form submissions
    async handleFormSubmit(e) {
        const form = e.target;
        
        if (form.id === 'login-form') {
            e.preventDefault();
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            
            const result = await Auth.login(email, password);
            
            if (result.success) {
                this.toast('Welcome back!', 'success');
                this.navigateTo('home');
            } else {
                this.toast(result.message, 'error');
            }
        }
        
        if (form.id === 'register-form') {
            e.preventDefault();
            const username = form.querySelector('#username').value;
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            const role = form.querySelector('#role').value;
            
            const result = await Auth.register(username, email, password, role);
            
            if (result.success) {
                this.toast('Account created successfully!', 'success');
                this.navigateTo('home');
            } else {
                this.toast(result.message, 'error');
            }
        }
        
        if (form.id === 'update-profile-form') {
            e.preventDefault();
            const username = form.querySelector('#username').value;
            const bio = form.querySelector('#bio').value;
            
            const result = await Auth.updateProfile({ username, bio });
            
            if (result.success) {
                this.toast('Profile updated successfully!', 'success');
            } else {
                this.toast(result.message, 'error');
            }
        }
        
        if (form.id === 'change-password-form') {
            e.preventDefault();
            const currentPassword = form.querySelector('#currentPassword').value;
            const newPassword = form.querySelector('#newPassword').value;
            
            const result = await Auth.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                this.toast('Password changed successfully!', 'success');
                form.reset();
            } else {
                this.toast(result.message, 'error');
            }
        }
    },

    // Show toast notification
    toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${Pages.escapeHtml(message)}</span>
        `;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    },

    // Show modal
    showModal(content) {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        
        if (modal && modalContent) {
            modalContent.innerHTML = content;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('modal');
        
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
