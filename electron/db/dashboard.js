export function registerDashboardHandlers(db, ipcMain) {
  ipcMain.handle('dashboard:getStats', () => {
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
    const activeVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'").get().count;
    const totalDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
    const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'active'").get().count;
    const ongoingTrips = db.prepare("SELECT COUNT(*) as count FROM trips WHERE status = 'ongoing'").get().count;
    const totalTrips = db.prepare('SELECT COUNT(*) as count FROM trips').get().count;
    const pendingMaintenance = db.prepare("SELECT COUNT(*) as count FROM maintenance_records WHERE status = 'scheduled'").get().count;
    const monthlyFuelCost = db.prepare(`
      SELECT COALESCE(SUM(total_cost), 0) as cost
      FROM fuel_entries
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get().cost;
    const vehiclesInMaintenance = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'").get().count;
    const expiringInsurance = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE insurance_expiry <= datetime('now', '+30 days')").get().count;
    const expiringLicense = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE license_expiry <= datetime('now', '+30 days')").get().count;
    const expiringDriverLicense = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE license_expiry <= datetime('now', '+30 days')").get().count;

    return {
      totalVehicles, activeVehicles, vehiclesInMaintenance,
      totalDrivers, activeDrivers,
      totalTrips, ongoingTrips,
      pendingMaintenance,
      monthlyFuelCost,
      expiringInsurance, expiringLicense, expiringDriverLicense,
    };
  });

  ipcMain.handle('dashboard:monthlyFuelReport', (_e, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return db.prepare(`
      SELECT v.plate_number, v.make, v.model,
        SUM(f.liters) as total_liters,
        SUM(f.total_cost) as total_cost,
        AVG(f.cost_per_liter) as avg_cost_per_liter,
        COUNT(f.id) as entries
      FROM fuel_entries f
      JOIN vehicles v ON v.id = f.vehicle_id
      WHERE date(f.date) >= ? AND date(f.date) <= ?
      GROUP BY f.vehicle_id
      ORDER BY total_cost DESC
    `).all(startDate, endDate);
  });

  ipcMain.handle('dashboard:vehicleUsageReport', (_e, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return db.prepare(`
      SELECT v.plate_number, v.make, v.model,
        COUNT(t.id) as trip_count,
        COALESCE(SUM(t.distance_km), 0) as total_distance,
        COALESCE(SUM(f.total_cost), 0) as fuel_cost
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id = v.id AND date(t.start_time) BETWEEN ? AND ?
      LEFT JOIN fuel_entries f ON f.vehicle_id = v.id AND date(f.date) BETWEEN ? AND ?
      GROUP BY v.id
      ORDER BY total_distance DESC
    `).all(startDate, endDate, startDate, endDate);
  });

  ipcMain.handle('dashboard:maintenanceSummary', (_e, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return db.prepare(`
      SELECT m.service_type,
        COUNT(m.id) as count,
        COALESCE(SUM(m.cost), 0) as total_cost,
        v.plate_number
      FROM maintenance_records m
      JOIN vehicles v ON v.id = m.vehicle_id
      WHERE date(m.date) BETWEEN ? AND ?
      GROUP BY m.service_type
      ORDER BY total_cost DESC
    `).all(startDate, endDate);
  });

  ipcMain.handle('dashboard:getAlertsSummary', () => {
    return {
      critical: db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND is_resolved = 0").get().count,
      warning: db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'warning' AND is_resolved = 0").get().count,
      info: db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'info' AND is_resolved = 0").get().count,
      total: db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_resolved = 0').get().count,
    };
  });

  ipcMain.handle('dashboard:getUtilizationRate', () => {
    const total = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status != "retired"').get().count;
    if (total === 0) return { rate: 0, active: 0, total: 0 };
    const active = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'").get().count;
    return { rate: Math.round((active / total) * 100), active, total };
  });

  ipcMain.handle('dashboard:getGeofenceViolations', () => {
    return db.prepare("SELECT COUNT(*) as count FROM alerts WHERE type = 'geofence_violation' AND is_resolved = 0").get().count;
  });

  ipcMain.handle('dashboard:driverPerformance', (_e, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return db.prepare(`
      SELECT d.id, d.name,
        COUNT(t.id) as trip_count,
        COALESCE(SUM(t.distance_km), 0) as total_distance,
        v.plate_number, v.make, v.model
      FROM drivers d
      LEFT JOIN trips t ON t.driver_id = d.id AND date(t.start_time) BETWEEN ? AND ?
      LEFT JOIN vehicles v ON v.id = t.vehicle_id
      GROUP BY d.id
      ORDER BY total_distance DESC
    `).all(startDate, endDate);
  });

  ipcMain.handle('dashboard:getComprehensiveReport', (_e, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    // Monthly aggregates
    const fuelCostMonth = db.prepare(`SELECT COALESCE(SUM(total_cost), 0) as total FROM fuel_entries WHERE date >= ? AND date <= ?`).get(startDate, endDate).total;
    const maintCostMonth = db.prepare(`SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_records WHERE date >= ? AND date <= ?`).get(startDate, endDate).total;
    const tripCountMonth = db.prepare(`SELECT COUNT(*) as count FROM trips WHERE start_time >= ? AND start_time < ?`).get(startDate, `${year}-${String(nextMonth).padStart(2, '0')}-01`).count;
    const dispatchCountMonth = db.prepare(`SELECT COUNT(*) as count FROM dispatches WHERE created_at >= ? AND created_at < ?`).get(startDate, `${year}-${String(nextMonth).padStart(2, '0')}-01`).count;

    // Yearly aggregates
    const fuelCostYear = db.prepare(`SELECT COALESCE(SUM(total_cost), 0) as total FROM fuel_entries WHERE date >= ? AND date <= ?`).get(yearStart, yearEnd).total;
    const maintCostYear = db.prepare(`SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_records WHERE date >= ? AND date <= ?`).get(yearStart, yearEnd).total;
    const tripCountYear = db.prepare(`SELECT COUNT(*) as count FROM trips WHERE start_time >= ? AND start_time < ?`).get(yearStart, `${year + 1}-01-01`).count;
    const dispatchCountYear = db.prepare(`SELECT COUNT(*) as count FROM dispatches WHERE created_at >= ? AND created_at < ?`).get(yearStart, `${year + 1}-01-01`).count;

    // Fleet stats
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
    const totalDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
    const vehiclesInMaint = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'").get().count;
    const expiredDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE license_expiry < date('now')").get().count;

    // Monthly breakdown for chart
    const monthlyBreakdown = [];
    for (let m = 1; m <= 12; m++) {
      const ms = `${year}-${String(m).padStart(2, '0')}-01`;
      const me = `${year}-${String(m).padStart(2, '0')}-31`;
      const mf = db.prepare(`SELECT COALESCE(SUM(total_cost), 0) as total FROM fuel_entries WHERE date >= ? AND date <= ?`).get(ms, me).total;
      const mm = db.prepare(`SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_records WHERE date >= ? AND date <= ?`).get(ms, me).total;
      monthlyBreakdown.push({ month: m, fuelCost: mf, maintenanceCost: mm });
    }

    // Spare parts total value
    const sparePartsValue = db.prepare(`SELECT COALESCE(SUM(unit_cost * quantity), 0) as total FROM spare_parts`).get().total;

    return {
      month: { fuelCost: fuelCostMonth, maintenanceCost: maintCostMonth, trips: tripCountMonth, dispatches: dispatchCountMonth },
      year: { fuelCost: fuelCostYear, maintenanceCost: maintCostYear, trips: tripCountYear, dispatches: dispatchCountYear },
      fleet: { totalVehicles, totalDrivers, vehiclesInMaintenance: vehiclesInMaint, driversExpiredLicense: expiredDrivers },
      sparePartsValue,
      monthlyBreakdown,
    };
  });
}
