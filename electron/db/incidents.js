import { createAuditEntry } from './audit.js';

export function registerIncidentHandlers(db, ipcMain) {
  ipcMain.handle('incidents:getAll', (_e, filters = {}) => {
    let query = `SELECT i.*, v.plate_number, v.make, v.model, d.name AS driver_name
      FROM incidents i
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      LEFT JOIN drivers d ON d.id = i.driver_id
      WHERE 1=1`;
    const params = [];
    if (filters.type) { query += ' AND i.type = ?'; params.push(filters.type); }
    if (filters.severity) { query += ' AND i.severity = ?'; params.push(filters.severity); }
    if (filters.status) { query += ' AND i.status = ?'; params.push(filters.status); }
    if (filters.vehicle_id) { query += ' AND i.vehicle_id = ?'; params.push(filters.vehicle_id); }
    if (filters.driver_id) { query += ' AND i.driver_id = ?'; params.push(filters.driver_id); }
    query += ' ORDER BY i.created_at DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('incidents:get', (_e, id) => {
    return db.prepare(`SELECT i.*, v.plate_number, v.make, v.model, d.name AS driver_name
      FROM incidents i
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      LEFT JOIN drivers d ON d.id = i.driver_id
      WHERE i.id = ?`).get(id);
  });

  ipcMain.handle('incidents:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO incidents (vehicle_id, driver_id, trip_id,
      type, severity, date, location, latitude, longitude, description,
      actions_taken, reported_by, cost, status, resolution_notes)
      VALUES (@vehicle_id, @driver_id, @trip_id, @type, @severity, @date, @location,
        @latitude, @longitude, @description, @actions_taken, @reported_by, @cost,
        @status, @resolution_notes)`).run(data);
    createAuditEntry(db, 'CREATE', 'incident', result.lastInsertRowid,
      `Created incident: ${data.type}${data.location ? ' at ' + data.location : ''}`,
      null, { type: data.type, severity: data.severity });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('incidents:update', (_e, id, data) => {
    const old = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    db.prepare(`UPDATE incidents SET vehicle_id=@vehicle_id, driver_id=@driver_id,
      trip_id=@trip_id, type=@type, severity=@severity, date=@date, location=@location,
      latitude=@latitude, longitude=@longitude, description=@description,
      actions_taken=@actions_taken, reported_by=@reported_by, cost=@cost,
      status=@status, resolution_notes=@resolution_notes, updated_at=datetime('now')
      WHERE id=@id`).run({ ...data, id });
    if (old && old.status !== data.status) {
      createAuditEntry(db, 'UPDATE', 'incident', id,
        `Incident #${id} marked ${data.status}`, { status: old.status }, { status: data.status });
    } else {
      createAuditEntry(db, 'UPDATE', 'incident', id, `Updated incident #${id}`, null, null);
    }
    return db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
  });

  ipcMain.handle('incidents:delete', (_e, id) => {
    db.prepare('DELETE FROM incidents WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'incident', id, `Deleted incident #${id}`, null, null);
    return { success: true };
  });
}
