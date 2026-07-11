// ============================================================
// MOBILE SUPABASE BRIDGE — uses the shared singleton client
// All return types match mobileTypes.ts exactly.
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import type {
  Employee, AttendanceLog, AttendanceState, Shift,
  ClientVisit, Task, LeaveRequest, LeaveBalance,
  NotificationItem, Payslip,
} from './mobileTypes';

export function sb(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  return client;
}

// ─── session ─────────────────────────────────────────────────
export interface MobileSession {
  userId: string;     // auth.uid() — UUID from auth.users
  employeeId: string; // BUG 4/7 FIX: employees.id (EMP...) — used for all DB queries
  email: string;
  companyId: string;
  role: string;
  name: string;
}

const SESSION_KEY = 'th_mobile_session';
let _session: MobileSession | null = null;

export function setMobileSession(s: MobileSession): void {
  _session = s;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function getMobileSession(): MobileSession | null {
  if (_session) return _session;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) { _session = JSON.parse(raw); return _session; }
  } catch { /* ignore */ }
  return null;
}

function cid(): string { return _session?.companyId || ''; }
// BUG 4/7 FIX: always use employeeId (EMP...) for DB queries, not auth UUID
function eid(): string { return _session?.employeeId || ''; }

// ─── auth ─────────────────────────────────────────────────────
export async function mobileLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; session?: MobileSession }> {
  const { data, error } = await sb().auth.signInWithPassword({ email, password });
  if (error || !data.user) return { success: false, message: error?.message || 'Login failed' };

  let companyId = '';
  let fullName = email.split('@')[0];

  // Try users table first, then profiles, then employees
  const { data: u } = await sb().from('users')
    .select('company_id, full_name').eq('id', data.user.id).maybeSingle();
  if (u?.company_id) { companyId = u.company_id as string; fullName = (u.full_name as string) || fullName; }
  else {
    const { data: p } = await sb().from('profiles')
      .select('company_id, full_name').eq('id', data.user.id).maybeSingle();
    if (p?.company_id) { companyId = p.company_id as string; fullName = (p.full_name as string) || fullName; }
    else {
      // Employee added by admin — find via email
      const { data: emp } = await sb().from('employees')
        .select('company_id, name').ilike('email', email).maybeSingle();
      if (emp?.company_id) {
        companyId = emp.company_id as string;
        fullName = (emp.name as string) || fullName;
        // Backfill users row so future logins are instant
        await sb().from('users').upsert({
          id: data.user.id, company_id: companyId,
          full_name: fullName, email: email.toLowerCase(), status: 'active',
        }).then(() => {});
      }
    }
  }

  if (!companyId) return { success: false, message: 'No company linked to this account. Contact your admin.' };

  const { data: emp } = await sb().from('employees')
    .select('name, role').ilike('email', email).eq('company_id', companyId).maybeSingle();

  // BUG 4/7 FIX: also resolve the employee's EMP... id for use in all DB queries
  // employees.id = 'EMP...' (set by admin when adding employee)
  // auth.uid()   = UUID from auth.users
  // All attendance/task/leave queries use employees.id, NOT auth.uid()
  let employeeId = '';
  if (emp) {
    // We already have the employee record — fetch their id
    const { data: empWithId } = await sb().from('employees')
      .select('id')
      .ilike('email', email)
      .eq('company_id', companyId)
      .maybeSingle();
    employeeId = (empWithId as Record<string, unknown>)?.id as string || '';
  }

  const session: MobileSession = {
    userId: data.user.id,
    employeeId,  // BUG 4/7 FIX: EMP... id for all query filtering
    email,
    companyId,
    role: (emp?.role as string) || 'Field Agent',
    name: (emp?.name as string) || fullName,
  };
  setMobileSession(session);
  return { success: true, message: 'OK', session };
}

export async function mobileLogout(): Promise<void> {
  await sb().auth.signOut();
  _session = null;
  localStorage.removeItem(SESSION_KEY);
}

