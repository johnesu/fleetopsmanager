import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

const roles: { id: UserRole; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'admin', label: 'Admin', icon: '⚙️', desc: 'Full system access — enter your name to continue', color: 'from-blue-500 to-blue-600' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧', desc: 'Service records & spare parts — use your unique ID', color: 'from-amber-500 to-amber-600' },
  { id: 'driver', label: 'Driver', icon: '🚛', desc: 'Trips, vehicle & fuel logs — use your unique ID', color: 'from-emerald-500 to-emerald-600' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selectedRole || !value.trim()) return;
    setLoading(true);
    setError('');

    try {
      if (selectedRole === 'admin') {
        login('admin', value.trim());
        navigate('/', { replace: true });
      } else {
        const user = await window.electronAPI.getUserByUniqueId(value.trim().toUpperCase());
        if (!user || user.role !== selectedRole) {
          setError(`Invalid unique ID for ${selectedRole} role`);
          setLoading(false);
          return;
        }
        login(selectedRole, user.full_name);
        if (selectedRole === 'maintenance') navigate('/maintenance-dashboard', { replace: true });
        else navigate('/driver', { replace: true });
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">FleetOps Manager</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Select your role to continue</p>
        </div>

        <div className="grid gap-3 mb-4">
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => { setSelectedRole(r.id); setValue(''); setError(''); }}
              className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden ${
                selectedRole === r.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${r.color} opacity-0 hover:opacity-5 dark:hover:opacity-10 transition-opacity`} />
              <div className="relative flex items-center gap-4">
                <span className="text-3xl">{r.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === r.id ? 'border-primary bg-primary' : 'border-gray-300'
                }`}>
                  {selectedRole === r.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedRole && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {selectedRole === 'admin' ? 'Your Name' : 'Unique ID'}
            </label>
            <input
              value={value}
              onChange={e => { setValue(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder={selectedRole === 'admin' ? 'e.g. John Kamau' : selectedRole === 'maintenance' ? 'e.g. MNT-0001' : 'e.g. DRV-0001'}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || loading}
              className="mt-4 w-full py-2.5 bg-primary hover:bg-primary/80 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-on-primary rounded-lg text-sm font-medium transition-all"
            >
              {loading ? 'Signing in...' : `Continue as ${roles.find(r => r.id === selectedRole)?.label}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
