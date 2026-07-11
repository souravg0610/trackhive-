// STUB — All sync functions replaced by apiClient.ts calls.
// This file kept as stub to prevent import errors during migration.

export async function saveEmployee() { return null; }
export async function saveManyEmployees() { return null; }
export async function saveAttendance() { return null; }
export async function saveVisit() { return null; }
export async function saveTask() { return null; }
export async function saveGeofence() { return null; }
export async function saveDocument() { return null; }
export async function saveNotification() { return null; }
export async function saveShift() { return null; }
export async function saveShiftAssignments() { return null; }
export async function saveLeave() { return null; }
export async function saveManyLeaves() { return null; }
export async function saveSalaryConfig() { return null; }
export async function savePayslip() { return null; }
export async function saveOrgSettings() { return null; }
export async function adminInviteEmployee() { return { success: false, message: 'Use backend API' }; }
export async function adminSetEmployeePassword() { return { success: false, message: 'Use backend API' }; }
export async function pullStateFromSupabase() { return { success: false, message: 'Use backend API', data: {} }; }
export async function pushStateToSupabase() { return { success: false, message: 'Use backend API' }; }
export async function purgeAllTenantData() { return { success: false, message: 'Use backend API' }; }
export const SUPABASE_SQL_SCHEMA = '';
export function getCompanyId() { return localStorage.getItem('th_company_id') || ''; }
export async function loadOrgSettings() { return null; }
