import { useState, useEffect } from 'react';
import type { Vehicle, Driver, Assignment } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { PageSkeleton } from '../components/Skeleton';

const emptyVehicle: Record<string, string> = { plate_number: '', make: '', model: '', year: '', type: '', fuel_type: '', status: 'active', vin: '' };
const statusOptions = ['active', 'inactive', 'maintenance', 'retired'];
const types = ['sedan', 'SUV', 'truck', 'van', 'bus', 'motorcycle', 'HGV', 'trailer'];

function Vehicles() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyVehicle);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [assignVehicle, setAssignVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [v, d, a] = await Promise.all([
        window.electronAPI.getVehicles(),
        window.electronAPI.getDrivers(),
        window.electronAPI.getActiveAssignments(),
      ]);
      setVehicles(v || []);
      setDrivers(d || []);
      setAssignments(a || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  function getAssignedDriver(vehicleId: number) {
    const a = assignments.find(as => as.vehicle_id === vehicleId);
    if (!a) return null;
    return drivers.find(d => d.id === a.driver_id);
  }

  function openCreate() { setEditing(null); setForm(emptyVehicle); setModalOpen(true); }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({ plate_number: v.plate_number, make: v.make || '', model: v.model || '', year: String(v.year || ''), type: v.type || '', fuel_type: v.fuel_type || '', status: v.status, vin: v.vin || '' });
    setModalOpen(true);
  }

  function openAssign(v: Vehicle) {
    setAssignVehicle(v);
    setSelectedDriver('');
    setAssignModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await window.electronAPI.updateVehicle(editing.id, form);
        toast('Vehicle updated', 'success');
      } else {
        await window.electronAPI.createVehicle(form);
        toast('Vehicle created', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch { toast('Operation failed', 'error'); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteVehicle(deleteTarget.id);
      toast('Vehicle deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch { toast('Delete failed', 'error'); }
  }

  async function handleAssign() {
    if (!assignVehicle || !selectedDriver) return;
    try {
      await window.electronAPI.assignDriver(assignVehicle.id, Number(selectedDriver));
      toast(`Assigned vehicle to driver`, 'success');
      setAssignModal(false);
      loadData();
    } catch { toast('Assignment failed', 'error'); }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'status-active',
      maintenance: 'status-warning',
      retired: 'status-inactive',
      inactive: 'status-inactive',
    };
    return <span className={map[status] || 'status-inactive'}>{status}</span>;
  };

  const columns = [
    { key: 'plate_number', label: 'Plate', render: (r: Vehicle) => <span className="font-data-tabular text-data-tabular text-on-surface font-bold">{r.plate_number}</span> },
    { key: 'make', label: 'Make/Model', render: (r: Vehicle) => <span className="text-body-md text-on-surface">{r.make} {r.model}</span> },
    { key: 'type', label: 'Type', render: (r: Vehicle) => <span className="text-body-md text-on-surface capitalize">{r.type}</span> },
    { key: 'status', label: 'Status', render: (r: Vehicle) => statusBadge(r.status) },
    { key: 'driver', label: 'Driver', render: (r: Vehicle) => {
      const d = getAssignedDriver(r.id);
      return d ? <span className="text-body-md text-on-surface">{d.name}</span> : <span className="text-on-surface-variant italic">Unassigned</span>;
    }},
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-lg animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-lg">
        <div className="space-y-xs">
          <nav className="flex items-center gap-xs text-on-surface-variant text-[10px] font-label-sm uppercase tracking-widest">
            <span>FleetOps</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Vehicle Management</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Fleet Inventory</h1>
          <p className="text-on-surface-variant font-body-md">Manage and monitor your fleet vehicles.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
        <div className="glass-panel p-lg rounded-xl">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">Total</span>
            <span className="material-symbols-outlined text-primary">sensors</span>
          </div>
          <p className="text-headline-lg font-headline-lg text-on-surface">{vehicles.length}</p>
        </div>
        <div className="glass-panel p-lg rounded-xl">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">Active</span>
            <span className="material-symbols-outlined text-tertiary">check_circle</span>
          </div>
          <p className="text-headline-lg font-headline-lg text-tertiary">{vehicles.filter(v => v.status === 'active').length}</p>
        </div>
        <div className="glass-panel p-lg rounded-xl">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">Maintenance</span>
            <span className="material-symbols-outlined text-secondary">build</span>
          </div>
          <p className="text-headline-lg font-headline-lg text-secondary">{vehicles.filter(v => v.status === 'maintenance').length}</p>
        </div>
        <div className="glass-panel p-lg rounded-xl">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">Assigned</span>
            <span className="material-symbols-outlined text-primary">group</span>
          </div>
          <p className="text-headline-lg font-headline-lg text-on-surface">{assignments.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="flex-1 overflow-x-auto">
          <DataTable columns={columns} data={vehicles} onEdit={openEdit} onDelete={(v) => setDeleteTarget(v)} emptyMessage="No vehicles found" pageSize={25} />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Plate Number *</label>
              <input className="input-field" value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} required />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">VIN</label>
              <input className="input-field" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Make</label>
              <input className="input-field" value={form.make} onChange={e => setForm({...form, make: e.target.value})} />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Model</label>
              <input className="input-field" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Year</label>
              <input type="number" className="input-field" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Type</label>
              <select className="select-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="">Select type</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Fuel Type</label>
              <select className="select-field" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}>
                <option value="">Select fuel</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Status</label>
              <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title={`Assign Driver to ${assignVehicle?.plate_number || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Select Driver</label>
            <select className="select-field" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
              <option value="">Choose driver...</option>
              {drivers.filter(d => !assignments.some(a => a.driver_id === d.id)).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleAssign} disabled={!selectedDriver} className="btn-primary">Assign</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} message={`Delete vehicle ${deleteTarget?.plate_number}? This cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

export default Vehicles;
