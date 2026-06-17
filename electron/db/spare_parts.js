import { createAuditEntry } from './audit.js';

export function registerSparePartHandlers(db, ipcMain) {
  ipcMain.handle('spare_parts:getAll', () => {
    return db.prepare('SELECT * FROM spare_parts ORDER BY name ASC').all();
  });

  ipcMain.handle('spare_parts:get', (_e, id) => {
    return db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
  });

  ipcMain.handle('spare_parts:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO spare_parts (name, part_number, vehicle_make,
      vehicle_model, quantity, min_quantity, unit_cost, supplier, location, notes)
      VALUES (@name, @part_number, @vehicle_make, @vehicle_model, @quantity,
        @min_quantity, @unit_cost, @supplier, @location, @notes)`).run(data);
    createAuditEntry(db, 'CREATE', 'spare_part', result.lastInsertRowid,
      `Added spare part ${data.name}`, null, { name: data.name, quantity: data.quantity });
    return { id: result.lastInsertRowid, ...data };
  });

  ipcMain.handle('spare_parts:update', (_e, id, data) => {
    db.prepare(`UPDATE spare_parts SET name=@name, part_number=@part_number,
      vehicle_make=@vehicle_make, vehicle_model=@vehicle_model, quantity=@quantity,
      min_quantity=@min_quantity, unit_cost=@unit_cost, supplier=@supplier,
      location=@location, notes=@notes, updated_at=datetime('now')
      WHERE id=@id`).run({ ...data, id });
    createAuditEntry(db, 'UPDATE', 'spare_part', id, `Updated spare part ${data.name}`, null, null);
    return db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
  });

  ipcMain.handle('spare_parts:delete', (_e, id) => {
    const old = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
    db.prepare('DELETE FROM spare_parts WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'spare_part', id,
      `Deleted spare part ${old?.name || id}`, { name: old?.name }, null);
    return { success: true };
  });

  ipcMain.handle('spare_parts:getLowStock', () => {
    return db.prepare('SELECT * FROM spare_parts WHERE quantity <= min_quantity ORDER BY quantity ASC').all();
  });

  ipcMain.handle('spare_parts:adjustQuantity', (_e, id, adjustment) => {
    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
    if (!part) return { success: false, error: 'Part not found' };
    const newQty = part.quantity + adjustment;
    if (newQty < 0) return { success: false, error: 'Insufficient stock' };
    db.prepare('UPDATE spare_parts SET quantity = ?, updated_at = datetime("now") WHERE id = ?').run(newQty, id);
    const action = adjustment > 0 ? 'Added' : 'Removed';
    createAuditEntry(db, 'UPDATE', 'spare_part', id,
      `${action} ${Math.abs(adjustment)} units of ${part.name} (was ${part.quantity}, now ${newQty})`,
      { quantity: part.quantity }, { quantity: newQty });
    return db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
  });
}
