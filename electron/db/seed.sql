-- Seed data for FleetOps Manager

-- ============================================================
-- VEHICLES
-- ============================================================
INSERT OR IGNORE INTO vehicles (plate_number, make, model, year, color, status, insurance_expiry, license_expiry, odometer_km, fuel_type, notes) VALUES
('KAB 123A', 'Toyota', 'Hilux', 2022, 'White', 'active', '2026-12-15', '2026-08-20', 45230, 'diesel', 'Main field vehicle'),
('KAB 456B', 'Isuzu', 'D-Max', 2023, 'Blue', 'active', '2027-03-10', '2026-11-05', 28300, 'diesel', 'Delivery vehicle'),
('KAB 789C', 'Mitsubishi', 'L300', 2021, 'Silver', 'maintenance', '2026-06-01', '2026-07-15', 67100, 'petrol', 'Needs engine check'),
('KCB 321D', 'Toyota', 'Land Cruiser', 2023, 'Black', 'active', '2027-01-20', '2026-09-30', 15600, 'diesel', 'Executive use'),
('KCA 654E', 'Nissan', 'Navara', 2022, 'Red', 'active', '2026-10-25', '2026-12-01', 34100, 'diesel', 'Sales team'),
('KBZ 987F', 'Ford', 'Ranger', 2024, 'Gray', 'active', '2027-05-15', '2027-02-10', 8900, 'diesel', 'New fleet addition'),
('KAA 111G', 'Toyota', 'Hiace', 2020, 'White', 'inactive', '2026-04-20', '2026-04-20', 89200, 'petrol', 'Needs inspection'),
('KBB 222H', 'Mercedes', 'Sprinter', 2023, 'White', 'active', '2027-06-01', '2026-10-15', 21400, 'diesel', 'Long distance hauler');

-- ============================================================
-- DRIVERS
-- ============================================================
INSERT OR IGNORE INTO drivers (name, phone, email, license_number, license_expiry, license_class, status, notes) VALUES
('John Kamau', '+254 712 345 678', 'john.kamau@email.com', 'DL00123', '2026-09-15', 'B, C1', 'active', 'Senior driver, 10 years exp'),
('Mary Wanjiku', '+254 723 456 789', 'mary.wanjiku@email.com', 'DL00456', '2026-11-20', 'B, C, D', 'active', 'Heavy truck certified'),
('Peter Ochieng', '+254 734 567 890', 'peter.ochieng@email.com', 'DL00789', '2027-01-10', 'B, C1', 'active', 'Reliable, on-time delivery'),
('Grace Akinyi', '+254 745 678 901', 'grace.akinyi@email.com', 'DL00111', '2026-07-05', 'B', 'active', 'City routes specialist'),
('Samuel Kiprop', '+254 756 789 012', 'samuel.kiprop@email.com', 'DL00222', '2026-05-30', 'B, C, D', 'suspended', 'License review pending'),
('Jane Muthoni', '+254 767 890 123', 'jane.muthoni@email.com', 'DL00333', '2027-03-22', 'B, C1', 'active', 'New hire, good record');

-- ============================================================
-- VEHICLE-DRIVER ASSIGNMENTS
-- ============================================================
INSERT OR IGNORE INTO vehicle_driver_assignments (vehicle_id, driver_id, start_date, is_active) VALUES
(1, 1, '2025-01-15', 1),
(2, 2, '2025-02-01', 1),
(4, 3, '2025-03-10', 1),
(5, 4, '2025-04-01', 1),
(8, 6, '2025-06-01', 1),
(3, 5, '2025-01-20', 0);

