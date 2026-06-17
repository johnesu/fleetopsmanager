import { useState, useEffect } from 'react';
import type { MaintenanceRecord, SparePart, Vehicle, Alert } from '../types';

export default function MaintenanceDashboard() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allRecords, allVehicles, allParts, allAlerts] = await Promise.all([
          window.electronAPI.getMaintenanceRecords(),
          window.electronAPI.getVehicles(),
          window.electronAPI.getSpareParts(),
          window.electronAPI.getAlerts(),
        ]);
        setRecords(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setVehicles(allVehicles);
        setSpareParts(allParts);
        setAlerts((allAlerts || []).filter(a => !a.is_resolved).slice(0, 10));
      } catch (err) {
        console.error('Failed to load maintenance data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const inMaintenance = vehicles.filter(v => v.status === 'maintenance');
  const scheduled = records.filter(r => r.status === 'scheduled');
  const completed = records.filter(r => r.status === 'completed');
  const lowStock = spareParts.filter(p => p.quantity <= p.min_quantity);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Maintenance Dashboard</h1>
        <p className="text-amber-100 mt-1">{inMaintenance.length} vehicles in service · {scheduled.length} scheduled · {lowStock.length} low-stock parts</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Maintenance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{inMaintenance.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{scheduled.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completed.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{lowStock.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vehicles in Maintenance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Vehicles in Maintenance</h2>
          {inMaintenance.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No vehicles currently in maintenance</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inMaintenance.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.plate_number} — {v.make} {v.model}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{v.odometer_km.toLocaleString()} km</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Service</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Maintenance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Services</h2>
          {scheduled.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming services</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scheduled.slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.service_type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.plate_number || `Vehicle #${r.vehicle_id}`} · {new Date(r.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shrink-0 ml-2">Scheduled</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spare Parts Inventory */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Spare Parts Inventory</h2>
          {spareParts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No parts in inventory</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {spareParts.slice(0, 10).map(p => {
                const isLow = p.quantity <= p.min_quantity;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Stock: {p.quantity} / Min: {p.min_quantity}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${isLow ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {isLow ? 'Low' : 'OK'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Maintenance Records */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
          {completed.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No completed records</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {completed.slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.service_type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.plate_number || `Vehicle #${r.vehicle_id}`} · {new Date(r.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0 ml-2">Done</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Alerts</h2>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className={`shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}>
                  {a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : '🔵'}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
