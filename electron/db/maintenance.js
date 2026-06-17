import { createAuditEntry } from './audit.js';

export function registerMaintenanceHandlers(db, ipcMain) {
  ipcMain.handle('maintenance:getAll', (_e, filters = {}) => {
    let query = `SELECT m.*, v.plate_number, v.make, v.model FROM maintenance_records m JOIN vehicles v ON v.id = m.vehicle_id WHERE 1=1`;
    const params = [];
    if (filters.vehicle_id) { query += ' AND m.vehicle_id = ?'; params.push(filters.vehicle_id); }
    if (filters.status) { query += ' AND m.status = ?'; params.push(filters.status); }
    if (filters.service_type) { query += ' AND m.service_type = ?'; params.push(filters.service_type); }
    query += ' ORDER BY m.date DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('maintenance:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO maintenance_records (vehicle_id, service_type, description,
      date, cost, mileage_km, next_service_date, next_service_mileage, status, notes)
      VALUES (@vehicle_id, @service_type, @description, @date, @cost, @mileage_km,
        @next_service_date, @next_service_mileage, @status, @notes)`).run(data);
    const v = db.prepare('SELECT plate_number FROM vehicles WHERE id = ?').get(data.vehicle_id);
    createAuditEntry(db, 'CREATE', 'maintenance', result.lastInsertRowid,
      `Scheduled ${data.service_type} for ${v?.plate_number || data.vehicle_id}`,
      null, { service_type: data.service_type, cost: data.cost });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('maintenance:update', (_e, id, data) => {
    const old = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
    db.prepare(`UPDATE maintenance_records SET vehicle_id=@vehicle_id, service_type=@service_type,
      description=@description, date=@date, cost=@cost, mileage_km=@mileage_km,
      next_service_date=@next_service_date, next_service_mileage=@next_service_mileage,
      status=@status, notes=@notes WHERE id=@id`).run({ ...data, id });
    if (old && old.status !== data.status && data.status === 'completed') {
      createAuditEntry(db, 'UPDATE', 'maintenance', id,
        `Completed ${data.service_type}`, { status: old.status }, { status: data.status });
    } else {
      createAuditEntry(db, 'UPDATE', 'maintenance', id, `Updated maintenance record #${id}`, null, null);
    }
    return db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  });

  ipcMain.handle('maintenance:delete', (_e, id) => {
    db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'maintenance', id, `Deleted maintenance record #${id}`, null, null);
    return { success: true };
  });

  ipcMain.handle('maintenance:getUpcoming', () => {
    return db.prepare(`SELECT m.*, v.plate_number, v.make, v.model FROM maintenance_records m
      JOIN vehicles v ON v.id = m.vehicle_id WHERE (m.next_service_date IS NOT NULL
      AND m.next_service_date <= datetime('now', '+30 days')) ORDER BY m.next_service_date`).all();
  });
}