-- ============================================================
-- TRIPS
-- ============================================================
INSERT OR IGNORE INTO trips (vehicle_id, driver_id, start_location, end_location, start_time, end_time, distance_km, status, purpose, notes) VALUES
(1, 1, 'Nairobi Depot', 'Mombasa Port', '2026-01-05 06:00:00', '2026-01-05 14:30:00', 480, 'completed', 'Goods delivery', 'Arrived on time'),
(2, 2, 'Nairobi CBD', 'Nakuru Town', '2026-01-06 08:00:00', '2026-01-06 11:15:00', 160, 'completed', 'Supply run', 'Light traffic'),
(4, 3, 'Nairobi Office', 'Kisumu City', '2026-01-08 05:30:00', '2026-01-08 15:00:00', 350, 'completed', 'Client meeting', 'Overnight stay'),
(1, 1, 'Mombasa Port', 'Nairobi Depot', '2026-01-10 07:00:00', '2026-01-10 15:45:00', 480, 'completed', 'Return trip', 'Smooth ride'),
(5, 4, 'Nairobi Depot', 'Thika Town', '2026-01-12 09:00:00', '2026-01-12 10:30:00', 45, 'completed', 'Local delivery', 'Multiple stops'),
(2, 2, 'Nakuru Town', 'Eldoret City', '2026-01-15 07:00:00', NULL, 190, 'ongoing', 'Supply chain', 'In transit'),
(8, 6, 'Nairobi Depot', 'Mombasa Port', '2026-01-18 06:00:00', NULL, 480, 'ongoing', 'Bulk delivery', 'Heavy load'),
(1, 1, 'Nairobi Depot', 'Machakos Town', '2026-02-01 10:00:00', NULL, 65, 'pending', 'Local pickup', 'Scheduled today');

-- ============================================================
-- FUEL ENTRIES
-- ============================================================
INSERT OR IGNORE INTO fuel_entries (vehicle_id, trip_id, date, liters, cost_per_liter, total_cost, mileage_km, station, notes) VALUES
(1, 1, '2026-01-05', 60, 195, 11700, 45230, 'TotalEnergies Mombasa Rd', 'Full tank'),
(2, 2, '2026-01-06', 40, 195, 7800, 28300, 'Shell Nakuru', 'Half tank'),
(4, 3, '2026-01-08', 80, 195, 15600, 15600, 'TotalEnergies Kisumu', 'Full tank for long trip'),
(1, 4, '2026-01-10', 55, 198, 10890, 45710, 'Vivo Energy Mombasa', 'Return refill'),
(5, 5, '2026-01-12', 25, 195, 4875, 34100, 'Shell Thika', 'Short trip top up'),
(2, 6, '2026-01-15', 45, 197, 8865, 28460, 'TotalEnergies Nakuru', 'Trip refill'),
(8, 7, '2026-01-18', 90, 195, 17550, 21400, 'Shell Nairobi', 'Full tank long haul'),
(1, NULL, '2026-02-01', 30, 200, 6000, 45890, 'TotalEnergies', 'Weekly top up');

-- ============================================================
-- MAINTENANCE RECORDS
-- ============================================================
INSERT OR IGNORE INTO maintenance_records (vehicle_id, service_type, description, date, cost, mileage_km, next_service_date, next_service_mileage, status, notes) VALUES
(1, 'Oil Change', 'Regular oil and filter change', '2026-01-02', 4500, 45000, '2026-04-02', 48000, 'completed', 'Done at authorized center'),
(3, 'Engine Repair', 'Engine misfire diagnosis and repair', '2026-01-05', 25000, 67000, '2026-02-05', 68500, 'completed', 'Parts replaced'),
(2, 'Brake Service', 'Brake pad replacement', '2026-01-10', 8500, 28100, '2026-07-10', 33000, 'completed', 'All 4 pads replaced'),
(4, 'Tire Rotation', 'Tire rotation and alignment', '2026-01-15', 3200, 15400, '2026-07-15', 20000, 'completed', 'Balanced all tires'),
(1, 'Scheduled Service', '30,000 km service', '2026-01-20', 12000, 45600, '2026-04-20', 50000, 'completed', 'Full service done'),
(3, 'Transmission Check', 'Transmission fluid leak', '2026-01-25', 18000, 67500, NULL, NULL, 'scheduled', 'Waiting for parts'),
(5, 'AC Service', 'AC gas recharge', '2026-02-01', 3500, 34200, '2027-02-01', 40000, 'scheduled', 'Booked for next week'),
(8, 'Pre-delivery Check', 'Inspection before trip', '2026-01-17', 2000, 21400, '2026-04-17', 26000, 'completed', 'All OK');

