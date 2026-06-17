-- Run this in Supabase SQL Editor to create the schema

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGSERIAL PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  vin_number TEXT DEFAULT '',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','maintenance','retired')),
  insurance_expiry DATE,
  license_expiry DATE,
  registration_expiry DATE,
  odometer_km REAL DEFAULT 0,
  fuel_type TEXT DEFAULT 'petrol' CHECK(fuel_type IN ('petrol','diesel','electric','hybrid')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  license_number TEXT NOT NULL,
  license_expiry DATE,
  license_class TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
  availability TEXT NOT NULL DEFAULT 'available' CHECK(availability IN ('available','on_trip','off_duty')),
  emergency_contact TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_driver_assignments (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  start_location TEXT DEFAULT '',
  end_location TEXT DEFAULT '',
  start_lat REAL,
  start_lng REAL,
  end_lat REAL,
  end_lng REAL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  distance_km REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','ongoing','completed','cancelled')),
  purpose TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatches (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  dispatched_by TEXT DEFAULT '',
  dispatch_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','in_progress','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  pickup_location TEXT DEFAULT '',
  dropoff_location TEXT DEFAULT '',
  pickup_lat REAL,
  pickup_lng REAL,
  dropoff_lat REAL,
  dropoff_lng REAL,
  cargo_description TEXT DEFAULT '',
  cargo_weight_kg REAL DEFAULT 0,
  recipient_name TEXT DEFAULT '',
  recipient_phone TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fuel_entries (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters REAL NOT NULL,
  cost_per_liter REAL NOT NULL,
  total_cost REAL NOT NULL,
  mileage_km REAL DEFAULT 0,
  station TEXT DEFAULT '',
  receipt_image TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost REAL DEFAULT 0,
  mileage_km REAL DEFAULT 0,
  next_service_date DATE,
  next_service_mileage REAL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('scheduled','in_progress','completed','cancelled')),
  vendor TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spare_parts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  part_number TEXT DEFAULT '',
  vehicle_make TEXT DEFAULT '',
  vehicle_model TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  unit_cost REAL DEFAULT 0,
  supplier TEXT DEFAULT '',
  location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gps_tracking (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  speed REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  altitude REAL DEFAULT 0,
  accuracy REAL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geofences (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters REAL NOT NULL DEFAULT 500,
  type TEXT NOT NULL DEFAULT 'restricted' CHECK(type IN ('allowed','restricted','warning')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('maintenance','license_expiry','insurance_expiry','geofence_violation','speed_violation','idle_alert','fuel_theft','vehicle_downtime','incident','general')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  entity_type TEXT,
  entity_id INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('accident','near_miss','traffic_violation','mechanical_breakdown','cargo_issue','customer_complaint','other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT DEFAULT '',
  latitude REAL,
  longitude REAL,
  description TEXT NOT NULL,
  actions_taken TEXT DEFAULT '',
  reported_by TEXT DEFAULT '',
  cost REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','investigating','resolved','closed')),
  resolution_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK(type IN ('insurance','license','registration','inspection','service','other')),
  file_name TEXT DEFAULT '',
  file_data TEXT DEFAULT '',
  expiry_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'fleet_manager' CHECK(role IN ('admin','fleet_manager','dispatcher','driver')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE','DELETE')),
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_availability ON drivers(availability);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_trip ON dispatches(trip_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON dispatches(status);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_date ON fuel_entries(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ON vehicle_driver_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver ON vehicle_driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON vehicle_driver_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_gps_trip ON gps_tracking(trip_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_vehicle ON incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incidents_driver ON incidents(driver_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_name ON spare_parts(name);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- Enable Row Level Security (optional per-table)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "authenticated_all" ON vehicles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON drivers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON trips FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON dispatches FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON fuel_entries FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON maintenance_records FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON spare_parts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON gps_tracking FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON geofences FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON alerts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON incidents FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON vehicle_documents FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON vehicle_driver_assignments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON audit_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
