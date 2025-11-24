const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Set test environment before any imports
const testDbPath = path.join(__dirname, 'test-gallery.db');
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Clean up any existing test database
if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
}

// Helper for making HTTP requests
function makeRequest(server, method, url, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const { port } = server.address();
        const options = {
            hostname: '127.0.0.1',
            port,
            path: url,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : {}
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

describe('Online Art Gallery API Tests', async () => {
    let server;
    let app;
    let db;

    before(async () => {
        // Import app and initialize
        const appModule = require('../app');
        const dbModule = require('../config/database');
        
        app = appModule.app;
        db = dbModule.db;
        dbModule.initializeDatabase();
        
        // Start server
        server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.on('listening', resolve));
    });

    after(() => {
        if (server) {
            server.close();
        }
        if (db) {
            db.close();
        }
        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });

    await it('should return health status', async () => {
        const res = await makeRequest(server, 'GET', '/api/health');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.status, 'ok');
    });

    await it('should register a new user', async () => {
        const res = await makeRequest(server, 'POST', '/api/auth/register', {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'visitor'
        });

        assert.strictEqual(res.status, 201);
        assert.ok(res.data.token);
        assert.strictEqual(res.data.user.username, 'testuser');
        assert.strictEqual(res.data.user.role, 'visitor');
    });

    await it('should not register with existing email', async () => {
        const res = await makeRequest(server, 'POST', '/api/auth/register', {
            username: 'anotheruser',
            email: 'test@example.com',
            password: 'password123'
        });

        assert.strictEqual(res.status, 400);
        assert.ok(res.data.error);
    });

    await it('should login with valid credentials', async () => {
        const res = await makeRequest(server, 'POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        assert.strictEqual(res.status, 200);
        assert.ok(res.data.token);
        assert.strictEqual(res.data.user.email, 'test@example.com');
    });

    await it('should not login with invalid credentials', async () => {
        const res = await makeRequest(server, 'POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'wrongpassword'
        });

        assert.strictEqual(res.status, 401);
    });

    await it('should get user profile with valid token', async () => {
        // First login to get token
        const loginRes = await makeRequest(server, 'POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        
        const res = await makeRequest(server, 'GET', '/api/auth/profile', null, loginRes.data.token);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.username, 'testuser');
    });

    await it('should not get profile without token', async () => {
        const res = await makeRequest(server, 'GET', '/api/auth/profile');
        assert.strictEqual(res.status, 401);
    });

    await it('should register an artist', async () => {
        const res = await makeRequest(server, 'POST', '/api/auth/register', {
            username: 'artistuser',
            email: 'artist@example.com',
            password: 'password123',
            role: 'artist'
        });

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.user.role, 'artist');
    });

    await it('should get artists list', async () => {
        const res = await makeRequest(server, 'GET', '/api/auth/artists');

        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
    });

    await it('should get all artworks', async () => {
        const res = await makeRequest(server, 'GET', '/api/artworks');

        assert.strictEqual(res.status, 200);
        assert.ok(res.data.artworks);
        assert.ok(res.data.pagination);
    });

    await it('should get featured artworks', async () => {
        const res = await makeRequest(server, 'GET', '/api/artworks/featured');

        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    await it('should get all categories', async () => {
        const res = await makeRequest(server, 'GET', '/api/categories');

        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    await it('should get empty favorites list when authenticated', async () => {
        const loginRes = await makeRequest(server, 'POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        
        const res = await makeRequest(server, 'GET', '/api/favorites', null, loginRes.data.token);
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    await it('should not access favorites without authentication', async () => {
        const res = await makeRequest(server, 'GET', '/api/favorites');
        assert.strictEqual(res.status, 401);
    });
});

describe('Database Schema Tests', async () => {
    let db;
    const testDbPath2 = path.join(__dirname, 'test-schema.db');

    before(() => {
        // Clean up any existing test database
        if (fs.existsSync(testDbPath2)) {
            fs.unlinkSync(testDbPath2);
        }
        
        process.env.DB_PATH = testDbPath2;
        
        // Re-import database module
        delete require.cache[require.resolve('../config/database')];
        const dbModule = require('../config/database');
        db = dbModule.db;
        dbModule.initializeDatabase();
    });

    after(() => {
        if (db) {
            db.close();
        }
        if (fs.existsSync(testDbPath2)) {
            try {
                fs.unlinkSync(testDbPath2);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });

    await it('should have users table', () => {
        const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
        assert.ok(result);
        assert.strictEqual(result.name, 'users');
    });

    await it('should have artworks table', () => {
        const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='artworks'").get();
        assert.ok(result);
        assert.strictEqual(result.name, 'artworks');
    });

    await it('should have categories table', () => {
        const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
        assert.ok(result);
        assert.strictEqual(result.name, 'categories');
    });

    await it('should have favorites table', () => {
        const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='favorites'").get();
        assert.ok(result);
        assert.strictEqual(result.name, 'favorites');
    });
});
