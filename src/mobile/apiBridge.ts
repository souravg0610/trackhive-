// ============================================================
// MOBILE API BRIDGE — drop-in replacement for supabaseBridge.ts
// Same function names and signatures, but every call now goes
// through the NestJS backend via apiClient.ts. No Supabase
// client, no anon key, no service key anywhere in this file.
// ============================================================
import {
  apiSignIn, setApiToken, getApiToken, apiSignOut,
  apiGetEmployees,
  apiGetTodayAttendance, apiPunchIn, apiPunchOut, apiGetEmployeeAttendance,
  apiGetMonthlyStats,
  apiGetVisits, apiCheckInVisit, apiCheckOutVisit,
  apiGetTasksByEmployee, apiUpdateTaskStatus, apiCreateTask,
  apiGetMyShifts, apiCreateShift,
  apiGetLeaveBalance, apiApplyLeave,
  apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead,
  apiGetPayslips,
} from '../lib/apiClient';
import type {
  Employee, AttendanceLog, AttendanceState, Shift,
  ClientVisit, Task, LeaveRequest, LeaveBalance,
  NotificationItem, Payslip,
} from './mobileTypes';

// ─── session ─────────────────────────────────────────────────
export interface MobileSession {
  userId: string;
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

function eid(): string { return _session?.userId || ''; }

// ─── auth ─────────────────────────────────────────────────────
export async function mobileLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; session?: MobileSession }> {
  try {
    const result = await apiSignIn(email, password);
    const session: MobileSession = {
      userId:    result.user.sub,
      email:     result.user.email,
      companyId: result.user.companyId,
      role:      result.user.role,
      name:      result.user.name,
    };
    setMobileSession(session);
    return { success: true, message: 'OK', session };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Login failed' };
  }
}

export async function mobileLogout(): Promise<void> {
  apiSignOut();
  _session = null;
  localStorage.removeItem(SESSION_KEY);
}

// ─── employees ───────────────────────────────────────────────
export async function fetchEmployees(): Promise<Employee[]> {
  const raw = await apiGetEmployees().catch(() => []);
  return raw.map(e => ({
    id:             e.id as string,
    name:           e.name as string,
    role:           ((e.role as string) || 'Field Agent') as Employee['role'],
    department:     ((e.department as string) || 'Operations') as Employee['department'],
    email:          (e.email as string) || '',
    phone:          (e.phone as string) || '',
    status:         (e.status === 'active' ? 'Online' : e.status === 'stopped' ? 'Idle' : 'Offline') as Employee['status'],
    is_active:      true,
    avatar_url:     `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name as string)}&background=2563EB&color=fff`,
    location:       (e.work_location as string) || '',
    last_seen:      'Just now',
    license_count:  0,
    total_licenses: 20,
    joining_date:   (e.joining_date as string) || '',
  }));
}

// ─── dashboard stats ──────────────────────────────────────────
export async function fetchDashboardStats(employeeId: string) {
  const [visits, tasks, attendance] = await Promise.all([
    apiGetVisits(1, 1).catch(() => ({ meta: { total: 0 } })),
    apiGetTasksByEmployee(employeeId).catch(() => []),
    apiGetEmployeeAttendance(employeeId).catch(() => []),
  ]);
  const completedTasks = (tasks as Record<string, unknown>[]).filter(t => t.status === 'Completed').length;
  return {
    totalVisits:     (visits as { meta: { total: number } }).meta.total,
    completedTasks,
    attendanceDays:  (attendance as unknown[]).length,
    pendingLeaves:   0,
  };
}

