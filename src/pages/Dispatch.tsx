import { useState, useEffect, useRef } from 'react';
import type { Dispatch, Trip, Vehicle } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { downloadCSV } from '../utils/csv';
import { PageSkeleton } from '../components/Skeleton';
import useFormErrors from '../hooks/useFormErrors';

interface VehiclePosition {
  id: number;
  vehicle_id: number;
  plate_number: string;
  make: string;
  model: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  driver_name: string;
  _simulated: boolean;
}

const CENTER: [number, number] = [6.5244, 3.3792];
const priorities = ['low', 'normal', 'high', 'urgent'];
const dispatchStatuses = ['pending', 'approved', 'in_progress', 'completed', 'cancelled'];

const emptyDispatch: Record<string, string> = {
  trip_id: '', priority: 'normal', pickup_location: '', dropoff_location: '',
  cargo_description: '', cargo_weight_kg: '', recipient_name: '', recipient_phone: '',
  instructions: '', notes: '', status: 'pending',
};

const iconColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const routeColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;background:${color};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}

const ACTIVE_VEHICLE_CENTER = [
  { lat: 6.5244, lng: 3.3792 }, { lat: 6.5100, lng: 3.3600 },
  { lat: 6.5400, lng: 3.4000 }, { lat: 6.5000, lng: 3.3500 },
  { lat: 6.5500, lng: 3.3900 }, { lat: 6.4800, lng: 3.4100 },
  { lat: 6.5300, lng: 3.3450 }, { lat: 6.5150, lng: 3.4200 },
];

function createSimulatedPositions(vehicles: Vehicle[]): VehiclePosition[] {
  const active = vehicles.filter(v => v.status === 'active');
  const now = new Date().toISOString();
  return active.map((v, i) => {
    const origin = ACTIVE_VEHICLE_CENTER[i % ACTIVE_VEHICLE_CENTER.length];
    return {
      id: 9000 + v.id, vehicle_id: v.id, plate_number: v.plate_number, make: v.make, model: v.model,
      latitude: origin.lat + (Math.random() - 0.5) * 0.02,
      longitude: origin.lng + (Math.random() - 0.5) * 0.02,
      speed: 20 + Math.random() * 60, heading: Math.random() * 360,
      timestamp: now, driver_name: v.driver_name || '', _simulated: true,
    };
  });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}

function textToCoord(text: string, offset: number): [number, number] {
  const h = hashCode(text || 'unknown');
  const lat = 6.45 + (h % 1000) / 2000 + (offset || 0) * 0.003;
  const lng = 3.32 + ((h * 31) % 1000) / 2000 + (offset || 0) * 0.003;
  return [lat, lng];
}

function getRouteCoords(dispatch: Dispatch) {
  const pickup = dispatch.pickup_location || dispatch.start_location || 'Pickup';
  const dropoff = dispatch.dropoff_location || dispatch.end_location || 'Dropoff';
  return {
    pickup: { name: pickup, coord: textToCoord(pickup, dispatch.id) },
    dropoff: { name: dropoff, coord: textToCoord(dropoff, dispatch.id * 7 + 3) },
  };
}

const TILE_STYLES: Record<string, { url: string; attr: string; maxZoom: number; label: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19, label: 'Street',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 18, label: 'Satellite',
  },
};

