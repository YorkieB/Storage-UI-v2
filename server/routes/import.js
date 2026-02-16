import express from 'express';
import {
  getGoogleAuthUrl,
  googleCallback,
  importFromGoogleDrive,
  getMicrosoftAuthUrl,
  microsoftCallback,
  getDropboxAuthUrl,
  dropboxCallback,
} from '../controllers/importController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Google Drive routes
router.get('/google/auth', authenticateToken, getGoogleAuthUrl);
router.get('/google/callback', googleCallback); // No auth - receives OAuth callback
router.post('/google/import', authenticateToken, importFromGoogleDrive);

// Microsoft OneDrive routes
router.get('/microsoft/auth', authenticateToken, getMicrosoftAuthUrl);
router.get('/microsoft/callback', microsoftCallback);

// Dropbox routes
router.get('/dropbox/auth', authenticateToken, getDropboxAuthUrl);
router.get('/dropbox/callback', dropboxCallback);

export default router;
