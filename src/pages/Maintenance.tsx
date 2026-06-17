import React, { useState, useEffect } from 'react';
import type { MaintenanceRecord, Vehicle } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

const serviceTypes = ['Oil Change', 'Brake Service', 'Tire Service', 'Engine Repair', 'Transmission',
  'AC Service', 'Electrical', 'Suspension', 'Body Work', 'Scheduled Service', 'Inspection', 'Other'];

const emptyRecord: Record<string, string> = {
  vehicle_id: '', service_type: 'Oil Change', description: '',
  date: new Date().toISOString().slice(0, 10), cost: '', mileage_km: '',
  next_service_date: '', next_service_mileage: '', status: 'scheduled', notes: '',
};

function Maintenance() {
  const toast = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyRecord);
  const [upcoming, setUpcoming] = useState<MaintenanceRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const { errors, validate, clearErrors } = useFormErrors();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterStatus]);

  async function loadData() {
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (filterStatus) filters.status = filterStatus;
    const [r, v, u] = await Promise.all([
      window.electronAPI.getMaintenanceRecords(filters),
      window.electronAPI.getVehicles(),
      window.electronAPI.getUpcomingMaintenance(),
    ]);
    setRecords(r); setVehicles(v); setUpcoming(u);
    setLoading(false);
  }

  const filtered = records.filter(r =>
    !search ||
    (r.plate_number || '').toLowerCase().includes(search.toLowerCase()) ||
    r.service_type.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setForm({ ...emptyRecord, date: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }

  function openEdit(record: MaintenanceRecord) {
    setEditing(record);
    setForm({
      vehicle_id: String(record.vehicle_id), service_type: record.service_type, description: record.description || '',
      date: record.date?.slice(0, 10) || '', cost: String(record.cost || ''), mileage_km: String(record.mileage_km || ''),
      next_service_date: record.next_service_date || '', next_service_mileage: String(record.next_service_mileage || ''),
      status: record.status, notes: record.notes || '',
    });
    setModalOpen(true);
  }

  function handleDelete(record: MaintenanceRecord) { setConfirmDelete(record); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteMaintenanceRecord(confirmDelete.id);
    setConfirmDelete(null);
    toast('Maintenance record deleted', 'success');
    loadData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({
      vehicle_id: { required: true, label: 'Vehicle' },
      date: { required: true, label: 'Date' },
      service_type: { required: true, label: 'Service type' },
    }, form)) return;
    const payload = {
      ...form, vehicle_id: parseInt(form.vehicle_id), cost: parseFloat(form.cost) || 0,
      mileage_km: parseFloat(form.mileage_km) || 0, next_service_mileage: form.next_service_mileage ? parseFloat(form.next_service_mileage) : null,
    };
    if (editing) {
      await window.electronAPI.updateMaintenanceRecord(editing.id, payload);
      toast('Maintenance record updated', 'success');
    } else {
      await window.electronAPI.createMaintenanceRecord(payload);
      toast('Maintenance record added', 'success');
    }
    setModalOpen(false);
    loadData();
  }

  const columns = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'plate_number', label: 'Vehicle' },
    { key: 'service_type', label: 'Service Type' },
    { key: 'cost', label: 'Cost', render: (row) => `₦ ${Number(row.cost || 0).toLocaleString()}` },
    {
      key: 'next_service_date', label: 'Next Service',
      render: (row) => row.next_service_date && new Date(row.next_service_date) <= new Date(Date.now() + 30 * 86400000)
        ? <span className="text-red-600 dark:text-red-400 font-medium">{row.next_service_date}</span>
        : (row.next_service_date || '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);

  if (loading) return <PageSkeleton />;

  return (
    <div>
      {upcoming.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Upcoming Service Reminders ({upcoming.length})</h3>
          <div className="space-y-1">
            {upcoming.map(u => (
              <p key={u.id} className="text-sm text-yellow-700 dark:text-yellow-400">
                {u.plate_number} — {u.service_type} {u.next_service_date ? `by ${u.next_service_date}` : ''} {u.next_service_mileage ? `or ${u.next_service_mileage} km` : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Records</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{records.length}</p></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₦ {totalCost.toLocaleString()}</p></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Reminders</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{upcoming.length}</p></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <input placeholder="Search maintenance..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          {['', 'scheduled', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-primary text-on-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'maintenance')} className="btn-secondary btn-sm">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ Add Record</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No maintenance records yet" pageSize={10} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Maintenance Record' : 'Add Maintenance Record'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle *</label>
              <select className={`select-field${errors.vehicle_id ? ' border-red-500' : ''}`} value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} required>
                <option value="">— Select —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>)}
              </select>
              {errors.vehicle_id && <p className="text-red-500 text-xs mt-1">{errors.vehicle_id}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Type *</label>
              <select className={`select-field${errors.service_type ? ' border-red-500' : ''}`} value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>{serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}</select>
              {errors.service_type && <p className="text-red-500 text-xs mt-1">{errors.service_type}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label><input type="date" className={`input-field${errors.date ? ' border-red-500' : ''}`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost (₦)</label><input type="number" step="0.01" className="input-field" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mileage (km)</label><input type="number" className="input-field" value={form.mileage_km} onChange={e => setForm({...form, mileage_km: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Service Date</label><input type="date" className="input-field" value={form.next_service_date} onChange={e => setForm({...form, next_service_date: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Service Mileage</label><input type="number" className="input-field" value={form.next_service_mileage} onChange={e => setForm({...form, next_service_mileage: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label><textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} message="Delete this maintenance record? This action cannot be undone." onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default Maintenance;
