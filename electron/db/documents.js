import { createAuditEntry } from './audit.js';

export function registerDocumentHandlers(db, ipcMain) {
  ipcMain.handle('documents:getByVehicle', (_e, vehicle_id) => {
    return db.prepare(`SELECT vd.*, v.plate_number, v.make, v.model
      FROM vehicle_documents vd
      JOIN vehicles v ON v.id = vd.vehicle_id
      WHERE vd.vehicle_id = ?
      ORDER BY vd.created_at DESC`).all(vehicle_id);
  });

  ipcMain.handle('documents:get', (_e, id) => {
    return db.prepare(`SELECT vd.*, v.plate_number, v.make, v.model
      FROM vehicle_documents vd
      JOIN vehicles v ON v.id = vd.vehicle_id
      WHERE vd.id = ?`).get(id);
  });

  ipcMain.handle('documents:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO vehicle_documents (vehicle_id, name, type,
      file_name, file_data, expiry_date, notes)
      VALUES (@vehicle_id, @name, @type, @file_name, @file_data, @expiry_date, @notes)`).run(data);
    createAuditEntry(db, 'CREATE', 'document', result.lastInsertRowid,
      `Added document ${data.name} for vehicle #${data.vehicle_id}`,
      null, { name: data.name, type: data.type });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('documents:delete', (_e, id) => {
    const old = db.prepare('SELECT * FROM vehicle_documents WHERE id = ?').get(id);
    db.prepare('DELETE FROM vehicle_documents WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'document', id,
      `Deleted document ${old?.name || id}`, { name: old?.name }, null);
    return { success: true };
  });
}
