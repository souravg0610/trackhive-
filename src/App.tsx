/**
 * App.tsx — TrackHive shell component
 *
 * Responsibilities (only these):
 *  - Route between marketing / auth / app
 *  - Compose hooks: useAuth, useDBState, usePermissions, useSearch
 *  - Render layout shell (header + sidebar + main + mobile nav)
 *  - Lazy-load tab modules so initial bundle is small
 *
 * Nothing else lives here.
 */

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Search, Bell, HelpCircle, Sparkles, Upload, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveState } from './dbState';
import { isApiConfigured } from './lib/apiClient';

import { Session } from './lib/storageKeys';
import { useAuth } from './hooks/useAuth';
import { useDBState } from './hooks/useDBState';
import { useHierarchy } from './hooks/useHierarchy';
import { usePermissions } from './hooks/usePermissions';
import { useSearch } from './hooks/useSearch';
import Sidebar from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import Auth from './components/Auth';
import TrackHiveLogo from './components/TrackHiveLogo';
import MobileApp from './MobileApp';

// FIX 4: Lazy-load all heavy tab bundles — ~40-60% initial bundle reduction
const CoreTabs_A  = lazy(() => import('./components/CoreTabs_A'));
const CoreTabs_B  = lazy(() => import('./components/CoreTabs_B'));
const CoreTabs_C  = lazy(() => import('./components/CoreTabs_C'));
const ShiftModule   = lazy(() => import('./components/ShiftModule'));
const PayrollModule = lazy(() => import('./components/PayrollModule'));
const LeaveModule   = lazy(() => import('./components/LeaveModule'));
const MarketingWS  = lazy(() => import('./pages/MarketingWS'));

const APP_VERSION = '3.1.0';

