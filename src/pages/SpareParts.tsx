import React, { useState, useEffect } from 'react';
import type { SparePart } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

const emptyPart: Record<string, string> = {
  name: '', part_number: '', vehicle_make: '', vehicle_model: '',
  quantity: '', min_quantity: '', unit_cost: '', supplier: '', location: '', notes: '',
};

function SpareParts() {
  const toast = useToast();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyPart);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const { errors, validate, clearErrors } = useFormErrors();

  useEffect(() => { loadParts(); }, []);

  async function loadParts() {
    setLoading(true);
    const data = await window.electronAPI.getSpareParts();
    setParts(data);
    setLoading(false);
  }

  const filtered = parts.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.part_number || '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setForm(emptyPart); setModalOpen(true); }

  function openEdit(part: SparePart) {
    setEditing(part);
    setForm({
      name: part.name, part_number: part.part_number || '',
      vehicle_make: part.vehicle_make || '', vehicle_model: part.vehicle_model || '',
      quantity: String(part.quantity), min_quantity: String(part.min_quantity || 0),
      unit_cost: String(part.unit_cost || 0), supplier: part.supplier || '',
      location: part.location || '', notes: part.notes || '',
    });
    setModalOpen(true);
  }

  function handleDelete(part: SparePart) { setConfirmDelete(part); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteSparePart(confirmDelete.id);
    setConfirmDelete(null);
    toast(`Part ${confirmDelete.name} deleted`, 'success');
    loadParts();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({
      name: { required: true, label: 'Part name' },
      quantity: { required: true, label: 'Quantity', min: 0 },
      min_quantity: { label: 'Min quantity', min: 0 },
    }, form)) return;
    const payload = {
      ...form,
      quantity: parseInt(form.quantity) || 0,
      min_quantity: parseInt(form.min_quantity) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
    };
    if (editing) {
      await window.electronAPI.updateSparePart(editing.id, payload);
      toast(`Part ${form.name} updated`, 'success');
    } else {
      await window.electronAPI.createSparePart(payload);
      toast(`Part ${form.name} created`, 'success');
    }
    setModalOpen(false);
    loadParts();
  }

  function _openAdjust(part: SparePart) {
    setSelectedPart(part);
    setAdjustDelta(0);
    setAdjustModalOpen(true);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPart || adjustDelta === 0) return;
    await window.electronAPI.adjustPartQuantity(selectedPart.id, adjustDelta);
    setAdjustModalOpen(false);
    toast(`Adjusted ${selectedPart.name} by ${adjustDelta > 0 ? '+' : ''}${adjustDelta}`, 'success');
    loadParts();
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'part_number', label: 'Part #' },
    { key: 'vehicle_make', label: 'Make' },
    { key: 'vehicle_model', label: 'Model' },
    {
      key: 'quantity', label: 'Qty',
      render: (row) => {
        const low = row.quantity <= row.min_quantity;
        return (
          <span className={`font-medium ${low ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {row.quantity}
            {low && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Low</span>}
          </span>
        );
      },
    },
    { key: 'min_quantity', label: 'Min Qty' },
    { key: 'unit_cost', label: 'Unit Cost', render: (row) => `₦ ${Number(row.unit_cost || 0).toLocaleString()}` },
    { key: 'supplier', label: 'Supplier' },
    { key: 'location', label: 'Location' },
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <input placeholder="Search parts..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'spare-parts')} className="btn-secondary">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ Add Part</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No spare parts found" pageSize={10} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Part' : 'Add Part'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className={`input-field${errors.name ? ' border-red-500' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Part Number</label>
              <input className="input-field" value={form.part_number} onChange={e => setForm({...form, part_number: e.target.value})} />
            </div>
            <div>
              <label className="label">Vehicle Make</label>
              <input className="input-field" value={form.vehicle_make} onChange={e => setForm({...form, vehicle_make: e.target.value})} />
            </div>
            <div>
              <label className="label">Vehicle Model</label>
              <input className="input-field" value={form.vehicle_model} onChange={e => setForm({...form, vehicle_model: e.target.value})} />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" className={`input-field${errors.quantity ? ' border-red-500' : ''}`} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="label">Min Quantity</label>
              <input type="number" className={`input-field${errors.min_quantity ? ' border-red-500' : ''}`} value={form.min_quantity} onChange={e => setForm({...form, min_quantity: e.target.value})} />
              {errors.min_quantity && <p className="text-red-500 text-sm mt-1">{errors.min_quantity}</p>}
            </div>
            <div>
              <label className="label">Unit Cost (₦)</label>
              <input type="number" step="0.01" className="input-field" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input className="input-field" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input-field" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title={`Adjust Quantity: ${selectedPart?.name || ''}`} size="sm">
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="label">Current Quantity: <strong>{selectedPart?.quantity || 0}</strong></label>
          </div>
          <div>
            <label className="label">Adjustment (use positive to add, negative to subtract)</label>
            <input type="number" className="input-field" value={adjustDelta} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustDelta(parseInt(e.target.value) || 0)} required />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">New quantity will be: {(selectedPart?.quantity || 0) + adjustDelta}</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAdjustModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Adjust</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} message={`Delete ${confirmDelete?.name}? This action cannot be undone.`} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default SpareParts;
