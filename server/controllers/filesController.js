import { query } from '../config/database.js';
import { uploadToSpaces, deleteFromSpaces, getPresignedUrl } from '../config/spaces.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Spaces and save metadata to database
 */
export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { folderId } = req.body;
    const userId = req.user.id;

    // Check storage limit
    const userResult = await query(
      'SELECT storage_used, storage_limit FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    const fileSize = req.file.size;

    if (user.storage_used + fileSize > user.storage_limit) {
      return res.status(413).json({
        success: false,
        message: 'Storage limit exceeded',
      });
    }

    // Determine file type
    const mimeType = req.file.mimetype;
    const fileType = getFileType(mimeType);

    // Upload to Spaces
    const { key, url } = await uploadToSpaces(
      req.file.buffer,
      req.file.originalname,
      mimeType,
      userId
    );

    // Save file metadata to database
    const result = await query(
      `INSERT INTO files (
        user_id, folder_id, name, original_name, file_type, mime_type,
        size, spaces_key, spaces_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        folderId || null,
        req.file.originalname,
        req.file.originalname,
        fileType,
        mimeType,
        fileSize,
        key,
        url,
      ]
    );

    const file = result.rows[0];

    // Update user's storage usage
    await query(
      'UPDATE users SET storage_used = storage_used + $1 WHERE id = $2',
      [fileSize, userId]
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: formatFileResponse(file),
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
    });
  }
}

/**
 * Get all files for current user
 */
export async function getFiles(req, res) {
  try {
    const { folderId, starred, trashed } = req.query;
    const userId = req.user.id;

    let queryText = `
      SELECT * FROM files
      WHERE user_id = $1
    `;
    const queryParams = [userId];
    let paramCount = 2;

    if (folderId !== undefined) {
      queryText += ` AND folder_id ${folderId === 'null' ? 'IS NULL' : `= $${paramCount++}`}`;
      if (folderId !== 'null') queryParams.push(folderId);
    }

    if (starred === 'true') {
      queryText += ` AND is_starred = true`;
    }

    if (trashed !== undefined) {
      queryText += ` AND is_trashed = $${paramCount++}`;
      queryParams.push(trashed === 'true');
    } else {
      queryText += ` AND is_trashed = false`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows.map(formatFileResponse),
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get files',
    });
  }
}

/**
 * Get a single file by ID
 */
export async function getFileById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'SELECT * FROM files WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.json({
      success: true,
      data: formatFileResponse(result.rows[0]),
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file',
    });
  }
}

/**
 * Download a file (returns presigned URL)
 */
export async function downloadFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'SELECT spaces_key, name FROM files WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const file = result.rows[0];

    // Generate presigned URL (valid for 1 hour)
    const downloadUrl = await getPresignedUrl(file.spaces_key, 3600);

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link',
    });
  }
}

/**
 * Update file metadata
 */
export async function updateFile(req, res) {
  try {
    const { id } = req.params;
    const { name, folderId, isStarred } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (folderId !== undefined) {
      updates.push(`folder_id = $${paramCount++}`);
      values.push(folderId || null);
    }

    if (isStarred !== undefined) {
      updates.push(`is_starred = $${paramCount++}`);
      values.push(isStarred);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided',
      });
    }

    values.push(id, userId);

    const result = await query(
      `UPDATE files SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.json({
      success: true,
      message: 'File updated successfully',
      data: formatFileResponse(result.rows[0]),
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file',
    });
  }
}

/**
 * Move file to trash
 */
export async function trashFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE files SET is_trashed = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.json({
      success: true,
      message: 'File moved to trash',
      data: formatFileResponse(result.rows[0]),
    });
  } catch (error) {
    console.error('Trash file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move file to trash',
    });
  }
}

/**
 * Restore file from trash
 */
export async function restoreFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE files SET is_trashed = false
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.json({
      success: true,
      message: 'File restored from trash',
      data: formatFileResponse(result.rows[0]),
    });
  } catch (error) {
    console.error('Restore file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore file',
    });
  }
}

/**
 * Permanently delete a file
 */
export async function deleteFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get file info
    const result = await query(
      'SELECT spaces_key, size FROM files WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const file = result.rows[0];

    // Delete from Spaces
    await deleteFromSpaces(file.spaces_key);

    // Delete from database
    await query('DELETE FROM files WHERE id = $1', [id]);

    // Update user's storage usage
    await query(
      'UPDATE users SET storage_used = storage_used - $1 WHERE id = $2',
      [file.size, userId]
    );

    res.json({
      success: true,
      message: 'File deleted permanently',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
    });
  }
}

/**
 * Helper function to determine file type from MIME type
 */
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.startsWith('text/') || mimeType.includes('json')) return 'text';
  return 'other';
}

/**
 * Format file response
 */
function formatFileResponse(file) {
  return {
    id: file.id,
    name: file.name,
    originalName: file.original_name,
    type: 'file',
    fileType: file.file_type,
    mimeType: file.mime_type,
    size: file.size,
    url: file.spaces_url,
    thumbnailUrl: file.thumbnail_url,
    isStarred: file.is_starred,
    isTrashed: file.is_trashed,
    folderId: file.folder_id,
    createdAt: file.created_at,
    updatedAt: file.updated_at,
  };
}
