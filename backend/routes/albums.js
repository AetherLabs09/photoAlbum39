const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const albums = db.prepare(`
    SELECT a.*, 
      (SELECT COUNT(*) FROM media WHERE album_id = a.id) as media_count,
      (SELECT COUNT(*) FROM albums WHERE parent_id = a.id) as children_count
    FROM albums a
    ORDER BY a.is_top DESC, a.sort_order ASC, a.created_at ASC
  `).all();
  res.json(albums);
});

router.get('/tree', (req, res) => {
  const albums = db.prepare(`
    SELECT * FROM albums ORDER BY is_top DESC, sort_order ASC, created_at ASC
  `).all();
  
  function buildTree(items, parentId = null) {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  }
  
  res.json(buildTree(albums));
});

router.get('/:id', (req, res) => {
  const album = db.prepare(`
    SELECT a.*, 
      (SELECT COUNT(*) FROM media WHERE album_id = a.id) as media_count
    FROM albums a WHERE a.id = ?
  `).get(req.params.id);
  
  if (!album) {
    return res.status(404).json({ error: 'Album not found' });
  }
  res.json(album);
});

router.post('/', (req, res) => {
  const { name, parent_id } = req.body;
  const id = uuidv4();
  
  const maxOrder = db.prepare(`
    SELECT COALESCE(MAX(sort_order), 0) as max_order FROM albums WHERE parent_id IS ?
  `).get(parent_id || null);
  
  db.prepare(`
    INSERT INTO albums (id, name, parent_id, sort_order) VALUES (?, ?, ?, ?)
  `).run(id, name, parent_id || null, maxOrder.max_order + 1);
  
  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(id);
  res.status(201).json(album);
});

router.put('/:id', (req, res) => {
  const { name, parent_id, sort_order, is_top } = req.body;
  const { id } = req.params;
  
  db.prepare(`
    UPDATE albums 
    SET name = COALESCE(?, name),
        parent_id = COALESCE(?, parent_id),
        sort_order = COALESCE(?, sort_order),
        is_top = COALESCE(?, is_top),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, parent_id, sort_order, is_top, id);
  
  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(id);
  res.json(album);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  if (id === 'default') {
    return res.status(400).json({ error: 'Cannot delete default album' });
  }
  
  db.prepare('UPDATE media SET album_id = NULL WHERE album_id = ?').run(id);
  db.prepare('UPDATE albums SET parent_id = NULL WHERE parent_id = ?').run(id);
  db.prepare('DELETE FROM albums WHERE id = ?').run(id);
  
  res.json({ message: 'Album deleted' });
});

router.post('/:id/move', (req, res) => {
  const { id } = req.params;
  const { target_id, position } = req.body;
  
  if (id === target_id) {
    return res.status(400).json({ error: 'Cannot move to itself' });
  }
  
  db.prepare('UPDATE albums SET parent_id = ? WHERE id = ?').run(target_id || null, id);
  
  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(id);
  res.json(album);
});

router.post('/:id/top', (req, res) => {
  const { id } = req.params;
  const { is_top } = req.body;
  
  db.prepare('UPDATE albums SET is_top = ? WHERE id = ?').run(is_top ? 1 : 0, id);
  
  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(id);
  res.json(album);
});

module.exports = router;
