-- Seed data for FleetOps Manager
-- Run this in the Supabase SQL Editor after running migration.sql

-- Vehicles
INSERT INTO vehicles (id, plate_number, make, model, year, color, status, insurance_expiry, license_expiry, odometer_km, fuel_type, notes) VALUES
  (1, 'KAB 123A', 'Toyota', 'Hilux', 2022, 'White', 'active', '2026-12-15', '2026-08-20', 45230, 'diesel', 'Main field vehicle'),
  (2, 'KAB 456B', 'Isuzu', 'D-Max', 2023, 'Blue', 'active', '2027-03-10', '2026-11-05', 28300, 'diesel', 'Delivery vehicle'),
  (3, 'KAB 789C', 'Mitsubishi', 'L300', 2021, 'Silver', 'maintenance', '2026-06-01', '2026-07-15', 67100, 'petrol', 'Needs engine check'),
  (4, 'KCB 321D', 'Toyota', 'Land Cruiser', 2023, 'Black', 'active', '2027-01-20', '2026-09-30', 15600, 'diesel', 'Executive use'),
  (5, 'KCA 654E', 'Nissan', 'Navara', 2022, 'Red', 'active', '2026-10-25', '2026-12-01', 34100, 'diesel', 'Sales team'),
  (6, 'KBZ 987F', 'Ford', 'Ranger', 2024, 'Gray', 'active', '2027-05-15', '2027-02-10', 8900, 'diesel', 'New fleet addition'),
  (7, 'KAA 111G', 'Toyota', 'Hiace', 2020, 'White', 'inactive', '2026-04-20', '2026-04-20', 89200, 'petrol', 'Needs inspection'),
  (8, 'KBB 222H', 'Mercedes', 'Sprinter', 2023, 'White', 'active', '2027-06-01', '2026-10-15', 21400, 'diesel', 'Long distance hauler')
ON CONFLICT (id) DO UPDATE SET
  plate_number = EXCLUDED.plate_number, make = EXCLUDED.make, model = EXCLUDED.model,
  year = EXCLUDED.year, color = EXCLUDED.color, status = EXCLUDED.status,
  insurance_expiry = EXCLUDED.insurance_expiry, license_expiry = EXCLUDED.license_expiry,
  odometer_km = EXCLUDED.odometer_km, fuel_type = EXCLUDED.fuel_type, notes = EXCLUDED.notes;

