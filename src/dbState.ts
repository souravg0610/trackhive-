/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Employee,
  AttendanceLog,
  ClientVisit,
  KanbanTask,
  GeofenceArea,
  DocumentRecord,
  NotificationAlert,
  RoutePath,
  CompanySettings,
  AppPreferences,
  ShiftPattern,
  EmployeeShiftAssignment,
  PayrollRecord,
  LeavePolicy,
  LeaveApplication
} from './types';

const DEFAULT_ROLES = ['Super Administrator', 'Manager', 'Field Agent', 'Sales Executive', 'Logistics Rider'];
const DEFAULT_DEPARTMENTS = ['Operations', 'Sales', 'Logistics', 'Customer Support', 'Human Resources'];
const DEFAULT_BRANCHES = ['HQ Office'];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Administrator': ['dashboard', 'employees', 'tracking', 'attendance', 'shifts', 'payroll', 'leaves', 'visits', 'tasks', 'routes', 'geofence', 'reports', 'documents', 'notifications', 'settings'],
  'Manager': ['dashboard', 'employees', 'tracking', 'attendance', 'shifts', 'payroll', 'leaves', 'visits', 'tasks', 'routes', 'geofence', 'reports', 'documents', 'notifications'],
  'Field Agent': ['dashboard', 'tracking', 'attendance', 'leaves', 'visits', 'tasks', 'routes', 'notifications'],
  'Sales Executive': ['dashboard', 'tracking', 'attendance', 'leaves', 'visits', 'tasks', 'routes', 'notifications'],
  'Logistics Rider': ['dashboard', 'tracking', 'attendance', 'leaves', 'visits', 'tasks', 'routes', 'notifications']
};

const EMPTY_COMPANY_SETTINGS: CompanySettings = {
  name: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  industry: '',
  companySize: '',
  timezone: '(UTC +05:30) Asia/Kolkata',
  dateFormat: 'MMM DD, YYYY',
  currency: 'INR (₹)',
  language: 'English',
  description: '',
  logoUrl: ''
};

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  defaultDashboard: 'Dashboard',
  rowsPerPage: 10,
  startOfWeek: 'Monday',
  unitSystem: 'Metric (km, kg)',
  theme: 'light'
};

export interface SalaryConfig {
  ctcMonthly: number;
  optInEPF: boolean;
  metroHRA: boolean;
  customTds: number;
  mediclaimDeduction: number;
  customAllowance: number;
}

export interface DBState {
  employees: Employee[];
  employeeSalaryConfigs?: Record<string, SalaryConfig>;
  attendance: AttendanceLog[];
  visits: ClientVisit[];
  tasks: KanbanTask[];
  geofences: GeofenceArea[];
  documents: DocumentRecord[];
  notifications: NotificationAlert[];
  routes: RoutePath[];
  settings: CompanySettings;
  preferences: AppPreferences;
  currentPlan: {
    type: string;
    validUntil: string;
    maxEmployees: number;
    storageUsed: string;
    storageTotal: string;
  };
  customRoles?: string[];
  customDepartments?: string[];
  customBranches?: string[];
  rolePermissions?: Record<string, string[]>;
  taskSelfieRequired?: boolean;
  attendanceSelfieRequired?: boolean;
  shifts?: ShiftPattern[];
  shiftAssignments?: EmployeeShiftAssignment[];
  payrollRecords?: PayrollRecord[];
  leavePolicies?: LeavePolicy[];
  leaveApplications?: LeaveApplication[];
}

/**
 * Returns an EMPTY state – no dummy shifts, no dummy leaves, nothing.
 * All real data comes from Supabase.
 */
export function getInitialState(userEmail?: string): DBState {
  return {
    employees: [],
    attendance: [],
    visits: [],
    tasks: [],
    geofences: [],
    documents: [],
    notifications: [],
    routes: [],
    settings: EMPTY_COMPANY_SETTINGS,
    preferences: DEFAULT_APP_PREFERENCES,
    currentPlan: {
      type: 'Enterprise Cloud Plan',
      validUntil: 'Unlimited',
      maxEmployees: 250,
      storageUsed: '0 GB',
      storageTotal: '100 GB'
    },
    customRoles: DEFAULT_ROLES,
    customDepartments: DEFAULT_DEPARTMENTS,
    customBranches: DEFAULT_BRANCHES,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    taskSelfieRequired: true,
    attendanceSelfieRequired: true,
    shifts: [],
    shiftAssignments: [],
    payrollRecords: [],
    leavePolicies: [],
    leaveApplications: []
  };
}

/**
 * No-op – no localStorage caching of any data.
 */
export function saveState(state: DBState) {
  // Intentionally empty – data is stored only in Supabase.
}