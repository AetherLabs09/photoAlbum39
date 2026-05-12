const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const uploadsDir = path.join(__dirname, '../uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'other';
};

const generateThumbnail = async (filePath, filename, fileType) => {
  const thumbnailFilename = `thumb_${path.basename(filename, path.extname(filename))}.jpg`;
  const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
  
  try {
    if (fileType === 'image') {
      await sharp(filePath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      return `/uploads/thumbnails/${thumbnailFilename}`;
    }
  } catch (err) {
    console.error('Thumbnail generation error:', err);
  }
  return null;
};

const getImageMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (err) {
    return { width: null, height: null };
  }
};

router.post('/upload', upload.array('files', 50), async (req, res) => {
  const files = req.files;
  const { album_id } = req.body;
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  const results = [];
  
  for (const file of files) {
    const id = uuidv4();
    const fileType = getFileType(file.mimetype);
    const filePath = `/uploads/${file.filename}`;
    
    let thumbnailPath = null;
    let width = null;
    let height = null;
    
    if (fileType === 'image') {
      thumbnailPath = await generateThumbnail(file.path, file.filename, fileType);
      const metadata = await getImageMetadata(file.path);
      width = metadata.width;
      height = metadata.height;
    }
    
    db.prepare(`
      INSERT INTO media (id, filename, original_name, file_path, thumbnail_path, file_type, file_size, width, height, album_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, file.filename, file.originalname, filePath, thumbnailPath, fileType, file.size, width, height, album_id || null);
    
    const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
    results.push(media);
  }
  
  res.status(201).json({ files: results });
});

router.get('/', (req, res) => {
  const { album_id, type, start_date, end_date, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  let sql = `
    SELECT m.*, 
      GROUP_CONCAT(t.name) as tags,
      mn.content as note
    FROM media m
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    LEFT JOIN media_notes mn ON m.id = mn.media_id
    WHERE 1=1
  `;
  const params = [];
  
  if (album_id) {
    sql += ' AND m.album_id = ?';
    params.push(album_id);
  }
  
  if (type) {
    sql += ' AND m.file_type = ?';
    params.push(type);
  }
  
  if (start_date) {
    sql += ' AND date(m.capture_time) >= date(?)';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND date(m.capture_time) <= date(?)';
    params.push(end_date);
  }
  
  if (search) {
    sql += ' AND (m.original_name LIKE ? OR mn.content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += ' GROUP BY m.id ORDER BY m.capture_time DESC, m.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const media = db.prepare(sql).all(...params);
  res.json(media);
});

router.get('/timeline', (req, res) => {
  const { album_id, type } = req.query;
  
  let sql = `
    SELECT 
      strftime('%Y', COALESCE(capture_time, created_at)) as year,
      strftime('%m', COALESCE(capture_time, created_at)) as month,
      strftime('%d', COALESCE(capture_time, created_at)) as day,
      COUNT(*) as count
    FROM media
    WHERE 1=1
  `;
  const params = [];
  
  if (album_id) {
    sql += ' AND album_id = ?';
    params.push(album_id);
  }
  
  if (type) {
    sql += ' AND file_type = ?';
    params.push(type);
  }
  
  sql += `
    GROUP BY year, month, day
    ORDER BY year DESC, month DESC, day DESC
  `;
  
  const timeline = db.prepare(sql).all(...params);
  
  const grouped = {};
  timeline.forEach(item => {
    if (!grouped[item.year]) grouped[item.year] = {};
    if (!grouped[item.year][item.month]) grouped[item.year][item.month] = [];
    grouped[item.year][item.month].push({ day: item.day, count: item.count });
  });
  
  res.json(grouped);
});

router.get('/:id', (req, res) => {
  const media = db.prepare(`
    SELECT m.*, 
      GROUP_CONCAT(t.name) as tags,
      mn.content as note
    FROM media m
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    LEFT JOIN media_notes mn ON m.id = mn.media_id
    WHERE m.id = ?
    GROUP BY m.id
  `).get(req.params.id);
  
  if (!media) {
    return res.status(404).json({ error: 'Media not found' });
  }
  res.json(media);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { album_id, capture_time } = req.body;
  
  db.prepare(`
    UPDATE media 
    SET album_id = COALESCE(?, album_id),
        capture_time = COALESCE(?, capture_time),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(album_id, capture_time, id);
  
  const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  res.json(media);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  if (!media) {
    return res.status(404).json({ error: 'Media not found' });
  }
  
  if (media.file_path) {
    const filePath = path.join(__dirname, '..', media.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  if (media.thumbnail_path) {
    const thumbPath = path.join(__dirname, '..', media.thumbnail_path);
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
  }
  
  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  res.json({ message: 'Media deleted' });
});

router.post('/batch/move', (req, res) => {
  const { ids, album_id } = req.body;
  
  const stmt = db.prepare('UPDATE media SET album_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const updateMany = db.transaction((items) => {
    for (const id of items) stmt.run(album_id, id);
  });
  
  updateMany(ids);
  res.json({ message: 'Media moved successfully' });
});

router.post('/batch/delete', (req, res) => {
  const { ids } = req.body;
  
  const deleteMany = db.transaction((items) => {
    for (const id of items) {
      const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
      if (media) {
        if (media.file_path) {
          const filePath = path.join(__dirname, '..', media.file_path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        if (media.thumbnail_path) {
          const thumbPath = path.join(__dirname, '..', media.thumbnail_path);
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }
        db.prepare('DELETE FROM media WHERE id = ?').run(id);
      }
    }
  });
  
  deleteMany(ids);
  res.json({ message: 'Media deleted successfully' });
});

router.post('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { operation, params: opParams } = req.body;
  
  const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  if (!media) {
    return res.status(404).json({ error: 'Media not found' });
  }
  
  if (media.file_type !== 'image') {
    return res.status(400).json({ error: 'Only images can be edited' });
  }
  
  const filePath = path.join(__dirname, '..', media.file_path);
  const newId = uuidv4();
  const newFilename = `${newId}${path.extname(media.filename)}`;
  const newFilePath = path.join(uploadsDir, newFilename);
  
  try {
    let image = sharp(filePath);
    
    switch (operation) {
      case 'rotate':
        image = image.rotate(opParams.angle || 90);
        break;
      case 'crop':
        image = image.extract({
          left: opParams.x,
          top: opParams.y,
          width: opParams.width,
          height: opParams.height
        });
        break;
      case 'resize':
        image = image.resize(opParams.width, opParams.height);
        break;
      default:
        return res.status(400).json({ error: 'Unknown operation' });
    }
    
    await image.toFile(newFilePath);
    
    const thumbnailPath = await generateThumbnail(newFilePath, newFilename, 'image');
    const metadata = await getImageMetadata(newFilePath);
    
    db.prepare(`
      INSERT INTO media (id, filename, original_name, file_path, thumbnail_path, file_type, file_size, width, height, album_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, newFilename, `edited_${media.original_name}`, `/uploads/${newFilename}`, thumbnailPath, 'image', 
      fs.statSync(newFilePath).size, metadata.width, metadata.height, media.album_id);
    
    const newMedia = db.prepare('SELECT * FROM media WHERE id = ?').get(newId);
    res.json(newMedia);
  } catch (err) {
    console.error('Edit error:', err);
    res.status(500).json({ error: 'Failed to edit image' });
  }
});

router.post('/:id/note', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  const existing = db.prepare('SELECT * FROM media_notes WHERE media_id = ?').get(id);
  
  if (existing) {
    db.prepare('UPDATE media_notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE media_id = ?').run(content, id);
  } else {
    db.prepare('INSERT INTO media_notes (id, media_id, content) VALUES (?, ?, ?)').run(uuidv4(), id, content);
  }
  
  res.json({ message: 'Note saved' });
});

module.exports = router;
