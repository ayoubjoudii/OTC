# Online Art Gallery Management System

A full-stack web application that enables digital management of artworks. Artists can upload, manage, and showcase their artworks, while visitors can browse, search, and save favorites.

## Features

### User Roles
- **Visitor**: Browse gallery, search artworks, create account, save favorites
- **Artist**: All visitor features + upload and manage own artworks
- **Admin**: All features + manage users, categories, and all artworks

### Core Functionality
- 🖼️ **Gallery Display**: Dynamic grid-based artwork showcase
- 🔍 **Search & Filter**: Search by title, artist, category, and price range
- 👤 **User Authentication**: Secure JWT-based authentication
- ❤️ **Favorites**: Save and manage favorite artworks
- 📁 **Categories**: Organize artworks by categories
- 🎨 **Artist Profiles**: View artist portfolios
- 📊 **Dashboard**: Artists can manage their artworks
- 🔧 **Admin Panel**: Full system management

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Security**: Helmet, CORS, express-validator
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, CSS3

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd OTC
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
PORT=3000
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=24h
DB_PATH=./gallery.db
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/artists` | Get all artists |
| GET | `/api/auth/users` | Get all users (admin) |
| PUT | `/api/auth/users/:id/role` | Update user role (admin) |
| DELETE | `/api/auth/users/:id` | Delete user (admin) |

### Artworks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/artworks` | Get all artworks (with filters) |
| GET | `/api/artworks/featured` | Get featured artworks |
| GET | `/api/artworks/:id` | Get artwork by ID |
| GET | `/api/artworks/artist/me` | Get current artist's artworks |
| POST | `/api/artworks` | Create artwork (artist/admin) |
| PUT | `/api/artworks/:id` | Update artwork (owner/admin) |
| DELETE | `/api/artworks/:id` | Delete artwork (owner/admin) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get category by ID |
| POST | `/api/categories` | Create category (admin) |
| PUT | `/api/categories/:id` | Update category (admin) |
| DELETE | `/api/categories/:id` | Delete category (admin) |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user's favorites |
| POST | `/api/favorites` | Add to favorites |
| DELETE | `/api/favorites/:artworkId` | Remove from favorites |
| GET | `/api/favorites/check/:artworkId` | Check if favorited |

## Project Structure

```
OTC/
├── src/
│   ├── config/
│   │   ├── constants.js    # App configuration
│   │   └── database.js     # Database setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── artworkController.js
│   │   ├── categoryController.js
│   │   └── favoriteController.js
│   ├── middleware/
│   │   ├── auth.js         # Authentication middleware
│   │   └── upload.js       # File upload middleware
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── artworkRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── favoriteRoutes.js
│   ├── public/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── pages.js
│   │   │   └── app.js
│   │   └── index.html
│   ├── tests/
│   │   └── api.test.js
│   └── app.js              # Main application
├── .gitignore
├── package.json
└── README.md
```

## Running Tests

```bash
npm test
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Helmet security headers
- Input validation with express-validator
- CORS configuration
- File type validation for uploads
- Role-based access control
- Rate limiting (100 requests/15min for API, 20 requests/15min for auth)

## License

ISC