// ─── employees ───────────────────────────────────────────────
export async function fetchEmployees(): Promise<Employee[]> {
  if (!cid()) return [];
  const { data } = await sb().from('employees')
    .select('*').eq('company_id', cid()).eq('is_active', true).order('name');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map(e => ({
    id: e.id as string,
    name: e.name as string,
    role: ((e.role as string) || 'Field Agent') as Employee['role'],
    department: ((e.department as string) || 'Operations') as Employee['department'],
    email: (e.email as string) || '',
    phone: (e.phone as string) || '',
    status: (e.status === 'active' ? 'Online' : e.status === 'stopped' ? 'Idle' : 'Offline') as Employee['status'],
    is_active: true,
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name as string)}&background=2563EB&color=fff`,
    location: (e.work_location as string) || '',
    last_seen: 'Just now',
    license_count: 0,
    total_licenses: 20,
    joining_date: (e.joining_date as string) || '',
  }));
}

// ─── attendance ───────────────────────────────────────────────
export async function pushPunchIn(
  employeeIdParam: string,
  employeeName: string,
  department: string,
  location: string,
): Promise<string | null> {
  // BUG 4 FIX: always use the EMP... id from session, not auth UUID
  // If caller passes the auth UUID by mistake, fall back to session.employeeId
  const employeeId = eid() || employeeIdParam;
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const { error } = await sb().from('attendance').upsert({
    id: `ATT-${cid()}-${employeeId}-${today}`,
    company_id: cid(), employee_id: employeeId,
    employee_name: employeeName, department,
    date: today, check_in_time: time,
    status: 'Present', location, created_by: employeeName,
  });
  if (error) { console.error('pushPunchIn:', error.message); return error.message; }
  return null;
}

export async function pushPunchOut(
  employeeIdParam: string,
  location: string,
): Promise<string | null> {
  // BUG 4 FIX: use EMP... id from session
  const employeeId = eid() || employeeIdParam;
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const { error } = await sb().from('attendance')
    .update({ check_out_time: time, location })
    .eq('id', `ATT-${cid()}-${employeeId}-${today}`);
  if (error) { console.error('pushPunchOut:', error.message); return error.message; }
  return null;
}

export async function checkIfPunchedIn(employeeIdParam: string): Promise<boolean> {
  // BUG 4 FIX: use EMP... id
  const employeeId = eid() || employeeIdParam;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb().from('attendance').select('check_in_time, check_out_time')
    .eq('company_id', cid()).eq('employee_id', employeeId).eq('date', today).maybeSingle();
  if (!data) return false;
  const d = data as Record<string, unknown>;
  return !!(d.check_in_time && !d.check_out_time);
}

export async function fetchTodayAttendanceLogs(employeeId: string): Promise<AttendanceLog[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb().from('attendance').select('*')
    .eq('company_id', cid()).eq('employee_id', employeeId).eq('date', today);
  if (!data?.length) return [];
  const row = data[0] as Record<string, unknown>;
  const logs: AttendanceLog[] = [];
  if (row.check_in_time) logs.push({ id: '1', type: 'Punch In', time: row.check_in_time as string, location: (row.location as string) || '', source: 'mobile' });
  if (row.check_out_time) logs.push({ id: '2', type: 'Punch Out', time: row.check_out_time as string, location: (row.location as string) || '', source: 'mobile' });
  return logs;
}

export async function fetchAttendanceStats(employeeId: string) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const { data } = await sb().from('attendance').select('status')
    .eq('company_id', cid()).eq('employee_id', employeeId).gte('date', thisMonth + '-01');
  const rows = (data || []) as { status: string }[];
  return {
    present: rows.filter(r => r.status === 'Present').length,
    absent:  rows.filter(r => r.status === 'Absent').length,
    late:    rows.filter(r => r.status === 'Late').length,
    leave:   rows.filter(r => r.status === 'On Leave').length,
  };
}

// ─── dashboard stats ──────────────────────────────────────────
export async function fetchDashboardStats(employeeId: string) {
  if (!cid()) return { totalVisits: 0, completedTasks: 0, attendanceDays: 0, pendingLeaves: 0 };
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [{ count: visits }, { count: tasks }, { count: attendance }, { count: leaves }] =
    await Promise.all([
      sb().from('visits').select('*', { count: 'exact', head: true }).eq('company_id', cid()).eq('employee_id', employeeId),
      sb().from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', cid()).eq('employee_id', employeeId).eq('status', 'Completed'),
      sb().from('attendance').select('*', { count: 'exact', head: true }).eq('company_id', cid()).eq('employee_id', employeeId).gte('date', thisMonth + '-01'),
      sb().from('leaves').select('*', { count: 'exact', head: true }).eq('company_id', cid()).eq('employee_id', employeeId).eq('status', 'pending'),
    ]);
  return { totalVisits: visits ?? 0, completedTasks: tasks ?? 0, attendanceDays: attendance ?? 0, pendingLeaves: leaves ?? 0 };
}

// ─── visits — maps to ClientVisit shape ──────────────────────
export async function fetchVisits(employeeId?: string): Promise<ClientVisit[]> {
  if (!cid()) return [];
  const id = employeeId || eid();
  const { data } = await sb().from('visits').select('*')
    .eq('company_id', cid()).eq('employee_id', id).order('created_at', { ascending: false });
  if (!data) return [];
  const colors: ClientVisit['iconColor'][] = ['green', 'blue', 'amber', 'purple'];
  return (data as Record<string, unknown>[]).map((v, i) => ({
    id: v.id as string,
    companyName: v.client_name as string,
    managerName: (v.employee_name as string) || '',
    location: (v.location as string) || '',
    city: (v.location as string)?.split(',').pop()?.trim() || 'Delhi',
    time: (v.check_in_time as string) || (v.created_at as string) || '',
    status: (v.status === 'Completed' ? 'Completed' : 'Pending') as ClientVisit['status'],
    iconColor: colors[i % colors.length],
  }));
}

export async function pushVisitStatusUpdate(visitId: string, status: string): Promise<string | null> {
  const { error } = await sb().from('visits').update({ status }).eq('id', visitId);
  if (error) { console.error('pushVisitStatusUpdate:', error.message); return error.message; }
  return null;
}

// ─── tasks — maps to Task shape ───────────────────────────────
export async function fetchTasks(employeeId?: string): Promise<Task[]> {
  if (!cid()) return [];
  const id = employeeId || eid();
  const { data } = await sb().from('tasks').select('*')
    .eq('company_id', cid()).eq('employee_id', id).order('created_at', { ascending: false });
  if (!data) return [];
  return (data as Record<string, unknown>[]).map(t => ({
    id: t.id as string,
    title: t.title as string,
    clientName: (t.client_name as string) || '',
    priority: ((t.priority as string) || 'Medium') as Task['priority'],
    status: ((t.status as string) || 'To Do') as Task['status'],
    assigneeAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent((t.employee_name as string) || 'U')}&background=2563EB&color=fff`,
    dueDate: (t.due_date as string) || '',
    progress: (t.progress as number) || 0,
  }));
}

