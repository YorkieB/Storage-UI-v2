# 🚀 CloudDrive Full Stack Setup Guide

Complete guide to setting up CloudDrive with DigitalOcean Spaces, PostgreSQL, and OAuth integrations.

## 📋 Prerequisites Checklist

- [ ] DigitalOcean Spaces bucket created
- [ ] PostgreSQL installed
- [ ] Google Cloud project (for Google Drive)
- [ ] Microsoft Azure app (for OneDrive)
- [ ] Dropbox app created
- [ ] Node.js 20+ installed

---

## Part 1: Database Setup

### Option A: Local PostgreSQL

```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE DATABASE clouddrive;
CREATE USER clouddrive_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE clouddrive TO clouddrive_user;
\q
```

### Option B: DigitalOcean Managed Database

1. Go to DigitalOcean Control Panel
2. Create → Databases → PostgreSQL
3. Choose your plan (Basic $15/month recommended)
4. Note the connection details

---

## Part 2: Server Configuration

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in these required values:

```env
# Database - Use your PostgreSQL connection details
DATABASE_URL=postgresql://clouddrive_user:your_password@localhost:5432/clouddrive

# JWT Secrets - Generate these!
JWT_SECRET=<generate_random_64_char_string>
REFRESH_TOKEN_SECRET=<generate_random_64_char_string>

# DigitalOcean Spaces - From your Spaces dashboard
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_KEY=YOUR_SPACES_ACCESS_KEY
DO_SPACES_SECRET=YOUR_SPACES_SECRET_KEY
DO_SPACES_CDN_ENDPOINT=https://your-bucket-name.nyc3.cdn.digitaloceanspaces.com
```

**Generate JWT secrets:**
```bash
# Run this twice, use output for JWT_SECRET and REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run Database Migrations

```bash
npm run migrate
```

You should see:
```
✅ Migration completed successfully!
Database schema created:
  - users
  - folders
  - files
  - albums
  - ...
```

### 4. Test the Server

```bash
npm run dev
```

You should see:
```
==================================================
  CloudDrive Backend Server
==================================================
  🚀 Server running on port 5000
  ...
```

Test it:
```bash
curl http://localhost:5000/health
```

---

## Part 3: OAuth Setup

### Google Drive OAuth

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name: "CloudDrive"
   - Click "Create"

3. **Enable Google Drive API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "CloudDrive Web"
   - Authorized redirect URIs:
     - `http://localhost:5000/api/import/google/callback`
     - `https://your-domain.com/api/import/google/callback` (for production)
   - Click "Create"

5. **Copy Credentials to .env**
   ```env
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/import/google/callback
   ```

### Microsoft OneDrive OAuth

