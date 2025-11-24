// In production, JWT_SECRET must be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

// Fail in production if JWT_SECRET is not set
if (isProduction && !JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable must be set in production');
}

module.exports = {
    JWT_SECRET: JWT_SECRET || 'dev-only-secret-key-not-for-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    PORT: process.env.PORT || 3000,
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};
