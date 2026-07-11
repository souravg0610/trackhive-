import { useMemo, useState, useEffect } from 'react';
import type { DBState } from '../dbState';

interface SearchResult {
  id: string;
  category: 'App Sections' | 'Staff Directory' | 'Tasks & Visits' | 'Absences & Requests';
  title: string;
  subtitle: string;
  info: string;
  tab: string;
  targetQuery: string;
}

const SECTIONS = [
  { id: 'dashboard',     label: 'Dashboard Overview',            keywords: ['dashboard','overview','metrics','charts'] },
  { id: 'employees',     label: 'Employee Registry',             keywords: ['employees','staff','team','directory','onboard'] },
  { id: 'tracking',      label: 'Live GPS Tracking',             keywords: ['tracking','live','map','gps','location'] },
  { id: 'attendance',    label: 'Attendance Timesheets',         keywords: ['attendance','check-in','punch','hours','clock'] },
  { id: 'shifts',        label: 'Shift Roster Planner',          keywords: ['shifts','shift','roster','schedule'] },
  { id: 'payroll',       label: 'Indian Payroll Engine',         keywords: ['payroll','salary','payslip','pf','tax','tds'] },
  { id: 'leaves',        label: 'Leave & Absences',              keywords: ['leaves','leave','vacation','holiday','absent'] },
  { id: 'visits',        label: 'Client Site Visits',            keywords: ['visits','visit','client','meetings','sales'] },
  { id: 'tasks',         label: 'Kanban Task Boards',            keywords: ['tasks','task','todo','kanban','board','assign'] },
  { id: 'routes',        label: 'GPS Travel History',            keywords: ['routes','route','travel','history','path'] },
  { id: 'geofence',      label: 'Geofenced Perimeters',          keywords: ['geofence','perimeter','boundary','radius'] },
  { id: 'reports',       label: 'Reports & Excel Downloads',     keywords: ['reports','report','csv','excel','export'] },
  { id: 'documents',     label: 'Document Vault',                keywords: ['documents','document','pdf','vault','contracts'] },
  { id: 'settings',      label: 'Global Settings',               keywords: ['settings','config','role','branch','backup'] },
];

// FIX: Build index once when db/role changes; query it cheaply on each keystroke
function buildIndex(db: DBState, role: string): SearchResult[] {
  const allowed = db.rolePermissions?.[role] ?? ['dashboard', 'notifications'];
  const results: SearchResult[] = [];

  SECTIONS.forEach(sec => {
    if (!allowed.includes(sec.id)) return;
    results.push({
      id: `sec-${sec.id}`,
      category: 'App Sections',
      title: sec.label,
      subtitle: sec.keywords.slice(0, 4).join(', '),
      info: 'Jump to tab',
      tab: sec.id,
      targetQuery: '',
    });
  });

  if (allowed.includes('employees')) {
    db.employees.forEach(emp => {
      results.push({
        id: `emp-${emp.email}`,
        category: 'Staff Directory',
        title: emp.name,
        subtitle: `${emp.jobTitle || 'Team Member'} · ${emp.department || 'Operations'}`,
        info: emp.email,
        tab: 'employees',
        targetQuery: emp.name,
      });
    });
  }

  if (allowed.includes('tasks')) {
    db.tasks.forEach(task => {
      results.push({
        id: `task-${task.id}`,
        category: 'Tasks & Visits',
        title: `Task: ${task.title}`,
        subtitle: `${task.employeeName} · ${task.status}`,
        info: task.description || '',
        tab: 'tasks',
        targetQuery: task.title,
      });
    });
  }

  if (allowed.includes('visits')) {
    db.visits.forEach(v => {
      results.push({
        id: `visit-${v.id}`,
        category: 'Tasks & Visits',
        title: `Visit: ${v.clientName}`,
        subtitle: `${v.visitType} · ${v.status}`,
        info: v.location,
        tab: 'visits',
        targetQuery: v.clientName,
      });
    });
  }

  if (allowed.includes('leaves')) {
    db.leaveApplications?.forEach(la => {
      results.push({
        id: `leave-${la.id}`,
        category: 'Absences & Requests',
        title: `Leave: ${la.employeeName}`,
        subtitle: `${la.leavePolicyName} · ${la.startDate} to ${la.endDate}`,
        info: la.reason || '',
        tab: 'leaves',
        targetQuery: la.employeeName,
      });
    });
  }

  return results;
}

function queryIndex(index: SearchResult[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return index.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.subtitle.toLowerCase().includes(q) ||
    item.info.toLowerCase().includes(q) ||
    item.targetQuery.toLowerCase().includes(q)
  );
}

export function useSearch(db: DBState, role: string) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce: only query after 150ms idle
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // Index rebuilds only when data or role changes (expensive operation)
  const index = useMemo(() => buildIndex(db, role), [db, role]);

  // Query runs cheaply on debounced keystrokes
  const results = useMemo(() => queryIndex(index, debouncedQuery), [index, debouncedQuery]);

  return { query, setQuery, results };
}
