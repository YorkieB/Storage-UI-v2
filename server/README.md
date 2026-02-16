# CloudDrive Backend Server

Full-stack backend API for CloudDrive with DigitalOcean Spaces integration, PostgreSQL database, and OAuth support for Google Drive, OneDrive, and Dropbox.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

- **Database**: PostgreSQL connection details
- **JWT Secrets**: Generate secure random strings
- **DigitalOcean Spaces**: Your Spaces key, secret, bucket, and region
- **OAuth**: Google, Microsoft, and Dropbox client IDs and secrets

### 3. Set Up PostgreSQL Database

Install PostgreSQL if you don't have it:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

Create the database:

```bash
sudo -u postgres psql
CREATE DATABASE clouddrive;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE clouddrive TO your_username;
\q
```

### 4. Run Migrations

```bash
npm run migrate
```

This will create all necessary tables in your database.

### 5. Start the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## 📋 API Documentation

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/refresh` | POST | Refresh access token | No |
| `/api/auth/profile` | GET | Get user profile | Yes |
| `/api/auth/profile` | PUT | Update profile | Yes |
| `/api/auth/change-password` | POST | Change password | Yes |

### Files

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/files/upload` | POST | Upload file to Spaces | Yes |
| `/api/files` | GET | Get all files | Yes |
| `/api/files/:id` | GET | Get single file | Yes |
| `/api/files/:id/download` | GET | Get download URL | Yes |
| `/api/files/:id` | PUT | Update file metadata | Yes |
| `/api/files/:id/trash` | POST | Move to trash | Yes |
| `/api/files/:id/restore` | POST | Restore from trash | Yes |
| `/api/files/:id` | DELETE | Delete permanently | Yes |

### Folders

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/folders` | POST | Create folder | Yes |
| `/api/folders` | GET | Get all folders | Yes |
| `/api/folders/:id` | PUT | Update folder | Yes |
| `/api/folders/:id` | DELETE | Delete folder | Yes |

### Cloud Import

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/import/google/auth` | GET | Get Google OAuth URL | Yes |
| `/api/import/google/callback` | GET | Google OAuth callback | No |
| `/api/import/google/import` | POST | Import from Google Drive | Yes |
| `/api/import/microsoft/auth` | GET | Get Microsoft OAuth URL | Yes |
| `/api/import/microsoft/callback` | GET | Microsoft OAuth callback | No |
| `/api/import/dropbox/auth` | GET | Get Dropbox OAuth URL | Yes |
| `/api/import/dropbox/callback` | GET | Dropbox OAuth callback | No |

## 🔐 OAuth Setup

### Google Drive

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/import/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Microsoft OneDrive

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new app in Azure AD
3. Add Microsoft Graph API permissions: `Files.Read.All`
4. Add redirect URI: `http://localhost:5000/api/import/microsoft/callback`
5. Copy Application (client) ID and Client Secret to `.env`

### Dropbox

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Choose "Scoped access" and "Full Dropbox"
4. Add redirect URI: `http://localhost:5000/api/import/dropbox/callback`
5. Copy App key and App secret to `.env`

## 🗄️ Database Schema

- **users** - User accounts and settings
- **files** - File metadata and Spaces references
- **folders** - Folder hierarchy
- **albums** - Photo/video albums
- **album_files** - Album-file relationships
- **shared_links** - Shareable links
- **oauth_tokens** - OAuth refresh tokens

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **PostgreSQL** - Database
- **AWS SDK** - DigitalOcean Spaces (S3-compatible)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Google APIs** - Google Drive integration
- **Multer** - File upload handling

## 📦 Deployment

### DigitalOcean Droplet

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Clone the repo
git clone your-repo-url
cd Storage-UI-v2/server

# Install dependencies
npm ci --production

# Set up .env
cp .env.example .env
nano .env

# Run migrations
npm run migrate

# Start with PM2
npm install -g pm2
pm2 start index.js --name clouddrive-api
pm2 startup
pm2 save
```

## 🔧 Environment Variables Reference

See `.env.example` for complete list of required variables.

## 📝 License

MIT
