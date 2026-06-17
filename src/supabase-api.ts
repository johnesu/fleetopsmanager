import supabase from './lib/supabase'

function logAudit(action: string, entityType: string, entityId: number | null, description: string, oldValues?: unknown, newValues?: unknown) {
  Promise.resolve(supabase.from('audit_logs').insert({
    action, entity_type: entityType, entity_id: entityId,
    description,
    old_values: oldValues ? JSON.stringify(oldValues) : null,
    new_values: newValues ? JSON.stringify(newValues) : null,
  })).catch(console.error)
}

function buildFilters<T extends Record<string, unknown>>(filters?: T): { column: string; value: unknown }[] {
  if (!filters) return []
  return Object.entries(filters)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ({ column: k, value: v }))
}

const api = {
  async getVehicles() {
    const { data } = await supabase.from('vehicles').select('*').order('id', { ascending: false })
    return data || []
  },
  async getVehicle(id: number) {
    const { data } = await supabase.from('vehicles').select('*').eq('id', id).single()
    return data
  },
  async createVehicle(fields: Record<string, unknown>) {
    const { data } = await supabase.from('vehicles').insert(fields).select().single()
    if (data) logAudit('CREATE', 'vehicle', data.id, `Added vehicle ${fields.plate_number}`, null, fields)
    return data
  },
  async updateVehicle(id: number, fields: Record<string, unknown>) {
    const { data: old } = await supabase.from('vehicles').select('*').eq('id', id).single()
    const { data } = await supabase.from('vehicles').update(fields).eq('id', id).select().single()
    if (data && old) logAudit('UPDATE', 'vehicle', id, `Updated vehicle ${data.plate_number}`, old, fields)
    return data
  },
  async deleteVehicle(id: number) {
    logAudit('DELETE', 'vehicle', id, `Deleted vehicle #${id}`, null, null)
    await supabase.from('vehicles').delete().eq('id', id)
    return { success: true }
  },
  async getVehiclesByStatus(status: string) {
    const { data } = await supabase.from('vehicles').select('*').eq('status', status)
    return data || []
  },
  async getExpiringVehicles() {
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString()
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .or(`insurance_expiry.lte.${thirtyDays},license_expiry.lte.${thirtyDays}`)
    return data || []
  },

  async getDrivers() {
    const { data } = await supabase.from('drivers').select('*').order('id', { ascending: false })
    return data || []
  },
  async getDriver(id: number) {
    const { data } = await supabase.from('drivers').select('*').eq('id', id).single()
    return data
  },
  async createDriver(fields: Record<string, unknown>) {
    const { data } = await supabase.from('drivers').insert(fields).select().single()
    return data
  },
  async updateDriver(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('drivers').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteDriver(id: number) {
    await supabase.from('drivers').delete().eq('id', id)
    return { success: true }
  },
  async getExpiringLicenses() {
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString()
    const { data } = await supabase.from('drivers').select('*').lte('license_expiry', thirtyDays)
    return data || []
  },

  async getActiveAssignments() {
    const { data } = await supabase
      .from('vehicle_driver_assignments')
      .select('*, vehicles!inner(plate_number, make, model), drivers!inner(name, phone)')
      .eq('is_active', true)
    return (data || []).map((a: Record<string, unknown>) => ({
      ...a,
      plate_number: (a.vehicles as Record<string, unknown>)?.plate_number,
      make: (a.vehicles as Record<string, unknown>)?.make,
      model: (a.vehicles as Record<string, unknown>)?.model,
      driver_name: (a.drivers as Record<string, unknown>)?.name,
      phone: (a.drivers as Record<string, unknown>)?.phone,
      vehicles: undefined, drivers: undefined,
    }))
  },
  async getAssignmentsByVehicle(vehicleId: number) {
    const { data } = await supabase
      .from('vehicle_driver_assignments')
      .select('*, drivers!inner(name, license_number)')
      .eq('vehicle_id', vehicleId)
    return (data || []).map((a: Record<string, unknown>) => ({
      ...a,
      driver_name: (a.drivers as Record<string, unknown>)?.name,
      license_number: (a.drivers as Record<string, unknown>)?.license_number,
      drivers: undefined,
    }))
  },
  async getAssignmentsByDriver(driverId: number) {
    const { data } = await supabase
      .from('vehicle_driver_assignments')
      .select('*, vehicles!inner(plate_number, make, model)')
      .eq('driver_id', driverId)
    return (data || []).map((a: Record<string, unknown>) => ({
      ...a,
      plate_number: (a.vehicles as Record<string, unknown>)?.plate_number,
      make: (a.vehicles as Record<string, unknown>)?.make,
      model: (a.vehicles as Record<string, unknown>)?.model,
      vehicles: undefined,
    }))
  },
  async assignDriver(vehicleId: number, driverId: number) {
    const { data } = await supabase
      .from('vehicle_driver_assignments')
      .insert({ vehicle_id: vehicleId, driver_id: driverId, is_active: true })
      .select().single()
    return data
  },
  async unassignDriver(assignmentId: number) {
    await supabase.from('vehicle_driver_assignments')
      .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
      .eq('id', assignmentId)
    return { success: true }
  },
  async assignVehicle(driverId: number, vehicleId: number) {
    const { data } = await supabase
      .from('vehicle_driver_assignments')
      .insert({ vehicle_id: vehicleId, driver_id: driverId, is_active: true })
      .select().single()
    return data
  },
  async unassignVehicle(assignmentId: number) {
    await supabase.from('vehicle_driver_assignments')
      .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
      .eq('id', assignmentId)
    return { success: true }
  },

  async getTrips(filters?: Record<string, unknown>) {
    let q = supabase.from('trips').select('*, vehicles!inner(plate_number, make, model), drivers!inner(name)')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('id', { ascending: false })
    return (data || []).map((t: Record<string, unknown>) => ({
      ...t,
      plate_number: (t.vehicles as Record<string, unknown>)?.plate_number,
      make: (t.vehicles as Record<string, unknown>)?.make,
      model: (t.vehicles as Record<string, unknown>)?.model,
      driver_name: (t.drivers as Record<string, unknown>)?.name,
      vehicles: undefined, drivers: undefined,
    }))
  },
  async getTrip(id: number) {
    const { data } = await supabase
      .from('trips')
      .select('*, vehicles!inner(plate_number, make, model), drivers!inner(name)')
      .eq('id', id).single()
    if (!data) return null
    return {
      ...data,
      plate_number: (data.vehicles as Record<string, unknown>)?.plate_number,
      make: (data.vehicles as Record<string, unknown>)?.make,
      model: (data.vehicles as Record<string, unknown>)?.model,
      driver_name: (data.drivers as Record<string, unknown>)?.name,
      vehicles: undefined, drivers: undefined,
    }
  },
  async createTrip(fields: Record<string, unknown>) {
    const { data } = await supabase.from('trips').insert(fields).select().single()
    if (data) logAudit('CREATE', 'trip', data.id, `Created trip: ${fields.start_location} → ${fields.end_location}`, null, fields)
    return data
  },
  async updateTrip(id: number, fields: Record<string, unknown>) {
    const { data: old } = await supabase.from('trips').select('*').eq('id', id).single()
    const { data } = await supabase.from('trips').update(fields).eq('id', id).select().single()
    if (data) logAudit('UPDATE', 'trip', id, `Updated trip #${id}`, old, fields)
    return data
  },
  async deleteTrip(id: number) {
    logAudit('DELETE', 'trip', id, `Deleted trip #${id}`, null, null)
    await supabase.from('trips').delete().eq('id', id)
    return { success: true }
  },
  async getTripsByVehicle(vehicleId: number) {
    const { data } = await supabase.from('trips').select('*').eq('vehicle_id', vehicleId).order('id', { ascending: false })
    return data || []
  },

  async getFuelEntries(filters?: Record<string, unknown>) {
    let q = supabase.from('fuel_entries').select('*, vehicles!inner(plate_number)')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('id', { ascending: false })
    return (data || []).map((e: Record<string, unknown>) => ({
      ...e,
      plate_number: (e.vehicles as Record<string, unknown>)?.plate_number,
      vehicles: undefined,
    }))
  },
  async createFuelEntry(fields: Record<string, unknown>) {
    const { data } = await supabase.from('fuel_entries').insert(fields).select().single()
    return data
  },
  async updateFuelEntry(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('fuel_entries').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteFuelEntry(id: number) {
    await supabase.from('fuel_entries').delete().eq('id', id)
    return { success: true }
  },
  async getFuelReport(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('fuel_entries')
      .select('*, vehicles!inner(plate_number)')
      .gte('date', start).lte('date', end)
    return (data || []).map((e: Record<string, unknown>) => ({
      ...e,
      plate_number: (e.vehicles as Record<string, unknown>)?.plate_number,
      vehicles: undefined,
    }))
  },

  async getMaintenanceRecords(filters?: Record<string, unknown>) {
    let q = supabase.from('maintenance_records').select('*, vehicles!inner(plate_number, make, model)')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('id', { ascending: false })
    return (data || []).map((r: Record<string, unknown>) => ({
      ...r,
      plate_number: (r.vehicles as Record<string, unknown>)?.plate_number,
      make: (r.vehicles as Record<string, unknown>)?.make,
      model: (r.vehicles as Record<string, unknown>)?.model,
      vehicles: undefined,
    }))
  },
  async createMaintenanceRecord(fields: Record<string, unknown>) {
    const { data } = await supabase.from('maintenance_records').insert(fields).select().single()
    return data
  },
  async updateMaintenanceRecord(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('maintenance_records').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteMaintenanceRecord(id: number) {
    await supabase.from('maintenance_records').delete().eq('id', id)
    return { success: true }
  },
  async getUpcomingMaintenance() {
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString()
    const { data } = await supabase
      .from('maintenance_records')
      .select('*, vehicles!inner(plate_number)')
      .lte('next_service_date', thirtyDays)
      .neq('status', 'completed')
    return (data || []).map((r: Record<string, unknown>) => ({
      ...r,
      plate_number: (r.vehicles as Record<string, unknown>)?.plate_number,
      vehicles: undefined,
    }))
  },

  async getDispatches(filters?: Record<string, unknown>) {
    let q = supabase.from('dispatches').select('*, trips!inner(vehicle_id, driver_id, start_location, end_location)')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('id', { ascending: false })
    return (data || []).map((d: Record<string, unknown>) => ({
      ...d,
      ...((d.trips || {}) as Record<string, unknown>),
      trips: undefined,
    }))
  },
  async getDispatch(id: number) {
    const { data } = await supabase.from('dispatches').select('*').eq('id', id).single()
    return data
  },
  async createDispatch(fields: Record<string, unknown>) {
    const { data } = await supabase.from('dispatches').insert(fields).select().single()
    return data
  },
  async updateDispatch(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('dispatches').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteDispatch(id: number) {
    await supabase.from('dispatches').delete().eq('id', id)
    return { success: true }
  },

  async getLatestPositions() {
    const { data: vehicles } = await supabase.from('vehicles').select('id')
    if (!vehicles) return []
    const positions = []
    for (const v of vehicles) {
      const { data } = await supabase
        .from('gps_tracking')
        .select('*')
        .eq('vehicle_id', v.id)
        .order('timestamp', { ascending: false })
        .limit(1)
      if (data?.[0]) positions.push(data[0])
    }
    return positions
  },
  async getTrackingByVehicle(vehicleId: number, limit = 100) {
    const { data } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    return data || []
  },
  async getTrackingByTrip(tripId: number) {
    const { data } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true })
    return data || []
  },
  async createTrackingPoint(fields: Record<string, unknown>) {
    const { data } = await supabase.from('gps_tracking').insert(fields).select().single()
    return data
  },
  async getRouteHistory(vehicleId: number, startDate: string, endDate: string) {
    const { data } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('timestamp', startDate).lte('timestamp', endDate)
      .order('timestamp', { ascending: true })
    return data || []
  },

  async getGeofences() {
    const { data } = await supabase.from('geofences').select('*')
    return data || []
  },
  async getGeofence(id: number) {
    const { data } = await supabase.from('geofences').select('*').eq('id', id).single()
    return data
  },
  async createGeofence(fields: Record<string, unknown>) {
    const { data } = await supabase.from('geofences').insert(fields).select().single()
    return data
  },
  async updateGeofence(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('geofences').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteGeofence(id: number) {
    await supabase.from('geofences').delete().eq('id', id)
    return { success: true }
  },
  async checkGeofenceViolations() {
    const { data: geofences } = await supabase.from('geofences').select('*').eq('active', true)
    const { data: positions } = await supabase.from('gps_tracking').select('*').order('timestamp', { ascending: false }).limit(50)
    const violations: { geofence: unknown; vehicle: unknown }[] = []
    for (const g of geofences || []) {
      for (const p of positions || []) {
        const dist = Math.sqrt(
          Math.pow((p.latitude - g.latitude) * 111320, 2) +
          Math.pow((p.longitude - g.longitude) * 111320 * Math.cos(g.latitude * Math.PI / 180), 2)
        )
        if (g.type === 'restricted' && dist < g.radius_meters) {
          violations.push({ geofence: g, vehicle: p })
        }
      }
    }
    return violations
  },

  async getAlerts(filters?: Record<string, unknown>) {
    let q = supabase.from('alerts').select('*')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('created_at', { ascending: false })
    return data || []
  },
  async getAlert(id: number) {
    const { data } = await supabase.from('alerts').select('*').eq('id', id).single()
    return data
  },
  async createAlert(fields: Record<string, unknown>) {
    const { data } = await supabase.from('alerts').insert(fields).select().single()
    return data
  },
  async markAlertRead(id: number) {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id)
    return { success: true }
  },
  async markAlertResolved(id: number) {
    await supabase.from('alerts').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    return { success: true }
  },
  async markAllAlertsRead() {
    await supabase.from('alerts').update({ is_read: true }).eq('is_read', false)
    return { success: true }
  },
  async resolveAlert(id: number) {
    await supabase.from('alerts').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    return { success: true }
  },
  async deleteAlert(id: number) {
    await supabase.from('alerts').delete().eq('id', id)
    return { success: true }
  },
  async getUnreadAlertCount() {
    const { count } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_read', false)
    return count || 0
  },
  async generateAlerts() {
    return { generated: 0 }
  },

  async getIncidents(filters?: Record<string, unknown>) {
    let q = supabase.from('incidents').select('*, vehicles!inner(plate_number), drivers!inner(name)')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('created_at', { ascending: false })
    return (data || []).map((i: Record<string, unknown>) => ({
      ...i,
      plate_number: (i.vehicles as Record<string, unknown>)?.plate_number,
      driver_name: (i.drivers as Record<string, unknown>)?.name,
      vehicles: undefined, drivers: undefined,
    }))
  },
  async getIncident(id: number) {
    const { data } = await supabase
      .from('incidents')
      .select('*, vehicles!inner(plate_number), drivers!inner(name)')
      .eq('id', id).single()
    if (!data) return null
    return {
      ...data,
      plate_number: (data.vehicles as Record<string, unknown>)?.plate_number,
      driver_name: (data.drivers as Record<string, unknown>)?.name,
      vehicles: undefined, drivers: undefined,
    }
  },
  async createIncident(fields: Record<string, unknown>) {
    const { data } = await supabase.from('incidents').insert(fields).select().single()
    return data
  },
  async updateIncident(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('incidents').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteIncident(id: number) {
    await supabase.from('incidents').delete().eq('id', id)
    return { success: true }
  },

  async getSpareParts() {
    const { data } = await supabase.from('spare_parts').select('*')
    return data || []
  },
  async getSparePart(id: number) {
    const { data } = await supabase.from('spare_parts').select('*').eq('id', id).single()
    return data
  },
  async createSparePart(fields: Record<string, unknown>) {
    const { data } = await supabase.from('spare_parts').insert(fields).select().single()
    return data
  },
  async updateSparePart(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('spare_parts').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteSparePart(id: number) {
    await supabase.from('spare_parts').delete().eq('id', id)
    return { success: true }
  },
  async getLowStockParts() {
    const { data } = await supabase.from('spare_parts').select('*')
    return (data || []).filter((p: Record<string, unknown>) => (p.quantity as number) <= (p.min_quantity as number))
  },
  async adjustPartQuantity(id: number, delta: number) {
    const { data: part } = await supabase.from('spare_parts').select('quantity').eq('id', id).single()
    if (!part) return null
    const newQty = (part.quantity || 0) + delta
    const { data } = await supabase.from('spare_parts').update({ quantity: Math.max(0, newQty) }).eq('id', id).select().single()
    return data
  },
  async adjustStock(id: number, delta: number) {
    return this.adjustPartQuantity(id, delta) as Promise<void>
  },

  async getDocumentsByVehicle(vehicleId: number) {
    const { data } = await supabase.from('vehicle_documents').select('*').eq('vehicle_id', vehicleId)
    return data || []
  },
  async getDocument(id: number) {
    const { data } = await supabase.from('vehicle_documents').select('*').eq('id', id).single()
    return data
  },
  async createDocument(fields: Record<string, unknown>) {
    const { data } = await supabase.from('vehicle_documents').insert(fields).select().single()
    return data
  },
  async deleteDocument(id: number) {
    await supabase.from('vehicle_documents').delete().eq('id', id)
    return { success: true }
  },

  async getAllSettings() {
    const { data } = await supabase.from('settings').select('*')
    const result: Record<string, string> = {}
    for (const s of data || []) {
      result[(s as Record<string, unknown>).key as string] = (s as Record<string, unknown>).value as string
    }
    return result
  },
  async getSetting(key: string) {
    const { data } = await supabase.from('settings').select('value').eq('key', key).single()
    return data?.value || null
  },
  async setSetting(key: string, value: string) {
    await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
    return { success: true }
  },
  async setMultipleSettings(settings: { key: string; value: string }[]) {
    const now = new Date().toISOString()
    for (const s of settings) {
      await supabase.from('settings').upsert({ ...s, updated_at: now })
    }
    return { success: true }
  },
  async getSettings() {
    const all = await this.getAllSettings()
    return all as Record<string, unknown>
  },
  async updateSettings(settings: Record<string, unknown>) {
    const entries = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }))
    return this.setMultipleSettings(entries)
  },
  async resetAllData() {
    const tables = ['vehicles', 'drivers', 'trips', 'fuel_entries', 'maintenance_records', 'dispatches',
      'gps_tracking', 'geofences', 'alerts', 'incidents', 'spare_parts', 'audit_logs', 'vehicle_documents',
      'vehicle_driver_assignments', 'settings', 'users']
    for (const t of tables) {
      await supabase.from(t).delete().neq('id', 0)
    }
    return { success: true }
  },

  async authenticateUser(username: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    })
    if (error || !data.user) return null
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', username)
      .single()
    return user || null
  },
  async getUsers() {
    const { data } = await supabase.from('users').select('*')
    return data || []
  },
  async createUser(fields: Record<string, unknown>) {
    const { data } = await supabase.from('users').insert(fields).select().single()
    return data
  },
  async updateUser(id: number, fields: Record<string, unknown>) {
    const { data } = await supabase.from('users').update(fields).eq('id', id).select().single()
    return data
  },
  async deleteUser(id: number) {
    await supabase.from('users').delete().eq('id', id)
    return { success: true }
  },
  async generateUniqueId(role: string) {
    const prefix = role === 'maintenance' ? 'MNT' : 'DRV'
    const { data: users } = await supabase.from('users').select('unique_id').like('unique_id', `${prefix}-%`)
    const nums = (users || []).map((u: Record<string, unknown>) => parseInt((u.unique_id as string || '').split('-')[1], 10)).filter(n => !isNaN(n))
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `${prefix}-${String(next).padStart(4, '0')}`
  },
  async getUserByUniqueId(uniqueId: string) {
    const { data: user } = await supabase.from('users').select('id, full_name, role, unique_id').eq('unique_id', uniqueId).eq('is_active', true).single()
    if (!user) return null
    return { id: user.id, full_name: user.full_name, role: user.role, unique_id: user.unique_id }
  },

  async getDashboardStats() {
    const [vehicles, drivers, trips, maintenance, fuel, alerts] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('drivers').select('*'),
      supabase.from('trips').select('*'),
      supabase.from('maintenance_records').select('*'),
      supabase.from('fuel_entries').select('*'),
      supabase.from('alerts').select('*'),
    ])
    const totalFuel = (fuel.data || []).reduce((s: number, e: Record<string, unknown>) => s + (e.total_cost as number || 0), 0)
    return {
      totalVehicles: vehicles.data?.length || 0,
      activeVehicles: (vehicles.data || []).filter((v: Record<string, unknown>) => v.status === 'active').length,
      totalDrivers: drivers.data?.length || 0,
      availableDrivers: (drivers.data || []).filter((d: Record<string, unknown>) => d.availability === 'available').length,
      activeTrips: (trips.data || []).filter((t: Record<string, unknown>) => t.status === 'ongoing').length,
      completedTrips: (trips.data || []).filter((t: Record<string, unknown>) => t.status === 'completed').length,
      pendingMaintenance: (maintenance.data || []).filter((m: Record<string, unknown>) => m.status === 'scheduled').length,
      totalFuelCost: totalFuel,
      unreadAlerts: (alerts.data || []).filter((a: Record<string, unknown>) => !a.is_read).length,
    }
  },
  async getMonthlyFuelReport(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('fuel_entries')
      .select('*, vehicles!inner(plate_number)')
      .gte('date', start).lte('date', end)
    return (data || []).map((e: Record<string, unknown>) => ({
      ...e,
      plate_number: (e.vehicles as Record<string, unknown>)?.plate_number,
      vehicles: undefined,
    }))
  },
  async getVehicleUsageReport(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    const end = new Date(year, month, 0).toISOString()
    const { data } = await supabase
      .from('trips')
      .select('*, vehicles!inner(plate_number)')
      .or(`start_time.gte.${start},start_time.lte.${end}`)
    return (data || []).map((t: Record<string, unknown>) => ({
      ...t,
      plate_number: (t.vehicles as Record<string, unknown>)?.plate_number,
      vehicles: undefined,
    }))
  },
  async getMaintenanceSummary(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('maintenance_records')
      .select('*, vehicles!inner(plate_number)')
      .gte('date', start).lte('date', end)
    return (data || []).map((m: Record<string, unknown>) => ({
      ...m,
      plate_number: (m.vehicles as Record<string, unknown>)?.plate_number,
      vehicles: undefined,
    }))
  },
  async getDriverPerformance(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    const end = new Date(year, month, 0).toISOString()
    const { data } = await supabase
      .from('trips')
      .select('*, drivers!inner(name)')
      .or(`start_time.gte.${start},start_time.lte.${end}`)
    return (data || []).map((t: Record<string, unknown>) => ({
      ...t,
      driver_name: (t.drivers as Record<string, unknown>)?.name,
      drivers: undefined,
    }))
  },
  async getAlertsSummary() {
    const { data } = await supabase.from('alerts').select('*')
    const alerts = data || []
    return {
      total: alerts.length,
      critical: alerts.filter((a: Record<string, unknown>) => a.severity === 'critical').length,
      warning: alerts.filter((a: Record<string, unknown>) => a.severity === 'warning').length,
      info: alerts.filter((a: Record<string, unknown>) => a.severity === 'info').length,
    }
  },
  async getUtilizationRate() {
    const { count: total } = await supabase.from('vehicles').select('*', { count: 'exact', head: true })
    const { count: active } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'active')
    return total ? (active || 0) / total : 0
  },
  async getGeofenceViolationCount() {
    const { count } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('type', 'geofence_violation').eq('is_resolved', false)
    return count || 0
  },
  async getComprehensiveReport(year: number, month: number) {
    const [fuel, trips, maintenance, alerts] = await Promise.all([
      this.getMonthlyFuelReport(year, month),
      this.getVehicleUsageReport(year, month),
      this.getMaintenanceSummary(year, month),
      this.getAlertsSummary(),
    ])
    return { fuel, trips, maintenance, alerts }
  },

  async getAuditLogs(filters?: Record<string, unknown>) {
    let q = supabase.from('audit_logs').select('*')
    for (const f of buildFilters(filters)) {
      q = q.eq(f.column, f.value)
    }
    const { data } = await q.order('created_at', { ascending: false })
    return data || []
  },
  async createAuditEntry(entry: Record<string, unknown>) {
    const { data } = await supabase.from('audit_logs').insert(entry).select().single()
    return data
  },
}

export default api
