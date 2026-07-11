// ============================================================
// API CLIENT — the ONLY way the frontend talks to data.
// Every call goes through the NestJS backend.
// Set VITE_API_URL=http://localhost:4000/api/v1 in .env.local
// ============================================================

const BASE: string = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api/v1';

let _token: string | null = null;

export function setApiToken(token: string): void {
  _token = token;
  localStorage.setItem('th_token', token);
}
export function getApiToken(): string | null {
  return _token || localStorage.getItem('th_token');
}
export function clearApiToken(): void {
  _token = null;
  localStorage.removeItem('th_token');
}
export function setRefreshToken(token: string): void {
  localStorage.setItem('th_refresh_token', token);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem('th_refresh_token');
}
export function clearRefreshToken(): void {
  localStorage.removeItem('th_refresh_token');
}
export function isBackendEnabled(): boolean { return !!BASE; }
export function isApiConfigured(): boolean { return !!BASE; }

// ── Core fetch with auto token-refresh on 401 ─────────────────
let _isRefreshing = false;
let _refreshQueue: Array<() => void> = [];

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retry = false,
): Promise<T> {
  const token = getApiToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !_retry) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      if (_isRefreshing) {
        await new Promise<void>(resolve => _refreshQueue.push(resolve));
        return apiFetch<T>(path, options, true);
      }
      _isRefreshing = true;
      try {
        const refreshed = await apiFetch<{ token: string }>(
          '/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refreshToken }) },
          true,
        );
        setApiToken(refreshed.token);
        _refreshQueue.forEach(fn => fn());
        _refreshQueue = [];
        return apiFetch<T>(path, options, true);
      } catch {
        clearApiToken();
        clearRefreshToken();
        window.location.reload();
        throw new Error('Session expired. Please sign in again.');
      } finally {
        _isRefreshing = false;
      }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as Record<string, unknown>).message || `API error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  const body = json as Record<string, unknown>;
  return (body.data !== undefined ? body.data : body) as T;
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

export interface AuthUser {
  sub: string;
  email: string;
  companyId: string;
  role: string;
  name: string;
}

export async function apiSignUp(payload: {
  email: string; password: string; fullName: string;
  companyName: string; phone: string; industry?: string;
  companySize?: string; address?: string;
}): Promise<{ token: string; refreshToken?: string; user: AuthUser; companyId: string }> {
  const result = await apiFetch<{ token: string; refreshToken?: string; user: AuthUser; companyId: string }>(
    '/auth/signup', { method: 'POST', body: JSON.stringify(payload) }
  );
  setApiToken(result.token);
  if (result.refreshToken) setRefreshToken(result.refreshToken);
  return result;
}

export async function apiSignIn(email: string, password: string): Promise<{
  token: string; refreshToken: string; user: AuthUser;
}> {
  const result = await apiFetch<{ token: string; refreshToken: string; user: AuthUser }>(
    '/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  setApiToken(result.token);
  setRefreshToken(result.refreshToken);
  return result;
}

export async function apiRefreshToken(refreshToken: string): Promise<{ token: string }> {
  return apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
}

export async function apiGetMe(): Promise<AuthUser> {
  return apiFetch('/auth/me');
}

export function apiSignOut(): void {
  clearApiToken();
  clearRefreshToken();
}

// ════════════════════════════════════════════════════════════
// EMPLOYEES
// ════════════════════════════════════════════════════════════

export async function apiGetEmployees(): Promise<Record<string, unknown>[]> {
  return apiFetch('/employees');
}

export async function apiGetEmployee(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/employees/${id}`);
}

export async function apiGetEmployeesByDepartment(dept: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/employees/by-department/${encodeURIComponent(dept)}`);
}

export async function apiCreateEmployee(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/employees', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiUpdateEmployee(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiDeactivateEmployee(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/employees/${id}/deactivate`, { method: 'PUT' });
}

export async function apiDeleteEmployee(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/employees/${id}`, { method: 'DELETE' });
}

export async function apiBulkImportEmployees(
  employees: Record<string, unknown>[],
): Promise<{ succeeded: number; failed: number; total: number }> {
  return apiFetch('/employees/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ employees }),
  });
}

// ════════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════════

export async function apiPunchIn(location?: string, department?: string): Promise<Record<string, unknown>> {
  return apiFetch('/attendance/punch-in', { method: 'POST', body: JSON.stringify({ location, department }) });
}

export async function apiPunchOut(location?: string): Promise<Record<string, unknown>> {
  return apiFetch('/attendance/punch-out', { method: 'POST', body: JSON.stringify({ location }) });
}

export async function apiGetTodayAttendance(): Promise<Record<string, unknown>[]> {
  return apiFetch('/attendance/today');
}

export async function apiGetMonthlyStats(month: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/attendance/stats/${month}`);
}

export async function apiGetEmployeeAttendance(id: string, from?: string, to?: string): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiFetch(`/attendance/employee/${id}${qs ? `?${qs}` : ''}`);
}

