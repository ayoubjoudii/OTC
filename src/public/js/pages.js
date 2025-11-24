// Pages Module - Renders different pages
const Pages = {
    // Home Page
    async home() {
        const featuredArtworks = await API.artworks.getFeatured(8);
        const categories = await API.categories.getAll();
        
        return `
            <section class="hero">
                <div class="container">
                    <h1>Discover Extraordinary Art</h1>
                    <p>Explore a curated collection of unique artworks from talented artists around the world. Find your perfect piece today.</p>
                    <div class="hero-buttons">
                        <a href="#" data-page="gallery" class="btn btn-primary btn-lg">
                            <i class="fas fa-images"></i> Browse Gallery
                        </a>
                        ${!Auth.isLoggedIn() ? `
                            <a href="#" data-page="register" class="btn btn-outline btn-lg" style="border-color: white; color: white;">
                                <i class="fas fa-user-plus"></i> Join as Artist
                            </a>
                        ` : ''}
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <div class="section-title">
                        <h2>Featured Artworks</h2>
                        <p>Handpicked selections from our gallery</p>
                    </div>
                    ${featuredArtworks.length > 0 ? `
                        <div class="artwork-grid">
                            ${featuredArtworks.map(artwork => this.renderArtworkCard(artwork)).join('')}
                        </div>
                        <div class="text-center" style="margin-top: 2rem;">
                            <a href="#" data-page="gallery" class="btn btn-secondary">View All Artworks</a>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-palette"></i>
                            <h3>No artworks yet</h3>
                            <p>Check back soon for amazing artwork!</p>
                        </div>
                    `}
                </div>
            </section>

            ${categories.length > 0 ? `
                <section class="section" style="background: white;">
                    <div class="container">
                        <div class="section-title">
                            <h2>Browse by Category</h2>
                            <p>Find art that speaks to you</p>
                        </div>
                        <div class="artwork-grid">
                            ${categories.map(cat => `
                                <div class="artist-card" data-action="navigate-gallery" data-category="${this.escapeAttr(cat.id)}">
                                    <div class="artist-avatar">
                                        <i class="fas fa-folder"></i>
                                    </div>
                                    <h3>${this.escapeHtml(cat.name)}</h3>
                                    <p>${cat.description ? this.escapeHtml(cat.description) : 'Explore this category'}</p>
                                    <div class="artwork-count">
                                        <i class="fas fa-image"></i> ${cat.artwork_count} artwork${cat.artwork_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            ` : ''}
        `;
    },

    // Gallery Page
    async gallery(params = {}) {
        const categories = await API.categories.getAll();
        
        return `
            <section class="section">
                <div class="container">
                    <div class="section-title">
                        <h2>Art Gallery</h2>
                        <p>Discover unique artworks from talented artists</p>
                    </div>
                    
                    <div class="filter-bar">
                        <input type="text" id="search-input" placeholder="Search artworks..." value="${params.search || ''}">
                        <select id="category-filter">
                            <option value="">All Categories</option>
                            ${categories.map(cat => `
                                <option value="${cat.id}" ${params.category === cat.id ? 'selected' : ''}>${this.escapeHtml(cat.name)}</option>
                            `).join('')}
                        </select>
                        <select id="price-filter">
                            <option value="">Any Price</option>
                            <option value="0-100">Under $100</option>
                            <option value="100-500">$100 - $500</option>
                            <option value="500-1000">$500 - $1,000</option>
                            <option value="1000-">Over $1,000</option>
                        </select>
                        <button class="btn btn-primary" onclick="Pages.applyFilters()">
                            <i class="fas fa-search"></i> Search
                        </button>
                    </div>
                    
                    <div id="gallery-content">
                        <div class="loading"><div class="spinner"></div></div>
                    </div>
                    
                    <div id="gallery-pagination" class="pagination"></div>
                </div>
            </section>
        `;
    },

    // Load gallery content
    async loadGallery(params = {}) {
        const container = document.getElementById('gallery-content');
        const pagination = document.getElementById('gallery-pagination');
        
        if (!container) return;
        
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        
        try {
            const data = await API.artworks.getAll(params);
            
            if (data.artworks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No artworks found</h3>
                        <p>Try adjusting your search criteria</p>
                    </div>
                `;
                pagination.innerHTML = '';
                return;
            }
            
            container.innerHTML = `
                <div class="artwork-grid">
                    ${data.artworks.map(artwork => this.renderArtworkCard(artwork)).join('')}
                </div>
            `;
            
            // Pagination
            if (data.pagination.total > data.pagination.limit) {
                const totalPages = Math.ceil(data.pagination.total / data.pagination.limit);
                const currentPage = Math.floor(data.pagination.offset / data.pagination.limit) + 1;
                
                pagination.innerHTML = `
                    <button ${currentPage === 1 ? 'disabled' : ''} onclick="Pages.changePage(${currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span style="padding: 0.75rem;">Page ${currentPage} of ${totalPages}</span>
                    <button ${currentPage === totalPages ? 'disabled' : ''} onclick="Pages.changePage(${currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;
            } else {
                pagination.innerHTML = '';
            }
        } catch (error) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading artworks</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    },

    // Apply gallery filters
    applyFilters() {
        const search = document.getElementById('search-input')?.value || '';
        const category = document.getElementById('category-filter')?.value || '';
        const priceRange = document.getElementById('price-filter')?.value || '';
        
        const params = { limit: 12, offset: 0 };
        if (search) params.search = search;
        if (category) params.category = category;
        
        if (priceRange) {
            const [min, max] = priceRange.split('-');
            if (min) params.minPrice = min;
            if (max) params.maxPrice = max;
        }
        
        this.currentGalleryParams = params;
        this.loadGallery(params);
    },

    // Change page
    changePage(page) {
        const params = { ...this.currentGalleryParams, offset: (page - 1) * 12 };
        this.loadGallery(params);
    },

    currentGalleryParams: { limit: 12, offset: 0 },

    // Artists Page
    async artists() {
        const artists = await API.auth.getArtists();
        
        return `
            <section class="section">
                <div class="container">
                    <div class="section-title">
                        <h2>Our Artists</h2>
                        <p>Meet the talented creators behind our collection</p>
                    </div>
                    ${artists.length > 0 ? `
                        <div class="artist-grid">
                            ${artists.map(artist => `
                                <div class="artist-card" data-action="navigate-gallery" data-artist="${this.escapeAttr(artist.id)}">
                                    <div class="artist-avatar">
                                        ${artist.profile_image ? 
                                            `<img src="${this.escapeHtml(artist.profile_image)}" alt="${this.escapeHtml(artist.username)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                                            `<i class="fas fa-user"></i>`
                                        }
                                    </div>
                                    <h3>${this.escapeHtml(artist.username)}</h3>
                                    <p>${artist.bio ? this.escapeHtml(artist.bio.substring(0, 100)) + (artist.bio.length > 100 ? '...' : '') : 'Artist'}</p>
                                    <div class="artwork-count">
                                        <i class="fas fa-image"></i> ${artist.artwork_count} artwork${artist.artwork_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>No artists yet</h3>
                            <p>Be the first to join our community!</p>
                        </div>
                    `}
                </div>
            </section>
        `;
    },

    // Login Page
    login() {
        if (Auth.isLoggedIn()) {
            setTimeout(() => App.navigateTo('home'), 0);
            return '<div class="loading"><div class="spinner"></div></div>';
        }
        
        return `
            <div class="form-container">
                <h2>Welcome Back</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </form>
                <p class="form-footer">
                    Don't have an account? <a href="#" data-page="register">Register here</a>
                </p>
            </div>
        `;
    },

    // Register Page
    register() {
        if (Auth.isLoggedIn()) {
            setTimeout(() => App.navigateTo('home'), 0);
            return '<div class="loading"><div class="spinner"></div></div>';
        }
        
        return `
            <div class="form-container">
                <h2>Create Account</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required placeholder="johndoe" minlength="3">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required placeholder="••••••••" minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="role">I want to</label>
                        <select id="role" name="role">
                            <option value="visitor">Browse artworks</option>
                            <option value="artist">Sell my artworks</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-user-plus"></i> Register
                    </button>
                </form>
                <p class="form-footer">
                    Already have an account? <a href="#" data-page="login">Login here</a>
                </p>
            </div>
        `;
    },

    // Profile Page
    async profile() {
        if (!Auth.isLoggedIn()) {
            setTimeout(() => App.navigateTo('login'), 0);
            return '<div class="loading"><div class="spinner"></div></div>';
        }
        
        const user = Auth.user;
        
        return `
            <div class="profile-header">
                <div class="profile-avatar">
                    ${user.profile_image ? 
                        `<img src="${user.profile_image}" alt="${this.escapeHtml(user.username)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                        `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="profile-info">
                    <h1>${this.escapeHtml(user.username)}</h1>
                    <p>${this.escapeHtml(user.email)}</p>
                    <span class="profile-role">${user.role}</span>
                </div>
            </div>
            <section class="section">
                <div class="container">
                    <div class="form-container" style="margin-top: -3rem;">
                        <h2>Update Profile</h2>
                        <form id="update-profile-form">
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input type="text" id="username" name="username" value="${this.escapeHtml(user.username)}" minlength="3">
                            </div>
                            <div class="form-group">
                                <label for="bio">Bio</label>
                                <textarea id="bio" name="bio" placeholder="Tell us about yourself...">${user.bio ? this.escapeHtml(user.bio) : ''}</textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </form>
                        
                        <hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--border-color);">
                        
                        <h3 style="margin-bottom: 1rem;">Change Password</h3>
                        <form id="change-password-form">
                            <div class="form-group">
                                <label for="currentPassword">Current Password</label>
                                <input type="password" id="currentPassword" name="currentPassword" required>
                            </div>
                            <div class="form-group">
                                <label for="newPassword">New Password</label>
                                <input type="password" id="newPassword" name="newPassword" required minlength="6">
                            </div>
                            <button type="submit" class="btn btn-secondary" style="width: 100%;">
                                <i class="fas fa-key"></i> Change Password
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;
    },

    // Favorites Page
    async favorites() {
        if (!Auth.isLoggedIn()) {
            setTimeout(() => App.navigateTo('login'), 0);
            return '<div class="loading"><div class="spinner"></div></div>';
        }
        
        const favorites = await API.favorites.getAll();
        
        return `
            <section class="section">
                <div class="container">
                    <div class="section-title">
                        <h2>My Favorites</h2>
                        <p>Artworks you've saved for later</p>
                    </div>
                    ${favorites.length > 0 ? `
                        <div class="artwork-grid">
                            ${favorites.map(fav => this.renderArtworkCard(fav)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-heart"></i>
                            <h3>No favorites yet</h3>
                            <p>Start exploring and save artworks you love!</p>
                            <a href="#" data-page="gallery" class="btn btn-primary" style="margin-top: 1rem;">Browse Gallery</a>
                        </div>
                    `}
                </div>
            </section>
        `;
    },

    // Dashboard Page (Artist)
    async dashboard() {
        if (!Auth.hasRole('artist', 'admin')) {
            setTimeout(() => App.navigateTo('home'), 0);
            return '<div class="loading"><div class="spinner"></div></div>';
        }
        
        const artworks = await API.artworks.getMyArtworks();
        const categories = await API.categories.getAll();
        
        return `
            <section class="section">
                <div class="container">
                    <div class="dashboard-header">
                        <div>
                            <h2>My Artworks</h2>
                            <p>Manage your art collection</p>
                        </div>
                        <button class="btn btn-primary" onclick="Pages.showArtworkModal()">
                            <i class="fas fa-plus"></i> Add Artwork
                        </button>
                    </div>
                    
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <i class="fas fa-image"></i>
                            <h3>${artworks.length}</h3>
                            <p>Total Artworks</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-check-circle"></i>
                            <h3>${artworks.filter(a => a.is_available).length}</h3>
                            <p>Available</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-dollar-sign"></i>
                            <h3>${artworks.filter(a => a.price).length}</h3>
                            <p>For Sale</p>
                        </div>
                    </div>
                    
                    ${artworks.length > 0 ? `
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${artworks.map(artwork => `
                                        <tr>
                                            <td>
                                                <img src="${artwork.image_url}" alt="${this.escapeHtml(artwork.title)}" 
                                                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                                            </td>
                                            <td>${this.escapeHtml(artwork.title)}</td>
                                            <td>${artwork.category_name || '-'}</td>
                                            <td>${artwork.price ? '$' + artwork.price.toFixed(2) : 'Not for sale'}</td>
                                            <td>
                                                <span class="badge ${artwork.is_available ? 'badge-available' : 'badge-unavailable'}">
                                                    ${artwork.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td class="table-actions">
                                                <button data-action="edit-artwork" data-artwork-id="${this.escapeAttr(artwork.id)}" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="delete" data-action="delete-artwork" data-artwork-id="${this.escapeAttr(artwork.id)}" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-palette"></i>
                            <h3>No artworks yet</h3>
                            <p>Start by uploading your first artwork!</p>
                        </div>
                    `}
                </div>
            </section>
            
            <script>
                window.dashboardCategories = ${JSON.stringify(categories)};
            </script>
        `;
    },

    // Admin Page
    async admin() {
        if (!Auth.hasRole('admin')) {
            setTimeout(() => App.navigateTo('home'), 0);
            return '<div class="loading"><div class="spinner"></div></div>';
        }
        
        const users = await API.auth.getAllUsers();
        const categories = await API.categories.getAll();
        
        return `
            <section class="section">
                <div class="container">
                    <div class="section-title">
                        <h2>Admin Dashboard</h2>
                        <p>Manage users and categories</p>
                    </div>
                    
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <i class="fas fa-users"></i>
                            <h3>${users.length}</h3>
                            <p>Total Users</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-paint-brush"></i>
                            <h3>${users.filter(u => u.role === 'artist').length}</h3>
                            <p>Artists</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-folder"></i>
                            <h3>${categories.length}</h3>
                            <p>Categories</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 3rem;">
                        <div class="dashboard-header">
                            <h3>Categories</h3>
                            <button class="btn btn-primary btn-sm" onclick="Pages.showCategoryModal()">
                                <i class="fas fa-plus"></i> Add Category
                            </button>
                        </div>
                        ${categories.length > 0 ? `
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Artworks</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${categories.map(cat => `
                                            <tr>
                                                <td>${this.escapeHtml(cat.name)}</td>
                                                <td>${cat.description ? this.escapeHtml(cat.description.substring(0, 50)) + (cat.description.length > 50 ? '...' : '') : '-'}</td>
                                                <td>${cat.artwork_count}</td>
                                                <td class="table-actions">
                                                    <button data-action="edit-category" data-category-id="${this.escapeAttr(cat.id)}" title="Edit">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="delete" data-action="delete-category" data-category-id="${this.escapeAttr(cat.id)}" title="Delete">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p>No categories yet.</p>'}
                    </div>
                    
                    <div>
                        <h3 style="margin-bottom: 1rem;">Users</h3>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${users.map(user => `
                                        <tr>
                                            <td>${this.escapeHtml(user.username)}</td>
                                            <td>${this.escapeHtml(user.email)}</td>
                                            <td>
                                                <select onchange="Pages.updateUserRole('${user.id}', this.value)" 
                                                        ${user.id === Auth.user.id ? 'disabled' : ''}>
                                                    <option value="visitor" ${user.role === 'visitor' ? 'selected' : ''}>Visitor</option>
                                                    <option value="artist" ${user.role === 'artist' ? 'selected' : ''}>Artist</option>
                                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                                </select>
                                            </td>
                                            <td class="table-actions">
                                                ${user.id !== Auth.user.id ? `
                                                    <button class="delete" data-action="delete-user" data-user-id="${this.escapeAttr(user.id)}" title="Delete">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                ` : '<span style="color: var(--text-secondary)">You</span>'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    // Artwork Detail Page
    async artworkDetail(id) {
        try {
            const artwork = await API.artworks.getById(id);
            let isFavorited = false;
            
            if (Auth.isLoggedIn()) {
                try {
                    const favCheck = await API.favorites.check(id);
                    isFavorited = favCheck.isFavorited;
                } catch (e) {}
            }
            
            return `
                <div class="artwork-detail">
                    <div class="artwork-detail-image">
                        <img src="${artwork.image_url}" alt="${this.escapeHtml(artwork.title)}">
                    </div>
                    <div class="artwork-detail-info">
                        <h1>${this.escapeHtml(artwork.title)}</h1>
                        ${artwork.price ? `
                            <div class="artwork-detail-price">$${artwork.price.toFixed(2)}</div>
                        ` : ''}
                        
                        <div class="artwork-detail-meta">
                            <p><i class="fas fa-user"></i> <strong>Artist:</strong> ${this.escapeHtml(artwork.artist_name)}</p>
                            ${artwork.category_name ? `
                                <p><i class="fas fa-folder"></i> <strong>Category:</strong> ${this.escapeHtml(artwork.category_name)}</p>
                            ` : ''}
                            <p><i class="fas fa-${artwork.is_available ? 'check-circle' : 'times-circle'}"></i> 
                               <strong>Status:</strong> ${artwork.is_available ? 'Available' : 'Not Available'}</p>
                        </div>
                        
                        ${artwork.description ? `
                            <div class="artwork-detail-description">
                                <h3>Description</h3>
                                <p>${this.escapeHtml(artwork.description)}</p>
                            </div>
                        ` : ''}
                        
                        <div class="artwork-detail-actions">
                            ${Auth.isLoggedIn() ? `
                                <button class="btn ${isFavorited ? 'btn-secondary' : 'btn-outline'}" 
                                        data-action="toggle-favorite" data-artwork-id="${this.escapeAttr(artwork.id)}">
                                    <i class="fas fa-heart"></i> ${isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                                </button>
                            ` : `
                                <a href="#" data-page="login" class="btn btn-outline">
                                    <i class="fas fa-heart"></i> Login to Favorite
                                </a>
                            `}
                            <button class="btn btn-secondary" data-action="navigate-gallery" data-artist="${this.escapeAttr(artwork.artist_id)}">
                                View More by ${this.escapeHtml(artwork.artist_name)}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return `
                <div class="empty-state" style="padding: 6rem 1rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Artwork not found</h3>
                    <p>${this.escapeHtml(error.message)}</p>
                    <a href="#" data-page="gallery" class="btn btn-primary" style="margin-top: 1rem;">Back to Gallery</a>
                </div>
            `;
        }
    },

    // Helper: Render artwork card
    renderArtworkCard(artwork) {
        return `
            <div class="artwork-card">
                <div class="artwork-image">
                    <img src="${this.escapeHtml(artwork.image_url)}" alt="${this.escapeHtml(artwork.title)}">
                    <div class="artwork-overlay">
                        <button data-action="view-artwork" data-artwork-id="${this.escapeAttr(artwork.id)}">View Details</button>
                    </div>
                </div>
                <div class="artwork-info">
                    <h3>${this.escapeHtml(artwork.title)}</h3>
                    <div class="artwork-meta">
                        <span class="artwork-artist">
                            <i class="fas fa-user"></i> ${this.escapeHtml(artwork.artist_name)}
                        </span>
                        ${artwork.price ? `
                            <span class="artwork-price">$${Number(artwork.price).toFixed(2)}</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // Helper: Escape HTML - handles all XSS vectors
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        if (typeof text !== 'string') text = String(text);
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Helper: Escape for use in JavaScript string attributes (onclick, etc.)
    escapeAttr(text) {
        if (text === null || text === undefined) return '';
        if (typeof text !== 'string') text = String(text);
        // Only allow UUIDs, alphanumeric strings and basic characters for IDs
        if (!/^[a-zA-Z0-9\-_]+$/.test(text)) {
            console.warn('Invalid attribute value detected:', text);
            return '';
        }
        return text;
    },

    // Show artwork modal (add/edit)
    async showArtworkModal(artworkId = null) {
        const categories = window.dashboardCategories || await API.categories.getAll();
        let artwork = null;
        
        if (artworkId) {
            try {
                artwork = await API.artworks.getById(artworkId);
            } catch (e) {
                App.toast('Error loading artwork', 'error');
                return;
            }
        }
        
        const modalContent = `
            <button class="modal-close" onclick="App.closeModal()">&times;</button>
            <h2>${artwork ? 'Edit Artwork' : 'Add New Artwork'}</h2>
            <form id="artwork-form" enctype="multipart/form-data">
                <input type="hidden" id="artwork-id" value="${artwork?.id || ''}">
                
                <div class="form-group">
                    <label for="artwork-title">Title *</label>
                    <input type="text" id="artwork-title" name="title" required 
                           value="${artwork ? this.escapeHtml(artwork.title) : ''}" maxlength="200">
                </div>
                
                <div class="form-group">
                    <label for="artwork-description">Description</label>
                    <textarea id="artwork-description" name="description" maxlength="2000">${artwork?.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="artwork-price">Price ($)</label>
                    <input type="number" id="artwork-price" name="price" step="0.01" min="0"
                           value="${artwork?.price || ''}">
                </div>
                
                <div class="form-group">
                    <label for="artwork-category">Category</label>
                    <select id="artwork-category" name="category_id">
                        <option value="">No Category</option>
                        ${categories.map(cat => `
                            <option value="${cat.id}" ${artwork?.category_id === cat.id ? 'selected' : ''}>
                                ${this.escapeHtml(cat.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="artwork-available" name="is_available" 
                               ${artwork?.is_available !== false ? 'checked' : ''}>
                        Available for display/sale
                    </label>
                </div>
                
                <div class="form-group">
                    <label>Image ${artwork ? '' : '*'}</label>
                    <div class="file-upload" onclick="document.getElementById('artwork-image').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Click to upload image</p>
                        <input type="file" id="artwork-image" name="image" accept="image/jpeg,image/png,image/gif,image/webp"
                               ${artwork ? '' : 'required'}>
                    </div>
                    <div class="file-preview" id="file-preview">
                        ${artwork ? `<img src="${artwork.image_url}" alt="Current image">` : ''}
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> ${artwork ? 'Update' : 'Create'} Artwork
                </button>
            </form>
        `;
        
        App.showModal(modalContent);
        
        // File preview
        document.getElementById('artwork-image').addEventListener('change', function(e) {
            const preview = document.getElementById('file-preview');
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
        
        // Form submission
        document.getElementById('artwork-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('artwork-title').value);
            formData.append('description', document.getElementById('artwork-description').value);
            formData.append('price', document.getElementById('artwork-price').value);
            formData.append('category_id', document.getElementById('artwork-category').value);
            formData.append('is_available', document.getElementById('artwork-available').checked);
            
            const imageFile = document.getElementById('artwork-image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            try {
                const id = document.getElementById('artwork-id').value;
                if (id) {
                    await API.artworks.update(id, formData);
                    App.toast('Artwork updated successfully', 'success');
                } else {
                    await API.artworks.create(formData);
                    App.toast('Artwork created successfully', 'success');
                }
                App.closeModal();
                App.navigateTo('dashboard');
            } catch (error) {
                App.toast(error.message, 'error');
            }
        });
    },

    // Delete artwork
    async deleteArtwork(id) {
        if (!confirm('Are you sure you want to delete this artwork?')) return;
        
        try {
            await API.artworks.delete(id);
            App.toast('Artwork deleted successfully', 'success');
            App.navigateTo('dashboard');
        } catch (error) {
            App.toast(error.message, 'error');
        }
    },

    // Show category modal (add/edit)
    async showCategoryModal(categoryId = null) {
        let category = null;
        
        if (categoryId) {
            try {
                category = await API.categories.getById(categoryId);
            } catch (e) {
                App.toast('Error loading category', 'error');
                return;
            }
        }
        
        const modalContent = `
            <button class="modal-close" onclick="App.closeModal()">&times;</button>
            <h2>${category ? 'Edit Category' : 'Add New Category'}</h2>
            <form id="category-form">
                <input type="hidden" id="category-id" value="${category?.id || ''}">
                
                <div class="form-group">
                    <label for="category-name">Name *</label>
                    <input type="text" id="category-name" name="name" required 
                           value="${category ? this.escapeHtml(category.name) : ''}" maxlength="100">
                </div>
                
                <div class="form-group">
                    <label for="category-description">Description</label>
                    <textarea id="category-description" name="description" maxlength="500">${category?.description || ''}</textarea>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> ${category ? 'Update' : 'Create'} Category
                </button>
            </form>
        `;
        
        App.showModal(modalContent);
        
        document.getElementById('category-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('category-name').value,
                description: document.getElementById('category-description').value
            };
            
            try {
                const id = document.getElementById('category-id').value;
                if (id) {
                    await API.categories.update(id, data);
                    App.toast('Category updated successfully', 'success');
                } else {
                    await API.categories.create(data);
                    App.toast('Category created successfully', 'success');
                }
                App.closeModal();
                App.navigateTo('admin');
            } catch (error) {
                App.toast(error.message, 'error');
            }
        });
    },

    // Delete category
    async deleteCategory(id) {
        if (!confirm('Are you sure you want to delete this category?')) return;
        
        try {
            await API.categories.delete(id);
            App.toast('Category deleted successfully', 'success');
            App.navigateTo('admin');
        } catch (error) {
            App.toast(error.message, 'error');
        }
    },

    // Update user role
    async updateUserRole(userId, role) {
        try {
            await API.auth.updateUserRole(userId, role);
            App.toast('User role updated successfully', 'success');
        } catch (error) {
            App.toast(error.message, 'error');
            App.navigateTo('admin');
        }
    },

    // Delete user
    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        
        try {
            await API.auth.deleteUser(userId);
            App.toast('User deleted successfully', 'success');
            App.navigateTo('admin');
        } catch (error) {
            App.toast(error.message, 'error');
        }
    },

    // Toggle favorite
    async toggleFavorite(artworkId, button) {
        if (!Auth.isLoggedIn()) {
            App.navigateTo('login');
            return;
        }
        
        try {
            const isFavorited = button.classList.contains('btn-secondary');
            
            if (isFavorited) {
                await API.favorites.remove(artworkId);
                button.classList.remove('btn-secondary');
                button.classList.add('btn-outline');
                button.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
                App.toast('Removed from favorites', 'success');
            } else {
                await API.favorites.add(artworkId);
                button.classList.remove('btn-outline');
                button.classList.add('btn-secondary');
                button.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                App.toast('Added to favorites', 'success');
            }
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }
};
