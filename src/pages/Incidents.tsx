import React, { useState, useEffect } from 'react';
import type { Incident, Vehicle, Driver, Trip } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

const incidentTypes = ['accident', 'near_miss', 'traffic_violation', 'mechanical_breakdown', 'cargo_issue', 'customer_complaint', 'other'];
const severities = ['low', 'medium', 'high', 'critical'];
const incidentStatuses = ['open', 'investigating', 'resolved', 'closed'];

const severityColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const emptyIncident: Record<string, string> = {
  type: 'accident', severity: 'medium', date: new Date().toISOString().slice(0, 10),
  location: '', description: '', actions_taken: '', reported_by: '', cost: '',
  status: 'open', resolution_notes: '', vehicle_id: '', driver_id: '', trip_id: '',
};

function Incidents() {
  const toast = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyIncident);
  const [confirmDelete, setConfirmDelete] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const { errors, validate, clearErrors } = useFormErrors();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterType, filterSeverity, filterStatus]);

  async function loadData() {
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (filterType) filters.type = filterType;
    if (filterSeverity) filters.severity = filterSeverity;
    if (filterStatus) filters.status = filterStatus;
    const [inc, v, d, t] = await Promise.all([
      window.electronAPI.getIncidents(filters),
      window.electronAPI.getVehicles(),
      window.electronAPI.getDrivers(),
      window.electronAPI.getTrips({}),
    ]);
    setIncidents(inc);
    setVehicles(v);
    setDrivers(d);
    setTrips(t);
    setLoading(false);
  }

  const filtered = incidents.filter(inc =>
    !search ||
    (inc.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (inc.location || '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setForm({ ...emptyIncident, date: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }

  function openEdit(incident: Incident) {
    setEditing(incident);
    setForm({
      type: incident.type, severity: incident.severity,
      date: incident.date?.slice(0, 10) || '', location: incident.location || '',
      description: incident.description || '', actions_taken: incident.actions_taken || '',
      reported_by: incident.reported_by || '', cost: String(incident.cost || ''),
      status: incident.status, resolution_notes: incident.resolution_notes || '',
      vehicle_id: String(incident.vehicle_id || ''), driver_id: String(incident.driver_id || ''),
      trip_id: String(incident.trip_id || ''),
    });
    setModalOpen(true);
  }

  function handleDelete(incident: Incident) { setConfirmDelete(incident); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteIncident(confirmDelete.id);
    setConfirmDelete(null);
    toast('Incident deleted', 'success');
    loadData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({
      type: { required: true, label: 'Type' },
      severity: { required: true, label: 'Severity' },
      date: { required: true, label: 'Date' },
      description: { required: true, label: 'Description' },
    }, form)) return;
    const payload = {
      ...form,
      vehicle_id: form.vehicle_id ? parseInt(form.vehicle_id) : null,
      driver_id: form.driver_id ? parseInt(form.driver_id) : null,
      trip_id: form.trip_id ? parseInt(form.trip_id) : null,
      cost: parseFloat(form.cost) || 0,
    };
    if (editing) {
      await window.electronAPI.updateIncident(editing.id, payload);
      toast('Incident updated', 'success');
    } else {
      await window.electronAPI.createIncident(payload);
      toast('Incident created', 'success');
    }
    setModalOpen(false);
    loadData();
  }

  const columns = [
    { key: 'date', label: 'Date', render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '—' },
    {
      key: 'type', label: 'Type',
      render: (row) => <span className="capitalize">{row.type?.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'severity', label: 'Severity',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${severityColors[row.severity] || ''}`}>
          {row.severity}
        </span>
      ),
    },
    { key: 'location', label: 'Location' },
    {
      key: 'description', label: 'Description',
      render: (row) => (
        <span className="truncate max-w-[200px] inline-block">{row.description}</span>
      ),
    },
    { key: 'reported_by', label: 'Reported By' },
    { key: 'cost', label: 'Cost', render: (row) => row.cost ? `₦ ${Number(row.cost).toLocaleString()}` : '—' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <input placeholder="Search incidents..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          <select className="select-field w-36" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {incidentTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <select className="select-field w-28" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="">All Severity</option>
            {severities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select-field w-28" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {incidentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'incidents')} className="btn-secondary">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ New Incident</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No incidents recorded" pageSize={10} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Incident' : 'New Incident'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type *</label>
              <select className={`select-field ${errors.type ? 'border-red-500' : ''}`} value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                {incidentTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>
            <div>
              <label className="label">Severity *</label>
              <select className={`select-field ${errors.severity ? 'border-red-500' : ''}`} value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} required>
                {severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className={`input-field ${errors.date ? 'border-red-500' : ''}`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Cost (₦)</label>
              <input type="number" step="0.01" className="input-field" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="label">Location</label>
              <input className="input-field" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="label">Description *</label>
              <textarea className={`input-field ${errors.description ? 'border-red-500' : ''}`} rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Actions Taken</label>
              <textarea className="input-field" rows={2} value={form.actions_taken} onChange={e => setForm({...form, actions_taken: e.target.value})} />
            </div>
            <div>
              <label className="label">Reported By</label>
              <input className="input-field" value={form.reported_by} onChange={e => setForm({...form, reported_by: e.target.value})} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {incidentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Vehicle</label>
              <select className="select-field" value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})}>
                <option value="">— Select —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Driver</label>
              <select className="select-field" value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})}>
                <option value="">— Select —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Related Trip</label>
              <select className="select-field" value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})}>
                <option value="">— Select —</option>
                {trips.map(t => <option key={t.id} value={t.id}>#{t.id}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Resolution Notes</label>
              <textarea className="input-field" rows={2} value={form.resolution_notes} onChange={e => setForm({...form, resolution_notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} message="Delete this incident? This action cannot be undone." onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default Incidents;
