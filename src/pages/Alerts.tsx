import React, { useState, useEffect } from 'react';
import type { Alert } from '../types';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { PageSkeleton } from '../components/Skeleton';

const typeConfig: Record<string, { color: string }> = {
  maintenance: { color: 'blue' },
  license_expiry: { color: 'orange' },
  insurance_expiry: { color: 'red' },
  geofence_violation: { color: 'purple' },
  speed_violation: { color: 'yellow' },
  fuel_theft: { color: 'pink' },
  vehicle_downtime: { color: 'gray' },
  incident: { color: 'red' },
  general: { color: 'blue' },
};

const severityColors: Record<string, string> = {
  info: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function Alerts() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterType, filterSeverity, filterRead]);

  async function loadData() {
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (filterType) filters.type = filterType;
    if (filterSeverity) filters.severity = filterSeverity;
    if (filterRead === 'unread') filters.is_read = false;
    if (filterRead === 'read') filters.is_read = true;
    const [a, count] = await Promise.all([
      window.electronAPI.getAlerts(filters),
      window.electronAPI.getUnreadAlertCount(),
    ]);
    setAlerts(a || []);
    setUnreadCount(count || 0);
    setLoading(false);
  }

  async function _handleMarkRead(alert: Alert) {
    await window.electronAPI.markAlertRead(alert.id);
    toast('Alert marked as read', 'success');
    loadData();
  }

  async function _handleMarkResolved(alert: Alert) {
    await window.electronAPI.markAlertResolved(alert.id);
    toast('Alert resolved', 'success');
    loadData();
  }

  const [generating, setGenerating] = useState(false);

  async function handleGenerateAlerts() {
    setGenerating(true);
    try {
      await window.electronAPI.generateAlerts();
      toast('Alerts generated', 'success');
      loadData();
    } catch {
      toast('Failed to generate alerts', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkAllRead() {
    const unread = alerts.filter(a => !a.is_read);
    for (const a of unread) {
      await window.electronAPI.markAlertRead(a.id);
    }
    toast('All alerts marked as read', 'success');
    loadData();
  }

  const columns = [
    {
      key: 'type', label: 'Type',
      render: (row) => {
        const _cfg = typeConfig[row.type] || typeConfig.general;
        return <span className="capitalize text-xs">{row.type?.replace(/_/g, ' ')}</span>;
      },
    },
    {
      key: 'severity', label: 'Severity',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${severityColors[row.severity] || severityColors.info}`}>
          {row.severity}
        </span>
      ),
    },
    {
      key: 'message', label: 'Message',
      render: (row) => (
        <div>
          <span className={`${row.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-semibold'}`}>
            {row.message}
          </span>
          {expandedId === row.id && row.details && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{row.details}</p>
          )}
        </div>
      ),
    },
    {
      key: 'is_read', label: 'Status',
      render: (row) => row.is_read
        ? <span className="text-xs text-gray-400 dark:text-gray-500">Read</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">New</span>,
    },
    {
      key: 'created_at', label: 'Date',
      render: (row) => row.created_at ? new Date(row.created_at + 'Z').toLocaleString() : '—',
    },
  ];

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alert Center</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateAlerts} className="btn-secondary" disabled={generating}>{generating ? 'Generating...' : 'Generate Alerts'}</button>
          <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="btn-secondary disabled:opacity-50">Mark All Read</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="select-field w-44" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="select-field w-32" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
          <option value="">All Severity</option>
          <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
        </select>
        <select className="select-field w-32" value={filterRead} onChange={e => setFilterRead(e.target.value)}>
          <option value="">All Status</option>
          <option value="unread">Unread</option><option value="read">Read</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={alerts}
          emptyMessage="No alerts found"
          pageSize={15}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors" onClick={() => setExpandedId(expandedId === '__all' ? null : '__all')}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Alert Tips</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Click any row to expand/collapse alert details. Use filters above to narrow down alerts by type, severity, or status.
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bulk Actions</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Use "Mark All Read" to clear unread status on all visible alerts. Generate alerts to create new alerts based on current data.
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Alert Summary</p>
          <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
            <p><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>Critical: {alerts.filter(a => a.severity === 'critical').length}</p>
            <p><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>Warning: {alerts.filter(a => a.severity === 'warning').length}</p>
            <p><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>Info: {alerts.filter(a => a.severity === 'info').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