export async function pushTaskStatus(taskId: string, status: string): Promise<string | null> {
  const { error } = await sb().from('tasks').update({
    status,
    ...(status === 'Completed' ? { completed_at: new Date().toISOString(), progress: 100 } : {}),
  }).eq('id', taskId);
  if (error) { console.error('pushTaskStatus:', error.message); return error.message; }
  return null;
}

export async function pushNewTask(task: Partial<Task> & { employeeId?: string; employeeName?: string }): Promise<string | null> {
  const s = getMobileSession();
  const id = 'TSK-' + crypto.randomUUID();
  const { error } = await sb().from('tasks').insert({
    id, company_id: cid(),
    title: task.title || 'New Task',
    client_name: task.clientName || '',
    // BUG 4 FIX: use EMP... id not auth UUID
    employee_id: task.employeeId || eid() || s?.userId || '',
    employee_name: task.employeeName || s?.name || '',
    priority: task.priority || 'Medium',
    status: 'To Do', progress: 0,
    due_date: task.dueDate || '',
    created_by: s?.name || '',
  });
  if (error) { console.error('pushNewTask:', error.message); return error.message; }
  return null;
}

// ─── shifts — maps to Shift shape ────────────────────────────
export async function fetchShifts(employeeId?: string): Promise<Shift[]> {
  if (!cid()) return [];
  const id = employeeId || eid();
  const { data } = await sb().from('shift_assignments')
    .select('shift_id, assigned_date, shifts(shift_name, start_time, end_time, status, zone, location)')
    .eq('company_id', cid()).eq('employee_id', id)
    .order('assigned_date', { ascending: false }).limit(20);
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((a, i) => {
    const sh = (a.shifts as Record<string, unknown>) || {};
    const start = (sh.start_time as string) || '09:00';
    const end = (sh.end_time as string) || '18:00';
    const rawStatus = (sh.status as string) || 'upcoming';
    const statusMap: Record<string, Shift['status']> = {
      upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
    };
    return {
      id: (a.shift_id as string) || String(i),
      name: (sh.shift_name as string) || 'General Shift',
      timeRange: `${start} – ${end}`,
      duration: '9h',
      location: (sh.location as string) || '',
      zone: (sh.zone as string) || '',
      status: statusMap[rawStatus] || 'Upcoming',
      assignedEmployees: [],
      avatarCount: 0,
      overflowCount: 0,
    };
  });
}

