const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT t.*, COUNT(mt.media_id) as media_count
    FROM tags t
    LEFT JOIN media_tags mt ON t.id = mt.tag_id
    GROUP BY t.id
    ORDER BY t.name
  `).all();
  res.json(tags);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  
  try {
    db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.status(201).json(tag);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Tag already exists' });
    } else {
      throw err;
    }
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  try {
    db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(name, id);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.json(tag);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Tag name already exists' });
    } else {
      throw err;
    }
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  res.json({ message: 'Tag deleted' });
});

router.post('/media/:mediaId', (req, res) => {
  const { mediaId } = req.params;
  const { tag_ids } = req.body;
  
  const insertTag = db.prepare('INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)');
  const addTags = db.transaction((tags) => {
    for (const tagId of tags) {
      insertTag.run(mediaId, tagId);
    }
  });
  
  addTags(tag_ids);
  res.json({ message: 'Tags added' });
});

router.delete('/media/:mediaId/:tagId', (req, res) => {
  const { mediaId, tagId } = req.params;
  db.prepare('DELETE FROM media_tags WHERE media_id = ? AND tag_id = ?').run(mediaId, tagId);
  res.json({ message: 'Tag removed' });
});

router.post('/batch', (req, res) => {
  const { media_ids, tag_ids } = req.body;
  
  const insertTag = db.prepare('INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)');
  const addTags = db.transaction(() => {
    for (const mediaId of media_ids) {
      for (const tagId of tag_ids) {
        insertTag.run(mediaId, tagId);
      }
    }
  });
  
  addTags();
  res.json({ message: 'Tags added to all media' });
});

router.get('/search/:name', (req, res) => {
  const { name } = req.params;
  const media = db.prepare(`
    SELECT DISTINCT m.*
    FROM media m
    JOIN media_tags mt ON m.id = mt.media_id
    JOIN tags t ON mt.tag_id = t.id
    WHERE t.name LIKE ?
    ORDER BY m.created_at DESC
  `).all(`%${name}%`);
  
  res.json(media);
});

module.exports = router;
