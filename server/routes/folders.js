import express from 'express';
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
} from '../controllers/foldersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createFolder);
router.get('/', getFolders);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
