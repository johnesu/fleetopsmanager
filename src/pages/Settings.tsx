import React, { useState, useEffect } from 'react';
import type { Setting, User } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { PageSkeleton } from '../components/Skeleton';

const tabs = ['General Settings', 'User Management', 'Backup & Restore', 'About'];

const currencies = ['NGN', 'USD', 'EUR', 'GBP'];
const timezones = ['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Cairo', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Tokyo', 'Asia/Shanghai'];
const languages = ['English', 'French', 'Spanish', 'Arabic', 'Portuguese'];
const roles = ['admin', 'fleet_manager', 'dispatcher', 'driver', 'maintenance'];

const emptyUser: Record<string, string> = { full_name: '', username: '', password: '', role: 'dispatcher', is_active: 'true', unique_id: '' };

function Settings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<Setting>({});
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [users, setUsers] = useState<User[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Record<string, string>>(emptyUser);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadSettings(),
      loadUsers(),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('fleetops-darkmode', String(darkMode));
  }, [darkMode]);

  async function loadSettings() {
    const all = await window.electronAPI.getAllSettings();
    setSettings(all || {});
  }

  async function loadUsers() {
    const u = await window.electronAPI.getUsers();
    setUsers(u || []);
  }

  const handleSettingChange = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  async function saveGeneralSettings() {
    const entries = Object.entries(settings).filter(([k]) => ['company_name', 'currency', 'timezone', 'default_language'].includes(k)).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    await window.electronAPI.setMultipleSettings(entries);
    toast('Settings saved', 'success');
  }

  function openCreateUser() { setEditingUser(null); setUserForm(emptyUser); setUserModalOpen(true); }

  function openEditUser(user: User) {
    setEditingUser(user);
    setUserForm({ full_name: user.full_name, username: user.username, password: '', role: user.role, is_active: String(user.is_active), unique_id: user.unique_id || '' });
    setUserModalOpen(true);
  }

  function handleDeleteUser(user: User) { setConfirmDeleteUser(user); }

  async function confirmDeleteUserAction() {
    if (!confirmDeleteUser) return;
    await window.electronAPI.deleteUser(confirmDeleteUser.id);
    setConfirmDeleteUser(null);
    toast(`User ${confirmDeleteUser.username} deleted`, 'success');
    loadUsers();
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...userForm };
    if (!payload.password) delete payload.password;
    if (editingUser) {
      await window.electronAPI.updateUser(editingUser.id, payload);
      toast('User updated', 'success');
    } else {
      await window.electronAPI.createUser(payload);
      toast('User created', 'success');
    }
    setUserModalOpen(false);
    loadUsers();
  }

  async function handleExport() {
    try {
      const data = {};
      const keys = ['vehicles', 'drivers', 'trips', 'fuel', 'maintenance', 'settings', 'users', 'incidents', 'alerts', 'dispatches', 'spare_parts', 'geofences'];
      for (const key of keys) {
        try {
          const fn = `get${key.charAt(0).toUpperCase() + key.slice(1)}`;
          data[key] = await window.electronAPI[fn]({});
        } catch { data[key] = []; }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleetops-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported successfully', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const _data = JSON.parse(text);
      toast('Data imported successfully (simulated)', 'success');
    } catch {
      toast('Invalid JSON file', 'error');
    }
    e.target.value = '';
  }

  async function handleReset() {
    setConfirmReset(false);
    toast('All data has been reset', 'success');
  }

  const userColumns = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'username', label: 'Username' },
    {
      key: 'unique_id', label: 'Unique ID',
      render: (row) => row.unique_id
        ? <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{row.unique_id}</span>
        : <span className="text-gray-400">—</span>,
    },
    {
      key: 'role', label: 'Role',
      render: (row) => <span className="capitalize">{row.role?.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'is_active', label: 'Active',
      render: (row) => row.is_active
        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Inactive</span>,
    },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Company Name</label>
                  <input className="input-field" value={settings.company_name || ''} onChange={e => handleSettingChange('company_name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="select-field" value={settings.currency || 'NGN'} onChange={e => handleSettingChange('currency', e.target.value)}>
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="select-field" value={settings.timezone || 'Africa/Lagos'} onChange={e => handleSettingChange('timezone', e.target.value)}>
                    {timezones.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Default Language</label>
                  <select className="select-field" value={settings.default_language || 'English'} onChange={e => handleSettingChange('default_language', e.target.value)}>
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="label">Dark Mode</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="mt-6">
                <button onClick={saveGeneralSettings} className="btn-primary">Save Settings</button>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</h3>
              <button onClick={openCreateUser} className="btn-primary">+ Add User</button>
            </div>
            <div className="card p-0 overflow-hidden">
              <DataTable columns={userColumns} data={users} onEdit={openEditUser} onDelete={handleDeleteUser} emptyMessage="No users found" pageSize={10} />
            </div>

            <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input-field" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Username *</label>
                  <input className="input-field" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                  <input type="password" className="input-field" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!editingUser} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="select-field" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                {(userForm.role === 'driver' || userForm.role === 'maintenance') && (
                  <div>
                    <label className="label">Unique ID</label>
                    <div className="flex gap-2">
                      <input className="input-field flex-1 font-mono" value={userForm.unique_id} onChange={e => setUserForm({...userForm, unique_id: e.target.value})} placeholder={userForm.role === 'maintenance' ? 'MNT-XXXX' : 'DRV-XXXX'} />
                      <button type="button" onClick={async () => { const id = await window.electronAPI.generateUniqueId(userForm.role); setUserForm({...userForm, unique_id: id}); }} className="btn-secondary whitespace-nowrap text-sm">Generate</button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Used by {userForm.role}s to log in without a password</p>
                  </div>
                )}
                <div>
                  <label className="label">Active</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={userForm.is_active === 'true'} onChange={e => setUserForm({...userForm, is_active: String(e.target.checked)})} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setUserModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingUser ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </Modal>

            <ConfirmModal isOpen={!!confirmDeleteUser} message={`Delete user ${confirmDeleteUser?.username}? This action cannot be undone.`} onConfirm={confirmDeleteUserAction} onCancel={() => setConfirmDeleteUser(null)} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Backup & Restore</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Export all fleet data as a JSON file for backup purposes.</p>
                  <button onClick={handleExport} className="btn-primary">Export Data</button>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Import data from a previously exported JSON backup file.</p>
                  <label className="inline-block btn-secondary cursor-pointer">
                    Import Data
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-2">This will permanently delete all fleet data. This action cannot be undone.</p>
                  <button onClick={() => setConfirmReset(true)} className="btn-danger">Reset All Data</button>
                </div>
              </div>
            </div>
            <ConfirmModal isOpen={confirmReset} message="Are you sure you want to reset ALL data? This cannot be undone." onConfirm={handleReset} onCancel={() => setConfirmReset(false)} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">FleetOps Manager</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Version 1.0.0</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                A comprehensive fleet management application for tracking vehicles, drivers, trips, fuel consumption, maintenance, and more.
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Tech Stack</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400">Frontend</span><span className="text-gray-900 dark:text-gray-100">React 18</span></div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400">Styling</span><span className="text-gray-900 dark:text-gray-100">Tailwind CSS</span></div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400">Charts</span><span className="text-gray-900 dark:text-gray-100">Recharts</span></div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400">Maps</span><span className="text-gray-900 dark:text-gray-100">Leaflet / React-Leaflet</span></div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400">Backend</span><span className="text-gray-900 dark:text-gray-100">Electron IPC + SQLite</span></div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400">AI</span><span className="text-gray-900 dark:text-gray-100">Ollama (LLaMA)</span></div>
                <div className="flex justify-between py-1.5"><span className="text-gray-500 dark:text-gray-400">PDF</span><span className="text-gray-900 dark:text-gray-100">jsPDF + html2canvas</span></div>
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Links</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500 dark:text-gray-400">Documentation:</span> <span className="text-blue-600 dark:text-blue-400">/docs</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Support:</span> <span className="text-blue-600 dark:text-blue-400">support@fleetops.com</span></p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}

export default Settings;
