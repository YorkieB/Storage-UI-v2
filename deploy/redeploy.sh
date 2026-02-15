#!/bin/bash
# ============================================================
# CloudDrive - Quick Redeploy
# ============================================================
# Run this after pulling new changes from GitHub.
#
# Usage:
#   cd /path/to/cloud-storage-app
#   git pull origin main
#   ./deploy/redeploy.sh
# ============================================================

set -e

APP_DIR="/var/www/clouddrive"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Rebuilding CloudDrive..."

cd "$REPO_DIR"
npm ci --production=false
npm run build

echo "Deploying to $APP_DIR..."
rm -rf "$APP_DIR"/*
cp -r dist/* "$APP_DIR/"

echo "Done! Changes are live."
