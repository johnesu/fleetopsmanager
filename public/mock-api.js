window.electronAPI = (function() {
  let data = loadData();

  function loadData() {
    const saved = localStorage.getItem('fleetops-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const required = ['vehicles','drivers','trips','fuel','maintenance','dispatches','gpsTracking','geofences','alerts','incidents','spareParts','auditLogs','users'];
        if (parsed && required.every(k => Array.isArray(parsed[k]))) return parsed;
      } catch (e) {}
      console.warn('Corrupt localStorage data detected, clearing and using seed data');
      localStorage.removeItem('fleetops-data');
    }
    return getSeedData();
  }

  function save() {
    localStorage.setItem('fleetops-data', JSON.stringify(data));
  }

  function getSeedData() {
    return {
      vehicles: [
        { id: 1, plate_number: 'KAB 123A', make: 'Toyota', model: 'Hilux', year: 2022, color: 'White', status: 'active', insurance_expiry: '2026-12-15', license_expiry: '2026-08-20', odometer_km: 45230, fuel_type: 'diesel', notes: 'Main field vehicle' },
        { id: 2, plate_number: 'KAB 456B', make: 'Isuzu', model: 'D-Max', year: 2023, color: 'Blue', status: 'active', insurance_expiry: '2027-03-10', license_expiry: '2026-11-05', odometer_km: 28300, fuel_type: 'diesel', notes: 'Delivery vehicle' },
        { id: 3, plate_number: 'KAB 789C', make: 'Mitsubishi', model: 'L300', year: 2021, color: 'Silver', status: 'maintenance', insurance_expiry: '2026-06-01', license_expiry: '2026-07-15', odometer_km: 67100, fuel_type: 'petrol', notes: 'Needs engine check' },
        { id: 4, plate_number: 'KCB 321D', make: 'Toyota', model: 'Land Cruiser', year: 2023, color: 'Black', status: 'active', insurance_expiry: '2027-01-20', license_expiry: '2026-09-30', odometer_km: 15600, fuel_type: 'diesel', notes: 'Executive use' },
        { id: 5, plate_number: 'KCA 654E', make: 'Nissan', model: 'Navara', year: 2022, color: 'Red', status: 'active', insurance_expiry: '2026-10-25', license_expiry: '2026-12-01', odometer_km: 34100, fuel_type: 'diesel', notes: 'Sales team' },
        { id: 6, plate_number: 'KBZ 987F', make: 'Ford', model: 'Ranger', year: 2024, color: 'Gray', status: 'active', insurance_expiry: '2027-05-15', license_expiry: '2027-02-10', odometer_km: 8900, fuel_type: 'diesel', notes: 'New fleet addition' },
        { id: 7, plate_number: 'KAA 111G', make: 'Toyota', model: 'Hiace', year: 2020, color: 'White', status: 'inactive', insurance_expiry: '2026-04-20', license_expiry: '2026-04-20', odometer_km: 89200, fuel_type: 'petrol', notes: 'Needs inspection' },
        { id: 8, plate_number: 'KBB 222H', make: 'Mercedes', model: 'Sprinter', year: 2023, color: 'White', status: 'active', insurance_expiry: '2027-06-01', license_expiry: '2026-10-15', odometer_km: 21400, fuel_type: 'diesel', notes: 'Long distance hauler' },
      ],
      drivers: [
        { id: 1, name: 'John Kamau', phone: '+254 712 345 678', email: 'john.kamau@email.com', license_number: 'DL00123', license_expiry: '2026-09-15', license_class: 'B, C1', status: 'active', notes: 'Senior driver, 10 years exp' },
        { id: 2, name: 'Mary Wanjiku', phone: '+254 723 456 789', email: 'mary.wanjiku@email.com', license_number: 'DL00456', license_expiry: '2026-11-20', license_class: 'B, C, D', status: 'active', notes: 'Heavy truck certified' },
        { id: 3, name: 'Peter Ochieng', phone: '+254 734 567 890', email: 'peter.ochieng@email.com', license_number: 'DL00789', license_expiry: '2027-01-10', license_class: 'B, C1', status: 'active', notes: 'Reliable, on-time delivery' },
        { id: 4, name: 'Grace Akinyi', phone: '+254 745 678 901', email: 'grace.akinyi@email.com', license_number: 'DL00111', license_expiry: '2026-07-05', license_class: 'B', status: 'active', notes: 'City routes specialist' },
        { id: 5, name: 'Samuel Kiprop', phone: '+254 756 789 012', email: 'samuel.kiprop@email.com', license_number: 'DL00222', license_expiry: '2026-05-30', license_class: 'B, C, D', status: 'suspended', notes: 'License review pending' },
        { id: 6, name: 'Jane Muthoni', phone: '+254 767 890 123', email: 'jane.muthoni@email.com', license_number: 'DL00333', license_expiry: '2027-03-22', license_class: 'B, C1', status: 'active', notes: 'New hire, good record' },
      ],
      assignments: [
        { id: 1, vehicle_id: 1, driver_id: 1, start_date: '2025-01-15', end_date: null, is_active: 1 },
        { id: 2, vehicle_id: 2, driver_id: 2, start_date: '2025-02-01', end_date: null, is_active: 1 },
        { id: 3, vehicle_id: 4, driver_id: 3, start_date: '2025-03-10', end_date: null, is_active: 1 },
        { id: 4, vehicle_id: 5, driver_id: 4, start_date: '2025-04-01', end_date: null, is_active: 1 },
        { id: 5, vehicle_id: 8, driver_id: 6, start_date: '2025-06-01', end_date: null, is_active: 1 },
        { id: 6, vehicle_id: 3, driver_id: 5, start_date: '2025-01-20', end_date: '2025-03-15', is_active: 0 },
      ],
      trips: [
        { id: 1, vehicle_id: 1, driver_id: 1, start_location: 'Nairobi Depot', end_location: 'Mombasa Port', start_time: '2026-01-05 06:00:00', end_time: '2026-01-05 14:30:00', distance_km: 480, status: 'completed', purpose: 'Goods delivery', notes: 'Arrived on time' },
        { id: 2, vehicle_id: 2, driver_id: 2, start_location: 'Nairobi CBD', end_location: 'Nakuru Town', start_time: '2026-01-06 08:00:00', end_time: '2026-01-06 11:15:00', distance_km: 160, status: 'completed', purpose: 'Supply run', notes: 'Light traffic' },
        { id: 3, vehicle_id: 4, driver_id: 3, start_location: 'Nairobi Office', end_location: 'Kisumu City', start_time: '2026-01-08 05:30:00', end_time: '2026-01-08 15:00:00', distance_km: 350, status: 'completed', purpose: 'Client meeting', notes: 'Overnight stay' },
        { id: 4, vehicle_id: 1, driver_id: 1, start_location: 'Mombasa Port', end_location: 'Nairobi Depot', start_time: '2026-01-10 07:00:00', end_time: '2026-01-10 15:45:00', distance_km: 480, status: 'completed', purpose: 'Return trip', notes: 'Smooth ride' },
        { id: 5, vehicle_id: 5, driver_id: 4, start_location: 'Nairobi Depot', end_location: 'Thika Town', start_time: '2026-01-12 09:00:00', end_time: '2026-01-12 10:30:00', distance_km: 45, status: 'completed', purpose: 'Local delivery', notes: 'Multiple stops' },
        { id: 6, vehicle_id: 2, driver_id: 2, start_location: 'Nakuru Town', end_location: 'Eldoret City', start_time: '2026-01-15 07:00:00', end_time: null, distance_km: 190, status: 'ongoing', purpose: 'Supply chain', notes: 'In transit' },
        { id: 7, vehicle_id: 8, driver_id: 6, start_location: 'Nairobi Depot', end_location: 'Mombasa Port', start_time: '2026-01-18 06:00:00', end_time: null, distance_km: 480, status: 'ongoing', purpose: 'Bulk delivery', notes: 'Heavy load' },
        { id: 8, vehicle_id: 1, driver_id: 1, start_location: 'Nairobi Depot', end_location: 'Machakos Town', start_time: '2026-02-01 10:00:00', end_time: null, distance_km: 65, status: 'pending', purpose: 'Local pickup', notes: 'Scheduled today' },
      ],
      fuel: [
        { id: 1, vehicle_id: 1, trip_id: 1, date: '2026-01-05', liters: 60, cost_per_liter: 195, total_cost: 11700, mileage_km: 45230, station: 'TotalEnergies Mombasa Rd', notes: 'Full tank' },
        { id: 2, vehicle_id: 2, trip_id: 2, date: '2026-01-06', liters: 40, cost_per_liter: 195, total_cost: 7800, mileage_km: 28300, station: 'Shell Nakuru', notes: 'Half tank' },
        { id: 3, vehicle_id: 4, trip_id: 3, date: '2026-01-08', liters: 80, cost_per_liter: 195, total_cost: 15600, mileage_km: 15600, station: 'TotalEnergies Kisumu', notes: 'Full tank for long trip' },
        { id: 4, vehicle_id: 1, trip_id: 4, date: '2026-01-10', liters: 55, cost_per_liter: 198, total_cost: 10890, mileage_km: 45710, station: 'Vivo Energy Mombasa', notes: 'Return refill' },
        { id: 5, vehicle_id: 5, trip_id: 5, date: '2026-01-12', liters: 25, cost_per_liter: 195, total_cost: 4875, mileage_km: 34100, station: 'Shell Thika', notes: 'Short trip top up' },
        { id: 6, vehicle_id: 2, trip_id: 6, date: '2026-01-15', liters: 45, cost_per_liter: 197, total_cost: 8865, mileage_km: 28460, station: 'TotalEnergies Nakuru', notes: 'Trip refill' },
        { id: 7, vehicle_id: 8, trip_id: 7, date: '2026-01-18', liters: 90, cost_per_liter: 195, total_cost: 17550, mileage_km: 21400, station: 'Shell Nairobi', notes: 'Full tank long haul' },
        { id: 8, vehicle_id: 1, trip_id: null, date: '2026-02-01', liters: 30, cost_per_liter: 200, total_cost: 6000, mileage_km: 45890, station: 'TotalEnergies', notes: 'Weekly top up' },
      ],
      maintenance: [
        { id: 8, vehicle_id: 8, service_type: 'Pre-delivery Check', description: 'Inspection before trip', date: '2026-01-17', cost: 2000, mileage_km: 21400, next_service_date: '2026-04-17', next_service_mileage: 26000, status: 'completed', notes: 'All OK' },
      ],
      auditLogs: [
        { id: 1, action: 'CREATE', entity_type: 'vehicle', entity_id: 1, description: 'Added vehicle KAB 123A', old_values: null, new_values: '{"plate_number":"KAB 123A","make":"Toyota"}', created_at: '2025-12-01 08:00:00' },
        { id: 2, action: 'CREATE', entity_type: 'vehicle', entity_id: 2, description: 'Added vehicle KAB 456B', old_values: null, new_values: '{"plate_number":"KAB 456B","make":"Isuzu"}', created_at: '2025-12-02 09:00:00' },
        { id: 3, action: 'CREATE', entity_type: 'vehicle', entity_id: 8, description: 'Added vehicle KBB 222H', old_values: null, new_values: '{"plate_number":"KBB 222H","make":"Mercedes"}', created_at: '2025-12-10 10:00:00' },
        { id: 4, action: 'CREATE', entity_type: 'driver', entity_id: 1, description: 'Added driver John Kamau', old_values: null, new_values: '{"name":"John Kamau","license":"DL00123"}', created_at: '2025-12-15 08:30:00' },
        { id: 5, action: 'CREATE', entity_type: 'driver', entity_id: 2, description: 'Added driver Mary Wanjiku', old_values: null, new_values: '{"name":"Mary Wanjiku","license":"DL00456"}', created_at: '2025-12-16 09:00:00' },
        { id: 6, action: 'CREATE', entity_type: 'driver', entity_id: 6, description: 'Added driver Jane Muthoni', old_values: null, new_values: '{"name":"Jane Muthoni","license":"DL00333"}', created_at: '2025-12-20 11:00:00' },
        { id: 7, action: 'CREATE', entity_type: 'assignment', entity_id: 1, description: 'Assigned John Kamau to KAB 123A', old_values: null, new_values: '{"vehicle_id":1,"driver_id":1}', created_at: '2026-01-15 07:00:00' },
        { id: 8, action: 'CREATE', entity_type: 'assignment', entity_id: 2, description: 'Assigned Mary Wanjiku to KAB 456B', old_values: null, new_values: '{"vehicle_id":2,"driver_id":2}', created_at: '2026-02-01 08:00:00' },
        { id: 9, action: 'CREATE', entity_type: 'trip', entity_id: 1, description: 'Created trip: Nairobi Depot → Mombasa Port', old_values: null, new_values: '{"start_location":"Nairobi Depot","end_location":"Mombasa Port"}', created_at: '2026-01-05 05:30:00' },
        { id: 10, action: 'CREATE', entity_type: 'trip', entity_id: 2, description: 'Created trip: Nairobi CBD → Nakuru Town', old_values: null, new_values: '{"start_location":"Nairobi CBD","end_location":"Nakuru Town"}', created_at: '2026-01-06 07:30:00' },
        { id: 11, action: 'UPDATE', entity_type: 'trip', entity_id: 1, description: 'Completed trip #1 (Nairobi → Mombasa)', old_values: '{"status":"ongoing"}', new_values: '{"status":"completed"}', created_at: '2026-01-05 14:30:00' },
        { id: 12, action: 'UPDATE', entity_type: 'trip', entity_id: 2, description: 'Completed trip #2 (Nairobi → Nakuru)', old_values: '{"status":"ongoing"}', new_values: '{"status":"completed"}', created_at: '2026-01-06 11:15:00' },
        { id: 13, action: 'CREATE', entity_type: 'fuel', entity_id: 1, description: 'Added fuel entry: 60L for KAB 123A', old_values: null, new_values: '{"liters":60,"cost":11700}', created_at: '2026-01-05 15:00:00' },
        { id: 14, action: 'CREATE', entity_type: 'fuel', entity_id: 2, description: 'Added fuel entry: 40L for KAB 456B', old_values: null, new_values: '{"liters":40,"cost":7800}', created_at: '2026-01-06 12:00:00' },
        { id: 15, action: 'CREATE', entity_type: 'maintenance', entity_id: 1, description: 'Scheduled Oil Change for KAB 123A', old_values: null, new_values: '{"service_type":"Oil Change","cost":4500}', created_at: '2026-01-02 09:00:00' },
        { id: 16, action: 'CREATE', entity_type: 'maintenance', entity_id: 2, description: 'Scheduled Engine Repair for KAB 789C', old_values: null, new_values: '{"service_type":"Engine Repair","cost":25000}', created_at: '2026-01-05 08:30:00' },
        { id: 17, action: 'UPDATE', entity_type: 'maintenance', entity_id: 1, description: 'Completed Oil Change for KAB 123A', old_values: '{"status":"scheduled"}', new_values: '{"status":"completed"}', created_at: '2026-01-02 14:00:00' },
        { id: 18, action: 'UPDATE', entity_type: 'maintenance', entity_id: 2, description: 'Completed Engine Repair for KAB 789C', old_values: '{"status":"scheduled"}', new_values: '{"status":"completed"}', created_at: '2026-01-05 16:00:00' },
        { id: 19, action: 'UPDATE', entity_type: 'vehicle', entity_id: 3, description: 'Changed KAB 789C status to maintenance', old_values: '{"status":"active"}', new_values: '{"status":"maintenance"}', created_at: '2026-01-04 10:00:00' },
        { id: 20, action: 'CREATE', entity_type: 'assignment', entity_id: 6, description: 'Assigned Samuel Kiprop to KAB 789C (inactive)', old_values: null, new_values: '{"vehicle_id":3,"driver_id":5}', created_at: '2026-01-20 09:00:00' },
      ],
      dispatches: [
        { id: 1, trip_id: 1, dispatched_by: 'James Okafor', status: 'approved', priority: 'normal', cargo_type: 'Electronics equipment', dispatched_at: '2026-01-05 05:30:00', notes: 'Handle with care' },
        { id: 2, trip_id: 2, dispatched_by: 'Chioma Obi', status: 'in_progress', priority: 'high', cargo_type: 'Medical supplies', dispatched_at: '2026-01-06 07:45:00', notes: 'Urgent delivery' },
        { id: 3, trip_id: 3, dispatched_by: 'James Okafor', status: 'completed', priority: 'normal', cargo_type: null, dispatched_at: '2026-01-08 05:00:00', notes: 'Executive trip' },
        { id: 4, trip_id: 6, dispatched_by: 'Amara Nwachukwu', status: 'in_progress', priority: 'urgent', cargo_type: null, dispatched_at: '2026-01-15 06:30:00', notes: 'Priority dispatch' },
        { id: 5, trip_id: 7, dispatched_by: 'Chioma Obi', status: 'pending', priority: 'normal', cargo_type: null, dispatched_at: '2026-01-18 05:00:00', notes: 'Awaiting clearance' },
      ],
      gpsTracking: [
        { id: 1, vehicle_id: 1, trip_id: 1, latitude: 6.4500, longitude: 3.3900, timestamp: '2026-06-14 06:00:00', speed: 0, heading: 0, driver_id: 1 },
        { id: 2, vehicle_id: 1, trip_id: 1, latitude: 6.4520, longitude: 3.3920, timestamp: '2026-06-14 06:05:00', speed: 45, heading: 45, driver_id: 1 },
        { id: 3, vehicle_id: 1, trip_id: 1, latitude: 6.4550, longitude: 3.3950, timestamp: '2026-06-14 06:10:00', speed: 60, heading: 50, driver_id: 1 },
        { id: 4, vehicle_id: 2, trip_id: 2, latitude: 6.4480, longitude: 3.3850, timestamp: '2026-06-14 08:00:00', speed: 35, heading: 180, driver_id: 2 },
        { id: 5, vehicle_id: 2, trip_id: 2, latitude: 6.4400, longitude: 3.3820, timestamp: '2026-06-14 08:10:00', speed: 55, heading: 175, driver_id: 2 },
        { id: 6, vehicle_id: 8, trip_id: 7, latitude: 6.4580, longitude: 3.4050, timestamp: '2026-06-14 07:00:00', speed: 70, heading: 120, driver_id: 6 },
        { id: 7, vehicle_id: 1, trip_id: 4, latitude: 6.4600, longitude: 3.4000, timestamp: '2026-06-13 14:00:00', speed: 50, heading: 270, driver_id: 1 },
        { id: 8, vehicle_id: 1, trip_id: 4, latitude: 6.4580, longitude: 3.3950, timestamp: '2026-06-13 14:15:00', speed: 45, heading: 260, driver_id: 1 },
        { id: 9, vehicle_id: 2, trip_id: 6, latitude: 6.4450, longitude: 3.3780, timestamp: '2026-06-13 10:00:00', speed: 60, heading: 90, driver_id: 2 },
        { id: 10, vehicle_id: 8, trip_id: 7, latitude: 6.4620, longitude: 3.4100, timestamp: '2026-06-14 07:15:00', speed: 75, heading: 130, driver_id: 6 },
      ],
      geofences: [
        { id: 1, name: 'Lagos Depot Zone', latitude: 6.465, longitude: 3.406, radius_meters: 800, type: 'allowed', color: '#10b981', active: 1 },
        { id: 2, name: 'Lagos Island', latitude: 6.455, longitude: 3.395, radius_meters: 500, type: 'restricted', color: '#ef4444', active: 1 },
        { id: 3, name: 'Apapa Warehouse', latitude: 6.450, longitude: 3.375, radius_meters: 600, type: 'allowed', color: '#3b82f6', active: 1 },
      ],
      alerts: [
        { id: 1, type: 'maintenance', severity: 'critical', title: 'Oil Change Due - KAB 123A', description: 'KAB 123A is due for oil change service', entity_type: 'vehicle', entity_id: 1, is_read: 0, is_resolved: 0, created_at: '2026-06-10 08:00:00' },
        { id: 2, type: 'license_expiry', severity: 'warning', title: 'Driver License Expiring - Samuel Kiprop', description: 'Samuel Kiprop license DL00222 expires 2026-05-30', entity_type: 'driver', entity_id: 5, is_read: 0, is_resolved: 0, created_at: '2026-06-11 09:00:00' },
        { id: 3, type: 'speed_violation', severity: 'warning', title: 'Speed Limit Exceeded - KAB 456B', description: 'KAB 456B exceeded speed limit on Nakuru highway', entity_type: 'vehicle', entity_id: 2, is_read: 0, is_resolved: 0, created_at: '2026-06-12 10:00:00' },
        { id: 4, type: 'insurance_expiry', severity: 'critical', title: 'Insurance Expiring - KAA 111G', description: 'KAA 111G insurance expires 2026-04-20', entity_type: 'vehicle', entity_id: 7, is_read: 0, is_resolved: 0, created_at: '2026-06-12 11:00:00' },
        { id: 5, type: 'fuel_theft', severity: 'warning', title: 'Suspicious Fuel Consumption - KAB 789C', description: 'KAB 789C showing abnormal fuel consumption pattern', entity_type: 'vehicle', entity_id: 3, is_read: 0, is_resolved: 0, created_at: '2026-06-13 12:00:00' },
        { id: 6, type: 'geofence_violation', severity: 'critical', title: 'Vehicle Outside Allowed Zone - KCB 321D', description: 'KCB 321D detected outside permitted operational area', entity_type: 'vehicle', entity_id: 4, is_read: 0, is_resolved: 0, created_at: '2026-06-13 14:00:00' },
        { id: 7, type: 'vehicle_downtime', severity: 'warning', title: 'Vehicle Downtime - KAA 111G', description: 'KAA 111G has been inactive for extended period', entity_type: 'vehicle', entity_id: 7, is_read: 1, is_resolved: 1, resolved_at: '2026-06-14 09:00:00', created_at: '2026-06-12 15:00:00' },
        { id: 8, type: 'general', severity: 'info', title: 'New incident report filed', description: 'A new incident has been reported and requires review', entity_type: 'system', entity_id: null, is_read: 0, is_resolved: 0, created_at: '2026-06-14 10:00:00' },
      ],
      incidents: [
        { id: 1, trip_id: 1, vehicle_id: 1, driver_id: 1, type: 'accident', severity: 'high', status: 'resolved', description: 'Minor collision at intersection on Mombasa Road', location: 'Mombasa Road, Nairobi', reported_at: '2026-01-05 12:30:00', resolved_at: '2026-01-06 10:00:00', reported_by: 'John Kamau' },
        { id: 2, trip_id: 3, vehicle_id: 4, driver_id: 3, type: 'mechanical_breakdown', severity: 'medium', status: 'open', description: 'Engine overheating on Nakuru-Kisumu highway', location: 'Nakuru-Kisumu Highway', reported_at: '2026-01-08 10:00:00', resolved_at: null, reported_by: 'Peter Ochieng' },
        { id: 3, trip_id: 2, vehicle_id: 2, driver_id: 2, type: 'traffic_violation', severity: 'low', status: 'closed', description: 'Speeding ticket issued for exceeding limit by 15km/h', location: 'Nairobi-Nakuru Highway', reported_at: '2026-01-06 09:45:00', resolved_at: '2026-01-10 16:00:00', reported_by: 'Mary Wanjiku' },
        { id: 4, trip_id: 7, vehicle_id: 8, driver_id: 6, type: 'cargo_issue', severity: 'medium', status: 'investigating', description: 'Cargo manifest discrepancy found during loading', location: 'Nairobi Depot', reported_at: '2026-01-18 14:00:00', resolved_at: null, reported_by: 'Jane Muthoni' },
      ],
      spareParts: [
        { id: 1, name: 'Oil Filter', part_number: 'OF-101', compatible_vehicles: 'Toyota, Isuzu', quantity: 12, min_quantity: 5, unit_price: 1500, category: 'Filters', location: 'Shelf A-12', supplier: 'AutoParts Ltd' },
        { id: 2, name: 'Brake Pads', part_number: 'BP-202', compatible_vehicles: 'Toyota, Isuzu', quantity: 3, min_quantity: 5, unit_price: 3500, category: 'Brakes', location: 'Shelf B-04', supplier: 'BrakeMaster Inc' },
        { id: 3, name: 'Tire 225/70R15', part_number: 'TR-303', compatible_vehicles: 'Universal', quantity: 8, min_quantity: 4, unit_price: 12000, category: 'Tires', location: 'Warehouse C', supplier: 'TireWorld' },
        { id: 4, name: 'Battery 12V', part_number: 'BT-404', compatible_vehicles: 'Universal', quantity: 2, min_quantity: 3, unit_price: 8500, category: 'Electrical', location: 'Shelf A-08', supplier: 'PowerCell Co' },
        { id: 5, name: 'Air Filter', part_number: 'AF-505', compatible_vehicles: 'Toyota, Mitsubishi', quantity: 15, min_quantity: 5, unit_price: 1200, category: 'Filters', location: 'Shelf A-15', supplier: 'AutoParts Ltd' },
        { id: 6, name: 'Spark Plug', part_number: 'SP-606', compatible_vehicles: 'Universal', quantity: 20, min_quantity: 10, unit_price: 800, category: 'Engine', location: 'Shelf D-03', supplier: 'EnginePro' },
      ],
      documents: [
        { id: 1, vehicle_id: 1, type: 'insurance', name: 'Insurance Certificate', document_number: 'INS-2026-001', expiry_date: '2026-12-15', issued_date: '2025-12-15', status: 'active', notes: 'Comprehensive cover' },
        { id: 2, vehicle_id: 2, type: 'roadworthiness', name: 'Roadworthiness Certificate', document_number: 'RWC-2026-002', expiry_date: '2026-11-05', issued_date: '2025-11-05', status: 'active', notes: 'Passed inspection' },
        { id: 3, vehicle_id: 4, type: 'registration', name: 'Vehicle Registration', document_number: 'REG-2027-003', expiry_date: '2027-01-20', issued_date: '2024-01-20', status: 'active', notes: 'Private vehicle' },
        { id: 4, vehicle_id: 1, type: 'service', name: 'Service Record', document_number: 'SRV-2026-004', expiry_date: null, issued_date: '2026-01-02', status: 'active', notes: 'Oil change and inspection' },
      ],
      users: [
        { id: 1, username: 'admin', password: 'admin123', full_name: 'System Administrator', email: 'admin@fleetops.com', role: 'admin', is_active: 1, created_at: '2025-01-01 00:00:00', unique_id: null },
        { id: 2, username: 'dispatcher', password: 'dispatcher123', full_name: 'Dispatch Operator', email: 'dispatcher@fleetops.com', role: 'dispatcher', is_active: 1, created_at: '2025-01-01 00:00:00', unique_id: null },
        { id: 3, full_name: 'Maintenance Team', role: 'maintenance', is_active: 1, created_at: '2025-06-01 00:00:00', unique_id: 'MNT-0001' },
        { id: 4, full_name: 'Driver One', role: 'driver', is_active: 1, created_at: '2025-06-01 00:00:00', unique_id: 'DRV-0001' },
      ],
      settings: [
        { key: 'company_name', value: 'FleetOps Manager' },
        { key: 'currency', value: '₦' },
        { key: 'currency_code', value: 'NGN' },
        { key: 'timezone', value: 'Africa/Lagos' },
        { key: 'theme', value: 'dark' },
      ],
      nextId: { vehicles: 9, drivers: 7, assignments: 7, trips: 9, fuel: 9, maintenance: 9, auditLogs: 21, dispatches: 6, gpsTracking: 11, geofences: 4, alerts: 9, incidents: 5, spareParts: 7, documents: 5, users: 5 },
    };
  }

  function logAudit(action, entityType, entityId, description, oldValues, newValues) {
    const entry = {
      id: data.nextId.auditLogs++, action, entity_type: entityType, entity_id: entityId,
      description, old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    data.auditLogs.push(entry);
    save();
  }

  function getVehicle(id) { return data.vehicles.find(v => v.id === id); }
  function getDriver(id) { return data.drivers.find(d => d.id === id); }
  function getVehicleFull(v) { return { ...v, plate_number: v.plate_number, make: v.make, model: v.model }; }
  function getDriverFull(d) { return { ...d, name: d.name }; }

  return {
    // Vehicles
    getVehicles: () => { return [...data.vehicles].sort((a, b) => b.id - a.id); },
    getVehicle: (id) => getVehicle(id),
    createVehicle: (fields) => {
      const v = { id: data.nextId.vehicles++, ...fields };
      data.vehicles.push(v); save(); return v;
    },
    updateVehicle: (id, fields) => {
      const idx = data.vehicles.findIndex(v => v.id === id);
      if (idx === -1) return null;
      data.vehicles[idx] = { ...data.vehicles[idx], ...fields, id };
      save(); return data.vehicles[idx];
    },
    deleteVehicle: (id) => { data.vehicles = data.vehicles.filter(v => v.id !== id); save(); return { success: true }; },
    getVehiclesByStatus: (status) => data.vehicles.filter(v => v.status === status),
    getExpiringVehicles: () => data.vehicles.filter(v => {
      const d1 = v.insurance_expiry && new Date(v.insurance_expiry) <= new Date(Date.now() + 30*86400000);
      const d2 = v.license_expiry && new Date(v.license_expiry) <= new Date(Date.now() + 30*86400000);
      return d1 || d2;
    }),

    // Drivers
    getDrivers: () => { return [...data.drivers].sort((a, b) => b.id - a.id); },
    getDriver: (id) => getDriver(id),
    createDriver: (fields) => { const d = { id: data.nextId.drivers++, ...fields }; data.drivers.push(d); save(); return d; },
    updateDriver: (id, fields) => { const idx = data.drivers.findIndex(d => d.id === id); if (idx === -1) return null; data.drivers[idx] = { ...data.drivers[idx], ...fields, id }; save(); return data.drivers[idx]; },
    deleteDriver: (id) => { data.drivers = data.drivers.filter(d => d.id !== id); save(); return { success: true }; },
    getExpiringLicenses: () => data.drivers.filter(d => d.license_expiry && new Date(d.license_expiry) <= new Date(Date.now() + 30*86400000)),

    // Assignments
    getActiveAssignments: () => {
      return data.assignments.filter(a => a.is_active).map(a => {
        const v = getVehicle(a.vehicle_id);
        const d = getDriver(a.driver_id);
        return { ...a, plate_number: v?.plate_number, make: v?.make, model: v?.model, driver_name: d?.name, phone: d?.phone };
      });
    },
    getAssignmentsByVehicle: (vehicleId) => data.assignments.filter(a => a.vehicle_id === vehicleId).map(a => {
      const d = getDriver(a.driver_id);
      return { ...a, driver_name: d?.name, license_number: d?.license_number };
    }),
    getAssignmentsByDriver: (driverId) => data.assignments.filter(a => a.driver_id === driverId).map(a => {
      const v = getVehicle(a.vehicle_id);
      return { ...a, plate_number: v?.plate_number, make: v?.make, model: v?.model };
    }),
    assignDriver: (vehicleId, driverId) => {
      const existing = data.assignments.find(a => a.vehicle_id === vehicleId && a.is_active);
      if (existing) { existing.is_active = 0; existing.end_date = new Date().toISOString().slice(0, 10); }
      const a = { id: data.nextId.assignments++, vehicle_id: vehicleId, driver_id: driverId, start_date: new Date().toISOString().slice(0, 10), end_date: null, is_active: 1 };
      data.assignments.push(a); save();
      return { id: a.id, vehicle_id: vehicleId, driver_id: driverId };
    },
    unassignDriver: (assignmentId) => {
      const a = data.assignments.find(a => a.id === assignmentId);
      if (a) { a.is_active = 0; a.end_date = new Date().toISOString().slice(0, 10); save(); }
      return { success: true };
    },

    // Trips
    getTrips: (filters = {}) => {
      let result = [...data.trips].map(t => {
        const v = getVehicle(t.vehicle_id);
        const d = getDriver(t.driver_id);
        return { ...t, plate_number: v?.plate_number, make: v?.make, model: v?.model, driver_name: d?.name };
      });
      if (filters.status) result = result.filter(t => t.status === filters.status);
      return result.sort((a, b) => b.id - a.id);
    },
    getTrip: (id) => { const t = data.trips.find(t => t.id === id); if (!t) return null; const v = getVehicle(t.vehicle_id); const d = getDriver(t.driver_id); return { ...t, plate_number: v?.plate_number, make: v?.make, model: v?.model, driver_name: d?.name }; },
    createTrip: (fields) => { const t = { id: data.nextId.trips++, ...fields }; data.trips.push(t); save(); return t; },
    updateTrip: (id, fields) => { const idx = data.trips.findIndex(t => t.id === id); if (idx === -1) return null; data.trips[idx] = { ...data.trips[idx], ...fields, id }; save(); return data.trips[idx]; },
    deleteTrip: (id) => { data.trips = data.trips.filter(t => t.id !== id); save(); return { success: true }; },
    getTripsByVehicle: (vehicleId) => data.trips.filter(t => t.vehicle_id === vehicleId).map(t => { const d = getDriver(t.driver_id); return { ...t, driver_name: d?.name }; }),

    // Fuel
    getFuelEntries: (filters = {}) => {
      let result = [...data.fuel].map(f => { const v = getVehicle(f.vehicle_id); return { ...f, plate_number: v?.plate_number, make: v?.make, model: v?.model }; });
      if (filters.vehicle_id) result = result.filter(f => f.vehicle_id === filters.vehicle_id);
      if (filters.start_date) result = result.filter(f => f.date >= filters.start_date);
      if (filters.end_date) result = result.filter(f => f.date <= filters.end_date);
      return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    createFuelEntry: (fields) => { const f = { id: data.nextId.fuel++, ...fields, total_cost: Math.round(fields.liters * fields.cost_per_liter * 100) / 100 }; data.fuel.push(f); save(); return f; },
    updateFuelEntry: (id, fields) => { const idx = data.fuel.findIndex(f => f.id === id); if (idx === -1) return null; data.fuel[idx] = { ...data.fuel[idx], ...fields, id, total_cost: Math.round(fields.liters * fields.cost_per_liter * 100) / 100 }; save(); return data.fuel[idx]; },
    deleteFuelEntry: (id) => { data.fuel = data.fuel.filter(f => f.id !== id); save(); return { success: true }; },
    getFuelReport: (startDate, endDate) => {
      const filtered = data.fuel.filter(f => f.date >= startDate && f.date <= endDate);
      const grouped = {};
      filtered.forEach(f => {
        if (!grouped[f.vehicle_id]) {
          const v = getVehicle(f.vehicle_id);
          grouped[f.vehicle_id] = { plate_number: v?.plate_number, make: v?.make, model: v?.model, total_liters: 0, total_cost: 0, entries: 0 };
        }
        grouped[f.vehicle_id].total_liters += f.liters;
        grouped[f.vehicle_id].total_cost += f.total_cost;
        grouped[f.vehicle_id].entries++;
      });
      return Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost);
    },

    // Maintenance
    getMaintenanceRecords: (filters = {}) => {
      let result = [...data.maintenance].map(m => { const v = getVehicle(m.vehicle_id); return { ...m, plate_number: v?.plate_number, make: v?.make, model: v?.model }; });
      if (filters.vehicle_id) result = result.filter(m => m.vehicle_id === filters.vehicle_id);
      if (filters.status) result = result.filter(m => m.status === filters.status);
      if (filters.service_type) result = result.filter(m => m.service_type === filters.service_type);
      return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    createMaintenanceRecord: (fields) => { const m = { id: data.nextId.maintenance++, ...fields }; data.maintenance.push(m); save(); return m; },
    updateMaintenanceRecord: (id, fields) => { const idx = data.maintenance.findIndex(m => m.id === id); if (idx === -1) return null; data.maintenance[idx] = { ...data.maintenance[idx], ...fields, id }; save(); return data.maintenance[idx]; },
    deleteMaintenanceRecord: (id) => { data.maintenance = data.maintenance.filter(m => m.id !== id); save(); return { success: true }; },
    getUpcomingMaintenance: () => {
      return data.maintenance.filter(m => {
        const dateDue = m.next_service_date && new Date(m.next_service_date) <= new Date(Date.now() + 30*86400000);
        return dateDue;
      }).map(m => { const v = getVehicle(m.vehicle_id); return { ...m, plate_number: v?.plate_number, make: v?.make, model: v?.model }; });
    },

    // Dashboard
    getDashboardStats: () => {
      const totalVehicles = data.vehicles.length;
      const activeVehicles = data.vehicles.filter(v => v.status === 'active').length;
      const vehiclesInMaintenance = data.vehicles.filter(v => v.status === 'maintenance').length;
      const totalDrivers = data.drivers.length;
      const activeDrivers = data.drivers.filter(d => d.status === 'active').length;
      const ongoingTrips = data.trips.filter(t => t.status === 'ongoing').length;
      const totalTrips = data.trips.length;
      const pendingMaintenance = data.maintenance.filter(m => m.status === 'scheduled').length;
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const monthlyFuelCost = data.fuel.filter(f => f.date.startsWith(thisMonth)).reduce((s, f) => s + f.total_cost, 0);
      const expiringInsurance = data.vehicles.filter(v => v.insurance_expiry && new Date(v.insurance_expiry) <= new Date(Date.now() + 30*86400000)).length;
      const expiringLicense = data.vehicles.filter(v => v.license_expiry && new Date(v.license_expiry) <= new Date(Date.now() + 30*86400000)).length;
      const expiringDriverLicense = data.drivers.filter(d => d.license_expiry && new Date(d.license_expiry) <= new Date(Date.now() + 30*86400000)).length;
      return { totalVehicles, activeVehicles, vehiclesInMaintenance, totalDrivers, activeDrivers, ongoingTrips, totalTrips, pendingMaintenance, monthlyFuelCost, expiringInsurance, expiringLicense, expiringDriverLicense };
    },
    getMonthlyFuelReport: (year, month) => {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end = `${year}-${String(month).padStart(2,'0')}-31`;
      return Object.values(data.fuel.filter(f => f.date >= start && f.date <= end).reduce((acc, f) => {
        const v = getVehicle(f.vehicle_id);
        const key = f.vehicle_id;
        if (!acc[key]) acc[key] = { plate_number: v?.plate_number, make: v?.make, model: v?.model, total_liters: 0, total_cost: 0, avg_cost_per_liter: 0, entries: 0 };
        acc[key].total_liters += f.liters;
        acc[key].total_cost += f.total_cost;
        acc[key].entries++;
        acc[key].avg_cost_per_liter = acc[key].total_cost / acc[key].total_liters;
        return acc;
      }, {}));
    },
    getVehicleUsageReport: (year, month) => {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end = `${year}-${String(month).padStart(2,'0')}-31`;
      return data.vehicles.map(v => {
        const trips = data.trips.filter(t => t.vehicle_id === v.id && t.start_time && t.start_time.slice(0,10) >= start && t.start_time.slice(0,10) <= end);
        const fuel = data.fuel.filter(f => f.vehicle_id === v.id && f.date >= start && f.date <= end);
        return { plate_number: v.plate_number, make: v.make, model: v.model, trip_count: trips.length, total_distance: trips.reduce((s, t) => s + (t.distance_km || 0), 0), fuel_cost: fuel.reduce((s, f) => s + f.total_cost, 0) };
      }).sort((a, b) => b.total_distance - a.total_distance);
    },
    getMaintenanceSummary: (year, month) => {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end = `${year}-${String(month).padStart(2,'0')}-31`;
      const filtered = data.maintenance.filter(m => m.date >= start && m.date <= end);
      const grouped = {};
      filtered.forEach(m => {
        if (!grouped[m.service_type]) grouped[m.service_type] = { service_type: m.service_type, count: 0, total_cost: 0, plate_number: getVehicle(m.vehicle_id)?.plate_number };
        grouped[m.service_type].count++;
        grouped[m.service_type].total_cost += (m.cost || 0);
      });
      return Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost);
    },
    getDriverPerformance: (year, month) => {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end = `${year}-${String(month).padStart(2,'0')}-31`;
      return data.drivers.map(d => {
        const trips = data.trips.filter(t => t.driver_id === d.id && t.start_time && t.start_time.slice(0,10) >= start && t.start_time.slice(0,10) <= end);
        const v = trips.length > 0 ? getVehicle(trips[0].vehicle_id) : null;
        return { id: d.id, name: d.name, trip_count: trips.length, total_distance: trips.reduce((s, t) => s + (t.distance_km || 0), 0), plate_number: v?.plate_number, make: v?.make, model: v?.model };
      }).sort((a, b) => b.total_distance - a.total_distance);
    },

    // Audit Logs
    getAuditLogs: (filters = {}) => {
      let result = [...data.auditLogs].sort((a, b) => b.id - a.id);
      if (filters.entity_type) result = result.filter(l => l.entity_type === filters.entity_type);
      if (filters.action) result = result.filter(l => l.action === filters.action);
      if (filters.limit) result = result.slice(0, filters.limit);
      return result;
    },
    createAuditEntry: (entry) => {
      const e = { id: data.nextId.auditLogs++, ...entry, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
      data.auditLogs.push(e); save(); return e;
    },

    // Dispatches
    getDispatches: (filters = {}) => {
      let result = [...data.dispatches].map(d => {
        const trip = data.trips.find(t => t.id === d.trip_id);
        const v = trip ? data.vehicles.find(v => v.id === trip.vehicle_id) : null;
        const dr = trip ? data.drivers.find(dr => dr.id === trip.driver_id) : null;
        return { ...d, start_location: trip?.start_location, end_location: trip?.end_location, plate_number: v?.plate_number, driver_name: dr?.name };
      });
      if (filters.status) result = result.filter(d => d.status === filters.status);
      return result.sort((a, b) => b.id - a.id);
    },
    getDispatch: (id) => {
      const d = data.dispatches.find(x => x.id === id);
      if (!d) return null;
      const trip = data.trips.find(t => t.id === d.trip_id);
      return { ...d, start_location: trip?.start_location, end_location: trip?.end_location };
    },
    createDispatch: (fields) => {
      const d = { id: data.nextId.dispatches++, ...fields };
      data.dispatches.push(d); save();
      logAudit('CREATE', 'dispatch', d.id, `Dispatch created for trip #${d.trip_id}`, null, fields);
      return d;
    },
    updateDispatch: (id, fields) => {
      const idx = data.dispatches.findIndex(d => d.id === id);
      if (idx === -1) return null;
      const old = { ...data.dispatches[idx] };
      data.dispatches[idx] = { ...data.dispatches[idx], ...fields, id };
      save();
      logAudit('UPDATE', 'dispatch', id, `Dispatch #${id} updated`, old, data.dispatches[idx]);
      return data.dispatches[idx];
    },
    deleteDispatch: (id) => {
      data.dispatches = data.dispatches.filter(d => d.id !== id); save();
      logAudit('DELETE', 'dispatch', id, `Dispatch #${id} deleted`, null, null);
      return { success: true };
    },

    // GPS Tracking
    getLatestPositions: () => {
      const latest = {};
      data.gpsTracking.forEach(g => {
        if (!latest[g.vehicle_id] || g.id > latest[g.vehicle_id].id) latest[g.vehicle_id] = g;
      });
      return Object.values(latest).map(g => {
        const v = data.vehicles.find(x => x.id === g.vehicle_id);
        const d = g.driver_id ? data.drivers.find(x => x.id === g.driver_id) : null;
        return { ...g, plate_number: v?.plate_number, make: v?.make, model: v?.model, driver_name: d?.name };
      });
    },
    getTrackingByVehicle: (vehicleId, limit = 50) => {
      return data.gpsTracking.filter(g => g.vehicle_id === vehicleId).sort((a, b) => b.id - a.id).slice(0, limit);
    },
    getTrackingByTrip: (tripId) => {
      return data.gpsTracking.filter(g => g.trip_id === tripId).sort((a, b) => a.id - b.id);
    },
    createTrackingPoint: (data_) => {
      const g = { id: data.nextId.gpsTracking++, ...data_ };
      data.gpsTracking.push(g); save();
      return g;
    },
    getRouteHistory: (vehicleId, startDate, endDate) => {
      return data.gpsTracking.filter(g => g.vehicle_id === vehicleId && g.timestamp >= startDate && g.timestamp <= endDate).sort((a, b) => a.id - b.id);
    },

    // Geofences
    getGeofences: () => { return [...data.geofences]; },
    getGeofence: (id) => data.geofences.find(g => g.id === id),
    createGeofence: (fields) => {
      const g = { id: data.nextId.geofences++, ...fields, active: 1 };
      data.geofences.push(g); save(); return g;
    },
    updateGeofence: (id, fields) => {
      const idx = data.geofences.findIndex(g => g.id === id);
      if (idx === -1) return null;
      data.geofences[idx] = { ...data.geofences[idx], ...fields, id };
      save(); return data.geofences[idx];
    },
    deleteGeofence: (id) => { data.geofences = data.geofences.filter(g => g.id !== id); save(); return { success: true }; },
    checkGeofenceViolations: () => {
      const violations = [];
      const positions = this.getLatestPositions();
      positions.forEach(pos => {
        data.geofences.forEach(zone => {
          const R = 6371000;
          const dLat = (pos.latitude - zone.latitude) * Math.PI / 180;
          const dLng = (pos.longitude - zone.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(zone.latitude * Math.PI / 180) * Math.cos(pos.latitude * Math.PI / 180) * Math.sin(dLng/2)**2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;
          if (zone.type === 'restricted' && dist < zone.radius_meters) {
            violations.push({ vehicle_id: pos.vehicle_id, plate_number: pos.plate_number, geofence: zone.name, type: 'restricted_entry' });
          }
          if (zone.type === 'allowed' && dist > zone.radius_meters) {
            violations.push({ vehicle_id: pos.vehicle_id, plate_number: pos.plate_number, geofence: zone.name, type: 'allowed_exit' });
          }
        });
      });
      return violations;
    },

    // Alerts
    getAlerts: (filters = {}) => {
      let result = [...data.alerts].sort((a, b) => b.id - a.id);
      if (filters.type) result = result.filter(a => a.type === filters.type);
      if (filters.severity) result = result.filter(a => a.severity === filters.severity);
      if (filters.is_read !== undefined) result = result.filter(a => a.is_read === filters.is_read);
      if (filters.is_resolved !== undefined) result = result.filter(a => a.is_resolved === filters.is_resolved);
      return result;
    },
    getAlert: (id) => data.alerts.find(a => a.id === id),
    createAlert: (fields) => {
      const a = { id: data.nextId.alerts++, ...fields, is_read: 0, is_resolved: 0 };
      data.alerts.push(a); save(); return a;
    },
    markAlertRead: (id) => { const a = data.alerts.find(x => x.id === id); if (a) { a.is_read = 1; save(); } return { success: true }; },
    markAlertResolved: (id) => { const a = data.alerts.find(x => x.id === id); if (a) { a.is_resolved = 1; a.resolved_at = new Date().toISOString().slice(0, 19).replace('T', ' '); save(); } return { success: true }; },
    deleteAlert: (id) => { data.alerts = data.alerts.filter(a => a.id !== id); save(); return { success: true }; },
    getUnreadAlertCount: () => data.alerts.filter(a => !a.is_read).length,
    generateAlerts: () => {
      const count = 0;
      data.vehicles.forEach(v => {
        if (v.insurance_expiry && new Date(v.insurance_expiry) <= new Date(Date.now() + 30*86400000)) {
          if (!data.alerts.find(a => a.type === 'insurance_expiry' && a.entity_id === v.id && !a.is_resolved)) {
            data.alerts.push({ id: data.nextId.alerts++, type: 'insurance_expiry', severity: 'critical', title: `Insurance Expiring - ${v.plate_number}`, description: `Insurance for ${v.plate_number} expires on ${v.insurance_expiry}`, entity_type: 'vehicle', entity_id: v.id, is_read: 0, is_resolved: 0, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') });
          }
        }
      });
      save(); return { generated: data.alerts.length - count };
    },

    // Incidents
    getIncidents: (filters = {}) => {
      let result = [...data.incidents].map(i => {
        const v = i.vehicle_id ? data.vehicles.find(x => x.id === i.vehicle_id) : null;
        const d = i.driver_id ? data.drivers.find(x => x.id === i.driver_id) : null;
        return { ...i, plate_number: v?.plate_number, driver_name: d?.name };
      });
      if (filters.type) result = result.filter(i => i.type === filters.type);
      if (filters.severity) result = result.filter(i => i.severity === filters.severity);
      if (filters.status) result = result.filter(i => i.status === filters.status);
      return result.sort((a, b) => b.id - a.id);
    },
    getIncident: (id) => { const i = data.incidents.find(x => x.id === id); if (!i) return null; const v = i.vehicle_id ? data.vehicles.find(x => x.id === i.vehicle_id) : null; return { ...i, plate_number: v?.plate_number }; },
    createIncident: (fields) => { const i = { id: data.nextId.incidents++, ...fields }; data.incidents.push(i); save(); return i; },
    updateIncident: (id, fields) => { const idx = data.incidents.findIndex(i => i.id === id); if (idx === -1) return null; data.incidents[idx] = { ...data.incidents[idx], ...fields, id }; save(); return data.incidents[idx]; },
    deleteIncident: (id) => { data.incidents = data.incidents.filter(i => i.id !== id); save(); return { success: true }; },

    // Spare Parts
    getSpareParts: () => { return [...data.spareParts].sort((a, b) => b.id - a.id); },
    getSparePart: (id) => data.spareParts.find(s => s.id === id),
    createSparePart: (fields) => { const s = { id: data.nextId.spareParts++, ...fields }; data.spareParts.push(s); save(); return s; },
    updateSparePart: (id, fields) => { const idx = data.spareParts.findIndex(s => s.id === id); if (idx === -1) return null; data.spareParts[idx] = { ...data.spareParts[idx], ...fields, id }; save(); return data.spareParts[idx]; },
    deleteSparePart: (id) => { data.spareParts = data.spareParts.filter(s => s.id !== id); save(); return { success: true }; },
    getLowStockParts: () => data.spareParts.filter(s => s.quantity <= s.min_quantity),
    adjustPartQuantity: (id, delta) => {
      const s = data.spareParts.find(x => x.id === id);
      if (!s) return null;
      s.quantity = Math.max(0, s.quantity + delta);
      save(); return s;
    },

    // Vehicle Documents
    getDocumentsByVehicle: (vehicleId) => {
      return data.documents.filter(d => d.vehicle_id === vehicleId).map(d => {
        const v = data.vehicles.find(x => x.id === d.vehicle_id);
        return { ...d, plate_number: v?.plate_number };
      });
    },
    getDocument: (id) => data.documents.find(d => d.id === id),
    createDocument: (fields) => { const d = { id: data.nextId.documents++, ...fields }; data.documents.push(d); save(); return d; },
    deleteDocument: (id) => { data.documents = data.documents.filter(d => d.id !== id); save(); return { success: true }; },

    // Settings
    getAllSettings: () => { const obj = {}; data.settings.forEach(s => { obj[s.key] = s.value; }); return obj; },
    getSetting: (key) => { const s = data.settings.find(x => x.key === key); return s ? s.value : null; },
    setSetting: (key, value) => {
      const existing = data.settings.find(x => x.key === key);
      if (existing) existing.value = value;
      else data.settings.push({ key, value, updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') });
      save(); return { success: true };
    },
    setMultipleSettings: (settings) => {
      settings.forEach(({ key, value }) => {
        const existing = data.settings.find(x => x.key === key);
        if (existing) existing.value = value;
        else data.settings.push({ key, value, updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') });
      });
      save(); return { success: true };
    },

    // Users
    authenticateUser: (username, password) => {
      const user = data.users.find(u => u.username === username && u.password === password);
      if (!user) return null;
      return { id: user.id, username: user.username, full_name: user.full_name, role: user.role, is_active: user.is_active };
    },
    generateUniqueId: (role) => {
      const prefix = role === 'maintenance' ? 'MNT' : 'DRV';
      const existing = data.users.filter(u => u.unique_id && u.unique_id.startsWith(prefix));
      const nums = existing.map(u => parseInt(u.unique_id.split('-')[1], 10)).filter(n => !isNaN(n));
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `${prefix}-${String(next).padStart(4, '0')}`;
    },
    getUserByUniqueId: (uniqueId) => {
      const user = data.users.find(u => u.unique_id === uniqueId && u.is_active);
      if (!user) return null;
      return { id: user.id, full_name: user.full_name, role: user.role, unique_id: user.unique_id };
    },
    getUsers: () => { return data.users.map(u => ({ id: u.id, username: u.username, full_name: u.full_name, email: u.email, role: u.role, is_active: u.is_active, unique_id: u.unique_id })); },
    createUser: (fields) => {
      const u = { id: data.nextId.users++, ...fields, unique_id: null };
      data.users.push(u); save(); return { id: u.id, username: u.username, full_name: u.full_name, role: u.role, unique_id: u.unique_id };
    },
    updateUser: (id, fields) => { const idx = data.users.findIndex(u => u.id === id); if (idx === -1) return null; data.users[idx] = { ...data.users[idx], ...fields, id }; save(); return { id, username: data.users[idx].username, unique_id: data.users[idx].unique_id }; },
    deleteUser: (id) => { data.users = data.users.filter(u => u.id !== id); save(); return { success: true }; },

    // Dashboard extras
    getAlertsSummary: () => {
      const critical = data.alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
      const warning = data.alerts.filter(a => a.severity === 'warning' && !a.is_resolved).length;
      const info = data.alerts.filter(a => a.severity === 'info' && !a.is_resolved).length;
      const total = critical + warning + info;
      return { total, critical, warning, info };
    },
    getUtilizationRate: () => {
      const total = data.vehicles.filter(v => v.status !== 'retired').length;
      const active = data.vehicles.filter(v => v.status === 'active').length;
      return total > 0 ? Math.round((active / total) * 100) : 0;
    },
    getGeofenceViolationCount: () => data.alerts.filter(a => a.type === 'geofence_violation' && !a.is_resolved).length,
    getComprehensiveReport: (year, month) => {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end = `${year}-${String(month).padStart(2,'0')}-31`;
      const fuelCostMonth = data.fuel.filter(f => f.date >= start && f.date <= end).reduce((s, f) => s + f.total_cost, 0);
      const maintCostMonth = data.maintenance.filter(m => m.date >= start && m.date <= end).reduce((s, m) => s + (m.cost || 0), 0);
      const tripCountMonth = data.trips.filter(t => t.start_time && t.start_time.slice(0,10) >= start && t.start_time.slice(0,10) <= end).length;
      const dispatchCountMonth = data.dispatches.filter(d => d.created_at && d.created_at.slice(0,10) >= start && d.created_at.slice(0,10) <= end).length;

      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const fuelCostYear = data.fuel.filter(f => f.date >= yearStart && f.date <= yearEnd).reduce((s, f) => s + f.total_cost, 0);
      const maintCostYear = data.maintenance.filter(m => m.date >= yearStart && m.date <= yearEnd).reduce((s, m) => s + (m.cost || 0), 0);
      const tripCountYear = data.trips.filter(t => t.start_time && t.start_time.slice(0,10) >= yearStart && t.start_time.slice(0,10) <= yearEnd).length;
      const dispatchCountYear = data.dispatches.filter(d => d.created_at && d.created_at.slice(0,10) >= yearStart && d.created_at.slice(0,10) <= yearEnd).length;

      const totalVehicles = data.vehicles.length;
      const totalDrivers = data.drivers.length;
      const vehiclesInMaint = data.vehicles.filter(v => v.status === 'maintenance').length;
      const expiredDrivers = data.drivers.filter(d => d.license_expiry && new Date(d.license_expiry) < new Date()).length;

      const monthlyBreakdown = [];
      for (let m = 1; m <= 12; m++) {
        const ms = `${year}-${String(m).padStart(2,'0')}-01`;
        const me = `${year}-${String(m).padStart(2,'0')}-31`;
        const mf = data.fuel.filter(f => f.date >= ms && f.date <= me).reduce((s, f) => s + f.total_cost, 0);
        const mm = data.maintenance.filter(m => m.date >= ms && m.date <= me).reduce((s, m) => s + (m.cost || 0), 0);
        monthlyBreakdown.push({ month: m, fuelCost: mf, maintenanceCost: mm });
      }

      const sparePartsValue = data.spareParts.reduce((s, p) => s + ((p.unit_cost || p.unit_price || 0) * (p.quantity || 0)), 0);

      return {
        month: { fuelCost: fuelCostMonth, maintenanceCost: maintCostMonth, trips: tripCountMonth, dispatches: dispatchCountMonth },
        year: { fuelCost: fuelCostYear, maintenanceCost: maintCostYear, trips: tripCountYear, dispatches: dispatchCountYear },
        fleet: { totalVehicles, totalDrivers, vehiclesInMaintenance: vehiclesInMaint, driversExpiredLicense: expiredDrivers },
        sparePartsValue,
        monthlyBreakdown,
      };
    },
  };
})();

// Wrap all methods to return Promises (so .then() works in Electron-compatible code)
const __api = window.electronAPI;
for (const key of Object.keys(__api)) {
  if (typeof __api[key] === 'function') {
    const fn = __api[key];
    __api[key] = (...args) => {
      try {
        return Promise.resolve(fn(...args));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
}

console.log('FleetOps Manager running in browser mode (mock API)');