export async function apiRegularizeAttendance(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/attendance/${id}/regularize`, { method: 'PUT', body: JSON.stringify(payload) });
}

// ════════════════════════════════════════════════════════════
// LEAVES
// ════════════════════════════════════════════════════════════

export async function apiApplyLeave(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/leaves/apply', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiGetPendingLeaves(): Promise<Record<string, unknown>[]> {
  return apiFetch('/leaves/pending');
}

export async function apiApproveLeave(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/leaves/${id}/approve`, { method: 'PUT' });
}

export async function apiRejectLeave(id: string, reason: string): Promise<Record<string, unknown>> {
  return apiFetch(`/leaves/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
}

export async function apiGetLeaveBalance(employeeId: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/leaves/balance/${employeeId}`);
}

// ════════════════════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════════════════════

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export async function apiGetTasks(page = 1, limit = 50): Promise<PaginatedResult<Record<string, unknown>>> {
  return apiFetch(`/tasks?page=${page}&limit=${limit}`);
}

export async function apiGetTask(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/tasks/${id}`);
}

export async function apiGetTasksByStatus(status: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/tasks/by-status/${encodeURIComponent(status)}`);
}

export async function apiGetTasksByEmployee(employeeId: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/tasks/by-employee/${employeeId}`);
}

export async function apiCreateTask(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiUpdateTask(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiUpdateTaskStatus(id: string, status: string): Promise<Record<string, unknown>> {
  return apiFetch(`/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function apiDeleteTask(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}

// ════════════════════════════════════════════════════════════
// VISITS
// ════════════════════════════════════════════════════════════

export async function apiGetVisits(page = 1, limit = 50): Promise<PaginatedResult<Record<string, unknown>>> {
  return apiFetch(`/visits?page=${page}&limit=${limit}`);
}

export async function apiGetVisit(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/visits/${id}`);
}

export async function apiGetVisitsByEmployee(employeeId: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/visits/by-employee/${employeeId}`);
}

export async function apiCreateVisit(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/visits', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiUpdateVisit(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/visits/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiCheckInVisit(id: string, location: string): Promise<Record<string, unknown>> {
  return apiFetch(`/visits/${id}/check-in`, { method: 'PUT', body: JSON.stringify({ location }) });
}

export async function apiCheckOutVisit(id: string, notes: string): Promise<Record<string, unknown>> {
  return apiFetch(`/visits/${id}/check-out`, { method: 'PUT', body: JSON.stringify({ notes }) });
}

export async function apiDeleteVisit(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/visits/${id}`, { method: 'DELETE' });
}

// ════════════════════════════════════════════════════════════
// PAYROLL
// ════════════════════════════════════════════════════════════

export async function apiGetPayslips(employeeId?: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/payroll/payslips${employeeId ? `?employeeId=${employeeId}` : ''}`);
}

export async function apiGetSalaryConfig(employeeId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/payroll/salary/${employeeId}`);
}

export async function apiSetSalaryConfig(employeeId: string, config: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/payroll/salary/${employeeId}`, { method: 'PUT', body: JSON.stringify(config) });
}

export async function apiGeneratePayslip(employeeId: string, month: number, year: number, presentDays?: number): Promise<Record<string, unknown>> {
  return apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify({ employeeId, month, year, presentDays }) });
}

// ════════════════════════════════════════════════════════════
// SHIFTS
// ════════════════════════════════════════════════════════════

export async function apiGetShifts(): Promise<Record<string, unknown>[]> {
  return apiFetch('/shifts');
}

export async function apiGetShift(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/shifts/${id}`);
}

export async function apiGetMyShifts(): Promise<Record<string, unknown>[]> {
  return apiFetch('/shifts/me');
}

export async function apiGetShiftsByEmployee(employeeId: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/shifts/employee/${employeeId}`);
}

export async function apiCreateShift(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/shifts', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiUpdateShift(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiAssignShift(shiftId: string, employeeIds: string[], date?: string): Promise<Record<string, unknown>> {
  return apiFetch(`/shifts/${shiftId}/assign`, { method: 'POST', body: JSON.stringify({ employeeIds, date }) });
}

export async function apiDeleteShift(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/shifts/${id}`, { method: 'DELETE' });
}

// ════════════════════════════════════════════════════════════
// GEOFENCES
// ════════════════════════════════════════════════════════════

export async function apiGetGeofences(): Promise<Record<string, unknown>[]> {
  return apiFetch('/geofences');
}

export async function apiGetGeofence(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/geofences/${id}`);
}

export async function apiCreateGeofence(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/geofences', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiUpdateGeofence(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/geofences/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiDeleteGeofence(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/geofences/${id}`, { method: 'DELETE' });
}

export async function apiCheckGeofencePoint(lat: number, lng: number): Promise<{ inside: string[]; violations: string[] }> {
  return apiFetch('/geofences/check-point', { method: 'POST', body: JSON.stringify({ lat, lng }) });
}

// ════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════