const TabSkeleton = () => (
  <div className="flex items-center justify-center h-64">
    <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  // Version-gated localStorage clear
  React.useEffect(() => {
    const stored = Session.get('APP_VERSION' as never) ?? localStorage.getItem('app_version');
    if (stored !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('app_version', APP_VERSION);
      window.location.reload();
    }
  }, []);

  const [nonAuthView, setNonAuthView] = useState<'marketing' | 'login' | 'signup'>('marketing');

  // FIX 3: Auth state extracted to hook
  const { auth, login, logout, loginAsDemo } = useAuth();
  const currentUserEmail = auth.email;

  // FIX 3 + 5: DB state + Supabase pull via hook
  // useDBState polls for JWT token internally, so safe to pass email immediately
  const { db, setDb, isSyncing } = useDBState(currentUserEmail);

  // Company branding
  const [companyLogo, setCompanyLogo] = useState<string>(() => Session.get('COMPANY_LOGO' as never) ?? '');
  const [theme] = useState<'Light' | 'Dark'>('Light');
  const [isMobile] = useState(() => window.innerWidth < 768);

  // Derived user state
  const userEmployee = useMemo(() =>
    currentUserEmail
      ? db.employees.find(e => e.email.toLowerCase() === currentUserEmail.toLowerCase())
      : null,
  [db.employees, currentUserEmail]);

  const profileName = useMemo(() => {
    if (userEmployee) return userEmployee.name;
    const stored = Session.get('USER_NAME' as never);
    return stored || currentUserEmail.split('@')[0] || 'Admin';
  }, [userEmployee, currentUserEmail]);

  const profileRole = useMemo(() => {
    // Always prefer the JWT role stored at login (from users table)
    // userEmployee.role may lag behind if Super Admin changed it
    const storedRole = Session.get('USER_ROLE' as never);
    if (storedRole) return storedRole;
    if (userEmployee) return userEmployee.role;
    return 'Field Agent';
  }, [userEmployee]);

  // FIX 3: Permission check extracted to hook
  const permissions = usePermissions(db, profileRole);

  // Hierarchy — determines which employees this user can see
  const hierarchy = useHierarchy(
    db.employees,
    currentUserEmail,
    profileRole,
    db.rolePermissions || {},
  );

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Enforce default-deny: redirect to first allowed tab if current tab not permitted
  React.useEffect(() => {
    if (!permissions.includes(activeTab)) {
      setActiveTab(permissions[0] ?? 'dashboard');
    }
  }, [profileRole, permissions, activeTab]);

  // FIX 3: Search extracted to hook (separated index build + debounced query)
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults } = useSearch(db, profileRole);

  // Notifications
  const triggerNotification = React.useCallback((
    title: string,
    description: string,
    type: string,
    priority: string,
  ) => {
    const newAlert = {
      id: `ALR-${crypto.randomUUID()}`,
      title, description,
      type: type as never,
      priority: priority as never,
      time: 'Just now',
      read: false,
    };
    setDb(prev => {
      const next = { ...prev, notifications: [newAlert, ...prev.notifications] };
      saveState(next);
      return next;
    });
    // Notification saved to local state — backend will persist via trigger
  }, [setDb]);

  const unreadCount = useMemo(
    () => db.notifications.filter(n => !n.read).length,
    [db.notifications],
  );

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedRouteEmployeeId, setSelectedRouteEmployeeId] = useState<string | null>(null);

  const jumpToRouteHistory = (employeeId: string) => {
    setSelectedRouteEmployeeId(employeeId);
    setActiveTab('routes');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setCompanyLogo(b64);
      Session.set('COMPANY_LOGO' as never, b64);
      triggerNotification('Logo Updated', 'Company logo uploaded.', 'System', 'Low');
    };
    reader.readAsDataURL(file);
  };

  const apiConnected = useMemo(() => isApiConfigured(), []);

  // ── Unauthenticated views ──────────────────────────────────
  if (!currentUserEmail) {
    if (nonAuthView === 'marketing') {
      return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <MarketingWS
            onStartSignUp={() => setNonAuthView('signup')}
            onStartLogin={() => setNonAuthView('login')}
          />
        </Suspense>
      );
    }
    return (
      <Auth
        defaultSignUp={nonAuthView === 'signup'}
        onBackToLanding={() => setNonAuthView('marketing')}
        onAuthSuccess={(email, fullName) => login(email, fullName)}
        onBypass={loginAsDemo}
      />
    );
  }

  // ── Mobile app ─────────────────────────────────────────────
  if (isMobile) return <MobileApp />;

  // ── Desktop ERP ────────────────────────────────────────────
  const mobileNavTabs = [
    { id: 'dashboard', label: 'Home', emoji: '🏠' },
    { id: 'attendance', label: 'Clock', emoji: '🕐' },
    { id: 'tasks', label: 'Tasks', emoji: '✅' },
    { id: 'visits', label: 'Visits', emoji: '📍' },
    { id: 'notifications', label: 'Alerts', emoji: '🔔' },
  ].filter(item => permissions.includes(item.id));

  const TABS_A = ['dashboard', 'employees', 'tracking', 'attendance'];
  const TABS_B = ['visits', 'tasks', 'routes', 'geofence'];
  const TABS_C = ['reports', 'documents', 'notifications', 'settings'];

  return (
    <div className={`min-h-screen flex ${theme === 'Dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800'}`}>
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={tab => { setActiveTab(tab); setSearchQuery(''); }}
          notificationsCount={unreadCount}
          onLogout={logout}
          userName={profileName}
          userRole={profileRole}
          rolePermissions={db.rolePermissions}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Header */}
        <header className="h-24 bg-slate-900 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0 border-b border-slate-700/50">
          {/* Search */}
          <div className="flex items-center flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything & redirect..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-sm font-semibold pl-10 pr-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 hover:bg-slate-800/70 transition-all font-sans"
              />
              <AnimatePresence>
                {searchQuery.trim() !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-16 left-0 w-[440px] max-h-[500px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-3xl z-[99999] p-3 space-y-3 cursor-default scrollbar-none [&::-webkit-scrollbar]:hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        Results ({searchResults.length})
                      </span>
                      <button onClick={() => setSearchQuery('')} type="button"
                        className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer">
                        Clear
                      </button>
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        No matches for <strong className="text-slate-300">"{searchQuery}"</strong>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        {(['App Sections', 'Staff Directory', 'Tasks & Visits', 'Absences & Requests'] as const).map(cat => {
                          const items = searchResults.filter(r => r.category === cat);
                          if (!items.length) return null;
                          return (
                            <div key={cat} className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{cat}</span>
                              {items.map(item => (
                                <button key={item.id} type="button"
                                  onClick={() => {
                                    setActiveTab(item.tab);
                                    setSearchQuery(item.targetQuery || '');
                                  }}
                                  className="w-full text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-transparent hover:border-slate-800 transition-all flex items-center justify-between gap-3 group cursor-pointer">
                                  <div className="leading-tight min-w-0">
                                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{item.title}</p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">{item.subtitle}</p>
                                    {item.info && <p className="text-[9px] font-mono text-emerald-500 truncate mt-1">{item.info}</p>}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center justify-center px-6 py-2.5 bg-slate-850/80 rounded-2xl border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              {companyLogo
                ? <img src={companyLogo} alt="Company logo" className="h-14 w-auto object-contain" />
                : <TrackHiveLogo className="scale-90" />
              }
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {activeTab === 'settings' && (
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <button className="p-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors">
                  <Upload className="h-5 w-5" />
                </button>
              </div>
            )}
            <button onClick={() => {
              setActiveTab('notifications');
              triggerNotification('System Check', 'All systems operational.', 'System', 'Low');
            }}
              className="relative p-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-600 ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>
            <a href="https://docs.trackhive.app" target="_blank" rel="noopener noreferrer"
              className="p-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </a>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Syncing indicator — small bar, never blocks the UI */}
          {isSyncing && (
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-emerald-600 animate-pulse" />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 text-left">
            <div className="text-left leading-none">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-sans">Main ERP Workspace</span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight mt-1 capitalize">
                {activeTab.replace('-', ' ')} Modules
              </h1>
            </div>
            <div className="flex items-center bg-slate-150 p-1 rounded-2xl border border-slate-200">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 shadow-sm flex items-center gap-1.5">
                💻 Desktop Admin ERP
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 bg-white border px-3 py-1.5 rounded-2xl shadow-sm text-[11px] font-bold text-emerald-800">
              <Sparkles className="h-4 w-4 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{apiConnected ? 'Cloud Connected' : 'Offline Mode'}</span>
            </div>
          </div>

          {/* Tab routing — all lazy-loaded */}
          <div className="animate-in fade-in duration-300 font-sans">
            <Suspense fallback={<TabSkeleton />}>
              {TABS_A.includes(activeTab) && (
                <ErrorBoundary section={activeTab}>
                  <CoreTabs_A
                    db={db} setDb={setDb} activeTab={activeTab}
                    searchQuery={searchQuery} triggerNotification={triggerNotification}
                    jumpToRouteHistory={jumpToRouteHistory}
                    selectedEmployeeId={selectedEmployeeId}
                    setSelectedEmployeeId={setSelectedEmployeeId}
                    userRole={profileRole} currentUserEmail={currentUserEmail} hierarchy={hierarchy}
                  />
                </ErrorBoundary>
              )}

              {TABS_B.includes(activeTab) && (
                <ErrorBoundary section={activeTab}>
                  <CoreTabs_B
                    db={db} setDb={setDb} activeTab={activeTab}
                    searchQuery={searchQuery} triggerNotification={triggerNotification}
                    selectedRouteEmployeeId={selectedRouteEmployeeId}
                    setSelectedRouteEmployeeId={setSelectedRouteEmployeeId}
                    userRole={profileRole} currentUserEmail={currentUserEmail} hierarchy={hierarchy}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'shifts' && (
                <ErrorBoundary section="Shifts">
                  <ShiftModule db={db} setDb={setDb} hierarchy={hierarchy} triggerNotification={triggerNotification} searchQuery={searchQuery} />
                </ErrorBoundary>
              )}

              {activeTab === 'payroll' && (
                <ErrorBoundary section="Payroll">
                  <PayrollModule db={db} setDb={setDb} triggerNotification={triggerNotification} searchQuery={searchQuery} />
                </ErrorBoundary>
              )}

              {activeTab === 'leaves' && (
                <ErrorBoundary section="Leaves">
                  <LeaveModule db={db} setDb={setDb} triggerNotification={triggerNotification} searchQuery={searchQuery} currentUserEmail={currentUserEmail} hierarchy={hierarchy} />
                </ErrorBoundary>
              )}

              {TABS_C.includes(activeTab) && (
                <ErrorBoundary section={activeTab}>
                  <CoreTabs_C
                    db={db} setDb={setDb} activeTab={activeTab}
                    searchQuery={searchQuery} triggerNotification={triggerNotification}
                    onThemeChange={() => {}}
                    userRole={profileRole} currentUserEmail={currentUserEmail} hierarchy={hierarchy}
                  />
                </ErrorBoundary>
              )}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavTabs.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 flex-1 ${
                activeTab === item.id ? 'text-emerald-400 bg-emerald-900/30' : 'text-slate-400'
              }`}>
              <span className="text-base leading-none">{item.emoji}</span>
              <span className="text-[9px] font-bold tracking-wide truncate">{item.label}</span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}