import React, { useState, useEffect } from 'react';
import type { FuelEntry, Vehicle, Trip, MonthlyFuelReport } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

const emptyEntry: Record<string, string> = {
  vehicle_id: '', trip_id: '', date: new Date().toISOString().slice(0, 10),
  liters: '', cost_per_liter: '', total_cost: '', mileage_km: '', station: '', notes: '',
};

function Fuel() {
  const toast = useToast();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FuelEntry | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyEntry);
  const [report, setReport] = useState<MonthlyFuelReport[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<FuelEntry | null>(null);
const [loading, setLoading] = useState(true);
  const { errors, validate, clearErrors } = useFormErrors();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [e, v, t] = await Promise.all([
      window.electronAPI.getFuelEntries({}),
      window.electronAPI.getVehicles(),
      window.electronAPI.getTrips({}),
    ]);
    setEntries(e); setVehicles(v); setTrips(t.filter(t => t.status === 'completed' || t.status === 'ongoing'));
    const now = new Date();
    const r = await window.electronAPI.getFuelReport(now.getFullYear(), now.getMonth() + 1);
    setReport(r);
    setLoading(false);
  }

  const filtered = entries.filter(e =>
    !search ||
    (e.plate_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.station || '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setForm({ ...emptyEntry, date: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }

  function openEdit(entry: FuelEntry) {
    setEditing(entry);
    setForm({
      vehicle_id: String(entry.vehicle_id), trip_id: String(entry.trip_id || ''), date: entry.date?.slice(0, 10) || '',
      liters: String(entry.liters), cost_per_liter: String(entry.cost_per_liter), total_cost: String(entry.total_cost),
      mileage_km: String(entry.mileage_km || ''), station: entry.station || '', notes: entry.notes || '',
    });
    setModalOpen(true);
  }

  function handleDelete(entry: FuelEntry) { setConfirmDelete(entry); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteFuelEntry(confirmDelete.id);
    setConfirmDelete(null);
    toast('Fuel entry deleted', 'success');
    loadData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({
      vehicle_id: { required: true, label: 'Vehicle' },
      date: { required: true, label: 'Date' },
      liters: { required: true, label: 'Liters', positive: true },
      cost_per_liter: { required: true, label: 'Cost per liter', positive: true },
    }, form)) return;
    const payload = {
      ...form, vehicle_id: parseInt(form.vehicle_id),
      trip_id: form.trip_id ? parseInt(form.trip_id) : null,
      liters: parseFloat(form.liters), cost_per_liter: parseFloat(form.cost_per_liter),
      mileage_km: parseFloat(form.mileage_km) || 0,
    };
    if (editing) {
      await window.electronAPI.updateFuelEntry(editing.id, payload);
      toast('Fuel entry updated', 'success');
    } else {
      await window.electronAPI.createFuelEntry(payload);
      toast('Fuel entry added', 'success');
    }
    setModalOpen(false);
    loadData();
  }

  const columns = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'plate_number', label: 'Vehicle' },
    { key: 'liters', label: 'Liters', render: (row) => `${row.liters} L` },
    { key: 'cost_per_liter', label: 'Rate', render: (row) => `₦ ${row.cost_per_liter}` },
    { key: 'total_cost', label: 'Total', render: (row) => `₦ ${Number(row.total_cost).toLocaleString()}` },
    { key: 'mileage_km', label: 'Mileage', render: (row) => row.mileage_km ? `${row.mileage_km.toLocaleString()} km` : '—' },
    { key: 'station', label: 'Station' },
  ];

  const totalLiters = entries.reduce((s, e) => s + e.liters, 0);
  const totalCost = entries.reduce((s, e) => s + e.total_cost, 0);

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Entries</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{entries.length}</p></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Liters</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalLiters.toFixed(1)} L</p></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₦ {totalCost.toLocaleString()}</p></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <input placeholder="Search fuel entries..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'fuel-entries')} className="btn-secondary btn-sm">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ Add Fuel Entry</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No fuel entries yet" pageSize={10} />
      </div>

      {report.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Monthly Fuel Report by Vehicle</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-header">Vehicle</th><th className="table-header">Entries</th><th className="table-header">Total Liters</th><th className="table-header">Total Cost</th></tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {report.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="table-cell">{r.plate_number} — {r.make} {r.model}</td>
                    <td className="table-cell">{r.entries}</td>
                    <td className="table-cell">{Number(r.total_liters).toFixed(1)} L</td>
                    <td className="table-cell font-medium">₦ {Number(r.total_cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Fuel Entry' : 'Add Fuel Entry'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle *</label>
              <select className={`select-field ${errors.vehicle_id ? 'border-red-500' : ''}`} value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} required>
                <option value="">— Select —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>)}
              </select>
              {errors.vehicle_id && <p className="text-xs text-red-500 mt-1">{errors.vehicle_id}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label><input type="date" className={`input-field ${errors.date ? 'border-red-500' : ''}`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />{errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Related Trip</label>
              <select className="select-field" value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})}>
                <option value="">— None —</option>
                {trips.map(t => <option key={t.id} value={t.id}>#{t.id} — {t.start_location} → {t.end_location}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Liters *</label><input type="number" step="0.01" className={`input-field ${errors.liters ? 'border-red-500' : ''}`} value={form.liters} onChange={e => setForm({...form, liters: e.target.value})} required />{errors.liters && <p className="text-xs text-red-500 mt-1">{errors.liters}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost per Liter *</label><input type="number" step="0.01" className={`input-field ${errors.cost_per_liter ? 'border-red-500' : ''}`} value={form.cost_per_liter} onChange={e => setForm({...form, cost_per_liter: e.target.value})} required />{errors.cost_per_liter && <p className="text-xs text-red-500 mt-1">{errors.cost_per_liter}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mileage (km)</label><input type="number" className="input-field" value={form.mileage_km} onChange={e => setForm({...form, mileage_km: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Station</label><input className="input-field" value={form.station} onChange={e => setForm({...form, station: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label><textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} message="Delete this fuel entry? This action cannot be undone." onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default Fuel;
