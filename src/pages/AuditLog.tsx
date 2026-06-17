import React, { useState, useEffect } from 'react';
import type { AuditLog } from '../types';
import DataTable from '../components/DataTable';
import { PageSkeleton } from '../components/Skeleton';

const entityTypes: string[] = ['', 'vehicle', 'driver', 'trip', 'fuel', 'maintenance', 'assignment'];
const actions = ['', 'CREATE', 'UPDATE', 'DELETE'];

function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLogs(); }, [filterEntity, filterAction]);

  async function loadLogs() {
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (filterEntity) filters.entity_type = filterEntity;
    if (filterAction) filters.action = filterAction;
    filters.limit = 500;
    const data = await window.electronAPI.getAuditLogs(filters);
    setLogs(data || []);
    setLoading(false);
  }

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const entityColors: Record<string, string> = {
    vehicle: 'bg-blue-100 dark:bg-blue-900/30', driver: 'bg-green-100 dark:bg-green-900/30',
    trip: 'bg-purple-100 dark:bg-purple-900/30', fuel: 'bg-yellow-100 dark:bg-yellow-900/30',
    maintenance: 'bg-orange-100 dark:bg-orange-900/30', assignment: 'bg-gray-100 dark:bg-gray-700',
  };

  const columns = [
    {
      key: 'action', label: 'Action', width: '80px',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionColors[row.action] || ''}`}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity_type', label: 'Type', width: '100px',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm">
          <span className={`inline-block w-2 h-2 rounded-full ${entityColors[row.entity_type] || 'bg-gray-100 dark:bg-gray-700'}`}></span>
          <span className="capitalize">{row.entity_type}</span>
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
    {
      key: 'created_at', label: 'Timestamp', width: '180px',
      render: (row) => row.created_at ? new Date(row.created_at + 'Z').toLocaleString() : '—',
    },
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Entity Type</label>
            <select className="select-field w-36" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="">All Types</option>
              {entityTypes.filter(Boolean).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action</label>
            <select className="select-field w-32" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="">All Actions</option>
              {actions.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{logs.length} entries</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={logs} emptyMessage="No audit log entries found" pageSize={20} />
      </div>
    </div>
  );
}

export default AuditLog;