export async function apiGetNotifications(): Promise<Record<string, unknown>[]> {
  return apiFetch('/notifications');
}

export async function apiMarkNotificationRead(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function apiMarkAllNotificationsRead(): Promise<{ success: boolean }> {
  return apiFetch('/notifications/mark-all-read', { method: 'PUT' });
}

export async function apiPushNotification(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/notifications/push', { method: 'POST', body: JSON.stringify(payload) });
}

// ════════════════════════════════════════════════════════════
// DOCUMENTS
// ════════════════════════════════════════════════════════════

export async function apiGetDocuments(page = 1, limit = 50): Promise<PaginatedResult<Record<string, unknown>>> {
  return apiFetch(`/documents?page=${page}&limit=${limit}`);
}

export async function apiGetDocument(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/documents/${id}`);
}

export async function apiCreateDocument(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/documents', { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiUpdateDocument(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiDeleteDocument(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/documents/${id}`, { method: 'DELETE' });
}

// ════════════════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════════════════

export async function apiGetAttendanceReport(month?: string): Promise<Record<string, unknown>> {
  return apiFetch(`/reports/attendance${month ? `?month=${month}` : ''}`);
}

export async function apiGetVisitReport(from?: string, to?: string): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiFetch(`/reports/visits${qs ? `?${qs}` : ''}`);
}

export async function apiGetLeaveReport(year?: number): Promise<Record<string, unknown>> {
  return apiFetch(`/reports/leaves${year ? `?year=${year}` : ''}`);
}

export async function apiGetPayrollReport(month?: number, year?: number): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  const qs = params.toString();
  return apiFetch(`/reports/payroll${qs ? `?${qs}` : ''}`);
}

export async function apiGetTaskReport(): Promise<Record<string, unknown>> {
  return apiFetch('/reports/tasks');
}

export async function apiGetReport(
  type: 'attendance' | 'visits' | 'leaves' | 'payroll' | 'tasks',
  params?: Record<string, string | number>,
): Promise<Record<string, unknown>> {
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    : '';
  return apiFetch(`/reports/${type}${qs}`);
}

// ════════════════════════════════════════════════════════════
// COMPANY / SETTINGS / ORG SETTINGS
// ════════════════════════════════════════════════════════════

export async function apiGetCompany(): Promise<Record<string, unknown>> {
  return apiFetch('/companies/me');
}

export async function apiUpdateCompany(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/companies/me', { method: 'PUT', body: JSON.stringify(payload) });
}

export async function apiGetCompanySettings(): Promise<Record<string, unknown>> {
  return apiFetch('/companies/settings');
}

export async function apiUpdateCompanySetting(key: string, value: unknown): Promise<Record<string, unknown>> {
  return apiFetch('/companies/settings', { method: 'PUT', body: JSON.stringify({ key, value }) });
}

export interface OrgSettings {
  rolePermissions: Record<string, string[]>;
  customRoles: string[];
  customDepartments: string[];
  customBranches: string[];
}

export async function apiGetOrgSettings(): Promise<OrgSettings> {
  return apiFetch('/companies/org-settings');
}

export async function apiUpdateOrgSettings(payload: Partial<OrgSettings>): Promise<OrgSettings> {
  return apiFetch('/companies/org-settings', { method: 'PUT', body: JSON.stringify(payload) });
}

// ════════════════════════════════════════════════════════════
// USERS & ROLES
// ════════════════════════════════════════════════════════════

export async function apiGetUsers(): Promise<Record<string, unknown>[]> {
  return apiFetch('/users');
}

export async function apiGetSuperAdmins(): Promise<Record<string, unknown>[]> {
  return apiFetch('/users/super-admins');
}

export async function apiTransferSuperAdmin(toUserId: string, myNewRole = 'Manager'): Promise<Record<string, unknown>> {
  return apiFetch('/users/transfer-super-admin', { method: 'PUT', body: JSON.stringify({ toUserId, myNewRole }) });
}

export async function apiChangeUserRole(userId: string, role: string): Promise<Record<string, unknown>> {
  return apiFetch(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
}
export async function apiGenerateTempPassword(employeeId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/employees/${employeeId}/temp-password`, { method: 'POST' });
}

export async function apiBulkGeneratePasswords(): Promise<{
  results: { name: string; email: string; tempPassword: string; success: boolean; error?: string }[];
  succeeded: number;
  failed: number;
}> {
  return apiFetch('/employees/bulk-generate-passwords', { method: 'POST' });
}
// ════════════════════════════════════════════════════════════
// HIERARCHY
// ════════════════════════════════════════════════════════════

export async function apiGetOrgTree(): Promise<Record<string, unknown>[]> {
  return apiFetch('/employees/org-tree');
}

export async function apiGetDirectReports(employeeId: string): Promise<Record<string, unknown>[]> {
  return apiFetch(`/employees/${employeeId}/direct-reports`);
}

export async function apiGetReportingManager(employeeId: string): Promise<Record<string, unknown> | null> {
  return apiFetch(`/employees/${employeeId}/manager`);
}
