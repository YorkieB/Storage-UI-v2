#!/bin/bash
# ============================================================
# CloudDrive - Quick Redeploy Script
# ============================================================
# Use this to quickly redeploy after pulling updates from GitHub
#
# Usage:
#   cd /path/to/Storage-UI-v2
#   git pull origin main
#   ./deploy/redeploy.sh
# ============================================================

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="/var/www/clouddrive"

echo ""
echo "============================================"
echo "  CloudDrive Quick Redeploy"
echo "============================================"
echo ""

# Install/update frontend dependencies
echo "[1/5] Updating frontend dependencies..."
cd "$REPO_DIR"
npm ci --production=false

# Install/update backend dependencies
echo "[2/5] Updating backend dependencies..."
cd "$REPO_DIR/server"
npm ci --production=false

# Run any new migrations
echo "[3/5] Running database migrations..."
npm run migrate || echo "  ⚠️  No new migrations or already applied"

# Build frontend
echo "[4/5] Building frontend..."
cd "$REPO_DIR"
npm run build

# Deploy frontend
echo "[5/5] Deploying frontend..."
rm -rf "$APP_DIR"/*
cp -r dist/* "$APP_DIR/"

# Restart backend
echo "Restarting backend..."
pm2 restart clouddrive-api

echo ""
echo "============================================"
echo "  ✅ Redeploy Complete!"
echo "============================================"
echo ""
echo "  Frontend: Updated in $APP_DIR"
echo "  Backend:  Restarted with PM2"
echo ""
echo "  Check status:"
echo "    pm2 status"
echo "    pm2 logs clouddrive-api"
echo ""
echo "============================================"
echo ""
