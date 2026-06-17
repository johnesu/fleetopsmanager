import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const adminNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/vehicles', label: 'Vehicles', icon: 'local_shipping' },
  { path: '/drivers', label: 'Drivers', icon: 'person_apron' },
  { path: '/dispatch', label: 'Dispatch', icon: 'route' },
  { path: '/trips', label: 'Trips', icon: 'map' },
  { path: '/tracking', label: 'Live Tracking', icon: 'satellite_alt' },
  { path: '/fuel', label: 'Fuel', icon: 'local_gas_station' },
  { path: '/maintenance', label: 'Maintenance', icon: 'build' },
  { path: '/spare-parts', label: 'Spare Parts', icon: 'inventory' },
  { path: '/incidents', label: 'Incidents', icon: 'warning' },
  { path: '/alerts', label: 'Alerts', icon: 'notifications' },
  { path: '/reports', label: 'Reports', icon: 'assessment' },
  { path: '/audit-log', label: 'Audit Log', icon: 'history' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const driverNavItems: NavItem[] = [
  { path: '/driver', label: 'Dashboard', icon: 'dashboard' },
  { path: '/trips', label: 'Trips', icon: 'map' },
  { path: '/fuel', label: 'Fuel', icon: 'local_gas_station' },
  { path: '/tracking', label: 'Live Tracking', icon: 'satellite_alt' },
  { path: '/alerts', label: 'Alerts', icon: 'notifications' },
  { path: '/incidents', label: 'Incidents', icon: 'warning' },
];

const maintenanceNavItems: NavItem[] = [
  { path: '/maintenance-dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/maintenance', label: 'Maintenance', icon: 'build' },
  { path: '/spare-parts', label: 'Spare Parts', icon: 'inventory' },
  { path: '/vehicles', label: 'Vehicles', icon: 'local_shipping' },
  { path: '/alerts', label: 'Alerts', icon: 'notifications' },
  { path: '/incidents', label: 'Incidents', icon: 'warning' },
];

function Sidebar({ collapsed, onToggle, mobile, onMobileClose }: {
  collapsed: boolean;
  onToggle: () => void;
  mobile: boolean;
  onMobileClose: () => void;
}) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const navItems = role === 'driver' ? driverNavItems : role === 'maintenance' ? maintenanceNavItems : adminNavItems;
  const isAdmin = role === 'admin';

  function handleNavClick() {
    if (mobile) onMobileClose();
  }

  return (
    <aside className={`relative flex flex-col bg-surface-container/80 backdrop-blur-2xl border-r border-white/5 shadow-2xl transition-all duration-200 ${
      collapsed ? 'w-[72px]' : 'w-[280px]'
    }`}>
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-white/5 gap-2 ${collapsed ? 'justify-center' : 'px-lg'}`}>
        <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded object-cover flex-shrink-0" onError={() => console.error('Logo failed')} />
        {!collapsed && <span className="font-headline-md text-headline-md font-bold text-primary">FleetOps</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-sm space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/' || item.path === '/driver' || item.path === '/maintenance-dashboard'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-md px-lg py-sm rounded-lg transition-all duration-200 group ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'text-primary bg-primary-container/20 border-l-4 border-primary translate-x-0.5'
                  : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {!collapsed && <span className="font-label-sm text-label-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`border-t border-white/5 pt-md pb-lg px-sm space-y-1 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {!collapsed && isAdmin && (
          <div className="flex gap-2 px-sm pb-2">
            <button onClick={() => { navigate('/driver'); handleNavClick(); }} className="flex-1 text-center text-[10px] py-1.5 rounded-lg bg-white/5 text-on-surface-variant hover:bg-white/10 transition-colors font-label-sm">
              Driver
            </button>
            <button onClick={() => { navigate('/maintenance-dashboard'); handleNavClick(); }} className="flex-1 text-center text-[10px] py-1.5 rounded-lg bg-white/5 text-on-surface-variant hover:bg-white/10 transition-colors font-label-sm">
              Maint
            </button>
          </div>
        )}
        <NavLink to="/settings" onClick={handleNavClick} className={({ isActive }) =>
          `flex items-center gap-md px-lg py-sm rounded-lg transition-all duration-200 ${
            collapsed ? 'justify-center' : ''
          } ${
            isActive ? 'text-primary bg-primary-container/20' : 'text-on-surface-variant hover:bg-white/10'
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          {!collapsed && <span className="font-label-sm text-label-sm">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
