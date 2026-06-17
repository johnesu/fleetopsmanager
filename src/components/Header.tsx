import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles: Record<string, string> = {
  '/': 'Executive Dashboard',
  '/vehicles': 'Fleet Inventory',
  '/drivers': 'Driver Management',
  '/trips': 'Trip & Dispatch System',
  '/fuel': 'Fuel Tracking',
  '/maintenance': 'Maintenance System',
  '/reports': 'Reports & Analytics',
  '/driver': 'Driver Dashboard',
  '/maintenance-dashboard': 'Maintenance Dashboard',
  '/dispatch': 'Dispatch Center',
  '/tracking': 'Live Tracking',
  '/incidents': 'Incident Center',
  '/alerts': 'Alert Center',
  '/spare-parts': 'Spare Parts',
  '/audit-log': 'Audit Log',
  '/users': 'User Management',
  '/settings': 'Settings',
};

function Header({ darkMode, setDarkMode, onMenuToggle }: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  onMenuToggle: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, userName, logout } = useAuth();

  const path = location.pathname;
  const title = pageTitles[path] || 'FleetOps Manager';

  const roleLabels: Record<string, string> = { admin: 'Admin', maintenance: 'Maint', driver: 'Driver' };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-margin h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <div className="flex items-center gap-lg">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-white/10 transition-colors" aria-label="Toggle menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden lg:flex items-center gap-xs text-on-surface-variant text-[10px] font-label-sm uppercase tracking-widest">
          <span>FleetOps</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">{title}</span>
        </div>
        <div className="hidden lg:flex items-center bg-surface-container-low px-md py-xs rounded-lg border border-white/5">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-body-md w-64 placeholder:text-on-surface-variant/50 text-on-surface" placeholder="Search fleet data..." type="text" />
        </div>
      </div>

      <div className="flex items-center gap-md">
        {role && (
          <>
            <span className="px-md py-xs bg-primary-container/30 text-primary rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider border border-primary/10">
              {roleLabels[role]}
            </span>
            <span className="text-on-surface-variant font-label-sm text-label-sm hidden sm:block">{userName}</span>
          </>
        )}
        <button onClick={() => setDarkMode(!darkMode)} className="p-xs hover:bg-white/5 rounded-full transition-colors text-on-surface-variant" aria-label="Toggle theme">
          <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <button onClick={() => { logout(); navigate('/login', { replace: true }); }} className="p-xs hover:bg-white/5 rounded-full transition-colors text-on-surface-variant" aria-label="Logout" title="Logout">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
