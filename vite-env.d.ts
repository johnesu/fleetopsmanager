/// <reference types="vite/client" />

import type {
  Vehicle, Driver, Trip, FuelEntry, MaintenanceRecord, Dispatch,
  Incident, SparePart, Alert, AuditLog, Assignment, Setting, User,
  DashboardStats, MonthlyFuelReport, VehicleUsageReport,
} from './src/types';

interface ElectronAPI {
  // Vehicle
  getVehicles(): Promise<Vehicle[]>;
  createVehicle(data: Partial<Vehicle>): Promise<Vehicle>;
  updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;

  // Driver
  getDrivers(): Promise<Driver[]>;
  createDriver(data: Partial<Driver>): Promise<Driver>;
  updateDriver(id: number, data: Partial<Driver>): Promise<Driver>;
  deleteDriver(id: number): Promise<void>;
  getActiveAssignments(): Promise<Assignment[]>;
  assignVehicle(driverId: number, vehicleId: number): Promise<void>;
  assignDriver(driverId: number, vehicleId: number): Promise<void>;
  unassignVehicle(assignmentId: number): Promise<void>;
  unassignDriver(assignmentId: number): Promise<void>;

  // Trip
  getTrips(filters?: Partial<Trip>): Promise<Trip[]>;
  createTrip(data: Partial<Trip>): Promise<Trip>;
  updateTrip(id: number, data: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Fuel
  getFuelEntries(filters?: Partial<FuelEntry>): Promise<FuelEntry[]>;
  createFuelEntry(data: Partial<FuelEntry>): Promise<FuelEntry>;
  updateFuelEntry(id: number, data: Partial<FuelEntry>): Promise<FuelEntry>;
  deleteFuelEntry(id: number): Promise<void>;
  getMonthlyFuelReport(year: number, month: number): Promise<MonthlyFuelReport[]>;

  // Maintenance
  getMaintenanceRecords(filters?: Partial<MaintenanceRecord>): Promise<MaintenanceRecord[]>;
  createMaintenanceRecord(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: number, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord>;
  deleteMaintenanceRecord(id: number): Promise<void>;
  getUpcomingMaintenance(): Promise<MaintenanceRecord[]>;

  // Dispatch
  getDispatches(filters?: Partial<Dispatch>): Promise<Dispatch[]>;
  createDispatch(data: Partial<Dispatch>): Promise<Dispatch>;
  updateDispatch(id: number, data: Partial<Dispatch>): Promise<Dispatch>;
  deleteDispatch(id: number): Promise<void>;

  // Incidents
  getIncidents(filters?: Partial<Incident>): Promise<Incident[]>;
  createIncident(data: Partial<Incident>): Promise<Incident>;
  updateIncident(id: number, data: Partial<Incident>): Promise<Incident>;
  deleteIncident(id: number): Promise<void>;

  // Spare Parts
  getSpareParts(): Promise<SparePart[]>;
  createSparePart(data: Partial<SparePart>): Promise<SparePart>;
  updateSparePart(id: number, data: Partial<SparePart>): Promise<SparePart>;
  deleteSparePart(id: number): Promise<void>;
  adjustStock(id: number, delta: number): Promise<void>;
  adjustPartQuantity(id: number, delta: number): Promise<void>;

  // Alerts
  getAlerts(filters?: Partial<Alert>): Promise<Alert[]>;
  markAlertRead(id: number): Promise<void>;
  markAllAlertsRead(): Promise<void>;
  resolveAlert(id: number): Promise<void>;
  markAlertResolved(id: number): Promise<void>;
  getUnreadAlertCount(): Promise<number>;
  generateAlerts(): Promise<void>;

  // Audit Log
  getAuditLogs(filters?: Partial<AuditLog> & { limit?: number }): Promise<AuditLog[]>;

  // Reports
  getComprehensiveReport(params?: Record<string, unknown> | [Record<string, unknown>, Record<string, unknown>]): Promise<Record<string, unknown>>;
  getDriverPerformance(id: number, year: number, month: number): Promise<Record<string, unknown>>;
  getFuelReport(year: number, month: number): Promise<MonthlyFuelReport[]>;
  getDashboardStats(): Promise<DashboardStats>;
  getVehicleUsageReport(year: number, month: number): Promise<VehicleUsageReport[]>;
  getUtilizationRate(): Promise<number>;

  // Settings
  getSettings(): Promise<Setting>;
  updateSettings(settings: Partial<Setting>): Promise<void>;
  getAllSettings(): Promise<Record<string, unknown>>;
  setMultipleSettings(settings: Record<string, unknown>): Promise<void>;
  getUsers(): Promise<User[]>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  generateUniqueId(role: string): Promise<string>;
  getUserByUniqueId(uniqueId: string): Promise<{ id: number; full_name: string; role: string; unique_id: string } | null>;
  resetAllData(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