export async function pushNewShift(shift: Partial<Shift> & { shiftName?: string; startTime?: string; endTime?: string; employeeIds?: string[] }): Promise<string | null> {
  const { data, error } = await sb().from('shifts').insert({
    company_id: cid(),
    shift_name: shift.shiftName || shift.name || 'New Shift',
    start_time: shift.startTime || '09:00',
    end_time: shift.endTime || '18:00',
    zone: shift.zone || '', location: shift.location || '',
    status: 'upcoming',
  }).select('id').single();
  if (error) { console.error('pushNewShift:', error.message); return error.message; }
  const shiftId = (data as Record<string, unknown>).id as string;
  if (shift.employeeIds?.length) {
    const today = new Date().toISOString().split('T')[0];
    await sb().from('shift_assignments').insert(
      shift.employeeIds.map(empId => ({ company_id: cid(), shift_id: shiftId, employee_id: empId, assigned_date: today }))
    );
  }
  return null;
}

// ─── leaves — maps to LeaveBalance / LeaveRequest shapes ──────
export async function fetchLeaveBalance(employeeId?: string): Promise<LeaveBalance[]> {
  const id = employeeId || eid();
  if (!cid() || !id) {
    // Return default balances so UI renders even before data loads
    return [
      { type: 'Casual Leave (CL)', code: 'CL', left: 12, total: 12 },
      { type: 'Sick Leave (SL)',   code: 'SL', left: 8,  total: 8  },
      { type: 'Earned Leave (EL)', code: 'EL', left: 18, total: 18 },
      { type: 'Comp Off (CO)',     code: 'CO', left: 6,  total: 6  },
    ];
  }
  const { data } = await sb().from('leave_balances')
    .select('*, leave_types(type_name, code)')
    .eq('company_id', cid()).eq('employee_id', id);
  if (!data?.length) {
    return [
      { type: 'Casual Leave (CL)', code: 'CL', left: 12, total: 12 },
      { type: 'Sick Leave (SL)',   code: 'SL', left: 8,  total: 8  },
      { type: 'Earned Leave (EL)', code: 'EL', left: 18, total: 18 },
      { type: 'Comp Off (CO)',     code: 'CO', left: 6,  total: 6  },
    ];
  }
  const codeMap: Record<string, LeaveBalance['code']> = { CL: 'CL', SL: 'SL', EL: 'EL', CO: 'CO' };
  return (data as Record<string, unknown>[]).map(b => {
    const lt = (b.leave_types as Record<string, unknown>) || {};
    const code = (lt.code as string) || 'CL';
    const typeName = (lt.type_name as string) || 'Leave';
    const total = (b.total_days as number) || 0;
    const used = (b.used_days as number) || 0;
    return {
      type: `${typeName} (${code})`,
      code: (codeMap[code] || 'CL') as LeaveBalance['code'],
      total,
      left: Math.max(0, total - used),
    };
  });
}

export async function fetchLeaveHistory(employeeId?: string): Promise<LeaveRequest[]> {
  const id = employeeId || eid();
  if (!cid() || !id) return [];
  const { data } = await sb().from('leaves').select('*')
    .eq('company_id', cid()).eq('employee_id', id).order('created_at', { ascending: false });
  if (!data) return [];
  const leaveTypeMap: Record<string, LeaveRequest['leaveType']> = {
    CL: 'Casual Leave (CL)', SL: 'Sick Leave (SL)', EL: 'Earned Leave (EL)', CO: 'Comp Off (CO)',
  };
  return (data as Record<string, unknown>[]).map(l => {
    const policyName = (l.leave_policy_name as string) || 'CL';
    const code = policyName.match(/\((\w+)\)/)?.[1] || policyName;
    const start = l.start_date as string;
    const end = l.end_date as string;
    const days = (l.total_days as number) || 1;
    const duration = days === 0.5 ? 'Half Day' : days === 1 ? '1 Day' : `${days} Days`;
    const rawStatus = (l.status as string) || 'pending';
    const statusMap: Record<string, LeaveRequest['status']> = {
      approved: 'Approved', rejected: 'Rejected', pending: 'Pending', cancelled: 'Pending',
    };
    return {
      id: l.id as string,
      leaveType: (leaveTypeMap[code] || 'Casual Leave (CL)') as LeaveRequest['leaveType'],
      startDate: start,
      endDate: end,
      duration,
      status: statusMap[rawStatus] || 'Pending',
      reason: (l.reason as string) || '',
      phone: (l.contact_phone as string) || '',
      email: (l.employee_email as string) || '',
    };
  });
}

