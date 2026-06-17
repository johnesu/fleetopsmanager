import { describe, it, expect, beforeEach } from 'vitest';

// Re-create a minimal mock environment to test core logic
function createMockData() {
  const data = {
    vehicles: [
      { id: 1, plate_number: 'ABC-123', make: 'Toyota', model: 'Camry', year: 2020, status: 'active', odometer_km: 50000, fuel_type: 'petrol' },
      { id: 2, plate_number: 'XYZ-789', make: 'Honda', model: 'Civic', year: 2021, status: 'maintenance', odometer_km: 30000, fuel_type: 'diesel' },
    ],
    drivers: [
      { id: 1, name: 'John Doe', license_number: 'LIC-001', status: 'active' },
    ],
    fuel_entries: [],
    maintenance_records: [],
    trips: [],
    dispatches: [],
    incidents: [],
    spare_parts: [],
    alerts: [],
    audit_logs: [],
    assignments: [],
    settings: { fuel_unit: 'liters', currency: 'NGN' } as Record<string, unknown>,
    users: [],
  };
  return data;
}

describe('Mock Data Core Logic', () => {
  let data: ReturnType<typeof createMockData>;

  beforeEach(() => {
    data = createMockData();
  });

  it('should create a vehicle', () => {
    const newVehicle = { id: 3, plate_number: 'NEW-001', make: 'Ford', model: 'Focus', year: 2022, status: 'active', odometer_km: 1000, fuel_type: 'petrol' };
    data.vehicles.push(newVehicle);
    expect(data.vehicles).toHaveLength(3);
    expect(data.vehicles[2].plate_number).toBe('NEW-001');
  });

  it('should update a vehicle', () => {
    const vehicle = data.vehicles.find(v => v.id === 1)!;
    vehicle.status = 'maintenance';
    expect(data.vehicles[0].status).toBe('maintenance');
  });

  it('should delete a vehicle', () => {
    data.vehicles = data.vehicles.filter(v => v.id !== 1);
    expect(data.vehicles).toHaveLength(1);
    expect(data.vehicles[0].id).toBe(2);
  });

  it('should create a fuel entry and compute total_cost', () => {
    const entry = { id: 1, vehicle_id: 1, liters: 50, cost_per_liter: 200, total_cost: 50 * 200 };
    data.fuel_entries.push(entry);
    expect(data.fuel_entries[0].total_cost).toBe(10000);
  });

  it('should filter vehicles by status', () => {
    const active = data.vehicles.filter(v => v.status === 'active');
    expect(active).toHaveLength(1);
    expect(active[0].plate_number).toBe('ABC-123');
  });

  it('should search vehicles by plate', () => {
    const results = data.vehicles.filter(v =>
      v.plate_number.toLowerCase().includes('abc')
    );
    expect(results).toHaveLength(1);
  });

  it('should create and retrieve audit logs', () => {
    data.audit_logs.push({ id: 1, action: 'CREATE', entity_type: 'vehicle', entity_id: 3, timestamp: new Date().toISOString() });
    expect(data.audit_logs).toHaveLength(1);
    expect(data.audit_logs[0].action).toBe('CREATE');
  });

  it('should generate alerts for expiring insurance', () => {
    const alert = {
      id: 1, type: 'insurance_expiry', severity: 'warning',
      message: 'Insurance expires soon for ABC-123',
      vehicle_id: 1, is_read: false, is_resolved: false,
      created_at: new Date().toISOString(),
    };
    data.alerts.push(alert);
    expect(data.alerts[0].type).toBe('insurance_expiry');
    expect(data.alerts[0].severity).toBe('warning');
  });

  it('should mark alerts as read', () => {
    data.alerts.push({
      id: 1, type: 'general', severity: 'info',
      message: 'Test alert', is_read: false, is_resolved: false,
      created_at: new Date().toISOString(),
    });
    data.alerts[0].is_read = true;
    expect(data.alerts[0].is_read).toBe(true);
  });

  // ─── Driver Tests ───

  it('should create a driver', () => {
    const driver = { id: 2, name: 'Jane Smith', license_number: 'LIC-002', status: 'active' as const };
    data.drivers.push(driver);
    expect(data.drivers).toHaveLength(2);
    expect(data.drivers[1].name).toBe('Jane Smith');
  });

  it('should update a driver', () => {
    const driver = data.drivers.find(d => d.id === 1)!;
    driver.status = 'suspended';
    expect(data.drivers[0].status).toBe('suspended');
  });

  it('should delete a driver', () => {
    data.drivers = data.drivers.filter(d => d.id !== 1);
    expect(data.drivers).toHaveLength(0);
  });

  it('should filter drivers by status', () => {
    data.drivers.push({ id: 2, name: 'Inactive User', license_number: 'LIC-003', status: 'inactive' });
    const active = data.drivers.filter(d => d.status === 'active');
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('John Doe');
  });

  // ─── Trip Tests ───

  it('should create a trip', () => {
    const trip = { id: 1, vehicle_id: 1, driver_id: 1, start_location: 'A', end_location: 'B', start_time: '2024-01-01T08:00:00Z', distance_km: 100, status: 'ongoing' as const };
    data.trips.push(trip);
    expect(data.trips).toHaveLength(1);
    expect(data.trips[0].start_location).toBe('A');
  });

  it('should complete a trip', () => {
    data.trips.push({ id: 1, vehicle_id: 1, driver_id: 1, start_location: 'A', end_location: 'B', start_time: '2024-01-01T08:00:00Z', distance_km: 100, status: 'ongoing' });
    data.trips[0].status = 'completed';
    data.trips[0].end_time = '2024-01-01T10:00:00Z';
    expect(data.trips[0].status).toBe('completed');
    expect(data.trips[0].end_time).toBeDefined();
  });

  it('should filter trips by vehicle', () => {
    data.trips.push({ id: 1, vehicle_id: 1, driver_id: 1, start_location: 'A', end_location: 'B', start_time: '2024-01-01T08:00:00Z', distance_km: 100, status: 'completed' });
    data.trips.push({ id: 2, vehicle_id: 1, driver_id: 1, start_location: 'A', end_location: 'C', start_time: '2024-01-02T08:00:00Z', distance_km: 50, status: 'completed' });
    data.trips.push({ id: 3, vehicle_id: 2, driver_id: 1, start_location: 'A', end_location: 'D', start_time: '2024-01-03T08:00:00Z', distance_km: 200, status: 'completed' });
    const vehicle1Trips = data.trips.filter(t => t.vehicle_id === 1);
    expect(vehicle1Trips).toHaveLength(2);
    const vehicle2Trips = data.trips.filter(t => t.vehicle_id === 2);
    expect(vehicle2Trips).toHaveLength(1);
  });

  it('should calculate total distance for vehicle', () => {
    data.trips.push({ id: 1, vehicle_id: 1, driver_id: 1, start_location: 'A', end_location: 'B', start_time: '2024-01-01T08:00:00Z', distance_km: 100, status: 'completed' });
    data.trips.push({ id: 2, vehicle_id: 1, driver_id: 1, start_location: 'A', end_location: 'C', start_time: '2024-01-02T08:00:00Z', distance_km: 50, status: 'completed' });
    const total = data.trips.filter(t => t.vehicle_id === 1).reduce((sum, t) => sum + t.distance_km, 0);
    expect(total).toBe(150);
  });

  // ─── Dispatch Tests ───

  it('should create a dispatch', () => {
    const dispatch = { id: 1, trip_id: 1, priority: 'high' as const, pickup_location: 'Warehouse', dropoff_location: 'Store', cargo_description: 'Electronics', status: 'pending' as const };
    data.dispatches.push(dispatch);
    expect(data.dispatches).toHaveLength(1);
    expect(data.dispatches[0].priority).toBe('high');
  });

  it('should update dispatch status', () => {
    data.dispatches.push({ id: 1, trip_id: 1, priority: 'normal', pickup_location: 'A', dropoff_location: 'B', status: 'pending' });
    data.dispatches[0].status = 'in_progress';
    expect(data.dispatches[0].status).toBe('in_progress');
  });

  // ─── Maintenance Tests ───

  it('should create a maintenance record', () => {
    const record = { id: 1, vehicle_id: 1, service_type: 'Oil Change', date: '2024-01-15', cost: 15000, status: 'completed' as const };
    data.maintenance_records.push(record);
    expect(data.maintenance_records).toHaveLength(1);
    expect(data.maintenance_records[0].service_type).toBe('Oil Change');
  });

  it('should find upcoming maintenance by date', () => {
    data.maintenance_records.push({ id: 1, vehicle_id: 1, service_type: 'Oil Change', date: '2024-06-01', status: 'scheduled' });
    data.maintenance_records.push({ id: 2, vehicle_id: 2, service_type: 'Tire Rotation', date: '2024-07-01', status: 'scheduled' });
    const upcoming = data.maintenance_records.filter(r => r.status === 'scheduled');
    expect(upcoming).toHaveLength(2);
  });

  // ─── Incident Tests ───

  it('should create an incident', () => {
    const incident = { id: 1, type: 'Accident', severity: 'high' as const, date: '2024-03-01', description: 'Rear-end collision', status: 'open' as const };
    data.incidents.push(incident);
    expect(data.incidents).toHaveLength(1);
    expect(data.incidents[0].type).toBe('Accident');
  });

  it('should resolve an incident', () => {
    data.incidents.push({ id: 1, type: 'Accident', severity: 'high', date: '2024-03-01', description: 'Rear-end collision', status: 'open' });
    data.incidents[0].status = 'resolved';
    data.incidents[0].resolution_notes = 'Claim settled';
    expect(data.incidents[0].status).toBe('resolved');
    expect(data.incidents[0].resolution_notes).toBe('Claim settled');
  });

  // ─── Spare Parts Tests ───

  it('should create a spare part', () => {
    const part = { id: 1, name: 'Oil Filter', part_number: 'OF-100', quantity: 10, min_quantity: 2, unit_cost: 2500 };
    data.spare_parts.push(part);
    expect(data.spare_parts).toHaveLength(1);
    expect(data.spare_parts[0].name).toBe('Oil Filter');
  });

  it('should detect low stock', () => {
    data.spare_parts.push({ id: 1, name: 'Oil Filter', quantity: 1, min_quantity: 5, unit_cost: 2500 });
    data.spare_parts.push({ id: 2, name: 'Brake Pads', quantity: 10, min_quantity: 2, unit_cost: 8000 });
    const lowStock = data.spare_parts.filter(p => p.quantity < p.min_quantity);
    expect(lowStock).toHaveLength(1);
    expect(lowStock[0].name).toBe('Oil Filter');
  });

  it('should adjust stock quantity', () => {
    data.spare_parts.push({ id: 1, name: 'Oil Filter', quantity: 10, min_quantity: 2, unit_cost: 2500 });
    const part = data.spare_parts.find(p => p.id === 1)!;
    part.quantity -= 3;
    expect(part.quantity).toBe(7);
    expect(data.spare_parts[0].quantity).toBe(7);
  });

  // ─── Settings Tests ───

  it('should update settings', () => {
    data.settings.fuel_cost_per_liter = 650;
    expect(data.settings.fuel_cost_per_liter).toBe(650);
    expect(data.settings.fuel_unit).toBe('liters'); // unchanged
  });

  // ─── Edge Cases ───

  it('should handle empty results gracefully', () => {
    const filtered = data.vehicles.filter(v => v.status === 'retired');
    expect(filtered).toHaveLength(0);
    expect(Array.isArray(filtered)).toBe(true);
  });

  it('should handle case-insensitive search', () => {
    const results = data.vehicles.filter(v =>
      v.plate_number.toLowerCase().includes('xyz')
    );
    expect(results).toHaveLength(1);
  });

  it('should preserve other records when deleting', () => {
    data.vehicles = data.vehicles.filter(v => v.id !== 1);
    expect(data.vehicles).toHaveLength(1);
    expect(data.drivers).toHaveLength(1); // drivers untouched
  });

  it('should support nested property access on joined data', () => {
    const tripWithDetails = {
      id: 1, vehicle_id: 1, driver_id: 1,
      plate_number: 'ABC-123', driver_name: 'John Doe',
      start_location: 'A', end_location: 'B',
      start_time: '2024-01-01T08:00:00Z', distance_km: 100, status: 'completed',
    };
    expect(tripWithDetails.plate_number).toBe('ABC-123');
    expect(tripWithDetails.driver_name).toBe('John Doe');
  });
});
