import React, { useState, useEffect } from 'react';
import type { Driver, Assignment, Vehicle } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

const emptyDriver: Record<string, string> = {
  name: '', phone: '', email: '', license_number: '',
  license_expiry: '', license_class: '', status: 'active', notes: '',
};
const statuses = ['active', 'inactive', 'suspended'];

function Drivers() {
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyDriver);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const { errors, validate, clearErrors } = useFormErrors();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [d, v, a] = await Promise.all([
      window.electronAPI.getDrivers(),
      window.electronAPI.getVehicles(),
      window.electronAPI.getActiveAssignments(),
    ]);
    setDrivers(d); setVehicles(v); setAssignments(a);
    setLoading(false);
  }

  const filtered = drivers.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.license_number.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  function openCreate() { setEditing(null); setForm(emptyDriver); setModalOpen(true); }

  function openEdit(driver: Driver) {
    setEditing(driver);
    setForm({
      name: driver.name, phone: driver.phone || '', email: driver.email || '',
      license_number: driver.license_number, license_expiry: driver.license_expiry || '',
      license_class: driver.license_class || '', status: driver.status, notes: driver.notes || '',
    });
    setModalOpen(true);
  }

  function handleDelete(driver: Driver) { setConfirmDelete(driver); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteDriver(confirmDelete.id);
    setConfirmDelete(null);
    toast(`Driver ${confirmDelete.name} deleted`, 'success');
    loadData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({
      name: { required: true, label: 'Name' },
      license_number: { required: true, label: 'License number' },
      phone: { pattern: /^\+?[\d\s\-()]{7,15}$/, label: 'Phone', patternMessage: 'Invalid phone number' },
    }, form)) return;
    if (editing) {
      await window.electronAPI.updateDriver(editing.id, form);
      toast(`Driver ${form.name} updated`, 'success');
    } else {
      await window.electronAPI.createDriver(form);
      toast(`Driver ${form.name} created`, 'success');
    }
    setModalOpen(false);
    loadData();
  }

  function _openAssign(driver: Driver) { setSelectedDriver(driver); setAssignVehicleId(''); setAssignModalOpen(true); }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (assignVehicleId) {
      await window.electronAPI.assignDriver(parseInt(assignVehicleId), selectedDriver.id);
      setAssignModalOpen(false);
      toast(`Vehicle assigned to ${selectedDriver.name}`, 'success');
      loadData();
    }
  }

  async function handleUnassign(assignmentId: number) {
    await window.electronAPI.unassignDriver(assignmentId);
    toast('Driver unassigned', 'success');
    loadData();
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'license_number', label: 'License #' },
    {
      key: 'license_expiry', label: 'License Expiry',
      render: (row) => (
        <span className={row.license_expiry && new Date(row.license_expiry) <= new Date(Date.now() + 30 * 86400000) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
          {row.license_expiry || '—'}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <input placeholder="Search drivers..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'drivers')} className="btn-secondary btn-sm">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ Add Driver</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No drivers registered yet" pageSize={10} />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Active Vehicle Assignments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Driver</th>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Assigned Since</th>
                <th className="table-header w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No active assignments</td></tr>
              ) : assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-cell">{a.driver_name}</td>
                  <td className="table-cell">{a.plate_number} — {a.make} {a.model}</td>
                  <td className="table-cell">{new Date(a.start_date).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <button onClick={() => handleUnassign(a.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 text-sm font-medium">Unassign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input className={`input-field ${errors.name ? 'border-red-500' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input className={`input-field ${errors.phone ? 'border-red-500' : ''}`} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" className={`input-field ${errors.email ? 'border-red-500' : ''}`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Number *</label><input className={`input-field ${errors.license_number ? 'border-red-500' : ''}`} value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} required />{errors.license_number && <p className="text-xs text-red-500 mt-1">{errors.license_number}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Class</label><input className="input-field" value={form.license_class} onChange={e => setForm({...form, license_class: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Expiry</label><input type="date" className="input-field" value={form.license_expiry} onChange={e => setForm({...form, license_expiry: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select className="select-field" value={form.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, status: e.target.value})}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label><textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Vehicle to ${selectedDriver?.name || ''}`} size="sm">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Vehicle</label>
            <select className="select-field" value={assignVehicleId} onChange={e => setAssignVehicleId(e.target.value)} required>
              <option value="">— Select —</option>
              {vehicles.filter(v => v.status === 'active').map(v => (
                <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Assign</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} message={`Delete driver ${confirmDelete?.name}? This action cannot be undone.`} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default Drivers;
