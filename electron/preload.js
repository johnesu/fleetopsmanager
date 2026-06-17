import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Vehicles
  getVehicles: () => ipcRenderer.invoke('vehicles:getAll'),
  getVehicle: (id) => ipcRenderer.invoke('vehicles:get', id),
  createVehicle: (data) => ipcRenderer.invoke('vehicles:create', data),
  updateVehicle: (id, data) => ipcRenderer.invoke('vehicles:update', id, data),
  deleteVehicle: (id) => ipcRenderer.invoke('vehicles:delete', id),
  getVehiclesByStatus: (status) => ipcRenderer.invoke('vehicles:getByStatus', status),
  getExpiringVehicles: () => ipcRenderer.invoke('vehicles:getExpiring'),

  // Drivers
  getDrivers: () => ipcRenderer.invoke('drivers:getAll'),
  getDriver: (id) => ipcRenderer.invoke('drivers:get', id),
  createDriver: (data) => ipcRenderer.invoke('drivers:create', data),
  updateDriver: (id, data) => ipcRenderer.invoke('drivers:update', id, data),
  deleteDriver: (id) => ipcRenderer.invoke('drivers:delete', id),
  getExpiringLicenses: () => ipcRenderer.invoke('drivers:getExpiring'),

  // Assignments
  getActiveAssignments: () => ipcRenderer.invoke('assignments:getActive'),
  getAssignmentsByVehicle: (vehicleId) => ipcRenderer.invoke('assignments:getByVehicle', vehicleId),
  getAssignmentsByDriver: (driverId) => ipcRenderer.invoke('assignments:getByDriver', driverId),
  assignDriver: (vehicleId, driverId) => ipcRenderer.invoke('assignments:create', vehicleId, driverId),
  unassignDriver: (assignmentId) => ipcRenderer.invoke('assignments:end', assignmentId),

  // Trips
  getTrips: (filters) => ipcRenderer.invoke('trips:getAll', filters),
  getTrip: (id) => ipcRenderer.invoke('trips:get', id),
  createTrip: (data) => ipcRenderer.invoke('trips:create', data),
  updateTrip: (id, data) => ipcRenderer.invoke('trips:update', id, data),
  deleteTrip: (id) => ipcRenderer.invoke('trips:delete', id),
  getTripsByVehicle: (vehicleId) => ipcRenderer.invoke('trips:getByVehicle', vehicleId),

  // Fuel
  getFuelEntries: (filters) => ipcRenderer.invoke('fuel:getAll', filters),
  createFuelEntry: (data) => ipcRenderer.invoke('fuel:create', data),
  updateFuelEntry: (id, data) => ipcRenderer.invoke('fuel:update', id, data),
  deleteFuelEntry: (id) => ipcRenderer.invoke('fuel:delete', id),
  getFuelReport: (startDate, endDate) => ipcRenderer.invoke('fuel:getReport', startDate, endDate),

  // Maintenance
  getMaintenanceRecords: (filters) => ipcRenderer.invoke('maintenance:getAll', filters),
  createMaintenanceRecord: (data) => ipcRenderer.invoke('maintenance:create', data),
  updateMaintenanceRecord: (id, data) => ipcRenderer.invoke('maintenance:update', id, data),
  deleteMaintenanceRecord: (id) => ipcRenderer.invoke('maintenance:delete', id),
  getUpcomingMaintenance: () => ipcRenderer.invoke('maintenance:getUpcoming'),

  // Dashboard / Reports
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getMonthlyFuelReport: (year, month) => ipcRenderer.invoke('dashboard:monthlyFuelReport', year, month),
  getVehicleUsageReport: (year, month) => ipcRenderer.invoke('dashboard:vehicleUsageReport', year, month),
  getMaintenanceSummary: (year, month) => ipcRenderer.invoke('dashboard:maintenanceSummary', year, month),
  getDriverPerformance: (year, month) => ipcRenderer.invoke('dashboard:driverPerformance', year, month),

  // Audit Logs
  getAuditLogs: (filters) => ipcRenderer.invoke('audit:getAll', filters),
  createAuditEntry: (entry) => ipcRenderer.invoke('audit:create', entry),

  // Dispatches
  getDispatches: (filters) => ipcRenderer.invoke('dispatches:getAll', filters),
  getDispatch: (id) => ipcRenderer.invoke('dispatches:get', id),
  createDispatch: (data) => ipcRenderer.invoke('dispatches:create', data),
  updateDispatch: (id, data) => ipcRenderer.invoke('dispatches:update', id, data),
  deleteDispatch: (id) => ipcRenderer.invoke('dispatches:delete', id),

  // GPS Tracking
  getLatestPositions: () => ipcRenderer.invoke('tracking:getLatest'),
  getTrackingByVehicle: (vehicleId, limit) => ipcRenderer.invoke('tracking:getByVehicle', vehicleId, limit),
  getTrackingByTrip: (tripId) => ipcRenderer.invoke('tracking:getByTrip', tripId),
  createTrackingPoint: (data) => ipcRenderer.invoke('tracking:create', data),
  getRouteHistory: (vehicleId, startDate, endDate) => ipcRenderer.invoke('tracking:getRouteHistory', vehicleId, startDate, endDate),

  // Geofences
  getGeofences: () => ipcRenderer.invoke('geofences:getAll'),
  getGeofence: (id) => ipcRenderer.invoke('geofences:get', id),
  createGeofence: (data) => ipcRenderer.invoke('geofences:create', data),
  updateGeofence: (id, data) => ipcRenderer.invoke('geofences:update', id, data),
  deleteGeofence: (id) => ipcRenderer.invoke('geofences:delete', id),
  checkGeofenceViolations: () => ipcRenderer.invoke('geofences:checkViolations'),

  // Alerts
  getAlerts: (filters) => ipcRenderer.invoke('alerts:getAll', filters),
  getAlert: (id) => ipcRenderer.invoke('alerts:get', id),
  createAlert: (data) => ipcRenderer.invoke('alerts:create', data),
  markAlertRead: (id) => ipcRenderer.invoke('alerts:markRead', id),
  markAlertResolved: (id) => ipcRenderer.invoke('alerts:markResolved', id),
  deleteAlert: (id) => ipcRenderer.invoke('alerts:delete', id),
  getUnreadAlertCount: () => ipcRenderer.invoke('alerts:getUnreadCount'),
  generateAlerts: () => ipcRenderer.invoke('alerts:generate'),

  // Incidents
  getIncidents: (filters) => ipcRenderer.invoke('incidents:getAll', filters),
  getIncident: (id) => ipcRenderer.invoke('incidents:get', id),
  createIncident: (data) => ipcRenderer.invoke('incidents:create', data),
  updateIncident: (id, data) => ipcRenderer.invoke('incidents:update', id, data),
  deleteIncident: (id) => ipcRenderer.invoke('incidents:delete', id),

  // Spare Parts
  getSpareParts: () => ipcRenderer.invoke('spare_parts:getAll'),
  getSparePart: (id) => ipcRenderer.invoke('spare_parts:get', id),
  createSparePart: (data) => ipcRenderer.invoke('spare_parts:create', data),
  updateSparePart: (id, data) => ipcRenderer.invoke('spare_parts:update', id, data),
  deleteSparePart: (id) => ipcRenderer.invoke('spare_parts:delete', id),
  getLowStockParts: () => ipcRenderer.invoke('spare_parts:getLowStock'),
  adjustPartQuantity: (id, delta) => ipcRenderer.invoke('spare_parts:adjustQuantity', id, delta),

  // Vehicle Documents
  getDocumentsByVehicle: (vehicleId) => ipcRenderer.invoke('documents:getByVehicle', vehicleId),
  getDocument: (id) => ipcRenderer.invoke('documents:get', id),
  createDocument: (data) => ipcRenderer.invoke('documents:create', data),
  deleteDocument: (id) => ipcRenderer.invoke('documents:delete', id),

  // Settings
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  setMultipleSettings: (settings) => ipcRenderer.invoke('settings:setMultiple', settings),

  // Users
  authenticateUser: (username, password) => ipcRenderer.invoke('users:authenticate', username, password),
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (data) => ipcRenderer.invoke('users:create', data),
  updateUser: (id, data) => ipcRenderer.invoke('users:update', id, data),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),

  // Dashboard extras
  getAlertsSummary: () => ipcRenderer.invoke('dashboard:alertsSummary'),
  getUtilizationRate: () => ipcRenderer.invoke('dashboard:utilizationRate'),
  getGeofenceViolationCount: () => ipcRenderer.invoke('dashboard:geofenceViolationCount'),

  // Comprehensive Report
  getComprehensiveReport: (year, month) => ipcRenderer.invoke('dashboard:getComprehensiveReport', year, month),
});