-- ============================================================
-- AUDIT LOGS
-- ============================================================
INSERT OR IGNORE INTO audit_logs (action, entity_type, entity_id, description, old_values, new_values, created_at) VALUES
('CREATE', 'vehicle', 1, 'Added vehicle KAB 123A', NULL, '{"plate_number":"KAB 123A","make":"Toyota"}', '2025-12-01 08:00:00'),
('CREATE', 'vehicle', 2, 'Added vehicle KAB 456B', NULL, '{"plate_number":"KAB 456B","make":"Isuzu"}', '2025-12-02 09:00:00'),
('CREATE', 'vehicle', 8, 'Added vehicle KBB 222H', NULL, '{"plate_number":"KBB 222H","make":"Mercedes"}', '2025-12-10 10:00:00'),
('CREATE', 'driver', 1, 'Added driver John Kamau', NULL, '{"name":"John Kamau","license":"DL00123"}', '2025-12-15 08:30:00'),
('CREATE', 'driver', 2, 'Added driver Mary Wanjiku', NULL, '{"name":"Mary Wanjiku","license":"DL00456"}', '2025-12-16 09:00:00'),
('CREATE', 'driver', 6, 'Added driver Jane Muthoni', NULL, '{"name":"Jane Muthoni","license":"DL00333"}', '2025-12-20 11:00:00'),
('CREATE', 'assignment', 1, 'Assigned John Kamau to KAB 123A', NULL, '{"vehicle_id":1,"driver_id":1}', '2026-01-15 07:00:00'),
('CREATE', 'assignment', 2, 'Assigned Mary Wanjiku to KAB 456B', NULL, '{"vehicle_id":2,"driver_id":2}', '2026-02-01 08:00:00'),
('CREATE', 'trip', 1, 'Created trip: Nairobi Depot → Mombasa Port', NULL, '{"start_location":"Nairobi Depot","end_location":"Mombasa Port"}', '2026-01-05 05:30:00'),
('CREATE', 'trip', 2, 'Created trip: Nairobi CBD → Nakuru Town', NULL, '{"start_location":"Nairobi CBD","end_location":"Nakuru Town"}', '2026-01-06 07:30:00'),
('UPDATE', 'trip', 1, 'Completed trip #1 (Nairobi → Mombasa)', '{"status":"ongoing"}', '{"status":"completed"}', '2026-01-05 14:30:00'),
('UPDATE', 'trip', 2, 'Completed trip #2 (Nairobi → Nakuru)', '{"status":"ongoing"}', '{"status":"completed"}', '2026-01-06 11:15:00'),
('CREATE', 'fuel', 1, 'Added fuel entry: 60L for KAB 123A', NULL, '{"liters":60,"cost":11700}', '2026-01-05 15:00:00'),
('CREATE', 'fuel', 2, 'Added fuel entry: 40L for KAB 456B', NULL, '{"liters":40,"cost":7800}', '2026-01-06 12:00:00'),
('CREATE', 'maintenance', 1, 'Scheduled Oil Change for KAB 123A', NULL, '{"service_type":"Oil Change","cost":4500}', '2026-01-02 09:00:00'),
('CREATE', 'maintenance', 2, 'Scheduled Engine Repair for KAB 789C', NULL, '{"service_type":"Engine Repair","cost":25000}', '2026-01-05 08:30:00'),
('UPDATE', 'maintenance', 1, 'Completed Oil Change for KAB 123A', '{"status":"scheduled"}', '{"status":"completed"}', '2026-01-02 14:00:00'),
('UPDATE', 'maintenance', 2, 'Completed Engine Repair for KAB 789C', '{"status":"scheduled"}', '{"status":"completed"}', '2026-01-05 16:00:00'),
('UPDATE', 'vehicle', 3, 'Changed KAB 789C status to maintenance', '{"status":"active"}', '{"status":"maintenance"}', '2026-01-04 10:00:00'),
('CREATE', 'assignment', 6, 'Assigned Samuel Kiprop to KAB 789C (inactive)', NULL, '{"vehicle_id":3,"driver_id":5}', '2026-01-20 09:00:00');

-- ============================================================
-- NEW TABLES — Nigerian Fleet Data
-- ============================================================

-- -----------------------------------------------------------
-- USERS (2 users)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, email, phone, is_active) VALUES
('admin', '$2b$12$JGGpfkArHAqJvVxDAf92..lNJl9w5gS.dQgTrtrv4mTE510thTljK', 'Admin User', 'admin', 'admin@fleetops.com', '+234 801 000 0001', 1),
('dispatcher', '$2b$12$4FWwL4Ok0anbuj/i45bRmOQYhc5rLdQJ04Lrqqtkl3CO0m7JnxWiS', 'Dispatcher User', 'dispatcher', 'dispatcher@fleetops.com', '+234 801 000 0002', 1);

