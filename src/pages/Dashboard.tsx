import { useState, useEffect } from 'react';
import type { DashboardStats, Incident } from '../types';

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.electronAPI.getDashboardStats().then(setStats),
      window.electronAPI.getIncidents({}).then(setIncidents),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-lg animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-lg">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-panel rounded-xl p-lg h-32 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-24 mb-md" />
              <div className="h-8 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-lg">
          <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl h-[320px] animate-pulse" />
          <div className="col-span-12 lg:col-span-8 glass-panel rounded-xl h-[350px] animate-pulse" />
        </div>
      </div>
    );
  }

  const fleetSize = stats?.totalVehicles ?? 0;
  const activeVehicles = stats?.activeVehicles ?? 0;
  const utilization = fleetSize > 0 ? Math.round((activeVehicles / fleetSize) * 100) : 0;
  const activeDrivers = stats?.activeDrivers ?? 0;
  const healthScore = Math.min(100, Math.round(((activeVehicles + activeDrivers) / ((fleetSize || 1) + (stats?.totalDrivers || 1))) * 100));

  const kpiData = [
    { label: 'Total Fleet Size', value: fleetSize.toLocaleString(), sub: 'Registered vehicles', icon: 'inventory_2', trend: `${utilization}% active`, trendColor: 'text-tertiary' },
    { label: 'Active Vehicles', value: activeVehicles.toLocaleString(), sub: 'Currently operational', icon: 'commute', trend: `${Math.round((activeVehicles / (fleetSize || 1)) * 100)}% of fleet`, trendColor: 'text-tertiary' },
    { label: 'Fleet Utilization', value: `${utilization}%`, sub: 'Efficiency target: 82%', icon: 'query_stats', trend: utilization >= 78 ? 'On track' : 'Needs improvement', trendColor: utilization >= 78 ? 'text-tertiary' : 'text-error' },
    { label: 'Active Drivers', value: activeDrivers.toLocaleString(), sub: `Out of ${stats?.totalDrivers ?? 0} total`, icon: 'badge', trend: stats?.totalDrivers ? `${Math.round((activeDrivers / stats.totalDrivers) * 100)}% active` : '', trendColor: 'text-tertiary' },
  ];

  const recentIncidents = incidents.slice(0, 5);

  return (
    <div className="space-y-lg animate-fade-in">
      {/* Row 1: KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-lg">
        {kpiData.map((kpi, i) => (
          <div key={i} className="glass-panel p-lg rounded-xl flex flex-col gap-xs hover:-translate-y-0.5 transition-transform duration-300">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-label-sm text-on-surface-variant">{kpi.label}</span>
              <span className="material-symbols-outlined text-primary text-xl">{kpi.icon}</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface">{kpi.value}</h3>
            <div className="flex items-center gap-xs mt-xs">
              <span className={`${kpi.trendColor} text-xs font-bold`}>{kpi.trend}</span>
              <span className="text-on-surface-variant text-[10px]">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Row 2: Bento Grid */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Fleet Health Score */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <div className="glass-panel p-xl rounded-xl relative overflow-hidden h-[320px] flex flex-col items-center justify-center">
            <div className="relative z-10 text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant block mb-md">Fleet Health Score</span>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8" />
                  <circle className="text-tertiary drop-shadow-[0_0_8px_rgba(78,222,163,0.5)]" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset={552.92 - (552.92 * healthScore) / 100} strokeWidth="8" />
                </svg>
                <span className="absolute font-display-lg text-display-lg text-on-surface">{healthScore}</span>
              </div>
              <p className="mt-md text-tertiary font-bold font-label-sm text-label-sm uppercase tracking-widest">
                {healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
          </div>

          {/* Executive Insights */}
          <div className="glass-panel p-lg rounded-xl flex-1 border-l-4 border-primary">
            <div className="flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">Executive Insights</h4>
            </div>
            <div className="space-y-md">
              <div className="p-md bg-primary-container/20 rounded-lg border border-primary/10">
                <p className="text-primary font-bold text-sm mb-base">Fleet Overview</p>
                <p className="text-body-md text-on-surface-variant">
                  {activeVehicles} of {fleetSize} vehicles active. {stats?.pendingMaintenance ?? 0} pending maintenance items.
                </p>
              </div>
              <div className="p-md bg-tertiary-container/20 rounded-lg border border-tertiary/10">
                <p className="text-tertiary font-bold text-sm mb-base">Driver Status</p>
                <p className="text-body-md text-on-surface-variant">
                  {activeDrivers} drivers currently active. {stats?.ongoingTrips ?? 0} trips in progress.
                </p>
              </div>
              <div className="p-md bg-surface-container-highest rounded-lg">
                <p className="text-on-surface font-bold text-sm mb-base">Maintenance</p>
                <p className="text-body-md text-on-surface-variant">
                  {stats?.vehiclesInMaintenance ?? 0} vehicles in maintenance. {stats?.pendingMaintenance ?? 0} upcoming service.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visualizations */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          {/* Fleet Utilization */}
          <div className="glass-panel p-xl rounded-xl h-[350px] flex flex-col">
            <div className="flex justify-between items-center mb-xl">
              <div>
                <h4 className="font-headline-md text-headline-md text-on-surface">Fleet Utilization</h4>
                <p className="text-on-surface-variant font-label-sm text-label-sm">Active vs Total vehicles</p>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b0c8eb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#b0c8eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,150 Q100,120 200,160 T400,100 T600,140 T800,80 T1000,120 T1200,60" fill="none" stroke="#b0c8eb" strokeLinecap="round" strokeWidth="3" />
                <path d="M0,150 Q100,120 200,160 T400,100 T600,140 T800,80 T1000,120 T1200,60 L1200,200 L0,200 Z" fill="url(#chartGradient)" />
                <line stroke="white" strokeDasharray="4" strokeOpacity="0.05" x1="0" x2="100%" y1="40" y2="40" />
                <line stroke="white" strokeDasharray="4" strokeOpacity="0.05" x1="0" x2="100%" y1="120" y2="120" />
                <line stroke="white" strokeOpacity="0.1" x1="0" x2="100%" y1="200" y2="200" />
              </svg>
              <div className="flex justify-between mt-sm text-[10px] text-on-surface-variant font-label-sm">
                <span>WEEK 1</span><span>WEEK 2</span><span>WEEK 3</span><span>WEEK 4</span><span>WEEK 5</span><span>WEEK 6</span>
              </div>
            </div>
          </div>

          {/* Region Utilization */}
          <div className="glass-panel p-xl rounded-xl h-[350px] flex flex-col">
            <div className="flex justify-between items-center mb-xl">
              <div>
                <h4 className="font-headline-md text-headline-md text-on-surface">Resource Overview</h4>
                <p className="text-on-surface-variant font-label-sm text-label-sm">Vehicles, drivers, and trips</p>
              </div>
            </div>
            <div className="flex-1 flex items-end gap-lg px-md pb-md">
              <div className="flex-1 flex flex-col gap-xs items-center group">
                <div className="w-full bg-white/5 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-48">
                  <div className="bg-primary/60 w-full" style={{ height: `${Math.min(100, ((stats?.totalVehicles ?? 0) / Math.max(stats?.totalVehicles ?? 1, stats?.totalDrivers ?? 1, stats?.totalTrips ?? 1)) * 100)}%` }} />
                  <div className="absolute top-2 w-full text-center text-[10px] text-primary font-bold">{stats?.totalVehicles ?? 0}</div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">Vehicles</span>
              </div>
              <div className="flex-1 flex flex-col gap-xs items-center group">
                <div className="w-full bg-white/5 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-56">
                  <div className="bg-tertiary/60 w-full" style={{ height: `${Math.min(100, ((stats?.totalDrivers ?? 0) / Math.max(stats?.totalVehicles ?? 1, stats?.totalDrivers ?? 1, stats?.totalTrips ?? 1)) * 100)}%` }} />
                  <div className="absolute top-2 w-full text-center text-[10px] text-tertiary font-bold">{stats?.totalDrivers ?? 0}</div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">Drivers</span>
              </div>
              <div className="flex-1 flex flex-col gap-xs items-center group">
                <div className="w-full bg-white/5 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-40">
                  <div className="bg-secondary/60 w-full" style={{ height: `${Math.min(100, ((stats?.ongoingTrips ?? 0) / Math.max(stats?.totalVehicles ?? 1, stats?.totalDrivers ?? 1, stats?.totalTrips ?? 1)) * 100)}%` }} />
                  <div className="absolute top-2 w-full text-center text-[10px] text-secondary font-bold">{stats?.ongoingTrips ?? 0}</div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">Active Trips</span>
              </div>
              <div className="flex-1 flex flex-col gap-xs items-center group">
                <div className="w-full bg-white/5 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-32">
                  <div className="bg-error/60 w-full" style={{ height: `${Math.min(100, ((stats?.vehiclesInMaintenance ?? 0) / Math.max(stats?.totalVehicles ?? 1)) * 100)}%` }} />
                  <div className="absolute top-2 w-full text-center text-[10px] text-error font-bold">{stats?.vehiclesInMaintenance ?? 0}</div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">In Maint.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="col-span-12 glass-panel p-xl rounded-xl">
          <div className="flex justify-between items-center mb-lg">
            <h4 className="font-headline-md text-headline-md text-on-surface">Recent Incidents</h4>
            {recentIncidents.filter(i => i.severity === 'critical').length > 0 && (
              <span className="px-md py-xs bg-error-container text-error rounded-full font-label-sm text-[10px] font-bold">
                {recentIncidents.filter(i => i.severity === 'critical').length} CRITICAL
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Severity</th>
                  <th className="text-left py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="text-left py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Description</th>
                  <th className="text-left py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="text-right py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentIncidents.length === 0 ? (
                  <tr><td colSpan={5} className="py-md px-lg text-on-surface-variant text-center">No recent incidents</td></tr>
                ) : recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-md px-lg">
                      <span className={`px-md py-xs rounded-full text-[10px] font-bold border ${
                        inc.severity === 'critical'
                          ? 'bg-error-container/30 text-error border-error/20'
                          : inc.severity === 'high'
                          ? 'bg-secondary-container/20 text-secondary border-secondary/20'
                          : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                      }`}>{inc.severity?.toUpperCase() || 'INFO'}</span>
                    </td>
                    <td className="py-md px-lg font-data-tabular text-data-tabular text-on-surface">{inc.type}</td>
                    <td className="py-md px-lg text-body-md text-on-surface-variant">{inc.description}</td>
                    <td className="py-md px-lg">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        inc.status === 'resolved' ? 'text-tertiary' : inc.status === 'investigating' ? 'text-error' : 'text-on-surface-variant'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inc.status === 'resolved' ? 'bg-tertiary' : inc.status === 'investigating' ? 'bg-error animate-pulse' : 'bg-on-surface-variant'
                        }`} />
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-md px-lg text-right font-data-tabular text-data-tabular text-on-surface-variant">
                      {inc.date ? new Date(inc.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
