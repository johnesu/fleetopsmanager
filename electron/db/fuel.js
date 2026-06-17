import { createAuditEntry } from './audit.js';

export function registerFuelHandlers(db, ipcMain) {
  ipcMain.handle('fuel:getAll', (_e, filters = {}) => {
    let query = `SELECT f.*, v.plate_number, v.make, v.model FROM fuel_entries f JOIN vehicles v ON v.id = f.vehicle_id WHERE 1=1`;
    const params = [];
    if (filters.vehicle_id) { query += ' AND f.vehicle_id = ?'; params.push(filters.vehicle_id); }
    if (filters.start_date) { query += ' AND date(f.date) >= ?'; params.push(filters.start_date); }
    if (filters.end_date) { query += ' AND date(f.date) <= ?'; params.push(filters.end_date); }
    query += ' ORDER BY f.date DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('fuel:create', (_e, data) => {
    data.total_cost = Math.round(data.liters * data.cost_per_liter * 100) / 100;
    const result = db.prepare(`INSERT INTO fuel_entries (vehicle_id, trip_id, date, liters,
      cost_per_liter, total_cost, mileage_km, station, notes) VALUES (@vehicle_id, @trip_id, @date,
      @liters, @cost_per_liter, @total_cost, @mileage_km, @station, @notes)`).run(data);
    const v = db.prepare('SELECT plate_number FROM vehicles WHERE id = ?').get(data.vehicle_id);
    createAuditEntry(db, 'CREATE', 'fuel', result.lastInsertRowid,
      `Added fuel entry: ${data.liters}L for ${v?.plate_number || data.vehicle_id}`,
      null, { liters: data.liters, cost: data.total_cost });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('fuel:update', (_e, id, data) => {
    data.total_cost = Math.round(data.liters * data.cost_per_liter * 100) / 100;
    db.prepare(`UPDATE fuel_entries SET vehicle_id=@vehicle_id, trip_id=@trip_id, date=@date,
      liters=@liters, cost_per_liter=@cost_per_liter, total_cost=@total_cost,
      mileage_km=@mileage_km, station=@station, notes=@notes WHERE id=@id`).run({ ...data, id });
    createAuditEntry(db, 'UPDATE', 'fuel', id, `Updated fuel entry #${id}`, null, null);
    return db.prepare('SELECT * FROM fuel_entries WHERE id = ?').get(id);
  });

  ipcMain.handle('fuel:delete', (_e, id) => {
    db.prepare('DELETE FROM fuel_entries WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'fuel', id, `Deleted fuel entry #${id}`, null, null);
    return { success: true };
  });

  ipcMain.handle('fuel:getReport', (_e, startDate, endDate) => {
    return db.prepare(`SELECT v.plate_number, v.make, v.model, SUM(f.liters) as total_liters,
      SUM(f.total_cost) as total_cost, COUNT(f.id) as entries FROM fuel_entries f
      JOIN vehicles v ON v.id = f.vehicle_id WHERE date(f.date) >= ? AND date(f.date) <= ?
      GROUP BY f.vehicle_id ORDER BY total_cost DESC`).all(startDate, endDate);
  });
}
