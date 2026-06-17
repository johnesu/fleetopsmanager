import { createAuditEntry } from './audit.js';

export function registerDispatchHandlers(db, ipcMain) {
  ipcMain.handle('dispatches:getAll', (_e, filters = {}) => {
    let query = `SELECT d.*, t.start_location, t.end_location, t.status AS trip_status,
      v.plate_number, v.make, v.model,
      dr.name AS driver_name
      FROM dispatches d
      JOIN trips t ON t.id = d.trip_id
      JOIN vehicles v ON v.id = t.vehicle_id
      JOIN drivers dr ON dr.id = t.driver_id
      WHERE 1=1`;
    const params = [];
    if (filters.status) { query += ' AND d.status = ?'; params.push(filters.status); }
    if (filters.trip_id) { query += ' AND d.trip_id = ?'; params.push(filters.trip_id); }
    query += ' ORDER BY d.created_at DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('dispatches:get', (_e, id) => {
    return db.prepare(`SELECT d.*, t.start_location, t.end_location, t.status AS trip_status,
      v.plate_number, v.make, v.model,
      dr.name AS driver_name
      FROM dispatches d
      JOIN trips t ON t.id = d.trip_id
      JOIN vehicles v ON v.id = t.vehicle_id
      JOIN drivers dr ON dr.id = t.driver_id
      WHERE d.id = ?`).get(id);
  });

  ipcMain.handle('dispatches:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO dispatches (trip_id, dispatched_by, dispatch_time,
      status, priority, pickup_location, dropoff_location, pickup_lat, pickup_lng,
      dropoff_lat, dropoff_lng, cargo_description, cargo_weight_kg, recipient_name,
      recipient_phone, instructions, notes) VALUES (@trip_id, @dispatched_by, @dispatch_time,
      @status, @priority, @pickup_location, @dropoff_location, @pickup_lat, @pickup_lng,
      @dropoff_lat, @dropoff_lng, @cargo_description, @cargo_weight_kg, @recipient_name,
      @recipient_phone, @instructions, @notes)`).run(data);
    createAuditEntry(db, 'CREATE', 'dispatch', result.lastInsertRowid,
      `Created dispatch for trip #${data.trip_id}`,
      null, { trip_id: data.trip_id, priority: data.priority });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('dispatches:update', (_e, id, data) => {
    db.prepare(`UPDATE dispatches SET trip_id=@trip_id, dispatched_by=@dispatched_by,
      dispatch_time=@dispatch_time, status=@status, priority=@priority,
      pickup_location=@pickup_location, dropoff_location=@dropoff_location,
      pickup_lat=@pickup_lat, pickup_lng=@pickup_lng, dropoff_lat=@dropoff_lat,
      dropoff_lng=@dropoff_lng, cargo_description=@cargo_description,
      cargo_weight_kg=@cargo_weight_kg, recipient_name=@recipient_name,
      recipient_phone=@recipient_phone, instructions=@instructions, notes=@notes
      WHERE id=@id`).run({ ...data, id });
    createAuditEntry(db, 'UPDATE', 'dispatch', id, `Updated dispatch #${id}`, null, null);
    return db.prepare('SELECT * FROM dispatches WHERE id = ?').get(id);
  });

  ipcMain.handle('dispatches:delete', (_e, id) => {
    db.prepare('DELETE FROM dispatches WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'dispatch', id, `Deleted dispatch #${id}`, null, null);
    return { success: true };
  });
}
