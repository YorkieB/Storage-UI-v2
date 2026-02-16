import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  updateFile,
  trashFile,
  restoreFile,
  deleteFile,
} from '../controllers/filesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB default
  },
});

// All routes require authentication
router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.put('/:id', updateFile);
router.post('/:id/trash', trashFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id', deleteFile);

export default router;
