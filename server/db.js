import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../database.sqlite'));
db.pragma('journal_mode = WAL');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    registration TEXT UNIQUE,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    winnerCount INTEGER DEFAULT 1,
    allowRepeat INTEGER DEFAULT 0,
    animationSpeed TEXT DEFAULT 'medium',
    animationDuration INTEGER DEFAULT 3,
    autoDraw INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    winnerCountUsed INTEGER NOT NULL,
    allowRepeatUsed INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS history_winners (
    historyId TEXT,
    studentId TEXT,
    studentName TEXT,
    studentRegistration TEXT,
    FOREIGN KEY(historyId) REFERENCES history(id) ON DELETE CASCADE
  );

  -- Initialize settings row if empty
  INSERT OR IGNORE INTO settings (id, winnerCount, allowRepeat, animationSpeed, animationDuration, autoDraw)
  VALUES (1, 1, 0, 'medium', 3, 0);
`);

export default db;
