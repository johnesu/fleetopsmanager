import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let db = null;

export function getDatabase() {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'fleetops.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(
    path.join(app.getAppPath(), 'electron', 'db', 'schema.sql'),
    'utf-8'
  );
  db.exec(schema);

  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
