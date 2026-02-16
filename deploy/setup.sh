#!/bin/bash
# ============================================================
# CloudDrive - Full Stack Deployment Script
# ============================================================
# Run this on your DigitalOcean droplet after cloning the repo.
#
# Usage:
#   chmod +x deploy/setup.sh
#   sudo ./deploy/setup.sh your-domain.com
#
# Prerequisites:
#   - Ubuntu 22.04+ droplet
#   - SSH access as root or sudo user
#   - Domain pointed to your droplet's IP (for SSL)
#   - DigitalOcean Spaces credentials ready
# ============================================================

set -e

# --- Configuration ---
APP_DIR="/var/www/clouddrive"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${1:-YOUR_DOMAIN}"

echo ""
echo "============================================"
echo "  CloudDrive Full Stack Deployment"
echo "============================================"
echo "  App directory:  $APP_DIR"
echo "  Repo directory: $REPO_DIR"
echo "  Domain:         $DOMAIN"
echo "============================================"
echo ""

# --- Step 1: Install system dependencies ---
echo "[1/10] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx curl postgresql postgresql-contrib

# Install Node.js 20 LTS if not present
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

# Install PM2 for backend process management
if ! command -v pm2 &> /dev/null; then
    echo "  Installing PM2..."
    npm install -g pm2
fi

echo "  Node $(node -v) | npm $(npm -v) | PM2 $(pm2 -v)"

# --- Step 2: Set up PostgreSQL database ---
echo "[2/10] Setting up PostgreSQL database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'clouddrive'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE clouddrive;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = 'clouddrive_user'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER clouddrive_user WITH PASSWORD 'change_this_password';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE clouddrive TO clouddrive_user;"
echo "  ✅ Database 'clouddrive' created"

# --- Step 3: Install frontend dependencies ---
echo "[3/10] Installing frontend dependencies..."
cd "$REPO_DIR"
npm ci --production=false

# --- Step 4: Install backend dependencies ---
echo "[4/10] Installing backend dependencies..."
cd "$REPO_DIR/server"
npm ci --production=false

# --- Step 5: Configure environment variables ---
echo "[5/10] Configuring environment variables..."

# Frontend .env
if [ ! -f "$REPO_DIR/.env" ]; then
    cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
    echo "  ⚠️  Frontend .env created - EDIT THIS FILE!"
fi

# Backend .env
if [ ! -f "$REPO_DIR/server/.env" ]; then
    cp "$REPO_DIR/server/.env.example" "$REPO_DIR/server/.env"

    # Auto-configure some values
    sed -i "s|NODE_ENV=development|NODE_ENV=production|g" "$REPO_DIR/server/.env"
    sed -i "s|CLIENT_URL=http://localhost:3000|CLIENT_URL=https://$DOMAIN|g" "$REPO_DIR/server/.env"
    sed -i "s|DATABASE_URL=postgresql://username:password@localhost:5432/clouddrive|DATABASE_URL=postgresql://clouddrive_user:change_this_password@localhost:5432/clouddrive|g" "$REPO_DIR/server/.env"

    # Generate JWT secrets
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i "s|JWT_SECRET=your-super-secret-jwt-key-change-this-in-production|JWT_SECRET=$JWT_SECRET|g" "$REPO_DIR/server/.env"
    sed -i "s|REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key|REFRESH_TOKEN_SECRET=$REFRESH_SECRET|g" "$REPO_DIR/server/.env"

    echo "  ⚠️  Backend .env created - YOU MUST EDIT THIS FILE!"
    echo "  ⚠️  Required: Add your DigitalOcean Spaces credentials"
    echo "  ⚠️  Optional: Add OAuth credentials for cloud import"
fi

# --- Step 6: Run database migrations ---
echo "[6/10] Running database migrations..."
cd "$REPO_DIR/server"
npm run migrate || echo "  ⚠️  Migrations may have already run"

# --- Step 7: Build frontend ---
echo "[7/10] Building frontend production bundle..."
cd "$REPO_DIR"
npm run build

# --- Step 8: Deploy frontend to web root ---
echo "[8/10] Deploying frontend to $APP_DIR..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -r "$REPO_DIR/dist/"* "$APP_DIR/"

# --- Step 9: Start backend with PM2 ---
echo "[9/10] Starting backend server with PM2..."
cd "$REPO_DIR/server"
pm2 delete clouddrive-api 2>/dev/null || true
pm2 start index.js --name clouddrive-api
pm2 save
pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
chmod +x /tmp/pm2_startup.sh
/tmp/pm2_startup.sh

echo "  ✅ Backend running on port 5000"

# --- Step 10: Configure Nginx ---
echo "[10/10] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/clouddrive"

# Create nginx config with API proxy
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    root $APP_DIR;
    index index.html;

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Increase timeout for file uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Frontend SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 100M;
}
EOF

# Enable the site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/clouddrive

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx

echo ""
echo "============================================"
echo "  ✅ Deployment Complete!"
echo "============================================"
echo ""
echo "  🌐 Your app: http://$DOMAIN"
echo "  🔧 Backend: http://$DOMAIN/api/health"
echo ""
echo "  ⚠️  CRITICAL NEXT STEPS:"
echo ""
echo "  1. Edit backend environment variables:"
echo "     nano $REPO_DIR/server/.env"
echo ""
echo "     Required configuration:"
echo "     - DO_SPACES_KEY=your_spaces_key"
echo "     - DO_SPACES_SECRET=your_spaces_secret"
echo "     - DO_SPACES_BUCKET=your_bucket_name"
echo "     - DO_SPACES_REGION=nyc3 (or your region)"
echo "     - DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com"
echo ""
echo "     After editing, restart backend:"
echo "     pm2 restart clouddrive-api"
echo ""
echo "  2. Update PostgreSQL password (recommended):"
echo "     sudo -u postgres psql"
echo "     ALTER USER clouddrive_user WITH PASSWORD 'your_secure_password';"
echo "     Then update DATABASE_URL in server/.env"
echo ""
echo "  3. Set up HTTPS (free SSL via Let's Encrypt):"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d $DOMAIN"
echo ""
echo "  4. Test the backend API:"
echo "     curl http://$DOMAIN/api/health"
echo ""
echo "  5. Optional - Add OAuth credentials for cloud import:"
echo "     Edit $REPO_DIR/server/.env"
echo "     Follow SETUP_GUIDE.md for OAuth app setup"
echo ""
echo "============================================"
echo ""
echo "  📊 Monitor backend:"
echo "     pm2 logs clouddrive-api"
echo "     pm2 monit"
echo "     pm2 status"
echo ""
echo "  📖 Full documentation:"
echo "     - SETUP_GUIDE.md (comprehensive setup)"
echo "     - server/README.md (API documentation)"
echo ""
echo "============================================"
echo ""