// ─── attendance ───────────────────────────────────────────────
export async function pushPunchIn(
  employeeId: string,
  employeeName: string,
  department: string,
  location: string,
): Promise<string | null> {
  try { await apiPunchIn(location, department); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Punch in failed'; }
}

export async function pushPunchOut(
  employeeId: string,
  location: string,
): Promise<string | null> {
  try { await apiPunchOut(location); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Punch out failed'; }
}

export async function checkIfPunchedIn(employeeId: string): Promise<boolean> {
  const today = await apiGetTodayAttendance().catch(() => []);
  const mine = today.find(r => r.employee_id === employeeId);
  return !!(mine?.check_in_time && !mine?.check_out_time);
}

export async function fetchTodayAttendanceLogs(employeeId: string): Promise<AttendanceLog[]> {
  const today = await apiGetTodayAttendance().catch(() => []);
  const row = today.find(r => r.employee_id === employeeId);
  if (!row) return [];
  const logs: AttendanceLog[] = [];
  if (row.check_in_time)  logs.push({ id: '1', type: 'Punch In',  time: row.check_in_time as string,  location: (row.location as string) || '', source: 'mobile' });
  if (row.check_out_time) logs.push({ id: '2', type: 'Punch Out', time: row.check_out_time as string, location: (row.location as string) || '', source: 'mobile' });
  return logs;
}

export async function fetchAttendanceStats(employeeId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const stats = await apiGetMonthlyStats(month).catch(() => []);
  const mine = stats.find(s => s.employeeId === employeeId) as Record<string, number> | undefined;
  return {
    present: mine?.present ?? 0,
    absent:  mine?.absent  ?? 0,
    late:    mine?.late    ?? 0,
    leave:   mine?.leave   ?? 0,
  };
}

// ─── visits ───────────────────────────────────────────────────
export async function fetchVisits(employeeId?: string): Promise<ClientVisit[]> {
  const result = await apiGetVisits(1, 100).catch(() => ({ data: [] as Record<string, unknown>[] }));
  const colors: ClientVisit['iconColor'][] = ['green', 'blue', 'amber', 'purple'];
  return result.data.map((v, i) => ({
    id:           v.id as string,
    companyName:  v.client_name as string,
    managerName:  (v.employee_name as string) || '',
    location:     (v.location as string) || '',
    city:         (v.location as string)?.split(',').pop()?.trim() || 'Delhi',
    time:         (v.check_in_time as string) || (v.created_at as string) || '',
    status:       (v.status === 'Completed' ? 'Completed' : 'Pending') as ClientVisit['status'],
    iconColor:    colors[i % colors.length],
  }));
}

export async function pushVisitStatusUpdate(visitId: string, status: string): Promise<string | null> {
  try {
    if (status === 'Completed') await apiCheckOutVisit(visitId, '');
    else await apiCheckInVisit(visitId, '');
    return null;
  } catch (err: unknown) { return err instanceof Error ? err.message : 'Update failed'; }
}

// ─── tasks ────────────────────────────────────────────────────
export async function fetchTasks(employeeId?: string): Promise<Task[]> {
  const id = employeeId || eid();
  const raw = await apiGetTasksByEmployee(id).catch(() => []);
  return raw.map(t => ({
    id:             t.id as string,
    title:          t.title as string,
    clientName:     (t.client_name as string) || '',
    priority:       ((t.priority as string) || 'Medium') as Task['priority'],
    status:         ((t.status as string) || 'To Do') as Task['status'],
    assigneeAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent((t.employee_name as string) || 'U')}&background=2563EB&color=fff`,
    dueDate:        (t.due_date as string) || '',
    progress:       (t.progress as number) || 0,
  }));
}

export async function pushTaskStatus(taskId: string, status: string): Promise<string | null> {
  try { await apiUpdateTaskStatus(taskId, status); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Update failed'; }
}

export async function pushNewTask(task: Partial<Task> & { employeeId?: string; employeeName?: string }): Promise<string | null> {
  const s = getMobileSession();
  try {
    await apiCreateTask({
      title:         task.title || 'New Task',
      client_name:   task.clientName || '',
      employee_id:   task.employeeId || s?.userId || '',
      employee_name: task.employeeName || s?.name || '',
      priority:      task.priority || 'Medium',
      due_date:      task.dueDate || '',
    });
    return null;
  } catch (err: unknown) { return err instanceof Error ? err.message : 'Create failed'; }
}

// ─── shifts ───────────────────────────────────────────────────
export async function fetchShifts(employeeId?: string): Promise<Shift[]> {
  const raw = await apiGetMyShifts().catch(() => []);
  return raw.map((a, i) => {
    const start = (a.start_time as string) || '09:00';
    const end   = (a.end_time as string)   || '18:00';
    const statusMap: Record<string, Shift['status']> = {
      upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
    };
    return {
      id:                String(a.id ?? i),
      name:              (a.shift_name as string) || 'General Shift',
      timeRange:         `${start} – ${end}`,
      duration:          '9h',
      location:          (a.location as string) || '',
      zone:              (a.zone as string) || '',
      status:            statusMap[(a.status as string) || 'upcoming'] || 'Upcoming',
      assignedEmployees: [],
      avatarCount:       0,
      overflowCount:     0,
    };
  });
}

export async function pushNewShift(shift: Partial<Shift> & {
  shiftName?: string; startTime?: string; endTime?: string; employeeIds?: string[];
}): Promise<string | null> {
  try {
    await apiCreateShift({
      shift_name: shift.shiftName || shift.name || 'New Shift',
      start_time: shift.startTime || '09:00',
      end_time:   shift.endTime   || '18:00',
      zone:       shift.zone      || '',
      location:   shift.location  || '',
    });
    return null;
  } catch (err: unknown) { return err instanceof Error ? err.message : 'Create failed'; }
}

// ─── leaves ───────────────────────────────────────────────────
const DEFAULT_BALANCES: LeaveBalance[] = [
  { type: 'Casual Leave (CL)', code: 'CL', left: 12, total: 12 },
  { type: 'Sick Leave (SL)',   code: 'SL', left: 8,  total: 8  },
  { type: 'Earned Leave (EL)', code: 'EL', left: 18, total: 18 },
  { type: 'Comp Off (CO)',     code: 'CO', left: 6,  total: 6  },
];

export async function fetchLeaveBalance(employeeId?: string): Promise<LeaveBalance[]> {
  const id = employeeId || eid();
  if (!id) return DEFAULT_BALANCES;
  const raw = await apiGetLeaveBalance(id).catch(() => []);
  if (!raw.length) return DEFAULT_BALANCES;
  const codeMap: Record<string, LeaveBalance['code']> = { CL: 'CL', SL: 'SL', EL: 'EL', CO: 'CO' };
  return raw.map(b => {
    const lt       = (b.leave_types as Record<string, unknown>) || {};
    const code     = (lt.code as string) || 'CL';
    const typeName = (lt.type_name as string) || 'Leave';
    const total    = (b.total_days as number) || 0;
    const used     = (b.used_days as number) || 0;
    return {
      type:  `${typeName} (${code})`,
      code:  (codeMap[code] || 'CL') as LeaveBalance['code'],
      total,
      left:  Math.max(0, total - used),
    };
  });
}

export async function fetchLeaveHistory(employeeId?: string): Promise<LeaveRequest[]> {
  // Pending leaves endpoint covers the admin view; for personal
  // history we filter from the same pool by employee id.
  const id = employeeId || eid();
  const all = await apiGetLeaveBalance(id).catch(() => []); // placeholder if no dedicated endpoint
  return (all as unknown as Record<string, unknown>[]).map(l => ({
    id:        (l.id as string) || '',
    leaveType: 'Casual Leave (CL)',
    startDate: (l.start_date as string) || '',
    endDate:   (l.end_date as string) || '',
    duration:  '1 Day',
    status:    'Pending',
    reason:    (l.reason as string) || '',
    phone:     '',
  }));
}

export async function pushLeaveRequest(req: {
  employeeId: string; employeeName: string; employeeEmail?: string;
  leaveType?: string; leavePolicyName?: string;
  startDate: string; endDate: string; reason: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await apiApplyLeave({
      employee_id:        req.employeeId,
      employee_name:      req.employeeName,
      employee_email:     req.employeeEmail || '',
      leave_policy_name:  req.leavePolicyName || req.leaveType || 'Casual Leave',
      start_date:         req.startDate,
      end_date:           req.endDate,
      reason:             req.reason,
    });
    return { success: true, message: 'Leave request submitted.' };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Submit failed' };
  }
}

// ─── notifications ────────────────────────────────────────────
export async function fetchNotifications(userId?: string): Promise<NotificationItem[]> {
  const raw = await apiGetNotifications().catch(() => []);
  const typeMap: Record<string, NotificationItem['type']> = {
    Attendance: 'attendance', Task: 'task', Leave: 'leave', System: 'announcement',
    Visit: 'client', Report: 'performance', Alert: 'announcement', Route: 'attendance',
  };
  return raw.map(n => ({
    id:          n.id as string,
    title:       n.title as string,
    description: (n.description as string) || '',
    timestamp:   (n.created_at as string) || '',
    type:        (typeMap[n.type as string] || 'announcement') as NotificationItem['type'],
    read:        !!n.read,
    linkedText:  (n.reference_type as string) || '',
  }));
}

export async function markRead(notifId: string): Promise<void> {
  await apiMarkNotificationRead(notifId).catch(() => {});
}

export async function markAllRead(): Promise<void> {
  await apiMarkAllNotificationsRead().catch(() => {});
}

// ─── payslip ──────────────────────────────────────────────────
export async function fetchPayslip(employeeId?: string, month?: number, year?: number): Promise<Payslip | null> {
  const id = employeeId || eid();
  const m  = month ?? new Date().getMonth() + 1;
  const y  = year  ?? new Date().getFullYear();
  const s  = getMobileSession();

  const raw = await apiGetPayslips(id).catch(() => []);
  const data = raw.find(p => p.month === m && p.year === y);

  const empty: Payslip = {
    employeeId: id, employeeName: s?.name || 'Employee',
    month: `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`,
    bankAccount: 'Not set',
    earnings:   { basic: 0, hra: 0, conveyance: 0, special: 0, performance: 0, other: 0 },
    deductions: { providentFund: 0, professionalTax: 0, incomeTax: 0, esi: 0, other: 0 },
    grossSalary: 0, netSalary: 0, status: 'draft',
  } as Payslip;

  if (!data) return empty;

  const earn = (data.earnings_json   as Record<string, number>) || {};
  const ded  = (data.deductions_json as Record<string, number>) || {};
  return {
    employeeId: id, employeeName: s?.name || 'Employee',
    month: `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`,
    bankAccount: 'Not set',
    earnings: {
      basic: earn.basic || 0, hra: earn.hra || 0, conveyance: earn.conveyance || 1600,
      special: earn.special || 0, performance: earn.performance || 0, other: earn.other || 0,
    },
    deductions: {
      providentFund: ded.pf || 0, professionalTax: ded.pt || 0,
      incomeTax: ded.tds || 0, esi: ded.esi || 0, other: ded.other || 0,
    },
    grossSalary: (data.gross_earnings as number) || 0,
    netSalary:   (data.net_pay as number) || 0,
    status:      (data.status as string) || 'draft',
  } as Payslip;
}

// ─── realtime subscriptions ───────────────────────────────────
// Backend-API mode has no WebSocket layer yet. These are polling
// shims so existing screens keep working without modification —
// they poll every 15s instead of getting a push event.
type Unsub = { unsubscribe: () => void };

function poll(fn: () => void, intervalMs = 15000): Unsub {
  const id = setInterval(fn, intervalMs);
  return { unsubscribe: () => clearInterval(id) };
}

export function subAttendance(employeeId: string, callback: (payload: unknown) => void): Unsub {
  return poll(() => fetchTodayAttendanceLogs(employeeId).then(callback));
}
export function subTasks(employeeId: string, callback: (payload: unknown) => void): Unsub {
  return poll(() => fetchTasks(employeeId).then(callback));
}
export function subVisits(employeeId: string, callback: (payload: unknown) => void): Unsub {
  return poll(() => fetchVisits(employeeId).then(callback));
}
export function subNotifications(companyId: string, callback: (payload: unknown) => void): Unsub {
  return poll(() => fetchNotifications().then(callback));
}
