import React, { useState, useEffect, useRef } from 'react';
import type { Vehicle } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const CENTER = [6.5244, 3.3792];
const iconColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const TILE_STYLES = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    label: 'Street',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 18,
    label: 'Satellite',
  },
};

function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;background:${color};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transform:rotate(45deg)"><div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #fff;transform:rotate(-45deg);margin-top:-2px"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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

function Tracking() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [_ready, setReady] = useState(false);
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [mapStyle, setMapStyle] = useState('street');
  const [_tileIndex, _setTileIndex] = useState(0);

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

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;
    const map = L.map(mapContainerRef.current, {
      center: CENTER, zoom: 13, zoomControl: true,
    });
    const style = TILE_STYLES[mapStyle];
    tileLayerRef.current = L.tileLayer(style.url, { attribution: style.attr, maxZoom: style.maxZoom }).addTo(map);
    mapInstance.current = map;
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    const style = TILE_STYLES[mapStyle];
    if (tileLayerRef.current) mapInstance.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(style.url, { attribution: style.attr, maxZoom: style.maxZoom }).addTo(mapInstance.current);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const sel = positions.find(p => p.vehicle_id === parseInt(selectedVehicleId));
    if (sel) {
      mapInstance.current.setView([sel.latitude, sel.longitude], 15, { animate: true, duration: 0.5 });
    } else {
      mapInstance.current.setView(CENTER, 13, { animate: true, duration: 0.5 });
    }
  }, [selectedVehicleId, positions]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const displayed = selectedVehicleId
      ? positions.filter(p => p.vehicle_id === parseInt(selectedVehicleId))
      : positions;

    const newIds = new Set(displayed.map(p => p.vehicle_id));
    Object.keys(markersRef.current).forEach(id => {
      if (!newIds.has(parseInt(id))) {
        mapInstance.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    displayed.forEach(pos => {
      const color = iconColors[(pos.vehicle_id - 1) % iconColors.length];
      const popupHtml = `<b>${pos.plate_number}</b><br/>${pos.make || ''} ${pos.model || ''}<br/><span style="color:${pos.speed > 80 ? 'red' : pos.speed > 60 ? 'orange' : 'green'};font-weight:bold">${Math.round(pos.speed || 0)} km/h</span>`;
      if (markersRef.current[pos.vehicle_id]) {
        markersRef.current[pos.vehicle_id].setLatLng([pos.latitude, pos.longitude]);
        markersRef.current[pos.vehicle_id].setPopupContent(popupHtml);
        markersRef.current[pos.vehicle_id].setIcon(createColoredIcon(color));
      } else {
        const marker = L.marker([pos.latitude, pos.longitude], { icon: createColoredIcon(color) })
          .addTo(mapInstance.current)
          .bindPopup(popupHtml);
        markersRef.current[pos.vehicle_id] = marker;
      }
    });
  }, [positions, selectedVehicleId]);

  const selectedVehicle = vehicles.find(v => v.id === parseInt(selectedVehicleId));
  const selectedVehicleLatest = positions.find(p => p.vehicle_id === parseInt(selectedVehicleId));

  return (
    <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 140px)' }}>
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
                <button
                  key={key}
                  onClick={() => setMapStyle(key)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${mapStyle === key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div ref={mapContainerRef} className="flex-1 w-full rounded-lg" style={{ minHeight: '400px' }}></div>
        </div>
      </div>

      <div className="w-full lg:w-96 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Vehicle Selector</h3>
          <select className="select-field mb-3" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
            <option value="">All Vehicles ({positions.length} online)</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
          </select>
          {selectedVehicle && (
            <div className="text-sm space-y-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="font-semibold text-base">{selectedVehicle.plate_number}</p>
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
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Live Vehicles</h3>
          {positions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {positions.map((pos) => (
                <div
                  key={pos.vehicle_id}
                  className="flex items-center justify-between text-sm py-1.5 px-2 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                  onClick={() => setSelectedVehicleId(String(pos.vehicle_id))}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: iconColors[(pos.vehicle_id - 1) % iconColors.length] }}></span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{pos.plate_number}</p>
                  </div>
                  <span className={`text-xs font-medium ${pos.speed > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    {pos.speed ? `${Math.round(pos.speed)} km/h` : 'stopped'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tracking;