1. **Go to [Azure Portal](https://portal.azure.com/)**

2. **Register Application**
   - Azure Active Directory → "App registrations" → "New registration"
   - Name: "CloudDrive"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web → `http://localhost:5000/api/import/microsoft/callback`
   - Click "Register"

3. **Add API Permissions**
   - Go to "API permissions" → "Add a permission"
   - Microsoft Graph → "Delegated permissions"
   - Check: `Files.Read.All`, `offline_access`
   - Click "Add permissions"
   - Click "Grant admin consent"

4. **Create Client Secret**
   - Go to "Certificates & secrets" → "New client secret"
   - Description: "CloudDrive Secret"
   - Expires: 24 months
   - Click "Add"
   - **Copy the secret value immediately** (you won't see it again!)

5. **Copy Credentials to .env**
   ```env
   MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   MICROSOFT_CLIENT_SECRET=your_secret_value
   MICROSOFT_REDIRECT_URI=http://localhost:5000/api/import/microsoft/callback
   ```

### Dropbox OAuth

1. **Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)**

2. **Create App**
   - Click "Create app"
   - Choose API: "Scoped access"
   - Access type: "Full Dropbox"
   - Name: "CloudDrive" (must be unique)
   - Click "Create app"

3. **Configure Permissions**
   - Go to "Permissions" tab
   - Check: `files.content.read`
   - Click "Submit"

4. **Add Redirect URI**
   - Go to "Settings" tab
   - Redirect URIs: `http://localhost:5000/api/import/dropbox/callback`
   - Click "Add"

5. **Copy Credentials to .env**
   ```env
   DROPBOX_CLIENT_ID=your_app_key
   DROPBOX_CLIENT_SECRET=your_app_secret
   DROPBOX_REDIRECT_URI=http://localhost:5000/api/import/dropbox/callback
   ```

---

## Part 4: DigitalOcean Spaces Setup

### 1. Create Spaces Bucket (if not done)

1. Go to DigitalOcean Control Panel
2. Create → Spaces Object Storage
3. Choose datacenter (e.g., NYC3)
4. Name your Space: `clouddrive-storage`
5. Choose plan (5GB free, then $5/month for 250GB)
6. Click "Create"

### 2. Generate Access Keys

1. API → Spaces access keys
2. Click "Generate New Key"
3. Name: "CloudDrive API"
4. **Copy the key and secret immediately**

### 3. Enable CDN (Recommended)

1. Go to your Space
2. Settings → CDN
3. Click "Enable CDN"
4. Custom subdomain (optional): `cdn.your-domain.com`
5. Copy the CDN endpoint URL

### 4. Update .env

```env
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=clouddrive-storage
DO_SPACES_KEY=YOUR_KEY_HERE
DO_SPACES_SECRET=YOUR_SECRET_HERE
DO_SPACES_CDN_ENDPOINT=https://clouddrive-storage.nyc3.cdn.digitaloceanspaces.com
```

---

## Part 5: Frontend Configuration

The frontend needs to be updated to connect to the backend API. We'll do this in the next step.

For now, update the frontend `.env`:

```bash
cd ..  # Back to root directory
nano .env
```

Add:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_existing_gemini_key
```

---

## Part 6: Testing Everything

### 1. Start Backend

```bash
cd server
npm run dev
```

### 2. Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 3. Test File Upload

```bash
# Save the accessToken from registration
TOKEN="your_access_token_here"

curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/test/file.txt"
```

### 4. Test OAuth Flow

Open in browser:
```
http://localhost:5000/api/import/google/auth
```

You should be redirected to Google OAuth consent screen.

---

## Part 7: Production Deployment

### Update Production Environment Variables

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com

# Update all redirect URIs to use HTTPS
GOOGLE_REDIRECT_URI=https://your-domain.com/api/import/google/callback
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/import/microsoft/callback
DROPBOX_REDIRECT_URI=https://your-domain.com/api/import/dropbox/callback
```

### Deploy with PM2

```bash
# Install PM2
npm install -g pm2

# Start server
cd server
pm2 start index.js --name clouddrive-api

# Save PM2 config
pm2 startup
pm2 save

# Monitor
pm2 logs clouddrive-api
pm2 monit
```

---

## 🎉 You're Done!

Your CloudDrive backend is now fully configured with:

- ✅ PostgreSQL database
- ✅ DigitalOcean Spaces file storage
- ✅ JWT authentication
- ✅ Google Drive import
- ✅ OneDrive import
- ✅ Dropbox import

Next steps:
1. Update the frontend to use the backend API
2. Test all features end-to-end
3. Deploy to production

---

## 🐛 Troubleshooting

### Database connection fails
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Check database exists: `psql -l`

### Spaces upload fails
- Verify access key and secret
- Check bucket exists and region is correct
- Ensure bucket has correct permissions

### OAuth redirect fails
- Verify redirect URIs match exactly in OAuth app settings
- Check CLIENT_URL in `.env`
- Ensure callbacks are registered in all OAuth platforms

### Port already in use
- Change PORT in `.env`
- Or kill process: `sudo lsof -t -i:5000 | xargs kill -9`

---

## 📞 Need Help?

Check the server logs:
```bash
pm2 logs clouddrive-api
```

Or run in dev mode to see detailed errors:
```bash
npm run dev
```
