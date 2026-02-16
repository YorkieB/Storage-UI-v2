import { query } from '../config/database.js';

export async function createFolder(req, res) {
  try {
    const { name, parentId, color } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Folder name required' });
    }

    const result = await query(
      `INSERT INTO folders (user_id, parent_id, name, color)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, parentId || null, name, color || null]
    );

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: formatFolderResponse(result.rows[0]),
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to create folder' });
  }
}

export async function getFolders(req, res) {
  try {
    const { parentId } = req.query;
    const userId = req.user.id;

    let queryText = 'SELECT * FROM folders WHERE user_id = $1 AND is_trashed = false';
    const queryParams = [userId];

    if (parentId !== undefined) {
      queryText += ` AND parent_id ${parentId === 'null' ? 'IS NULL' : '= $2'}`;
      if (parentId !== 'null') queryParams.push(parentId);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows.map(formatFolderResponse),
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get folders' });
  }
}

export async function updateFolder(req, res) {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user.id;

    const result = await query(
      `UPDATE folders SET name = COALESCE($1, name), color = COALESCE($2, color)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [name, color, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    res.json({
      success: true,
      message: 'Folder updated successfully',
      data: formatFolderResponse(result.rows[0]),
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to update folder' });
  }
}

export async function deleteFolder(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete folder' });
  }
}

function formatFolderResponse(folder) {
  return {
    id: folder.id,
    name: folder.name,
    type: 'folder',
    parentId: folder.parent_id,
    color: folder.color,
    isTrashed: folder.is_trashed,
    createdAt: folder.created_at,
    updatedAt: folder.updated_at,
  };
}
