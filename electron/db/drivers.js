import { createAuditEntry } from './audit.js';

export function registerDriverHandlers(db, ipcMain) {
  ipcMain.handle('drivers:getAll', () => {
    return db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all();
  });

  ipcMain.handle('drivers:get', (_e, id) => {
    return db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
  });

  ipcMain.handle('drivers:create', (_e, data) => {
    const result = db.prepare(`
      INSERT INTO drivers (name, phone, email, license_number, license_expiry, license_class, status, notes)
      VALUES (@name, @phone, @email, @license_number, @license_expiry, @license_class, @status, @notes)
    `).run(data);
    createAuditEntry(db, 'CREATE', 'driver', result.lastInsertRowid,
      `Added driver ${data.name}`, null, { name: data.name, license: data.license_number });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('drivers:update', (_e, id, data) => {
    const old = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    db.prepare(`
      UPDATE drivers SET name=@name, phone=@phone, email=@email,
        license_number=@license_number, license_expiry=@license_expiry,
        license_class=@license_class, status=@status, notes=@notes,
        updated_at = datetime('now') WHERE id=@id
    `).run({ ...data, id });
    createAuditEntry(db, 'UPDATE', 'driver', id,
      `Updated driver ${data.name}`, null, null);
    return db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
  });

  ipcMain.handle('drivers:delete', (_e, id) => {
    const old = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    db.prepare('DELETE FROM drivers WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'driver', id,
      `Deleted driver ${old?.name || id}`, { name: old?.name }, null);
    return { success: true };
  });

  ipcMain.handle('drivers:getExpiring', () => {
    return db.prepare(`SELECT * FROM drivers WHERE license_expiry <= datetime('now', '+30 days') ORDER BY license_expiry`).all();
  });
}
