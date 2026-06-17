export function registerSettingHandlers(db, ipcMain) {
  ipcMain.handle('settings:getAll', () => {
    return db.prepare('SELECT * FROM settings ORDER BY key ASC').all();
  });

  ipcMain.handle('settings:get', (_e, key) => {
    const row = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    return row || null;
  });

  ipcMain.handle('settings:set', (_e, key, value) => {
    db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`).run(key, value);
    return { success: true, key, value };
  });

  ipcMain.handle('settings:setMultiple', (_e, entries) => {
    const stmt = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`);
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.key, String(item.value));
      }
    });
    insertMany(entries);
    return { success: true, count: entries.length };
  });
}