export async function pushLeaveRequest(req: {
  employeeId: string; employeeName: string; employeeEmail?: string;
  leaveType?: string; leavePolicyName?: string;
  startDate: string; endDate: string; reason: string;
}): Promise<{ success: boolean; message: string }> {
  const id = 'LVA-' + crypto.randomUUID();
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  const { error } = await sb().from('leaves').insert({
    id, company_id: cid(),
    employee_id: req.employeeId,
    employee_name: req.employeeName,
    employee_email: req.employeeEmail || '',
    leave_policy_name: req.leavePolicyName || req.leaveType || 'Casual Leave',
    start_date: req.startDate, end_date: req.endDate,
    total_days: totalDays, reason: req.reason,
    status: 'pending', applied_on: new Date().toISOString().split('T')[0],
  });
  if (error) { console.error('pushLeaveRequest:', error.message); return { success: false, message: error.message }; }
  return { success: true, message: 'Leave request submitted.' };
}

// ─── notifications — maps to NotificationItem shape ───────────
export async function fetchNotifications(userId?: string): Promise<NotificationItem[]> {
  if (!cid()) return [];
  const { data } = await sb().from('notifications')
    .select('*').eq('company_id', cid())
    .order('created_at', { ascending: false }).limit(50);
  if (!data) return [];
  const typeMap: Record<string, NotificationItem['type']> = {
    Attendance: 'attendance', Task: 'task', Leave: 'leave', System: 'announcement',
    Visit: 'client', Report: 'performance', Alert: 'announcement', Route: 'attendance',
  };
  return (data as Record<string, unknown>[]).map(n => ({
    id: n.id as string,
    title: n.title as string,
    description: (n.description as string) || '',
    timestamp: (n.created_at as string) || '',
    type: (typeMap[(n.type as string)] || 'announcement') as NotificationItem['type'],
    read: !!(n.read),
    linkedText: (n.reference_type as string) || '',
  }));
}

export async function markRead(notifId: string): Promise<void> {
  await sb().from('notifications').update({ read: true }).eq('id', notifId);
}

export async function markAllRead(): Promise<void> {
  if (!cid()) return;
  await sb().from('notifications').update({ read: true }).eq('company_id', cid()).eq('read', false);
}

// ─── payslip — maps to Payslip shape ─────────────────────────
export async function fetchPayslip(employeeId?: string, month?: number, year?: number): Promise<Payslip | null> {
  const id = employeeId || eid();
  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();
  if (!cid() || !id) return null;

  const { data } = await sb().from('payslips').select('*')
    .eq('company_id', cid()).eq('employee_id', id).eq('month', m).eq('year', y).maybeSingle();

  const s = getMobileSession();
  const empName = s?.name || 'Employee';

  if (!data) {
    // Return a zeroed payslip so UI renders cleanly
    return {
      employeeId: id, employeeName: empName,
      month: `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`,
      bankAccount: 'Not set',
      earnings: { basic: 0, hra: 0, conveyance: 0, special: 0, performance: 0, other: 0 },
      deductions: { providentFund: 0, professionalTax: 0, incomeTax: 0, esi: 0, other: 0 },
      grossSalary: 0, netSalary: 0, status: 'draft',
    } as Payslip;
  }

  const d = data as Record<string, unknown>;
  const earn = (d.earnings_json as Record<string, number>) || {};
  const ded  = (d.deductions_json as Record<string, number>) || {};
  return {
    employeeId: id, employeeName: empName,
    month: `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`,
    bankAccount: 'Not set',
    earnings: {
      basic:       earn.basic || 0,
      hra:         earn.hra || 0,
      conveyance:  earn.conveyance || 1600,
      special:     earn.special || 0,
      performance: earn.performance || 0,
      other:       earn.other || 0,
    },
    deductions: {
      providentFund:   ded.pf || 0,
      professionalTax: ded.pt || 0,
      incomeTax:       ded.tds || 0,
      esi:             ded.esi || 0,
      other:           ded.other || 0,
    },
    grossSalary: (d.gross_earnings as number) || 0,
    netSalary:   (d.net_pay as number) || 0,
    status:      (d.status as string) || 'draft',
  } as Payslip;
}

// ─── realtime subscriptions ───────────────────────────────────
export function subAttendance(employeeId: string, callback: (payload: unknown) => void) {
  return sb().channel(`att:${cid()}:${employeeId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `company_id=eq.${cid()}` }, callback)
    .subscribe();
}

export function subTasks(employeeId: string, callback: (payload: unknown) => void) {
  return sb().channel(`tsk:${cid()}:${employeeId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `company_id=eq.${cid()}` }, callback)
    .subscribe();
}

export function subVisits(employeeId: string, callback: (payload: unknown) => void) {
  return sb().channel(`vis:${cid()}:${employeeId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visits', filter: `company_id=eq.${cid()}` }, callback)
    .subscribe();
}

export function subNotifications(companyId: string, callback: (payload: unknown) => void) {
  return sb().channel(`ntf:${companyId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `company_id=eq.${companyId}` }, callback)
    .subscribe();
}
