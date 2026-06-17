// ─── Data Entities ───

export interface Vehicle {
  id: number;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  type?: string;
  vin?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  odometer_km: number;
  insurance_expiry?: string;
  license_expiry?: string;
  notes?: string;
  driver_name?: string;
}

export interface Driver {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  license_number: string;
  license_expiry?: string;
  license_class?: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

export interface Trip {
  id: number;
  vehicle_id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  start_time: string;
  end_time?: string;
  distance_km: number;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  purpose?: string;
  notes?: string;
  plate_number?: string;
  driver_name?: string;
}

export interface FuelEntry {
  id: number;
  vehicle_id: number;
  trip_id?: number;
  date: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  mileage_km?: number;
  station?: string;
  notes?: string;
  plate_number?: string;
  make?: string;
  model?: string;
  entries?: FuelEntry[];
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  service_type: string;
  description?: string;
  date: string;
  cost?: number;
  mileage_km?: number;
  next_service_date?: string;
  next_service_mileage?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  plate_number?: string;
}

export interface Dispatch {
  id: number;
  trip_id?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  pickup_location: string;
  dropoff_location: string;
  start_location?: string;
  end_location?: string;
  cargo_description?: string;
  cargo_weight_kg?: number;
  recipient_name?: string;
  recipient_phone?: string;
  instructions?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Incident {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  location?: string;
  description: string;
  actions_taken?: string;
  reported_by?: string;
  cost?: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution_notes?: string;
  vehicle_id?: number;
  driver_id?: number;
  trip_id?: number;
}

export interface SparePart {
  id: number;
  name: string;
  part_number?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  supplier?: string;
  location?: string;
  notes?: string;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  vehicle_id?: number;
  driver_id?: number;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  details?: string;
}

export interface AuditLog {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: number;
  entity_name?: string;
  description?: string;
  user_id?: number;
  user_name?: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  driver_id: number;
  vehicle_id: number;
  start_date: string;
  end_date?: string;
  driver_name: string;
  plate_number: string;
  make?: string;
  model?: string;
}

export interface Setting {
  company_name?: string;
  default_language?: string;
  fuel_unit?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  fuel_cost_per_liter?: number;
  maintenance_alert_days?: number;
  license_alert_days?: number;
}

export interface User {
  id: number;
  full_name: string;
  username: string;
  password?: string;
  role: 'admin' | 'fleet_manager' | 'dispatcher' | 'driver' | 'maintenance';
  is_active: boolean;
  unique_id?: string | null;
}

// ─── Dashboard ───

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  ongoingTrips: number;
  totalTrips: number;
  pendingMaintenance: number;
  vehiclesInMaintenance: number;
  monthlyFuelCost: number;
  expiringInsurance: number;
  expiringLicense: number;
  expiringDriverLicense: number;
}

export interface MonthlyFuelReport {
  plate_number: string;
  total_cost: number;
  total_liters: number;
  make?: string;
  model?: string;
  entries?: number;
}

export interface VehicleUsageReport {
  plate_number: string;
  total_distance: number;
  trip_count: number;
}

// ─── Validation ───

export interface ValidationRule {
  required?: boolean;
  label?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  email?: boolean;
  positive?: boolean;
}

export interface ValidationErrors {
  [field: string]: string;
}

export type UserRole = 'admin' | 'maintenance' | 'driver';

export interface AuthState {
  role: UserRole | null;
  user: { id: number; name: string } | null;
}