function Dispatch() {
  const toast = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDispatchId, setSelectedDispatchId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [mapStyle, setMapStyle] = useState('street');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dispatch | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyDispatch);
  const [confirmDelete, setConfirmDelete] = useState<Dispatch | null>(null);
  const [showTable, setShowTable] = useState(false);
  const { errors, validate, clearErrors } = useFormErrors();

  useEffect(() => { loadData(); }, [statusFilter]);

  useEffect(() => {
    (async () => {
      const v = await window.electronAPI.getVehicles().then(d => d || []);
      setVehicles(v);
    })();
  }, []);

  useEffect(() => {
    if (vehicles.length === 0) return;
    const sim = createSimulatedPositions(vehicles);
    setPositions(sim);
    simRef.current = setInterval(() => {
      setPositions(prev => prev.map(p => {
        const hRad = (p.heading || 0) * Math.PI / 180;
        const dt = 3;
        const dLat = Math.cos(hRad) * (p.speed || 30) / 111000 * dt;
        const dLng = Math.sin(hRad) * (p.speed || 30) / 111000 * dt / Math.cos((p.latitude || 6.5) * Math.PI / 180);
        return {
          ...p,
          latitude: (p.latitude || 6.5) + dLat + (Math.random() - 0.5) * 0.0005,
          longitude: (p.longitude || 3.38) + dLng + (Math.random() - 0.5) * 0.0005,
          heading: ((p.heading || 0) + (Math.random() - 0.5) * 15 + 360) % 360,
          speed: Math.max(0, Math.min(120, (p.speed || 30) + (Math.random() - 0.5) * 8)),
          timestamp: new Date().toISOString(),
        };
      }));
    }, 3000);
    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, [vehicles]);

  // Map init - same as Tracking.tsx
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;
    const map = L.map(mapContainerRef.current, {
      center: CENTER, zoom: 13, zoomControl: true,
    });
    const style = TILE_STYLES[mapStyle];
    tileLayerRef.current = L.tileLayer(style.url, { attribution: style.attr, maxZoom: style.maxZoom }).addTo(map);
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 300);
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    if (tileLayerRef.current) mapInstance.current.removeLayer(tileLayerRef.current);
    const style = TILE_STYLES[mapStyle];
    tileLayerRef.current = L.tileLayer(style.url, { attribution: style.attr, maxZoom: style.maxZoom }).addTo(mapInstance.current);
  }, [mapStyle]);

  // Dispatch routes
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    routeLayersRef.current.forEach(l => map.removeLayer(l));
    routeLayersRef.current = [];
    if (dispatches.length === 0) return;
    const bounds: [number, number][] = [];
    dispatches.forEach(d => {
      const route = getRouteCoords(d);
      const color = routeColors[(d.id - 1) % routeColors.length];
      const isSelected = d.id === selectedDispatchId;
      const layers = routeLayersRef.current;
      const pickupIcon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      const dropoffIcon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:#fff;border:3px solid ${color};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      const pm = L.marker(route.pickup.coord, { icon: pickupIcon }).bindPopup(`<b>Pickup</b><br/>${route.pickup.name}`);
      layers.push(pm); map.addLayer(pm);
      const dm = L.marker(route.dropoff.coord, { icon: dropoffIcon }).bindPopup(`<b>Dropoff</b><br/>${route.dropoff.name}`);
      layers.push(dm); map.addLayer(dm);
      const line = L.polyline([route.pickup.coord, route.dropoff.coord], {
        color, weight: isSelected ? 4 : 2, opacity: selectedDispatchId && !isSelected ? 0.3 : 0.8,
        dashArray: isSelected ? null : '6 4',
      }).bindPopup(`<b>#${d.id}</b>: ${route.pickup.name} → ${route.dropoff.name}`);
      layers.push(line); map.addLayer(line);
      if (isSelected) bounds.push(route.pickup.coord, route.dropoff.coord);
    });
    if (selectedDispatchId && bounds.length > 0) {
      map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
    } else if (!selectedDispatchId && dispatches.length > 0) {
      map.fitBounds(dispatches.flatMap(d => {
        const r = getRouteCoords(d);
        return [r.pickup.coord, r.dropoff.coord];
      }), { padding: [30, 30] });
    }
  }, [dispatches, selectedDispatchId]);

  // Vehicle markers
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const displayed = selectedVehicleId
      ? positions.filter(p => p.vehicle_id === parseInt(selectedVehicleId))
      : positions;
    const newIds = new Set(displayed.map(p => p.vehicle_id));
    Object.keys(markersRef.current).forEach(id => {
      if (!newIds.has(parseInt(id))) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    displayed.forEach(pos => {
      const color = iconColors[(pos.vehicle_id - 1) % iconColors.length];
      const popupHtml = `<b>${pos.plate_number}</b><br/>${pos.make || ''} ${pos.model || ''}<br/><span style="font-weight:bold;color:${pos.speed > 80 ? 'red' : pos.speed > 60 ? 'orange' : 'green'}">${Math.round(pos.speed || 0)} km/h</span>`;
      if (markersRef.current[pos.vehicle_id]) {
        markersRef.current[pos.vehicle_id].setLatLng([pos.latitude, pos.longitude]);
        markersRef.current[pos.vehicle_id].setPopupContent(popupHtml);
        markersRef.current[pos.vehicle_id].setIcon(createColoredIcon(color));
      } else {
        const marker = L.marker([pos.latitude, pos.longitude], { icon: createColoredIcon(color) }).addTo(map).bindPopup(popupHtml);
        markersRef.current[pos.vehicle_id] = marker;
      }
    });
  }, [positions, selectedVehicleId]);

  async function loadData() {
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (statusFilter) filters.status = statusFilter;
    const [d, t] = await Promise.all([
      window.electronAPI.getDispatches(filters),
      window.electronAPI.getTrips({}),
    ]);
    setDispatches(d);
    setTrips(t);
    setLoading(false);
  }

  const filtered = dispatches.filter(d =>
    !search ||
    (d.pickup_location || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.dropoff_location || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.recipient_name || '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setForm(emptyDispatch); setModalOpen(true); }
  function openEdit(dispatch: Dispatch) {
    setEditing(dispatch);
    setForm({
      trip_id: String(dispatch.trip_id || ''), priority: dispatch.priority,
      pickup_location: dispatch.pickup_location || '', dropoff_location: dispatch.dropoff_location || '',
      cargo_description: dispatch.cargo_description || '', cargo_weight_kg: String(dispatch.cargo_weight_kg || ''),
      recipient_name: dispatch.recipient_name || '', recipient_phone: dispatch.recipient_phone || '',
      instructions: dispatch.instructions || '', notes: dispatch.notes || '', status: dispatch.status,
    });
    setModalOpen(true);
  }
  function handleDelete(d: Dispatch) { setConfirmDelete(d); }
  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    await window.electronAPI.deleteDispatch(confirmDelete.id);
    setConfirmDelete(null);
    toast('Dispatch deleted', 'success');
    loadData();
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({ pickup_location: { required: true, label: 'Pickup location' }, dropoff_location: { required: true, label: 'Dropoff location' } }, form)) return;
    const payload = { ...form, trip_id: form.trip_id ? parseInt(form.trip_id) : null, cargo_weight_kg: parseFloat(form.cargo_weight_kg) || 0 };
    if (editing) {
      await window.electronAPI.updateDispatch(editing.id, payload);
      toast('Dispatch updated', 'success');
    } else {
      await window.electronAPI.createDispatch(payload);
      toast('Dispatch created', 'success');
    }
    setModalOpen(false);
    loadData();
  }

  const columns = [
    { key: 'id', label: '#' },
    { key: 'priority', label: 'Priority', render: (row: Dispatch) => {
      const colors: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
      return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[row.priority] || ''}`}>{row.priority}</span>;
    }},
    { key: 'pickup_location', label: 'Pickup' },
    { key: 'dropoff_location', label: 'Dropoff' },
    { key: 'recipient_name', label: 'Recipient' },
    { key: 'cargo_description', label: 'Cargo' },
    { key: 'status', label: 'Status', render: (row: Dispatch) => <StatusBadge status={row.status} /> },
  ];

  const selectedVehicle = vehicles.find(v => v.id === parseInt(selectedVehicleId));
  const selectedVehicleLatest = positions.find(p => p.vehicle_id === parseInt(selectedVehicleId));

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input placeholder="Search dispatches..." className="input-field max-w-xs" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          <select className="select-field w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {dispatchStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button onClick={() => setShowTable(!showTable)} className={`btn-secondary text-xs ${showTable ? 'bg-blue-600 text-white' : ''}`}>
            {showTable ? 'Map View' : 'Table View'}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered, columns, 'dispatches')} className="btn-secondary">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ New Dispatch</button>
        </div>
      </div>

      {/* Data Table */}
      {showTable && (
        <div className="card p-0 overflow-hidden">
          <DataTable columns={columns} data={filtered} onEdit={openEdit} onDelete={handleDelete}
            emptyMessage="No dispatches found" pageSize={10}
            onRowClick={(row) => setSelectedDispatchId(selectedDispatchId === row.id ? null : row.id)}
            rowClass={(row) => selectedDispatchId === row.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          />
        </div>
      )}

      {/* Map + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Map */}
        <div className="flex-1 relative">
          <div className="card p-1 overflow-hidden absolute inset-0 flex flex-col">
            <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2">
              <div className="bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-md shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {positions.length} vehicles
              </div>
              {positions.some(p => p._simulated) && (
                <div className="bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-md shadow-md">Simulation</div>
              )}
              <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-md shadow-md p-0.5">
                {Object.entries(TILE_STYLES).map(([key, s]) => (
                  <button key={key} onClick={() => setMapStyle(key)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${mapStyle === key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >{s.label}</button>
                ))}
              </div>
              {selectedDispatchId && (
                <button onClick={() => setSelectedDispatchId(null)} className="bg-white dark:bg-gray-800 text-xs px-2.5 py-1.5 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">Reset view</button>
              )}
              <div className="bg-white dark:bg-gray-800 text-xs px-2.5 py-1.5 rounded-lg shadow-md font-medium text-gray-600 dark:text-gray-300">
                {dispatches.length} dispatches
              </div>
            </div>
            <div ref={mapContainerRef} className="flex-1 w-full rounded-lg" style={{ minHeight: '400px' }}></div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Dispatches</h3>
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No dispatches</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filtered.map(d => (
                  <div key={d.id}
                    className={`flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer transition-colors ${selectedDispatchId === d.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    onClick={() => setSelectedDispatchId(selectedDispatchId === d.id ? null : d.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: routeColors[(d.id - 1) % routeColors.length] }}></span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">#{d.id} {d.pickup_location}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <StatusBadge status={d.status} />
                      <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} className="text-[10px] px-1 py-0.5 text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(d); }} className="text-[10px] px-1 py-0.5 text-red-600 dark:text-red-400 hover:underline">Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Vehicle Selector</h3>
            <select className="select-field mb-3" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
              <option value="">All Vehicles ({positions.length} online)</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
            </select>
            {selectedVehicle && (
              <div className="text-xs space-y-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="font-semibold text-sm">{selectedVehicle.plate_number}</p>
                <p className="text-gray-500 dark:text-gray-400">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${selectedVehicle.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="capitalize">{selectedVehicle.status}</span>
                </div>
                {selectedVehicleLatest && (
                  <p className={`font-semibold ${selectedVehicleLatest.speed > 80 ? 'text-red-600' : selectedVehicleLatest.speed > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {Math.round(selectedVehicleLatest.speed || 0)} km/h
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Live Vehicles</h3>
            {positions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {positions.map(pos => (
                  <div key={pos.vehicle_id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                    onClick={() => setSelectedVehicleId(String(pos.vehicle_id))}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: iconColors[(pos.vehicle_id - 1) % iconColors.length] }}></span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{pos.plate_number}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${pos.speed > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {pos.speed ? `${Math.round(pos.speed)} km/h` : 'stopped'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { clearErrors(); setModalOpen(false); }} title={editing ? 'Edit Dispatch' : 'New Dispatch'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Trip</label>
              <select className="select-field" value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})}>
                <option value="">— Select —</option>
                {trips.map(t => <option key={t.id} value={t.id}>#{t.id} — {t.start_location} → {t.end_location}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pickup Location *</label>
              <input className={`input-field ${errors.pickup_location ? 'border-red-500' : ''}`} value={form.pickup_location} onChange={e => setForm({...form, pickup_location: e.target.value})} />
              {errors.pickup_location && <p className="text-xs text-red-500 mt-1">{errors.pickup_location}</p>}
            </div>
            <div>
              <label className="label">Dropoff Location *</label>
              <input className={`input-field ${errors.dropoff_location ? 'border-red-500' : ''}`} value={form.dropoff_location} onChange={e => setForm({...form, dropoff_location: e.target.value})} />
              {errors.dropoff_location && <p className="text-xs text-red-500 mt-1">{errors.dropoff_location}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Cargo Description</label>
              <textarea className="input-field" rows={2} value={form.cargo_description} onChange={e => setForm({...form, cargo_description: e.target.value})} />
            </div>
            <div>
              <label className="label">Cargo Weight (kg)</label>
              <input type="number" step="0.1" className="input-field" value={form.cargo_weight_kg} onChange={e => setForm({...form, cargo_weight_kg: e.target.value})} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {dispatchStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Recipient Name</label>
              <input className="input-field" value={form.recipient_name} onChange={e => setForm({...form, recipient_name: e.target.value})} />
            </div>
            <div>
              <label className="label">Recipient Phone</label>
              <input className="input-field" value={form.recipient_phone} onChange={e => setForm({...form, recipient_phone: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="label">Instructions</label>
              <textarea className="input-field" rows={2} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
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

      <ConfirmModal isOpen={!!confirmDelete} message="Delete this dispatch? This action cannot be undone." onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

export default Dispatch;
