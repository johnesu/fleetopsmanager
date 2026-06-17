import { createAuditEntry } from './audit.js';

export function registerTrackingHandlers(db, ipcMain) {
  ipcMain.handle('tracking:getLatest', () => {
    return db.prepare(`
      SELECT g.*, v.plate_number, v.make, v.model
      FROM gps_tracking g
      JOIN vehicles v ON v.id = g.vehicle_id
      WHERE g.id IN (SELECT MAX(id) FROM gps_tracking GROUP BY vehicle_id)
      ORDER BY g.timestamp DESC
    `).all();
  });

  ipcMain.handle('tracking:getByVehicle', (_e, vehicle_id, limit = 100) => {
    return db.prepare(`
      SELECT g.*, v.plate_number, v.make, v.model
      FROM gps_tracking g
      JOIN vehicles v ON v.id = g.vehicle_id
      WHERE g.vehicle_id = ?
      ORDER BY g.timestamp DESC
      LIMIT ?
    `).all(vehicle_id, limit);
  });

  ipcMain.handle('tracking:getByTrip', (_e, trip_id) => {
    return db.prepare(`
      SELECT g.*, v.plate_number, v.make, v.model
      FROM gps_tracking g
      JOIN vehicles v ON v.id = g.vehicle_id
      WHERE g.trip_id = ?
      ORDER BY g.timestamp ASC
    `).all(trip_id);
  });

  ipcMain.handle('tracking:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO gps_tracking (vehicle_id, driver_id, trip_id,
      latitude, longitude, speed, heading, altitude, accuracy, timestamp)
      VALUES (@vehicle_id, @driver_id, @trip_id, @latitude, @longitude, @speed,
        @heading, @altitude, @accuracy, @timestamp)`).run(data);
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('tracking:getRouteHistory', (_e, vehicle_id, start_date, end_date) => {
    return db.prepare(`
      SELECT g.*, v.plate_number, v.make, v.model
      FROM gps_tracking g
      JOIN vehicles v ON v.id = g.vehicle_id
      WHERE g.vehicle_id = ?
        AND date(g.timestamp) >= ?
        AND date(g.timestamp) <= ?
      ORDER BY g.timestamp ASC
    `).all(vehicle_id, start_date, end_date);
  });
}
