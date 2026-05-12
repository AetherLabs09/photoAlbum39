const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../db/album.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    sort_order INTEGER DEFAULT 0,
    is_top INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES albums(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    duration REAL,
    album_id TEXT,
    capture_time TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media_tags (
    media_id TEXT,
    tag_id TEXT,
    PRIMARY KEY (media_id, tag_id),
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS media_notes (
    id TEXT PRIMARY KEY,
    media_id TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_albums_parent ON albums(parent_id);
  CREATE INDEX IF NOT EXISTS idx_media_album ON media(album_id);
  CREATE INDEX IF NOT EXISTS idx_media_capture_time ON media(capture_time);
  CREATE INDEX IF NOT EXISTS idx_media_type ON media(file_type);
`);

const initAlbums = db.prepare("SELECT COUNT(*) as count FROM albums");
const result = initAlbums.get();
if (result.count === 0) {
  const defaultAlbum = db.prepare("INSERT INTO albums (id, name, parent_id, sort_order) VALUES (?, ?, ?, ?)");
  defaultAlbum.run('default', '默认相册', null, 0);
}

module.exports = db;
