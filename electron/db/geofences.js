import { createAuditEntry } from './audit.js';

export function registerGeofenceHandlers(db, ipcMain) {
  ipcMain.handle('geofences:getAll', () => {
    return db.prepare('SELECT * FROM geofences ORDER BY name ASC').all();
  });

  ipcMain.handle('geofences:get', (_e, id) => {
    return db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);
  });

  ipcMain.handle('geofences:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO geofences (name, description, latitude,
      longitude, radius_meters, type, active, color)
      VALUES (@name, @description, @latitude, @longitude, @radius_meters, @type, @active, @color)`).run(data);
    createAuditEntry(db, 'CREATE', 'geofence', result.lastInsertRowid,
      `Created geofence ${data.name}`, null, { name: data.name, type: data.type });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('geofences:update', (_e, id, data) => {
    const old = db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);
    db.prepare(`UPDATE geofences SET name=@name, description=@description,
      latitude=@latitude, longitude=@longitude, radius_meters=@radius_meters,
      type=@type, active=@active, color=@color WHERE id=@id`).run({ ...data, id });
    createAuditEntry(db, 'UPDATE', 'geofence', id, `Updated geofence ${data.name}`, null, null);
    return db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);
  });

  ipcMain.handle('geofences:delete', (_e, id) => {
    const old = db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);
    db.prepare('DELETE FROM geofences WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'geofence', id,
      `Deleted geofence ${old?.name || id}`, { name: old?.name }, null);
    return { success: true };
  });

  ipcMain.handle('geofences:checkViolations', () => {
    const geofences = db.prepare('SELECT * FROM geofences WHERE active = 1').all();
    const latestPositions = db.prepare(`
      SELECT g.*, v.plate_number, v.make, v.model
      FROM gps_tracking g
      JOIN vehicles v ON v.id = g.vehicle_id
      WHERE g.id IN (SELECT MAX(id) FROM gps_tracking GROUP BY vehicle_id)
    `).all();

    const violations = [];
    for (const pos of latestPositions) {
      for (const zone of geofences) {
        const d = haversine(pos.latitude, pos.longitude, zone.latitude, zone.longitude);
        const distMeters = d * 1000;
        if (zone.type === 'allowed' && distMeters > zone.radius_meters) {
          violations.push({ vehicle: pos, geofence: zone, distance_meters: Math.round(distMeters) });
        } else if (zone.type === 'restricted' && distMeters <= zone.radius_meters) {
          violations.push({ vehicle: pos, geofence: zone, distance_meters: Math.round(distMeters) });
        }
      }
    }
    return violations;
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
