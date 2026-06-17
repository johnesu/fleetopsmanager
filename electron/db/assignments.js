import { createAuditEntry } from './audit.js';

export function registerAssignmentHandlers(db, ipcMain) {
  ipcMain.handle('assignments:getActive', () => {
    return db.prepare(`
      SELECT vda.*, v.plate_number, v.make, v.model, d.name AS driver_name, d.phone
      FROM vehicle_driver_assignments vda
      JOIN vehicles v ON v.id = vda.vehicle_id
      JOIN drivers d ON d.id = vda.driver_id
      WHERE vda.is_active = 1 ORDER BY vda.start_date DESC
    `).all();
  });

  ipcMain.handle('assignments:getByVehicle', (_e, vehicleId) => {
    return db.prepare(`
      SELECT vda.*, d.name AS driver_name, d.license_number
      FROM vehicle_driver_assignments vda JOIN drivers d ON d.id = vda.driver_id
      WHERE vda.vehicle_id = ? ORDER BY vda.start_date DESC
    `).all(vehicleId);
  });

  ipcMain.handle('assignments:getByDriver', (_e, driverId) => {
    return db.prepare(`
      SELECT vda.*, v.plate_number, v.make, v.model
      FROM vehicle_driver_assignments vda JOIN vehicles v ON v.id = vda.vehicle_id
      WHERE vda.driver_id = ? ORDER BY vda.start_date DESC
    `).all(driverId);
  });

  ipcMain.handle('assignments:create', (_e, vehicleId, driverId) => {
    const existing = db.prepare('SELECT id FROM vehicle_driver_assignments WHERE vehicle_id = ? AND is_active = 1').get(vehicleId);
    if (existing) {
      db.prepare('UPDATE vehicle_driver_assignments SET is_active = 0, end_date = datetime("now") WHERE id = ?').run(existing.id);
    }
    const result = db.prepare('INSERT INTO vehicle_driver_assignments (vehicle_id, driver_id) VALUES (?, ?)').run(vehicleId, driverId);
    const v = db.prepare('SELECT plate_number FROM vehicles WHERE id = ?').get(vehicleId);
    const d = db.prepare('SELECT name FROM drivers WHERE id = ?').get(driverId);
    createAuditEntry(db, 'CREATE', 'assignment', result.lastInsertRowid,
      `Assigned ${d?.name} to ${v?.plate_number}`,
      null, { vehicle_id: vehicleId, driver_id: driverId });
    return { id: result.lastInsertRowid, vehicle_id: vehicleId, driver_id: driverId };
  });

  ipcMain.handle('assignments:end', (_e, assignmentId) => {
    const a = db.prepare(`SELECT vda.*, v.plate_number, d.name FROM vehicle_driver_assignments vda
      JOIN vehicles v ON v.id = vda.vehicle_id JOIN drivers d ON d.id = vda.driver_id
      WHERE vda.id = ?`).get(assignmentId);
    db.prepare('UPDATE vehicle_driver_assignments SET is_active = 0, end_date = datetime("now") WHERE id = ?').run(assignmentId);
    createAuditEntry(db, 'UPDATE', 'assignment', assignmentId,
      `Unassigned ${a?.name} from ${a?.plate_number}`, null, null);
    return { success: true };
  });
}
