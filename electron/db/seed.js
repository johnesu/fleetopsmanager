import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export function seedDatabase(db) {
  const count = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
  if (count > 0) return;

  const seedPath = path.join(app.getAppPath(), 'electron', 'db', 'seed.sql');
  if (!fs.existsSync(seedPath)) return;

  const seedSQL = fs.readFileSync(seedPath, 'utf-8');
  db.exec(seedSQL);
}
