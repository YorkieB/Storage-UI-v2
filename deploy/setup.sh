#!/bin/bash
# ============================================================
# CloudDrive - DigitalOcean Deployment Script
# ============================================================
# Run this on your DigitalOcean droplet after cloning the repo.
#
# Usage:
#   chmod +x deploy/setup.sh
#   sudo ./deploy/setup.sh
#
# Prerequisites:
#   - Ubuntu 22.04+ droplet
#   - SSH access as root or sudo user
#   - Domain pointed to your droplet's IP (for SSL)
# ============================================================

set -e

# --- Configuration ---
APP_DIR="/var/www/clouddrive"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${1:-YOUR_DOMAIN}"

echo ""
echo "============================================"
echo "  CloudDrive Deployment"
echo "============================================"
echo "  App directory:  $APP_DIR"
echo "  Repo directory: $REPO_DIR"
echo "  Domain:         $DOMAIN"
echo "============================================"
echo ""

# --- Step 1: Install system dependencies ---
echo "[1/6] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx curl

# Install Node.js 20 LTS if not present
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

echo "  Node $(node -v) | npm $(npm -v)"

# --- Step 2: Install project dependencies ---
echo "[2/6] Installing project dependencies..."
cd "$REPO_DIR"
npm ci --production=false

# --- Step 3: Create .env if it doesn't exist ---
if [ ! -f "$REPO_DIR/.env" ]; then
    echo "[3/6] Creating .env from .env.example..."
    cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
    echo ""
    echo "  !! IMPORTANT: Edit $REPO_DIR/.env and add your Gemini API key !!"
    echo "  !! Run: nano $REPO_DIR/.env                                    !!"
    echo ""
else
    echo "[3/6] .env already exists, skipping..."
fi

# --- Step 4: Build the app ---
echo "[4/6] Building production bundle..."
npm run build

# --- Step 5: Deploy to web root ---
echo "[5/6] Deploying to $APP_DIR..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -r "$REPO_DIR/dist/"* "$APP_DIR/"

# --- Step 6: Configure Nginx ---
echo "[6/6] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/clouddrive"

# Copy and customise the nginx config
cp "$REPO_DIR/deploy/nginx.conf" "$NGINX_CONF"
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" "$NGINX_CONF"

# Enable the site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/clouddrive

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "============================================"
echo ""
echo "  Your app is live at: http://$DOMAIN"
echo ""
echo "  Next steps:"
echo "  1. Add your Gemini API key:  nano $REPO_DIR/.env"
echo "     Then rebuild:             cd $REPO_DIR && npm run build && cp -r dist/* $APP_DIR/"
echo ""
echo "  2. Set up HTTPS (free SSL via Let's Encrypt):"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d $DOMAIN"
echo "     Then uncomment the HTTPS block in $NGINX_CONF"
echo ""
echo "  3. Set up auto-renewal:  certbot renew --dry-run"
echo ""
echo "============================================"