-- -----------------------------------------------------------
-- DISPATCHES (5 linked to trips 1,2,3,6,7)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO dispatches (trip_id, dispatch_time, dispatched_by, status, notes) VALUES
(1, '2026-01-05 05:45:00', 1, 'dispatched', 'Lagos Depot to Apapa Port run - dispatched on schedule'),
(2, '2026-01-06 07:30:00', 1, 'dispatched', 'Lagos CBD to Ibadan supply run - early morning dispatch'),
(3, '2026-01-08 05:00:00', 2, 'dispatched', 'Lagos Office to Abuja - pre-dawn dispatch for long haul'),
(6, '2026-01-15 06:45:00', 1, 'dispatched', 'Ikeja to Port Harcourt supply chain run'),
(7, '2026-01-18 05:30:00', 2, 'dispatched', 'Lagos Depot to Onitsha bulk delivery dispatch');

-- -----------------------------------------------------------
-- GPS TRACKING (10 points around Lagos, lat ~6.45, lng ~3.39)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, timestamp) VALUES
(1, 6.5244, 3.3792, 45, 180, '2026-06-01 08:00:00'),
(1, 6.5000, 3.3500, 60, 190, '2026-06-01 08:15:00'),
(1, 6.4750, 3.3200, 55, 185, '2026-06-01 08:30:00'),
(2, 6.4500, 3.4000, 40, 270, '2026-06-01 09:00:00'),
(2, 6.4550, 3.3800, 50, 260, '2026-06-01 09:15:00'),
(2, 6.4600, 3.3550, 35, 265, '2026-06-01 09:30:00'),
(4, 6.6000, 3.3500, 70, 0, '2026-06-01 10:00:00'),
(4, 6.6200, 3.3520, 65, 10, '2026-06-01 10:15:00'),
(4, 6.6450, 3.3550, 55, 5, '2026-06-01 10:30:00'),
(6, 6.4800, 3.2900, 30, 135, '2026-06-01 11:00:00');

-- -----------------------------------------------------------
-- GEOFENCES (3 zones around Lagos)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO geofences (name, type, center_lat, center_lng, radius_meters, color, active) VALUES
('Lagos Depot Zone', 'depot', 6.5244, 3.3792, 500, '#FF5733', 1),
('Lagos Island City Center', 'city_center', 6.4550, 3.4050, 1000, '#33FF57', 1),
('Apapa Warehouse Zone', 'warehouse', 6.4400, 3.3600, 800, '#3357FF', 1);

-- -----------------------------------------------------------
-- ALERTS (8 of different types)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO alerts (vehicle_id, type, severity, message, is_read, created_at) VALUES
(3, 'maintenance', 'high', 'Vehicle KAB 789C has exceeded its service interval, immediate maintenance required in Lagos workshop', 0, '2026-06-10 09:00:00'),
(7, 'license_expiry', 'high', 'License for KAA 111G expired on 2026-04-20, vehicle cannot be used until renewed at Lagos DMV', 0, '2026-04-21 08:00:00'),
(5, 'speed_violation', 'medium', 'Vehicle KCA 654E exceeded speed limit on Lagos-Ibadan Expressway at 145 km/h in a 100 km/h zone', 0, '2026-05-15 14:30:00'),
(1, 'insurance_expiry', 'medium', 'Insurance for KAB 123A expires in 30 days on 2026-12-15, renewal needed', 0, '2026-11-15 08:00:00'),
(2, 'fuel_theft', 'low', 'Suspected fuel theft on KAB 456B - 20L discrepancy between pump reading and tank level in Ikeja depot', 1, '2026-05-20 10:00:00'),
(4, 'geofence_breach', 'medium', 'KCB 321D breached Apapa Warehouse Zone geofence at 2026-05-22 03:15:00 - unauthorized movement', 0, '2026-05-22 03:15:00'),
(8, 'tire_pressure', 'low', 'Low tire pressure on KBB 222H - rear left tire at 28 PSI, scheduled for inspection at Lagos yard', 1, '2026-06-05 07:00:00'),
(5, 'battery_voltage', 'medium', 'Low battery voltage on KCA 654E at 11.8V, alternator may need inspection at Port Harcourt base', 0, '2026-06-08 16:00:00');

