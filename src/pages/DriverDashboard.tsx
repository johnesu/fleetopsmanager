import { useState, useEffect } from 'react';
import type { Trip, Vehicle, Alert, FuelEntry } from '../types';
import { useAuth } from '../context/AuthContext';

export default function DriverDashboard() {
  const { userName } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [vehicles, allTrips, allAlerts, allFuel] = await Promise.all([
          window.electronAPI.getVehicles(),
          window.electronAPI.getTrips(),
          window.electronAPI.getAlerts(),
          window.electronAPI.getFuelEntries(),
        ]);
        const myVehicle = vehicles.find(v => v.driver_name === userName);
        setVehicle(myVehicle || null);
        const myTrips = myVehicle
          ? allTrips.filter(t => t.vehicle_id === myVehicle.id).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
          : [];
        setTrips(myTrips);
        setAlerts((allAlerts || []).filter(a => !a.is_resolved).slice(0, 5));
        const myFuel = myVehicle
          ? allFuel.filter(f => f.vehicle_id === myVehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          : [];
        setFuelEntries(myFuel.slice(0, 5));
      } catch (err) {
        console.error('Failed to load driver data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userName]);

  const activeTrip = trips.find(t => t.status === 'ongoing');
  const pendingTrips = trips.filter(t => t.status === 'pending');
  const completedTrips = trips.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {userName}!</h1>
        <p className="text-emerald-100 mt-1">
          {vehicle ? `Assigned: ${vehicle.make} ${vehicle.model} (${vehicle.plate_number})` : 'No vehicle assigned'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
            {activeTrip ? '🟢 On Trip' : vehicle ? '🟡 Available' : '🔴 Unassigned'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Trip</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{activeTrip ? activeTrip.start_location : 'None'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{pendingTrips.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{completedTrips.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Trip */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Trip</h2>
          {activeTrip ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20">From:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{activeTrip.start_location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20">To:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{activeTrip.end_location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20">Started:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(activeTrip.start_time).toLocaleString()}</span>
              </div>
              <button className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                End Trip
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-sm">No active trip</p>
            </div>
          )}
        </div>

        {/* Upcoming Trips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Trips</h2>
          {pendingTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No pending trips</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingTrips.slice(0, 5).map(trip => (
                <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{trip.start_location} → {trip.end_location}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(trip.start_time).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Trips</h2>
          {completedTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No completed trips</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {completedTrips.slice(0, 10).map(trip => (
                <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{trip.start_location} → {trip.end_location}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{trip.distance_km} km · {new Date(trip.start_time).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0 ml-2">Done</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts & Fuel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Alerts</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No alerts</p>
            ) : (
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
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Fuel Logs</h2>
            {fuelEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No fuel entries</p>
            ) : (
              <div className="space-y-2">
                {fuelEntries.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{f.liters}L @ ₦{f.cost_per_liter}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{f.station || 'N/A'} · {new Date(f.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">₦{f.total_cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
