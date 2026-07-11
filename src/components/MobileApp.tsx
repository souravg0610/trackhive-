import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, MapPin, Calendar, CheckSquare, Bell,
  Settings, LogOut, Menu, X, ChevronRight, Plus, Clock,
  MoreHorizontal, TrendingUp, Shield, Briefcase, FileText,
  Phone, Mail, Navigation, Home, BarChart2, UserCheck,
  AlertCircle, Check, Pencil, Eye, Filter, Search,
  ArrowLeft, RefreshCw, Building2, CreditCard, GitBranch
} from 'lucide-react';
import { DBState } from '../dbState';
import { Employee } from '../types';
import { apiUpdateEmployee } from '../lib/apiClient';
async function saveEmployee(e: Employee): Promise<string | null> {
  try { await apiUpdateEmployee(e.id, e as unknown as Record<string, unknown>); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}

interface MobileAppProps {
  db: DBState;
  setDb: React.Dispatch<React.SetStateAction<DBState>>;
  currentUserEmail: string;
  currentUserName: string;
  userRole: string;
  onLogout: () => void;
  triggerNotification: (title: string, desc: string, type: any, priority: any) => void;
}

type MobileScreen =
  | 'dashboard' | 'attendance' | 'punch-history'
  | 'employees' | 'tracking' | 'shifts' | 'payroll'
  | 'leaves' | 'visits' | 'tasks' | 'routes'
  | 'geofence' | 'reports' | 'documents'
  | 'notifications' | 'settings' | 'profile'
  | 'employee-detail';

const DARK = {
  bg: '#0d1117',
  card: '#161b22',
  card2: '#1c2128',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  green: '#3fb950',
  greenBg: '#1a3a2a',
  greenBorder: '#2d6a3f',
  red: '#f85149',
  redBg: '#3d1f1f',
  amber: '#d29922',
  amberBg: '#2d2110',
  blue: '#58a6ff',
  blueBg: '#1a2a3d',
  purple: '#bc8cff',
  purpleBg: '#2a1a3d',
};

export default function MobileApp({
  db, setDb, currentUserEmail, currentUserName, userRole, onLogout, triggerNotification
}: MobileAppProps) {
  const [screen, setScreen] = useState<MobileScreen>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const agentEmployee = useMemo(() =>
    db.employees.find(e => e.email.toLowerCase() === currentUserEmail.toLowerCase()),
    [db.employees, currentUserEmail]
  );

  const activeEmployees = db.employees.filter(e => e.isActive !== false && e.status !== 'offline');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = db.attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
  const unreadCount = db.notifications.filter(n => !n.read).length;
  const completedVisits = db.visits.filter(v => v.status === 'Completed').length;
  const completedTasks = db.tasks.filter(t => t.status === 'Completed').length;
  const myTodayLog = agentEmployee ? db.attendance.find(a => a.employeeId === agentEmployee.id && a.date === todayStr) : null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, perm: 'attendance' },
    { id: 'employees', label: 'Employees', icon: Users, perm: 'employees' },
    { id: 'tracking', label: 'Live Tracking', icon: Navigation, perm: 'tracking' },
    { id: 'visits', label: 'Visits', icon: MapPin, perm: 'visits' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, perm: 'tasks' },
    { id: 'shifts', label: 'Shift Roster', icon: Clock, perm: 'shifts' },
    { id: 'payroll', label: 'Indian Payroll', icon: CreditCard, perm: 'payroll' },
    { id: 'leaves', label: 'Leave Manager', icon: Calendar, perm: 'leaves' },
    { id: 'routes', label: 'Route History', icon: GitBranch, perm: 'routes' },
    { id: 'geofence', label: 'Geofence', icon: Shield, perm: 'geofence' },
    { id: 'reports', label: 'Reports', icon: BarChart2, perm: 'reports' },
    { id: 'documents', label: 'Documents', icon: FileText, perm: 'documents' },
    { id: 'notifications', label: 'Notifications', icon: Bell, perm: 'notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, perm: 'settings' },
  ].filter(item => {
    const perms = db.rolePermissions?.[userRole] ?? ['dashboard', 'notifications'];
    return perms.includes(item.perm);
  });

  const goTo = (s: MobileScreen) => { setScreen(s); setMenuOpen(false); };

  // ── BOTTOM NAV ──────────────────────────────────────────────────
  const bottomNav = [
    { id: 'dashboard' as MobileScreen, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance' as MobileScreen, label: 'Attendance', icon: Calendar },
    { id: 'visits' as MobileScreen, label: 'Visits', icon: MapPin },
    { id: 'profile' as MobileScreen, label: 'Profile', icon: UserCheck },
  ];

  // ── HEADER ──────────────────────────────────────────────────────
  const Header = ({ title, back }: { title?: string; back?: MobileScreen }) => (
    <div style={{ background: DARK.bg, borderBottom: `1px solid ${DARK.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {back ? (
          <button onClick={() => goTo(back)} style={{ background: 'none', border: 'none', color: DARK.green, cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
        ) : (
          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: DARK.muted, cursor: 'pointer', padding: 4 }}>
            <Menu size={22} />
          </button>
        )}
        {!back && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: DARK.green, borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <BarChart2 size={14} color="#fff" />
            </div>
            <div>
              <div style={{ color: DARK.text, fontWeight: 800, fontSize: 16 }}>TrackHive</div>
              <div style={{ color: DARK.green, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Field Force Management</div>
            </div>
          </div>
        )}
        {back && <span style={{ color: DARK.text, fontWeight: 700, fontSize: 16 }}>{title}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => goTo('notifications')} style={{ background: 'none', border: 'none', color: DARK.muted, cursor: 'pointer', position: 'relative', padding: 4 }}>
          <Bell size={22} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: -2, right: -2, background: DARK.red, color: '#fff', borderRadius: '50%', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // ── DRAWER MENU ─────────────────────────────────────────────────
  const DrawerMenu = () => (
    <>
      <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 280, background: DARK.card, zIndex: 101, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${DARK.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ background: DARK.green, borderRadius: 10, padding: '6px 10px' }}>
              <BarChart2 size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color: DARK.text, fontWeight: 800, fontSize: 18 }}>TrackHive</div>
              <div style={{ color: DARK.green, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>FIELD FORCE MANAGEMENT</div>
            </div>
          </div>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: DARK.card2, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: DARK.greenBg, border: `2px solid ${DARK.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK.green, fontWeight: 800, fontSize: 14 }}>
              {currentUserName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUserName}</div>
              <div style={{ color: DARK.green, fontSize: 10, fontWeight: 600 }}>{userRole}</div>
            </div>
            <ChevronRight size={14} color={DARK.muted} />
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => goTo(item.id as MobileScreen)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                background: active ? DARK.greenBg : 'none', border: 'none', cursor: 'pointer',
                borderLeft: active ? `3px solid ${DARK.green}` : '3px solid transparent',
                textAlign: 'left', transition: 'all 0.15s'
              }}>
                <Icon size={18} color={active ? DARK.green : DARK.muted} />
                <span style={{ color: active ? DARK.green : DARK.text, fontSize: 14, fontWeight: active ? 700 : 500 }}>{item.label}</span>
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: DARK.red, color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>{unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${DARK.border}` }}>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, color: DARK.red, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: '10px 0', width: '100%' }}>
            <LogOut size={18} />
            Logout (Sign Out)
          </button>
        </div>
      </div>
    </>
  );

  // ── STAT CARD ────────────────────────────────────────────────────
  const StatCard = ({ label, value, sub, subColor, icon: Icon, iconBg, mini }: any) => (
    <div style={{ background: DARK.card, borderRadius: 16, padding: mini ? '14px 16px' : '16px 18px', border: `1px solid ${DARK.border}`, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: DARK.muted, fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
        {Icon && <div style={{ background: iconBg || DARK.greenBg, borderRadius: 8, padding: 6 }}><Icon size={14} color={DARK.green} /></div>}
      </div>
      <div style={{ fontSize: mini ? 22 : 26, fontWeight: 800, color: DARK.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, fontWeight: 600, color: subColor || DARK.green, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  // ── DONUT CHART (SVG) ────────────────────────────────────────────
  const DonutChart = ({ present, total }: { present: number; total: number }) => {
    const pct = total > 0 ? present / total : 0;
    const r = 52; const cx = 64; const cy = 64;
    const circ = 2 * Math.PI * r;
    const absent = total - present;
    return (
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={DARK.redBg} strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={DARK.green} strokeWidth={14}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        {absent > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={DARK.red} strokeWidth={14}
            strokeDasharray={`${(absent / total) * circ * 0.2} ${circ}`}
            strokeDashoffset={-pct * circ} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={DARK.text} fontSize={18} fontWeight={800}>{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill={DARK.muted} fontSize={11} fontWeight={600}>Total</text>
      </svg>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // SCREENS
  // ══════════════════════════════════════════════════════════════

  // ── DASHBOARD ───────────────────────────────────────────────────
  const ScreenDashboard = () => {
    const absent = totalActive - presentCount;
    const totalActive = activeEmployees.length;
    const taskPct = db.tasks.length > 0 ? Math.round((completedTasks / db.tasks.length) * 100) : 0;
    const visitPct = db.visits.length > 0 ? Math.round((completedVisits / db.visits.length) * 100) : 0;

    const recentActivity = [
      ...db.attendance.slice(0, 3).map(a => ({ type: 'attend', label: a.checkOutTime ? 'Punched Out' : 'Punched In', name: a.employeeName, time: a.checkOutTime || a.checkInTime, color: a.checkOutTime ? DARK.red : DARK.green, bg: a.checkOutTime ? DARK.redBg : DARK.greenBg })),
      ...db.visits.filter(v => v.status === 'Completed').slice(0, 2).map(v => ({ type: 'visit', label: 'Client Visit Completed', name: v.employeeName, time: v.checkOutTime || '', color: DARK.blue, bg: DARK.blueBg })),
    ].slice(0, 4);

    return (
      <div>
        <Header />
        <div style={{ padding: '20px 16px', paddingBottom: 100, overflowY: 'auto' }}>
          {/* Greeting */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: DARK.muted, fontSize: 13 }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},</div>
            <div style={{ color: DARK.text, fontSize: 20, fontWeight: 800 }}>{currentUserName}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: DARK.greenBg, border: `1px solid ${DARK.greenBorder}`, borderRadius: 20, padding: '4px 10px', marginTop: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: DARK.green }} />
              <span style={{ color: DARK.green, fontSize: 11, fontWeight: 700 }}>Cloud Connected</span>
            </div>
          </div>

          {/* Punch card */}
          <div style={{ background: DARK.card, borderRadius: 16, padding: '16px', border: `1px solid ${DARK.border}`, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ color: DARK.muted, fontSize: 11, fontWeight: 600 }}>Current Status</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: myTodayLog && !myTodayLog.checkOutTime ? DARK.greenBg : DARK.card2, borderRadius: 20, padding: '3px 10px', marginTop: 4 }}>
                  <span style={{ color: myTodayLog && !myTodayLog.checkOutTime ? DARK.green : DARK.muted, fontSize: 11, fontWeight: 700 }}>
                    {myTodayLog ? (myTodayLog.checkOutTime ? 'PUNCHED OUT' : 'PUNCHED IN') : 'NOT PUNCHED IN'}
                  </span>
                </div>
                {myTodayLog && <div style={{ color: DARK.muted, fontSize: 11, marginTop: 4 }}>Since {myTodayLog.checkInTime}</div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button style={{ background: DARK.green, border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <UserCheck size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div>Punch In</div>
                  {myTodayLog && <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{myTodayLog.checkInTime}</div>}
                </div>
              </button>
              <button style={{ background: DARK.red, border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LogOut size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div>Punch Out</div>
                  {myTodayLog?.checkOutTime && <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{myTodayLog.checkOutTime}</div>}
                </div>
              </button>
            </div>
          </div>

          {/* Overview filter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: DARK.text, fontSize: 16, fontWeight: 700 }}>Overview</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: DARK.card2, border: `1px solid ${DARK.border}`, borderRadius: 8, padding: '6px 12px', color: DARK.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Filter size={12} />All Departments
              </button>
              <button style={{ background: DARK.card2, border: `1px solid ${DARK.border}`, borderRadius: 8, padding: '6px 12px', color: DARK.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} />Today
              </button>
            </div>
          </div>

          {/* 4 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatCard label="Active Employees" value={`${totalActive} / ${db.employees.length}`} sub={`${db.employees.length > 0 ? Math.round((totalActive / db.employees.length) * 100) : 0}% Active`} icon={Users} mini />
            <StatCard label="Live GPS Streamers" value={`${totalActive} / ${db.employees.length}`} sub={`${db.employees.length > 0 ? Math.round((totalActive / db.employees.length) * 100) : 0}% Active`} icon={Navigation} iconBg={DARK.blueBg} mini />
            <StatCard label="Client Visits" value={`${completedVisits} / ${db.visits.length}`} sub={`${visitPct}% Completed`} subColor={DARK.amber} icon={MapPin} iconBg={DARK.amberBg} mini />
            <StatCard label="Tasks Completion" value={`${completedTasks} / ${db.tasks.length}`} sub={`${taskPct}% Completed`} subColor={DARK.purple} icon={CheckSquare} iconBg={DARK.purpleBg} mini />
          </div>

          {/* Today's Attendance donut */}
          <div style={{ background: DARK.card, borderRadius: 16, padding: 16, border: `1px solid ${DARK.border}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <DonutChart present={presentCount} total={Math.max(db.employees.length, 1)} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: DARK.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Today's Attendance</div>
              {[
                { label: 'Present', count: presentCount, pct: db.employees.length > 0 ? ((presentCount / db.employees.length) * 100).toFixed(1) : '0', color: DARK.green },
                { label: 'Absent', count: Math.max(0, db.employees.length - presentCount), pct: db.employees.length > 0 ? (((db.employees.length - presentCount) / db.employees.length) * 100).toFixed(1) : '0', color: DARK.red },
                { label: 'On Leave', count: 0, pct: '0', color: DARK.amber },
                { label: 'Yet to Punch In', count: 0, pct: '0', color: DARK.muted },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: DARK.muted, fontSize: 12 }}>{item.label}</span>
                  </div>
                  <span style={{ color: DARK.text, fontSize: 12, fontWeight: 700 }}>{item.count} ({item.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task + Corporate Health */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: DARK.card, borderRadius: 16, padding: 16, border: `1px solid ${DARK.border}` }}>
              <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Task Execution Index</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={30} fill="none" stroke={DARK.card2} strokeWidth={10} />
                  <circle cx={40} cy={40} r={30} fill="none" stroke={DARK.purple} strokeWidth={10}
                    strokeDasharray={`${taskPct * 1.885} 188.5`} strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                  <text x={40} y={44} textAnchor="middle" fill={DARK.text} fontSize={14} fontWeight={800}>{taskPct}%</text>
                </svg>
                <div style={{ color: DARK.muted, fontSize: 11, marginTop: 4 }}>{completedTasks} / {db.tasks.length} Tasks</div>
              </div>
            </div>
            <div style={{ background: DARK.card, borderRadius: 16, padding: 16, border: `1px solid ${DARK.border}` }}>
              <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Corporate Health</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={30} fill="none" stroke={DARK.card2} strokeWidth={10} />
                  <circle cx={40} cy={40} r={30} fill="none" stroke={DARK.green} strokeWidth={10}
                    strokeDasharray={`${Math.min(visitPct + 50, 100) * 1.885} 188.5`} strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                  <text x={40} y={40} textAnchor="middle" fill={DARK.text} fontSize={14} fontWeight={800}>{Math.min(visitPct + 50, 100)}%</text>
                </svg>
                <div style={{ color: DARK.green, fontSize: 11, marginTop: 4, fontWeight: 700 }}>Healthy</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DARK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: DARK.text, fontWeight: 700, fontSize: 15 }}>Recent Activity</span>
              <button onClick={() => goTo('attendance')} style={{ background: 'none', border: 'none', color: DARK.green, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: DARK.muted, fontSize: 13 }}>No recent activity</div>
            ) : recentActivity.map((item, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < recentActivity.length - 1 ? `1px solid ${DARK.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserCheck size={16} color={item.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                  <div style={{ color: DARK.muted, fontSize: 11 }}>{item.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: DARK.muted, fontSize: 11 }}>{item.time}</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── ATTENDANCE ──────────────────────────────────────────────────
  const ScreenAttendance = () => {
    const logs = db.attendance.slice(0, 30);
    return (
      <div>
        <Header title="Attendance" back="dashboard" />
        <div style={{ padding: '16px', paddingBottom: 100 }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{ background: DARK.greenBg, borderRadius: 12, padding: 12, border: `1px solid ${DARK.greenBorder}`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: DARK.green }}>{presentCount}</div>
              <div style={{ fontSize: 10, color: DARK.green, fontWeight: 600 }}>Present</div>
            </div>
            <div style={{ background: DARK.redBg, borderRadius: 12, padding: 12, border: `1px solid ${DARK.red}22`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: DARK.red }}>{Math.max(0, db.employees.length - presentCount)}</div>
              <div style={{ fontSize: 10, color: DARK.red, fontWeight: 600 }}>Absent</div>
            </div>
            <div style={{ background: DARK.card, borderRadius: 12, padding: 12, border: `1px solid ${DARK.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: DARK.text }}>{db.employees.length}</div>
              <div style={{ fontSize: 10, color: DARK.muted, fontWeight: 600 }}>Total</div>
            </div>
          </div>

          {/* Logs */}
          <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DARK.border}` }}>
              <span style={{ color: DARK.text, fontWeight: 700 }}>Attendance Logs</span>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: DARK.muted, fontSize: 13 }}>No attendance records yet</div>
            ) : logs.map((log, i) => (
              <div key={log.id} style={{ padding: '12px 16px', borderBottom: i < logs.length - 1 ? `1px solid ${DARK.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: log.status === 'Present' ? DARK.greenBg : DARK.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: log.status === 'Present' ? DARK.green : DARK.red }}>
                  {log.employeeName.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13 }}>{log.employeeName}</div>
                  <div style={{ color: DARK.muted, fontSize: 11 }}>{log.date} · {log.checkInTime}{log.checkOutTime ? ` → ${log.checkOutTime}` : ''}</div>
                </div>
                <span style={{ background: log.status === 'Present' ? DARK.greenBg : DARK.redBg, color: log.status === 'Present' ? DARK.green : DARK.red, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '3px 8px', border: `1px solid ${log.status === 'Present' ? DARK.greenBorder : DARK.red + '44'}` }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── EMPLOYEES ───────────────────────────────────────────────────
  const ScreenEmployees = () => {
    const filtered = db.employees.filter(e =>
      e.isActive !== false && e.status !== 'offline' &&
      (!searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return (
      <div>
        <Header title="Employees" back="dashboard" />
        <div style={{ padding: 16, paddingBottom: 100 }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: DARK.card, borderRadius: 12, padding: '10px 14px', border: `1px solid ${DARK.border}`, marginBottom: 14 }}>
            <Search size={16} color={DARK.muted} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search employees..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DARK.text, fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: DARK.muted, fontSize: 13 }}>{filtered.length} Active Employees</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ background: DARK.card, borderRadius: 16, padding: 32, textAlign: 'center', color: DARK.muted, border: `1px solid ${DARK.border}` }}>No employees found</div>
            ) : filtered.map(emp => (
              <button key={emp.id} onClick={() => { setSelectedEmployeeId(emp.id); goTo('employee-detail'); }} style={{ background: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: DARK.greenBg, border: `2px solid ${DARK.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: DARK.green, flexShrink: 0 }}>
                  {emp.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: DARK.text, fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
                  <div style={{ color: DARK.muted, fontSize: 12 }}>{emp.role} · {emp.department}</div>
                  <div style={{ color: DARK.muted, fontSize: 11, marginTop: 2 }}>{emp.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ background: emp.status === 'active' ? DARK.greenBg : DARK.card2, color: emp.status === 'active' ? DARK.green : DARK.muted, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 8px', border: `1px solid ${emp.status === 'active' ? DARK.greenBorder : DARK.border}` }}>
                    {emp.status}
                  </span>
                  <ChevronRight size={14} color={DARK.muted} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── EMPLOYEE DETAIL ─────────────────────────────────────────────
  const ScreenEmployeeDetail = () => {
    const emp = db.employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return null;
    const empAttendance = db.attendance.filter(a => a.employeeId === emp.id).slice(0, 5);
    const empTasks = db.tasks.filter(t => t.employeeId === emp.id).slice(0, 3);
    const empVisits = db.visits.filter(v => v.employeeId === emp.id).slice(0, 3);
    return (
      <div>
        <Header title={emp.name} back="employees" />
        <div style={{ padding: 16, paddingBottom: 100 }}>
          {/* Profile card */}
          <div style={{ background: DARK.card, borderRadius: 20, padding: '24px 20px', border: `1px solid ${DARK.border}`, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: DARK.greenBg, border: `3px solid ${DARK.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: DARK.green, margin: '0 auto 12px' }}>
              {emp.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ color: DARK.text, fontWeight: 800, fontSize: 18 }}>{emp.name}</div>
            <div style={{ color: DARK.muted, fontSize: 13, margin: '4px 0 8px' }}>{emp.role} · {emp.department}</div>
            <span style={{ background: emp.status === 'active' ? DARK.greenBg : DARK.card2, color: emp.status === 'active' ? DARK.green : DARK.muted, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '4px 12px', border: `1px solid ${emp.status === 'active' ? DARK.greenBorder : DARK.border}` }}>
              {emp.status.toUpperCase()}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <a href={`tel:${emp.phone}`} style={{ background: DARK.greenBg, border: `1px solid ${DARK.greenBorder}`, borderRadius: 12, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: DARK.green, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                <Phone size={16} />Call
              </a>
              <a href={`mailto:${emp.email}`} style={{ background: DARK.blueBg, border: `1px solid ${DARK.blue}44`, borderRadius: 12, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: DARK.blue, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                <Mail size={16} />Email
              </a>
            </div>
          </div>
          {/* Details */}
          <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden', marginBottom: 16 }}>
            {[
              { label: 'Employee ID', value: emp.id },
              { label: 'Email', value: emp.email },
              { label: 'Phone', value: emp.phone },
              { label: 'Department', value: emp.department },
              { label: 'Joining Date', value: emp.joiningDate },
              { label: 'Work Location', value: emp.workLocation },
              { label: 'Reporting Manager', value: emp.reportingManager },
            ].filter(i => i.value).map((item, i, arr) => (
              <div key={item.label} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${DARK.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: DARK.muted, fontSize: 12 }}>{item.label}</span>
                <span style={{ color: DARK.text, fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{item.value || '—'}</span>
              </div>
            ))}
          </div>
          {/* Recent attendance */}
          {empAttendance.length > 0 && (
            <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DARK.border}` }}>
                <span style={{ color: DARK.text, fontWeight: 700 }}>Recent Attendance</span>
              </div>
              {empAttendance.map((a, i) => (
                <div key={a.id} style={{ padding: '10px 16px', borderBottom: i < empAttendance.length - 1 ? `1px solid ${DARK.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: DARK.muted, fontSize: 12, fontFamily: 'monospace' }}>{a.date}</span>
                  <span style={{ color: a.status === 'Present' ? DARK.green : DARK.red, fontSize: 12, fontWeight: 700 }}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── VISITS ──────────────────────────────────────────────────────
  const ScreenVisits = () => (
    <div>
      <Header title="Client Visits" back="dashboard" />
      <div style={{ padding: 16, paddingBottom: 100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: DARK.greenBg, borderRadius: 12, padding: 12, border: `1px solid ${DARK.greenBorder}`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK.green }}>{completedVisits}</div>
            <div style={{ fontSize: 10, color: DARK.green, fontWeight: 600 }}>Completed</div>
          </div>
          <div style={{ background: DARK.amberBg, borderRadius: 12, padding: 12, border: `1px solid ${DARK.amber}44`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK.amber }}>{db.visits.filter(v => v.status === 'Pending').length}</div>
            <div style={{ fontSize: 10, color: DARK.amber, fontWeight: 600 }}>Pending</div>
          </div>
          <div style={{ background: DARK.card, borderRadius: 12, padding: 12, border: `1px solid ${DARK.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK.text }}>{db.visits.length}</div>
            <div style={{ fontSize: 10, color: DARK.muted, fontWeight: 600 }}>Total</div>
          </div>
        </div>
        <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden' }}>
          {db.visits.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: DARK.muted }}>No visits recorded</div>
          ) : db.visits.slice(0, 20).map((v, i, arr) => (
            <div key={v.id} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${DARK.border}` : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: v.status === 'Completed' ? DARK.greenBg : DARK.amberBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={18} color={v.status === 'Completed' ? DARK.green : DARK.amber} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13 }}>{v.clientName}</div>
                <div style={{ color: DARK.muted, fontSize: 11 }}>{v.employeeName} · {v.visitType}</div>
                <div style={{ color: DARK.muted, fontSize: 11 }}>{v.checkInTime}</div>
              </div>
              <span style={{ background: v.status === 'Completed' ? DARK.greenBg : DARK.amberBg, color: v.status === 'Completed' ? DARK.green : DARK.amber, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                {v.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TASKS ────────────────────────────────────────────────────────
  const ScreenTasks = () => (
    <div>
      <Header title="Tasks" back="dashboard" />
      <div style={{ padding: 16, paddingBottom: 100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: DARK.greenBg, borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${DARK.greenBorder}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK.green }}>{completedTasks}</div>
            <div style={{ fontSize: 10, color: DARK.green, fontWeight: 600 }}>Done</div>
          </div>
          <div style={{ background: DARK.amberBg, borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${DARK.amber}44` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK.amber }}>{db.tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length}</div>
            <div style={{ fontSize: 10, color: DARK.amber, fontWeight: 600 }}>Active</div>
          </div>
          <div style={{ background: DARK.redBg, borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${DARK.red}44` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK.red }}>{db.tasks.filter(t => t.priority === 'High').length}</div>
            <div style={{ fontSize: 10, color: DARK.red, fontWeight: 600 }}>High Priority</div>
          </div>
        </div>
        <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden' }}>
          {db.tasks.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: DARK.muted }}>No tasks found</div>
          ) : db.tasks.slice(0, 20).map((t, i, arr) => (
            <div key={t.id} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${DARK.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13 }}>{t.title}</div>
                  <div style={{ color: DARK.muted, fontSize: 11, marginTop: 2 }}>{t.employeeName} · Due {t.dueDate}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ background: t.status === 'Completed' ? DARK.greenBg : t.status === 'In Progress' ? DARK.blueBg : DARK.amberBg, color: t.status === 'Completed' ? DARK.green : t.status === 'In Progress' ? DARK.blue : DARK.amber, borderRadius: 20, fontSize: 9, fontWeight: 700, padding: '2px 7px' }}>{t.status}</span>
                  <span style={{ background: t.priority === 'High' ? DARK.redBg : DARK.card2, color: t.priority === 'High' ? DARK.red : DARK.muted, borderRadius: 20, fontSize: 9, fontWeight: 700, padding: '2px 7px' }}>{t.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── NOTIFICATIONS ────────────────────────────────────────────────
  const ScreenNotifications = () => (
    <div>
      <Header title="Notifications" back="dashboard" />
      <div style={{ padding: 16, paddingBottom: 100 }}>
        {unreadCount > 0 && (
          <button onClick={() => setDb(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) }))}
            style={{ background: DARK.greenBg, border: `1px solid ${DARK.greenBorder}`, borderRadius: 10, padding: '8px 14px', color: DARK.green, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 14, width: '100%' }}>
            Mark all as read ({unreadCount} unread)
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {db.notifications.length === 0 ? (
            <div style={{ background: DARK.card, borderRadius: 16, padding: 32, textAlign: 'center', color: DARK.muted, border: `1px solid ${DARK.border}` }}>No notifications</div>
          ) : db.notifications.map(n => (
            <div key={n.id} onClick={() => setDb(prev => ({ ...prev, notifications: prev.notifications.map(x => x.id === n.id ? { ...x, read: true } : x) }))}
              style={{ background: n.read ? DARK.card : DARK.card2, borderRadius: 14, padding: '14px 16px', border: `1px solid ${n.read ? DARK.border : DARK.green + '44'}`, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: n.priority === 'High' ? DARK.redBg : DARK.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={16} color={n.priority === 'High' ? DARK.red : DARK.green} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                <div style={{ color: DARK.muted, fontSize: 12, marginTop: 2 }}>{n.description}</div>
                <div style={{ color: DARK.muted, fontSize: 11, marginTop: 4 }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: DARK.green, flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PROFILE ──────────────────────────────────────────────────────
  const ScreenProfile = () => (
    <div>
      <Header title="My Profile" back="dashboard" />
      <div style={{ padding: 16, paddingBottom: 100 }}>
        <div style={{ background: DARK.card, borderRadius: 20, padding: '28px 20px', border: `1px solid ${DARK.border}`, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: DARK.greenBg, border: `3px solid ${DARK.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: DARK.green, margin: '0 auto 14px' }}>
            {currentUserName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ color: DARK.text, fontWeight: 800, fontSize: 20 }}>{currentUserName}</div>
          <div style={{ color: DARK.green, fontSize: 13, fontWeight: 600, margin: '4px 0 8px' }}>{userRole}</div>
          <div style={{ color: DARK.muted, fontSize: 13 }}>{currentUserEmail}</div>
        </div>
        <div style={{ background: DARK.card, borderRadius: 16, border: `1px solid ${DARK.border}`, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { label: 'My Attendance', desc: 'View your punch history', screen: 'attendance' as MobileScreen, icon: Calendar },
            { label: 'My Tasks', desc: 'View assigned tasks', screen: 'tasks' as MobileScreen, icon: CheckSquare },
            { label: 'My Visits', desc: 'Client visit history', screen: 'visits' as MobileScreen, icon: MapPin },
            { label: 'Leave Manager', desc: 'Apply and track leaves', screen: 'leaves' as MobileScreen, icon: Clock },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => goTo(item.screen)} style={{ width: '100%', padding: '14px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${DARK.border}` : 'none', display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: DARK.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={DARK.green} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: DARK.text, fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                  <div style={{ color: DARK.muted, fontSize: 11 }}>{item.desc}</div>
                </div>
                <ChevronRight size={16} color={DARK.muted} />
              </button>
            );
          })}
        </div>
        <button onClick={onLogout} style={{ width: '100%', background: DARK.redBg, border: `1px solid ${DARK.red}44`, borderRadius: 14, padding: '14px', color: DARK.red, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} />Logout (Sign Out)
        </button>
      </div>
    </div>
  );

  // ── GENERIC SCREEN (for tabs not yet fully built) ─────────────────
  const ScreenGeneric = ({ title, back }: { title: string; back: MobileScreen }) => (
    <div>
      <Header title={title} back={back} />
      <div style={{ padding: 32, textAlign: 'center', color: DARK.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
        <div style={{ color: DARK.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13 }}>This section is available on the desktop version. Use a tablet or desktop for full access.</div>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <ScreenDashboard />;
      case 'attendance': return <ScreenAttendance />;
      case 'employees': return <ScreenEmployees />;
      case 'employee-detail': return <ScreenEmployeeDetail />;
      case 'visits': return <ScreenVisits />;
      case 'tasks': return <ScreenTasks />;
      case 'notifications': return <ScreenNotifications />;
      case 'profile': return <ScreenProfile />;
      default: return <ScreenGeneric title={navItems.find(n => n.id === screen)?.label || 'Section'} back="dashboard" />;
    }
  };

  return (
    <div style={{ background: DARK.bg, minHeight: '100vh', maxWidth: 430, margin: '0 auto', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {menuOpen && <DrawerMenu />}
      <div style={{ paddingBottom: 72 }}>{renderScreen()}</div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: DARK.card, borderTop: `1px solid ${DARK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 50 }}>
        {bottomNav.map(item => {
          const Icon = item.icon;
          const active = screen === item.id;
          return (
            <button key={item.id} onClick={() => goTo(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              <Icon size={22} color={active ? DARK.green : DARK.muted} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? DARK.green : DARK.muted }}>{item.label}</span>
            </button>
          );
        })}
        {/* FAB */}
        <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)' }}>
          <button style={{ width: 52, height: 52, borderRadius: '50%', background: DARK.green, border: '3px solid ' + DARK.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(63,185,80,0.4)' }}>
            <Plus size={24} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
