# OTC - Online Art Gallery

A web-based art gallery platform where users can browse artwork, become artists, and share their own creations with the community.

## 🎨 Features

### For All Users
- **User Authentication**: Secure registration and login system with password hashing
- **Gallery Browsing**: View public artworks from various artists
- **Artwork Details**: View detailed information about each piece including title, description, year, medium, and style
- **Favorites System**: Save and organize your favorite artworks
- **Comments**: Engage with artworks by leaving comments
- **User Profiles**: Manage personal information and view your favorites

### For Artists
- **Artist Registration**: Upgrade your account to become an artist
- **Upload Artwork**: Share your creations with customizable metadata
- **Portfolio Management**: View, edit, and delete your artworks
- **Privacy Controls**: Toggle artwork visibility (public/private)
- **Artist Profile**: Showcase your bio, website, and display name

## 🛠️ Tech Stack

- **Backend**: PHP 7+
- **Database**: MySQL/MariaDB
- **Frontend**: HTML5, CSS3, JavaScript
- **Server**: Apache (XAMPP recommended)

## 📋 Prerequisites

- XAMPP (or any Apache + MySQL + PHP setup)
- PHP 7.0 or higher
- MySQL/MariaDB database

## 🚀 Installation

1. **Clone or download the project** to your XAMPP htdocs directory:
   ```
   c:\xampp\htdocs\OTC-main
   ```

2. **Import the database**:
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `gallery`
   - Import the `gallery.sql` file

3. **Configure database connection**:
   - The default configuration in `config.php` is:
     ```php
     DB_HOST: localhost
     DB_USER: root
     DB_PASS: (empty)
     DB_NAME: gallery
     ```
   - Modify if your setup differs

4. **Create uploads directory**:
   - Ensure the `uploads/` folder exists and has write permissions
   - On Windows with XAMPP, this is usually handled automatically

5. **Start Apache and MySQL** via XAMPP Control Panel

6. **Access the application**:
   - Open your browser and navigate to: `http://localhost/OTC-main/`

## 📁 Project Structure

```
OTC-main/
├── index.php              # Main gallery page
├── login.php              # User login
├── register.php           # User registration
├── profile.php            # User profile & favorites
├── become_artist.php      # Upgrade to artist account
├── upload_artwork.php     # Upload new artwork (artists only)
├── artwork.php            # Individual artwork view with comments
├── edit_artwork.php       # Edit existing artwork (artists only)
├── delete_artwork.php     # Delete artwork (artists only)
├── toggle_favorite.php    # Add/remove favorites
├── edit_profile.php       # Edit user profile
├── config.php             # Database configuration
├── db.php                 # Database connection
├── header.php             # Shared header template
├── footer.php             # Shared footer template
├── styles.css             # Main stylesheet
├── loading.php            # Loading animations
├── gallery.sql            # Database schema and sample data
└── uploads/               # User-uploaded artwork images
```

## 🗄️ Database Schema

### Tables
- **users**: User accounts (email, password, role, profile info)
- **artists**: Artist profiles (display name, bio, website)
- **artworks**: Uploaded artwork (title, description, image, metadata)
- **favorites**: User-artwork favorite relationships
- **comments**: User comments on artworks

## 🔐 User Roles

1. **User**: Default role for registered accounts
   - Can browse gallery
   - Can favorite artworks
   - Can leave comments
   - Can view profiles

2. **Artist**: Upgraded user role
   - All user permissions
   - Can upload artworks
   - Can edit/delete own artworks
   - Has artist profile page

## 📝 Usage

### Creating an Account
1. Navigate to the registration page
2. Enter email and password (minimum 6 characters)
3. Confirm password
4. Automatic login after successful registration

### Becoming an Artist
1. Log in to your account
2. Navigate to "Become Artist"
3. Fill in your display name, bio, and website
4. Submit to upgrade your account

### Uploading Artwork
1. As an artist, access "Upload Artwork"
2. Fill in artwork details:
   - Title (required)
   - Description
   - Year
   - Medium
   - Style
   - Upload image (required)
   - Set public/private visibility
3. Submit to publish

### Managing Artwork
- View your artwork portfolio in your profile
- Click edit to modify artwork details
- Delete artwork you no longer wish to display

## 🎯 Features in Development

Based on the PlantUML diagrams in the project:
- Use case diagrams for system interactions
- Sequence diagrams for various operations
- Actor diagrams for role definitions

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📄 License

This project is open source and available for educational purposes.

## 🐛 Troubleshooting

### Common Issues

**Database connection failed**
- Verify MySQL is running in XAMPP
- Check config.php credentials
- Ensure `gallery` database exists

**Upload failed**
- Check uploads/ directory permissions
- Verify file size limits in php.ini
- Ensure file is a valid image format

**Access denied errors**
- Clear browser cookies/session
- Re-login to refresh session
- Check user role permissions

## 📞 Support

For issues or questions, please check the existing code comments or create an issue in the repository.