SELECT setval('vehicles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM vehicles));

-- Drivers
INSERT INTO drivers (id, name, phone, email, license_number, license_expiry, license_class, status, notes) VALUES
  (1, 'John Kamau', '+254 712 345 678', 'john.kamau@email.com', 'DL00123', '2026-09-15', 'B, C1', 'active', 'Senior driver, 10 years exp'),
  (2, 'Mary Wanjiku', '+254 723 456 789', 'mary.wanjiku@email.com', 'DL00456', '2026-11-20', 'B, C, D', 'active', 'Heavy truck certified'),
  (3, 'Peter Ochieng', '+254 734 567 890', 'peter.ochieng@email.com', 'DL00789', '2027-01-10', 'B, C1', 'active', 'Reliable, on-time delivery'),
  (4, 'Grace Akinyi', '+254 745 678 901', 'grace.akinyi@email.com', 'DL00111', '2026-07-05', 'B', 'active', 'City routes specialist'),
  (5, 'Samuel Kiprop', '+254 756 789 012', 'samuel.kiprop@email.com', 'DL00222', '2026-05-30', 'B, C, D', 'suspended', 'License review pending'),
  (6, 'Jane Muthoni', '+254 767 890 123', 'jane.muthoni@email.com', 'DL00333', '2027-03-22', 'B, C1', 'active', 'New hire, good record')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
  license_number = EXCLUDED.license_number, license_expiry = EXCLUDED.license_expiry,
  license_class = EXCLUDED.license_class, status = EXCLUDED.status, notes = EXCLUDED.notes;

SELECT setval('drivers_id_seq', (SELECT COALESCE(MAX(id), 0) FROM drivers));

-- Assignments
INSERT INTO vehicle_driver_assignments (id, vehicle_id, driver_id, start_date, end_date, is_active) VALUES
  (1, 1, 1, '2025-01-15', NULL, true),
  (2, 2, 2, '2025-02-01', NULL, true),
  (3, 4, 3, '2025-03-10', NULL, true),
  (4, 5, 4, '2025-04-01', NULL, true),
  (5, 8, 6, '2025-06-01', NULL, true),
  (6, 3, 5, '2025-01-20', '2025-03-15', false)
ON CONFLICT (id) DO UPDATE SET
  vehicle_id = EXCLUDED.vehicle_id, driver_id = EXCLUDED.driver_id,
  start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
  is_active = EXCLUDED.is_active;

SELECT setval('vehicle_driver_assignments_id_seq', (SELECT COALESCE(MAX(id), 0) FROM vehicle_driver_assignments));

-- Trips
INSERT INTO trips (id, vehicle_id, driver_id, start_location, end_location, start_time, end_time, distance_km, status, purpose, notes) VALUES
  (1, 1, 1, 'Nairobi Depot', 'Mombasa Port', '2026-01-05 06:00:00+03', '2026-01-05 14:30:00+03', 480, 'completed', 'Goods delivery', 'Arrived on time'),
  (2, 2, 2, 'Nairobi CBD', 'Nakuru Town', '2026-01-06 08:00:00+03', '2026-01-06 11:15:00+03', 160, 'completed', 'Supply run', 'Light traffic'),
  (3, 4, 3, 'Nairobi Office', 'Kisumu City', '2026-01-08 05:30:00+03', '2026-01-08 15:00:00+03', 350, 'completed', 'Client meeting', 'Overnight stay'),
  (4, 1, 1, 'Mombasa Port', 'Nairobi Depot', '2026-01-10 07:00:00+03', '2026-01-10 15:45:00+03', 480, 'completed', 'Return trip', 'Smooth ride'),
  (5, 5, 4, 'Nairobi Depot', 'Thika Town', '2026-01-12 09:00:00+03', '2026-01-12 10:30:00+03', 45, 'completed', 'Local delivery', 'Multiple stops'),
  (6, 2, 2, 'Nakuru Town', 'Eldoret City', '2026-01-15 07:00:00+03', NULL, 190, 'ongoing', 'Supply chain', 'In transit'),
  (7, 8, 6, 'Nairobi Depot', 'Mombasa Port', '2026-01-18 06:00:00+03', NULL, 480, 'ongoing', 'Bulk delivery', 'Heavy load'),
  (8, 1, 1, 'Nairobi Depot', 'Machakos Town', '2026-02-01 10:00:00+03', NULL, 65, 'pending', 'Local pickup', 'Scheduled today')
ON CONFLICT (id) DO UPDATE SET
  vehicle_id = EXCLUDED.vehicle_id, driver_id = EXCLUDED.driver_id,
  start_location = EXCLUDED.start_location, end_location = EXCLUDED.end_location,
  start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
  distance_km = EXCLUDED.distance_km, status = EXCLUDED.status,
  purpose = EXCLUDED.purpose, notes = EXCLUDED.notes;

SELECT setval('trips_id_seq', (SELECT COALESCE(MAX(id), 0) FROM trips));

-- Fuel entries
INSERT INTO fuel_entries (id, vehicle_id, trip_id, date, liters, cost_per_liter, total_cost, mileage_km, station, notes) VALUES
  (1, 1, 1, '2026-01-05', 60, 195, 11700, 45230, 'TotalEnergies Mombasa Rd', 'Full tank'),
  (2, 2, 2, '2026-01-06', 40, 195, 7800, 28300, 'Shell Nakuru', 'Half tank'),
  (3, 4, 3, '2026-01-08', 80, 195, 15600, 15600, 'TotalEnergies Kisumu', 'Full tank for long trip'),
  (4, 1, 4, '2026-01-10', 55, 198, 10890, 45710, 'Vivo Energy Mombasa', 'Return refill'),
  (5, 5, 5, '2026-01-12', 25, 195, 4875, 34100, 'Shell Thika', 'Short trip top up'),
  (6, 2, 6, '2026-01-15', 45, 197, 8865, 28460, 'TotalEnergies Nakuru', 'Trip refill'),
  (7, 8, 7, '2026-01-18', 90, 195, 17550, 21400, 'Shell Nairobi', 'Full tank long haul'),
  (8, 1, NULL, '2026-02-01', 30, 200, 6000, 45890, 'TotalEnergies', 'Weekly top up')
ON CONFLICT (id) DO UPDATE SET
  vehicle_id = EXCLUDED.vehicle_id, trip_id = EXCLUDED.trip_id, date = EXCLUDED.date,
  liters = EXCLUDED.liters, cost_per_liter = EXCLUDED.cost_per_liter,
  total_cost = EXCLUDED.total_cost, mileage_km = EXCLUDED.mileage_km,
  station = EXCLUDED.station, notes = EXCLUDED.notes;

SELECT setval('fuel_entries_id_seq', (SELECT COALESCE(MAX(id), 0) FROM fuel_entries));

-- Maintenance records
INSERT INTO maintenance_records (id, vehicle_id, service_type, description, date, cost, mileage_km, next_service_date, next_service_mileage, status, notes) VALUES
  (1, 1, 'Oil Change', 'Regular oil change and filter replacement', '2026-01-02', 4500, 45000, '2026-04-02', 47000, 'completed', 'Synthetic oil used'),
  (2, 3, 'Engine Repair', 'Engine misfire diagnosis and repair', '2026-01-05', 25000, 67000, '2026-04-05', 70000, 'completed', 'Replaced spark plugs'),
  (3, 5, 'Tire Replacement', 'Replaced 2 front tires', '2026-01-10', 12000, 34000, '2026-04-10', 36000, 'completed', 'Bridgestone tires'),
  (4, 2, 'Brake Service', 'Front brake pad replacement', '2026-01-12', 6500, 28200, '2026-04-12', 30000, 'completed', 'OEM parts'),
  (5, 4, 'AC Service', 'AC recharge and leak check', '2026-01-15', 3500, 15500, '2026-04-15', 17000, 'completed', 'All good'),
  (6, 6, 'Initial Service', 'First 10000km service', '2026-01-20', 8000, 8900, '2026-04-20', 10000, 'completed', 'Under warranty'),
  (7, 3, 'Transmission Check', 'Transmission fluid change', '2026-02-01', 9500, 67100, '2026-05-01', 69000, 'pending', 'Scheduled'),
  (8, 8, 'Pre-delivery Check', 'Inspection before trip', '2026-01-17', 2000, 21400, '2026-04-17', 26000, 'completed', 'All OK')
ON CONFLICT (id) DO UPDATE SET
  vehicle_id = EXCLUDED.vehicle_id, service_type = EXCLUDED.service_type,
  description = EXCLUDED.description, date = EXCLUDED.date, cost = EXCLUDED.cost,
  mileage_km = EXCLUDED.mileage_km, next_service_date = EXCLUDED.next_service_date,
  next_service_mileage = EXCLUDED.next_service_mileage, status = EXCLUDED.status, notes = EXCLUDED.notes;

SELECT setval('maintenance_records_id_seq', (SELECT COALESCE(MAX(id), 0) FROM maintenance_records));

-- Users (for auth reference)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, unique_id) VALUES
  (1, 'admin', 'admin@fleetops.com', '$2b$10$placeholder_hash', 'System Admin', 'admin', true, 'ADM-0001'),
  (2, 'manager', 'manager@fleetops.com', '$2b$10$placeholder_hash', 'James Okafor', 'manager', true, 'MGR-0001'),
  (3, 'dispatcher', 'dispatcher@fleetops.com', '$2b$10$placeholder_hash', 'Chioma Obi', 'dispatcher', true, 'DSP-0001'),
  (4, 'mechanic', 'mechanic@fleetops.com', '$2b$10$placeholder_hash', 'Emeka Nwachukwu', 'maintenance', true, 'MNT-0001'),
  (5, 'driver', 'driver@fleetops.com', '$2b$10$placeholder_hash', 'John Kamau', 'driver', true, 'DRV-0001')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username, email = EXCLUDED.email,
  full_name = EXCLUDED.full_name, role = EXCLUDED.role,
  is_active = EXCLUDED.is_active, unique_id = EXCLUDED.unique_id;

SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users));

-- Settings
INSERT INTO settings (key, value) VALUES
  ('app_name', 'FleetOps Manager'),
  ('company_name', 'Fleet Solutions Ltd'),
  ('fuel_budget', '500000'),
  ('maintenance_budget', '300000'),
  ('currency', 'KES'),
  ('fuel_unit', 'Liters'),
  ('distance_unit', 'km'),
  ('alert_email', 'alerts@fleetops.com'),
  ('geofence_radius', '500'),
  ('session_timeout', '3600')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Dispatches
INSERT INTO dispatches (id, trip_id, dispatched_by, status, priority, cargo_type, dispatched_at, notes) VALUES
  (1, 1, 'James Okafor', 'approved', 'normal', 'Electronics equipment', '2026-01-05 05:30:00+03', 'Handle with care'),
  (2, 2, 'Chioma Obi', 'in_progress', 'high', 'Medical supplies', '2026-01-06 07:45:00+03', 'Urgent delivery'),
  (3, 3, 'James Okafor', 'completed', 'normal', NULL, '2026-01-08 05:00:00+03', 'Executive trip'),
  (4, 6, 'Amara Nwachukwu', 'in_progress', 'urgent', NULL, '2026-01-15 06:30:00+03', 'Priority dispatch'),
  (5, 7, 'Chioma Obi', 'pending', 'normal', NULL, '2026-01-18 05:00:00+03', 'Awaiting clearance')
