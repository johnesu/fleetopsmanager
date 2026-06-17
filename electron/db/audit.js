export function registerAuditHandlers(db, ipcMain) {
  ipcMain.handle('audit:getAll', (_e, filters = {}) => {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (filters.entity_type) {
      query += ' AND entity_type = ?';
      params.push(filters.entity_type);
    }
    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(filters.limit || 500);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('audit:create', (_e, entry) => {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, description, old_values, new_values)
      VALUES (@action, @entity_type, @entity_id, @description, @old_values, @new_values)
    `);
    const result = stmt.run(entry);
    return { id: result.lastInsertRowid, ...entry };
  });
}

export function createAuditEntry(db, action, entityType, entityId, description, oldValues = null, newValues = null) {
  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, description, old_values, new_values)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(action, entityType, entityId, description,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null);
}
