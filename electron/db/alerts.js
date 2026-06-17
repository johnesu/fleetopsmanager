import { createAuditEntry } from './audit.js';

export function registerAlertHandlers(db, ipcMain) {
  ipcMain.handle('alerts:getAll', (_e, filters = {}) => {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    if (filters.type) { query += ' AND type = ?'; params.push(filters.type); }
    if (filters.severity) { query += ' AND severity = ?'; params.push(filters.severity); }
    if (filters.is_read !== undefined) { query += ' AND is_read = ?'; params.push(filters.is_read ? 1 : 0); }
    if (filters.is_resolved !== undefined) { query += ' AND is_resolved = ?'; params.push(filters.is_resolved ? 1 : 0); }
    query += ' ORDER BY created_at DESC';
    if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('alerts:get', (_e, id) => {
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  });

  ipcMain.handle('alerts:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO alerts (type, severity, title, description,
      entity_type, entity_id, is_read, is_resolved)
      VALUES (@type, @severity, @title, @description, @entity_type, @entity_id, 0, 0)`).run(data);
    return { id: result.lastInsertRowid, ...data, is_read: 0, is_resolved: 0 };
  });

  ipcMain.handle('alerts:markRead', (_e, id) => {
    db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('alerts:markResolved', (_e, id) => {
    db.prepare('UPDATE alerts SET is_resolved = 1, resolved_at = datetime("now") WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('alerts:delete', (_e, id) => {
    db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('alerts:getUnreadCount', () => {
    return db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0').get().count;
  });

  ipcMain.handle('alerts:generateAlerts', () => {
    const count = { generated: 0 };

    const expiringInsurance = db.prepare(`SELECT * FROM vehicles
      WHERE insurance_expiry <= datetime('now', '+30 days') AND insurance_expiry >= datetime('now')`).all();
    for (const v of expiringInsurance) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE entity_type = 'vehicle'
        AND entity_id = ? AND type = 'insurance_expiry' AND is_resolved = 0`).get(v.id);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, severity, title, description, entity_type, entity_id)
          VALUES ('insurance_expiry', 'warning', ?, ?, 'vehicle', ?)`).run(
          `Insurance expiring for ${v.plate_number}`,
          `Vehicle ${v.plate_number} insurance expires on ${v.insurance_expiry}`,
          v.id
        );
        count.generated++;
      }
    }

    const expiringLicense = db.prepare(`SELECT * FROM vehicles
      WHERE license_expiry <= datetime('now', '+30 days') AND license_expiry >= datetime('now')`).all();
    for (const v of expiringLicense) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE entity_type = 'vehicle'
        AND entity_id = ? AND type = 'license_expiry' AND is_resolved = 0`).get(v.id);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, severity, title, description, entity_type, entity_id)
          VALUES ('license_expiry', 'warning', ?, ?, 'vehicle', ?)`).run(
          `License expiring for ${v.plate_number}`,
          `Vehicle ${v.plate_number} license expires on ${v.license_expiry}`,
          v.id
        );
        count.generated++;
      }
    }

    const expiringDriverLicense = db.prepare(`SELECT * FROM drivers
      WHERE license_expiry <= datetime('now', '+30 days') AND license_expiry >= datetime('now')`).all();
    for (const d of expiringDriverLicense) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE entity_type = 'driver'
        AND entity_id = ? AND type = 'license_expiry' AND is_resolved = 0`).get(d.id);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, severity, title, description, entity_type, entity_id)
          VALUES ('license_expiry', 'warning', ?, ?, 'driver', ?)`).run(
          `License expiring for ${d.name}`,
          `Driver ${d.name} license expires on ${d.license_expiry}`,
          d.id
        );
        count.generated++;
      }
    }

    const upcomingMaintenance = db.prepare(`SELECT * FROM maintenance_records
      WHERE status = 'scheduled' AND next_service_date IS NOT NULL
      AND next_service_date <= datetime('now', '+7 days')`).all();
    for (const m of upcomingMaintenance) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE entity_type = 'maintenance'
        AND entity_id = ? AND type = 'maintenance' AND is_resolved = 0`).get(m.id);
      if (!existing) {
        const v = db.prepare('SELECT plate_number FROM vehicles WHERE id = ?').get(m.vehicle_id);
        db.prepare(`INSERT INTO alerts (type, severity, title, description, entity_type, entity_id)
          VALUES ('maintenance', 'info', ?, ?, 'maintenance', ?)`).run(
          `Maintenance due for ${v?.plate_number || m.vehicle_id}`,
          `${m.service_type} scheduled on ${m.next_service_date}`,
          m.id
        );
        count.generated++;
      }
    }

    return count;
  });
}