ON CONFLICT (id) DO UPDATE SET
  trip_id = EXCLUDED.trip_id, dispatched_by = EXCLUDED.dispatched_by,
  status = EXCLUDED.status, priority = EXCLUDED.priority,
  cargo_type = EXCLUDED.cargo_type, dispatched_at = EXCLUDED.dispatched_at, notes = EXCLUDED.notes;

SELECT setval('dispatches_id_seq', (SELECT COALESCE(MAX(id), 0) FROM dispatches));

-- Alerts
INSERT INTO alerts (id, type, severity, title, message, vehicle_id, is_read, is_resolved, created_at) VALUES
  (1, 'maintenance', 'warning', 'Maintenance Due', 'Vehicle KAB 789C is due for transmission check', 3, false, false, NOW() - INTERVAL '2 days'),
  (2, 'license', 'critical', 'License Expiring', 'Driver Samuel Kiprop license expiring soon', NULL, false, false, NOW() - INTERVAL '1 day'),
  (3, 'insurance', 'warning', 'Insurance Expiry', 'Vehicle KAA 111G insurance has expired', 7, true, false, NOW() - INTERVAL '5 days'),
  (4, 'fuel', 'info', 'Fuel Budget Alert', 'Fuel budget usage at 75% for this month', NULL, false, false, NOW()),
  (5, 'geofence', 'critical', 'Geofence Violation', 'Vehicle KAB 123A entered restricted zone', 1, false, false, NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type, severity = EXCLUDED.severity, title = EXCLUDED.title,
  message = EXCLUDED.message, vehicle_id = EXCLUDED.vehicle_id,
  is_read = EXCLUDED.is_read, is_resolved = EXCLUDED.is_resolved;

SELECT setval('alerts_id_seq', (SELECT COALESCE(MAX(id), 0) FROM alerts));

-- Incidents
INSERT INTO incidents (id, vehicle_id, driver_id, trip_id, type, severity, description, location, date, is_resolved, resolved_notes) VALUES
  (1, 1, 1, 1, 'accident', 'minor', 'Minor side mirror collision at roundabout', 'Mombasa Road', '2026-01-05', true, 'Mirror replaced, no injuries'),
  (2, 3, 5, NULL, 'breakdown', 'major', 'Engine failure on highway', 'Thika Road', '2026-01-08', true, 'Engine repaired, 2 days downtime'),
  (3, 5, 4, 5, 'traffic_violation', 'minor', 'Speeding ticket - 15km over limit', 'Thika Town', '2026-01-12', false, 'Fine paid, driver warned')
ON CONFLICT (id) DO UPDATE SET
  vehicle_id = EXCLUDED.vehicle_id, driver_id = EXCLUDED.driver_id,
  trip_id = EXCLUDED.trip_id, type = EXCLUDED.type, severity = EXCLUDED.severity,
  description = EXCLUDED.description, location = EXCLUDED.location,
  date = EXCLUDED.date, is_resolved = EXCLUDED.is_resolved, resolved_notes = EXCLUDED.resolved_notes;

SELECT setval('incidents_id_seq', (SELECT COALESCE(MAX(id), 0) FROM incidents));

-- Spare parts
INSERT INTO spare_parts (id, name, part_number, quantity, min_quantity, unit_cost, location, supplier) VALUES
  (1, 'Oil Filter', 'OF-001', 15, 5, 450, 'Store A', 'AutoParts Ltd'),
  (2, 'Air Filter', 'AF-002', 10, 5, 800, 'Store A', 'AutoParts Ltd'),
  (3, 'Brake Pads (Front)', 'BP-003', 8, 3, 2500, 'Store B', 'BrakeTech Inc'),
  (4, 'Brake Pads (Rear)', 'BP-004', 6, 3, 2200, 'Store B', 'BrakeTech Inc'),
  (5, 'Spark Plug', 'SP-005', 24, 12, 350, 'Store A', 'IgnitionPro'),
  (6, 'Engine Oil 5W-30 (1L)', 'EO-006', 20, 10, 600, 'Store C', 'Lubricants Co'),
  (7, 'Transmission Fluid (1L)', 'TF-007', 8, 4, 900, 'Store C', 'Lubricants Co'),
  (8, 'Windshield Wiper', 'WW-008', 12, 6, 500, 'Store A', 'ClearView Parts'),
  (9, 'Headlight Bulb', 'HB-009', 10, 5, 1200, 'Store B', 'LightingPro'),
  (10, 'Battery 12V', 'BT-010', 4, 2, 8500, 'Store C', 'PowerSource Ltd')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, part_number = EXCLUDED.part_number,
  quantity = EXCLUDED.quantity, min_quantity = EXCLUDED.min_quantity,
  unit_cost = EXCLUDED.unit_cost, location = EXCLUDED.location, supplier = EXCLUDED.supplier;

SELECT setval('spare_parts_id_seq', (SELECT COALESCE(MAX(id), 0) FROM spare_parts));

-- Vehicle documents
INSERT INTO vehicle_documents (id, vehicle_id, name, type, file_url, expiry_date, notes) VALUES
  (1, 1, 'Insurance Certificate 2026', 'insurance', '/docs/ins-001.pdf', '2026-12-15', 'Comprehensive cover'),
  (2, 1, 'Logbook', 'registration', '/docs/log-001.pdf', NULL, 'Original document'),
  (3, 2, 'Insurance Certificate 2026', 'insurance', '/docs/ins-002.pdf', '2027-03-10', 'Third party cover'),
  (4, 8, 'Insurance Certificate 2026', 'insurance', '/docs/ins-008.pdf', '2027-06-01', 'Comprehensive cover')
ON CONFLICT (id) DO UPDATE SET
  vehicle_id = EXCLUDED.vehicle_id, name = EXCLUDED.name, type = EXCLUDED.type,
  file_url = EXCLUDED.file_url, expiry_date = EXCLUDED.expiry_date, notes = EXCLUDED.notes;

SELECT setval('vehicle_documents_id_seq', (SELECT COALESCE(MAX(id), 0) FROM vehicle_documents));

-- Geofences
INSERT INTO geofences (id, name, latitude, longitude, radius_meters, type, active) VALUES
  (1, 'Nairobi Depot Zone', -1.2921, 36.8219, 200, 'restricted', true),
  (2, 'Mombasa Port Area', -4.0435, 39.6682, 300, 'restricted', true),
  (3, 'Downtown Restricted', -1.2864, 36.8172, 150, 'restricted', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  radius_meters = EXCLUDED.radius_meters, type = EXCLUDED.type, active = EXCLUDED.active;

SELECT setval('geofences_id_seq', (SELECT COALESCE(MAX(id), 0) FROM geofences));

-- GPS tracking (simplified sample points for vehicles)
INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, timestamp) VALUES
  (1, -1.2921, 36.8219, 0, 0, NOW() - INTERVAL '1 hour'),
  (1, -1.3200, 36.8500, 45, 120, NOW() - INTERVAL '30 minutes'),
  (1, -1.3500, 36.8800, 60, 115, NOW() - INTERVAL '15 minutes'),
  (1, -1.3800, 36.9100, 55, 110, NOW()),
  (2, -1.2864, 36.8172, 0, 0, NOW() - INTERVAL '1 hour'),
  (2, -1.3000, 36.8000, 35, 200, NOW() - INTERVAL '20 minutes'),
  (2, -1.3200, 36.7800, 40, 210, NOW()),
  (4, -1.2921, 36.8219, 0, 0, NOW() - INTERVAL '2 hours'),
  (4, -1.3400, 36.7500, 70, 260, NOW() - INTERVAL '1 hour'),
  (4, -1.4000, 36.6800, 65, 250, NOW()),
  (5, -1.2864, 36.8172, 0, 0, NOW() - INTERVAL '3 hours'),
  (5, -1.2700, 36.8500, 30, 45, NOW());
