import { createAuditEntry } from './audit.js';

export function registerVehicleHandlers(db, ipcMain) {
  ipcMain.handle('vehicles:getAll', () => {
    return db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
  });

  ipcMain.handle('vehicles:get', (_e, id) => {
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  });

  ipcMain.handle('vehicles:create', (_e, data) => {
    const stmt = db.prepare(`
      INSERT INTO vehicles (plate_number, make, model, year, color, status,
        insurance_expiry, license_expiry, odometer_km, fuel_type, notes)
      VALUES (@plate_number, @make, @model, @year, @color, @status,
        @insurance_expiry, @license_expiry, @odometer_km, @fuel_type, @notes)
    `);
    const result = stmt.run(data);
    createAuditEntry(db, 'CREATE', 'vehicle', result.lastInsertRowid,
      `Added vehicle ${data.plate_number}`, null, { plate_number: data.plate_number, make: data.make, model: data.model });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('vehicles:update', (_e, id, data) => {
    const old = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    const stmt = db.prepare(`
      UPDATE vehicles SET
        plate_number = @plate_number, make = @make, model = @model,
        year = @year, color = @color, status = @status,
        insurance_expiry = @insurance_expiry, license_expiry = @license_expiry,
        odometer_km = @odometer_km, fuel_type = @fuel_type, notes = @notes,
        updated_at = datetime('now')
      WHERE id = @id
    `);
    stmt.run({ ...data, id });
    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (old && old.status !== data.status) {
      createAuditEntry(db, 'UPDATE', 'vehicle', id,
        `Changed ${data.plate_number} status to ${data.status}`,
        { status: old.status }, { status: data.status });
    } else {
      createAuditEntry(db, 'UPDATE', 'vehicle', id,
        `Updated vehicle ${data.plate_number}`, null, null);
    }
    return updated;
  });

  ipcMain.handle('vehicles:delete', (_e, id) => {
    const old = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'vehicle', id,
      `Deleted vehicle ${old?.plate_number || id}`,
      { plate_number: old?.plate_number }, null);
    return { success: true };
  });

  ipcMain.handle('vehicles:getByStatus', (_e, status) => {
    return db.prepare('SELECT * FROM vehicles WHERE status = ? ORDER BY created_at DESC').all(status);
  });

  ipcMain.handle('vehicles:getExpiring', () => {
    return db.prepare(`
      SELECT * FROM vehicles
      WHERE insurance_expiry <= datetime('now', '+30 days')
         OR license_expiry <= datetime('now', '+30 days')
      ORDER BY insurance_expiry, license_expiry
    `).all();
  });
}
