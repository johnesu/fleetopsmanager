import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const Vehicles = lazy(() => import('./pages/Vehicles'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Trips = lazy(() => import('./pages/Trips'));
const Fuel = lazy(() => import('./pages/Fuel'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Reports = lazy(() => import('./pages/Reports'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Dispatch = lazy(() => import('./pages/Dispatch'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Incidents = lazy(() => import('./pages/Incidents'));
const SpareParts = lazy(() => import('./pages/SpareParts'));
const Settings = lazy(() => import('./pages/Settings'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const MaintenanceDashboard = lazy(() => import('./pages/MaintenanceDashboard'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('fleetops-darkmode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fleetops-darkmode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <div className={`${mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'} lg:relative lg:flex`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} mobile={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} onMenuToggle={() => setMobileSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto mt-16 p-margin">
          <div className="max-w-[1600px] mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { role } = useAuth();

  if (!role) {
    return <Routes><Route path="*" element={<Login />} /></Routes>;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Navigate to={role === 'driver' ? '/driver' : role === 'maintenance' ? '/maintenance-dashboard' : '/'} replace />} />
        <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="/vehicles" element={<ErrorBoundary><Vehicles /></ErrorBoundary>} />
        <Route path="/drivers" element={<ErrorBoundary><Drivers /></ErrorBoundary>} />
        <Route path="/trips" element={<ErrorBoundary><Trips /></ErrorBoundary>} />
        <Route path="/fuel" element={<ErrorBoundary><Fuel /></ErrorBoundary>} />
        <Route path="/maintenance" element={<ErrorBoundary><Maintenance /></ErrorBoundary>} />
        <Route path="/dispatch" element={<ErrorBoundary><Dispatch /></ErrorBoundary>} />
        <Route path="/tracking" element={<ErrorBoundary><Tracking /></ErrorBoundary>} />
        <Route path="/spare-parts" element={<ErrorBoundary><SpareParts /></ErrorBoundary>} />
        <Route path="/incidents" element={<ErrorBoundary><Incidents /></ErrorBoundary>} />
        <Route path="/alerts" element={<ErrorBoundary><Alerts /></ErrorBoundary>} />
        <Route path="/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
        <Route path="/audit-log" element={<ErrorBoundary><AuditLog /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        <Route path="/driver" element={<ErrorBoundary><DriverDashboard /></ErrorBoundary>} />
        <Route path="/maintenance-dashboard" element={<ErrorBoundary><MaintenanceDashboard /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
