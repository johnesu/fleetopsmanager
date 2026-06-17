import React, { useState, useEffect } from 'react';
import type { Trip, Vehicle, Driver } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

const emptyTrip: Record<string, string> = {
  vehicle_id: '', driver_id: '', start_location: '', end_location: '',
  start_time: '', end_time: '', distance_km: '', status: 'pending', purpose: '', notes: '',
};
const statuses = ['pending', 'ongoing', 'completed', 'cancelled'];

function Trips() {
  const toast = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyTrip);
  const [filter, setFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const { errors, validate, clearErrors } = useFormErrors();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (filter) filters.status = filter;
    const [t, v, d] = await Promise.all([
      window.electronAPI.getTrips(filters),
      window.electronAPI.getVehicles(),
      window.electronAPI.getDrivers(),
    ]);
    setTrips(t);
    setVehicles(v.filter(v => v.status === 'active'));
    setDrivers(d.filter(d => d.status === 'active'));
    setLoading(false);
  }

  const filtered = trips.filter(t =>
    !search ||
    (t.plate_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.driver_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.start_location || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.end_location || '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setForm(emptyTrip); setModalOpen(true); }

  function openEdit(trip: Trip) {
    setEditing(trip);
    setForm({
      vehicle_id: String(trip.vehicle_id), driver_id: String(trip.driver_id),
      start_location: trip.start_location || '', end_location: trip.end_location || '',
      start_time: trip.start_time || '', end_time: trip.end_time || '',
      distance_km: String(trip.distance_km || 0), status: trip.status,
      purpose: trip.purpose || '', notes: trip.notes || '',
    });
    setModalOpen(true);
  }

  function handleDelete(trip: Trip) { setConfirmDelete(trip); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteTrip(confirmDelete.id);
    setConfirmDelete(null);
    toast('Trip deleted', 'success');
    loadData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({
      vehicle_id: { required: true, label: 'Vehicle' },
      driver_id: { required: true, label: 'Driver' },
      start_location: { required: true, label: 'Start location' },
      end_location: { required: true, label: 'End location' },
      start_time: { required: true, label: 'Start time' },
    }, form)) return;
    const payload = { ...form, vehicle_id: parseInt(form.vehicle_id), driver_id: parseInt(form.driver_id), distance_km: parseFloat(form.distance_km) || 0 };
    if (editing) {
      await window.electronAPI.updateTrip(editing.id, payload);
      toast('Trip updated', 'success');
    } else {
      await window.electronAPI.createTrip(payload);
      toast('Trip created', 'success');
    }
    setModalOpen(false);
    loadData();
  }

  function quickStatus(trip: Trip, newStatus: Trip['status']) {
    window.electronAPI.updateTrip(trip.id, {
      vehicle_id: trip.vehicle_id, driver_id: trip.driver_id,
      start_location: trip.start_location || '', end_location: trip.end_location || '',
      start_time: trip.start_time || '', end_time: newStatus === 'completed' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : trip.end_time,
      distance_km: trip.distance_km || 0, status: newStatus,
      purpose: trip.purpose || '', notes: trip.notes || '',
    }).then(() => { loadData(); toast(`Trip #${trip.id} marked ${newStatus}`, 'success'); });
  }

  const columns = [
    { key: 'id', label: '#' },
    { key: 'plate_number', label: 'Vehicle', render: (row) => `${row.plate_number || ''} ${row.make || ''} ${row.model || ''}` },
    { key: 'driver_name', label: 'Driver' },
    { key: 'start_location', label: 'From' },
    { key: 'end_location', label: 'To' },
    { key: 'start_time', label: 'Start', render: (row) => row.start_time ? new Date(row.start_time).toLocaleDateString() : '—' },
    { key: 'distance_km', label: 'Distance', render: (row) => row.distance_km ? `${row.distance_km} km` : '—' },
    {
      key: 'status', label: 'Status', render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          {row.status === 'pending' && <button onClick={() => quickStatus(row, 'ongoing')} className="text-xs text-primary hover:text-primary/80">Start</button>}
          {row.status === 'ongoing' && <button onClick={() => quickStatus(row, 'completed')} className="text-xs text-green-600 hover:text-green-800">Complete</button>}
        </div>
      ),
    },
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <input placeholder="Search trips..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          {['', 'pending', 'ongoing', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-on-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'trips')} className="btn-secondary btn-sm">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ New Trip</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No trips recorded yet" pageSize={10} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Trip' : 'New Trip'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle *</label>
              <select className={`select-field ${errors.vehicle_id ? 'border-red-500' : ''}`} value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} required>
                <option value="">— Select —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>)}
              </select>
              {errors.vehicle_id && <p className="text-xs text-red-500 mt-1">{errors.vehicle_id}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver *</label>
              <select className={`select-field ${errors.driver_id ? 'border-red-500' : ''}`} value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} required>
                <option value="">— Select —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.driver_id && <p className="text-xs text-red-500 mt-1">{errors.driver_id}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Location</label><input className={`input-field ${errors.start_location ? 'border-red-500' : ''}`} value={form.start_location} onChange={e => setForm({...form, start_location: e.target.value})} />{errors.start_location && <p className="text-xs text-red-500 mt-1">{errors.start_location}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Location</label><input className={`input-field ${errors.end_location ? 'border-red-500' : ''}`} value={form.end_location} onChange={e => setForm({...form, end_location: e.target.value})} />{errors.end_location && <p className="text-xs text-red-500 mt-1">{errors.end_location}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label><input type="datetime-local" className={`input-field ${errors.start_time ? 'border-red-500' : ''}`} value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />{errors.start_time && <p className="text-xs text-red-500 mt-1">{errors.start_time}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label><input type="datetime-local" className="input-field" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distance (km)</label><input type="number" step="0.1" className="input-field" value={form.distance_km} onChange={e => setForm({...form, distance_km: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select className="select-field" value={form.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, status: e.target.value})}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label><input className="input-field" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label><textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} message={`Delete trip #${confirmDelete?.id}? This action cannot be undone.`} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default Trips;
