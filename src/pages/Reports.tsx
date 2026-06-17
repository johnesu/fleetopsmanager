import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportPDF, exportExcel } from '../utils/export';

const EXPENSE_COLORS = { fuel: '#3b82f6', maintenance: '#f59e0b', spareParts: '#8b5cf6' };

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReport(); }, [year, month]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.getComprehensiveReport({ year, month });
      setReport(data);
    } catch (err) {
      console.error('Report load error:', err);
      setError('Failed to load report data');
    }
    setLoading(false);
  }

  const monthLabel = months.find(m => m.value === month)?.label;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-2">{error || 'No data available'}</p>
          <button onClick={loadReport} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const { month: mData, year: yData, fleet, sparePartsValue, monthlyBreakdown } = report;
  const grandTotalMonth = mData.fuelCost + mData.maintenanceCost;
  const grandTotalYear = yData.fuelCost + yData.maintenanceCost;
  const expenseData = [
    { name: 'Fuel', value: mData.fuelCost },
    { name: 'Maintenance', value: mData.maintenanceCost },
  ].filter(e => e.value > 0);

  function buildSections() {
    const sections = [];
    sections.push({
      type: 'stats',
      items: [
        { label: 'Vehicles', value: fleet.totalVehicles },
        { label: 'Drivers', value: fleet.totalDrivers },
        { label: 'In Maintenance', value: fleet.vehiclesInMaintenance },
        { label: 'Expired Licenses', value: fleet.driversExpiredLicense },
      ],
    });
    sections.push({
      type: 'stats',
      items: [
        { label: `Fuel Cost (${monthLabel})`, value: `₦ ${mData.fuelCost.toLocaleString()}` },
        { label: `Maint Cost (${monthLabel})`, value: `₦ ${mData.maintenanceCost.toLocaleString()}` },
        { label: `Trips (${monthLabel})`, value: mData.trips },
        { label: `Dispatches (${monthLabel})`, value: mData.dispatches },
      ],
    });
    sections.push({
      type: 'stats',
      items: [
        { label: `Fuel Cost (${year})`, value: `₦ ${yData.fuelCost.toLocaleString()}` },
        { label: `Maint Cost (${year})`, value: `₦ ${yData.maintenanceCost.toLocaleString()}` },
        { label: `Trips (${year})`, value: yData.trips },
        { label: `Dispatches (${year})`, value: yData.dispatches },
      ],
    });
    sections.push({
      type: 'stats',
      items: [
        { label: `Grand Total (${monthLabel})`, value: `₦ ${grandTotalMonth.toLocaleString()}` },
        { label: `Grand Total (${year})`, value: `₦ ${grandTotalYear.toLocaleString()}` },
        { label: 'Spare Parts Value', value: `₦ ${sparePartsValue.toLocaleString()}` },
        { label: 'All-Time Grand Total', value: `₦ ${(grandTotalYear + sparePartsValue).toLocaleString()}` },
      ],
    });
    sections.push({
      title: `Monthly Breakdown ${year}`,
      type: 'table',
      columns: ['Month', 'Fuel Cost', 'Maintenance Cost', 'Total'],
      rows: monthlyBreakdown.map(m => [
        months[m.month - 1]?.label || m.month,
        `₦ ${m.fuelCost.toLocaleString()}`,
        `₦ ${m.maintenanceCost.toLocaleString()}`,
        `₦ ${(m.fuelCost + m.maintenanceCost).toLocaleString()}`,
      ]),
    });
    return sections;
  }

  function handleExportPDF() {
    exportPDF(`Fleet Report - ${monthLabel} ${year}`, buildSections());
  }

  function handleExportExcel() {
    exportExcel(`Fleet Report - ${monthLabel} ${year}`, buildSections());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Year</label>
            <select className="select-field w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Month</label>
            <select className="select-field w-36" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="pt-5">
            <p className="text-xs text-gray-400 dark:text-gray-500">{monthLabel} {year}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-5">
          <button onClick={handleExportPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            PDF
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Vehicles</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleet.totalVehicles}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fleet.vehiclesInMaintenance} under maintenance</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Drivers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleet.totalDrivers}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fleet.driversExpiredLicense} with expired license</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fuel Cost ({monthLabel})</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₦ {mData.fuelCost.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Year: ₦ {yData.fuelCost.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maintenance ({monthLabel})</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">₦ {mData.maintenanceCost.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Year: ₦ {yData.maintenanceCost.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trips ({monthLabel})</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mData.trips}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Year: {yData.trips}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dispatches ({monthLabel})</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mData.dispatches}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Year: {yData.dispatches}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spare Parts Value</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₦ {sparePartsValue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total inventory value</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Grand Total Spent</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">₦ {grandTotalMonth.toLocaleString()}</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{monthLabel} · Year: ₦ {grandTotalYear.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Expense Breakdown ({monthLabel})</h3>
          {expenseData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No expenses this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseData.map(e => <Cell key={e.name} fill={EXPENSE_COLORS[e.name.toLowerCase()] || '#6b7280'} />)}
                </Pie>
                <Tooltip formatter={(v) => [`₦ ${v.toLocaleString()}`, undefined]} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Monthly Expenses ({year})</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyBreakdown.map(m => ({ ...m, label: months[m.month - 1]?.label?.slice(0, 3) || m.month }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} formatter={(v) => [`₦ ${v.toLocaleString()}`, undefined]} />
              <Bar dataKey="fuelCost" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Fuel" stackId="a" />
              <Bar dataKey="maintenanceCost" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Maintenance" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Monthly Breakdown {year}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Month</th>
                <th className="table-header">Fuel Cost</th>
                <th className="table-header">Maintenance Cost</th>
                <th className="table-header">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyBreakdown.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-cell font-medium">{months[m.month - 1]?.label || m.month}</td>
                  <td className="table-cell">₦ {m.fuelCost.toLocaleString()}</td>
                  <td className="table-cell">₦ {m.maintenanceCost.toLocaleString()}</td>
                  <td className="table-cell font-medium">₦ {(m.fuelCost + m.maintenanceCost).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                <td className="table-header">TOTAL</td>
                <td className="table-header">₦ {yData.fuelCost.toLocaleString()}</td>
                <td className="table-header">₦ {yData.maintenanceCost.toLocaleString()}</td>
                <td className="table-header">₦ {(yData.fuelCost + yData.maintenanceCost).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
