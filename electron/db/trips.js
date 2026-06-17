import { createAuditEntry } from './audit.js';

export function registerTripHandlers(db, ipcMain) {
  ipcMain.handle('trips:getAll', (_e, filters = {}) => {
    let query = `SELECT t.*, v.plate_number, v.make, v.model, d.name AS driver_name
      FROM trips t JOIN vehicles v ON v.id = t.vehicle_id JOIN drivers d ON d.id = t.driver_id WHERE 1=1`;
    const params = [];
    if (filters.status) { query += ' AND t.status = ?'; params.push(filters.status); }
    if (filters.vehicle_id) { query += ' AND t.vehicle_id = ?'; params.push(filters.vehicle_id); }
    if (filters.driver_id) { query += ' AND t.driver_id = ?'; params.push(filters.driver_id); }
    if (filters.start_date) { query += ' AND date(t.start_time) >= ?'; params.push(filters.start_date); }
    if (filters.end_date) { query += ' AND date(t.start_time) <= ?'; params.push(filters.end_date); }
    query += ' ORDER BY t.created_at DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('trips:get', (_e, id) => {
    return db.prepare(`SELECT t.*, v.plate_number, v.make, v.model, d.name AS driver_name
      FROM trips t JOIN vehicles v ON v.id = t.vehicle_id JOIN drivers d ON d.id = t.driver_id WHERE t.id = ?`).get(id);
  });

  ipcMain.handle('trips:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO trips (vehicle_id, driver_id, start_location, end_location,
      start_time, distance_km, status, purpose, notes) VALUES (@vehicle_id, @driver_id, @start_location,
      @end_location, @start_time, @distance_km, @status, @purpose, @notes)`).run(data);
    createAuditEntry(db, 'CREATE', 'trip', result.lastInsertRowid,
      `Created trip: ${data.start_location || '?'} → ${data.end_location || '?'}`,
      null, { start_location: data.start_location, end_location: data.end_location });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('trips:update', (_e, id, data) => {
    const old = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    db.prepare(`UPDATE trips SET vehicle_id=@vehicle_id, driver_id=@driver_id,
      start_location=@start_location, end_location=@end_location,
      start_time=@start_time, end_time=@end_time, distance_km=@distance_km,
      status=@status, purpose=@purpose, notes=@notes WHERE id=@id`).run({ ...data, id });
    if (old && old.status !== data.status) {
      createAuditEntry(db, 'UPDATE', 'trip', id,
        `Trip #${id} marked ${data.status}`, { status: old.status }, { status: data.status });
    } else {
      createAuditEntry(db, 'UPDATE', 'trip', id, `Updated trip #${id}`, null, null);
    }
    return db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  });

  ipcMain.handle('trips:delete', (_e, id) => {
    db.prepare('DELETE FROM trips WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'trip', id, `Deleted trip #${id}`, null, null);
    return { success: true };
  });

  ipcMain.handle('trips:getByVehicle', (_e, vehicleId) => {
    return db.prepare(`SELECT t.*, d.name AS driver_name FROM trips t
      JOIN drivers d ON d.id = t.driver_id WHERE t.vehicle_id = ? ORDER BY t.created_at DESC`).all(vehicleId);
  });
}
