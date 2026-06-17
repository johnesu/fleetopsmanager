import { createAuditEntry } from './audit.js';

export function registerUserHandlers(db, ipcMain) {
  ipcMain.handle('users:authenticate', (_e, username, password) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
    if (!user || user.password_hash !== password) {
      return { success: false, error: 'Invalid credentials' };
    }
    db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);
    const { password_hash, ...safeUser } = user;
    return { success: true, user: safeUser };
  });

  ipcMain.handle('users:getAll', () => {
    const users = db.prepare('SELECT * FROM users ORDER BY full_name ASC').all();
    return users.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });
  });

  ipcMain.handle('users:create', (_e, data) => {
    const result = db.prepare(`INSERT INTO users (username, password_hash, full_name, email, role, is_active)
      VALUES (@username, @password_hash, @full_name, @email, @role, @is_active)`).run(data);
    createAuditEntry(db, 'CREATE', 'user', result.lastInsertRowid,
      `Created user ${data.username}`, null, { username: data.username, role: data.role });
    const { password_hash, ...safeUser } = { id: result.lastInsertRowid, ...data };
    return { success: true, user: safeUser };
  });

  ipcMain.handle('users:update', (_e, id, data) => {
    db.prepare(`UPDATE users SET username=@username, password_hash=@password_hash,
      full_name=@full_name, email=@email, role=@role, is_active=@is_active
      WHERE id=@id`).run({ ...data, id });
    createAuditEntry(db, 'UPDATE', 'user', id, `Updated user ${data.username}`, null, null);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const { password_hash, ...safeUser } = updated;
    return { success: true, user: safeUser };
  });

  ipcMain.handle('users:delete', (_e, id) => {
    const old = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    createAuditEntry(db, 'DELETE', 'user', id, `Deleted user ${old?.username || id}`,
      { username: old?.username }, null);
    return { success: true };
  });
}