-- -----------------------------------------------------------
-- INCIDENTS (4)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO incidents (vehicle_id, driver_id, type, description, location, date, severity, status, notes) VALUES
(2, 2, 'accident', 'Minor rear-end collision at traffic light in Ikeja, Lagos', 'Ikeja, Lagos State', '2026-04-10', 'low', 'resolved', 'No injuries, vehicle had minor bumper damage, insurance claim filed'),
(5, 4, 'breakdown', 'Engine overheating on Lagos-Ibadan Expressway, vehicle stopped at roadside', 'Lagos-Ibadan Expressway, km 25', '2026-05-02', 'medium', 'resolved', 'Coolant leak repaired at nearest garage, returned to service same day'),
(8, 6, 'theft_attempt', 'Attempted theft of cargo at rest stop in Ore, Ondo State during overnight layover', 'Ore, Ondo State', '2026-05-18', 'high', 'investigating', 'Security guard thwarted attempt, police report filed with Ore Police Station'),
(4, 3, 'traffic_violation', 'Driver issued speeding ticket on Abuja-Lokoja Highway exceeding limit by 25 km/h', 'Abuja-Lokoja Highway', '2026-06-02', 'low', 'pending', 'Ticket amount ₦25,000, court appearance scheduled for next month');

-- -----------------------------------------------------------
-- SPARE PARTS (6)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO spare_parts (name, part_number, quantity, unit_price, supplier, category) VALUES
('Oil Filter', 'OF-TOY-001', 25, 2500.00, 'Toyota Nigeria Ltd, Lagos', 'Filters'),
('Brake Pads (Front)', 'BP-ISU-002', 12, 8500.00, 'Isuzu Parts Nigeria, Ikeja', 'Brakes'),
('All-Season Tires 225/65R17', 'TR-225-65-17', 8, 45000.00, 'Michelin Nigeria, Lagos', 'Tires'),
('Battery 12V 100Ah', 'BT-12-100', 10, 35000.00, 'Exide Nigeria, Port Harcourt', 'Electrical'),
('Air Filter', 'AF-TOY-003', 20, 3200.00, 'AutoXpress Nigeria, Lekki', 'Filters'),
('Spark Plugs (Set of 4)', 'SP-NG-004', 15, 6000.00, 'NGK Nigeria, Lagos', 'Ignition');

-- -----------------------------------------------------------
-- VEHICLE DOCUMENTS (4 linked to vehicles 1,2,4,8)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO vehicle_documents (vehicle_id, document_type, document_number, issue_date, expiry_date, status, notes) VALUES
(1, 'Insurance Certificate', 'INS-2026-001', '2025-12-15', '2026-12-15', 'active', 'Comprehensive cover - Leadway Assurance, valid nationwide'),
(2, 'Roadworthiness Certificate', 'RWC-2026-045', '2026-01-10', '2027-01-10', 'active', 'Passed Lagos state vehicle inspection test'),
(4, 'Vehicle Registration', 'VRN-LAG-321D', '2023-06-01', '2028-06-01', 'active', 'Lagos state registration, class D commercial vehicle'),
(8, 'Emission Test Certificate', 'EMT-2026-089', '2026-01-15', '2027-01-15', 'active', 'Compliant with EURO 4 standards - passed LASEPA test');

-- -----------------------------------------------------------
-- SETTINGS (10 key-value pairs)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO settings (key, value, description) VALUES
('theme', 'light', 'Application theme (light/dark)'),
('currency', 'NGN', 'Default currency for financial reports'),
('currency_symbol', '₦', 'Currency symbol for display'),
('fuel_unit', 'liters', 'Unit for fuel measurements'),
('distance_unit', 'km', 'Unit for distance measurements'),
('language', 'en', 'Application language'),
('date_format', 'YYYY-MM-DD', 'Date display format'),
('timezone', 'Africa/Lagos', 'Default timezone for all timestamps'),
('notification_email', 'admin@fleetops.com', 'Default notification email address'),
('fuel_cost_per_liter', '195', 'Default fuel cost per liter in Nigerian Naira');
