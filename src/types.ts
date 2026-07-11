/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  role: string;
  jobTitle?: string;
  avatar?: string; // base64 or URL
  status: 'active' | 'stopped' | 'offline';
  phone: string;
  email: string;
  department: string;
  joiningDate: string;
  reportingManager: string;
  workLocation: string;
  address: string;
  maritalStatus?: 'Single' | 'Married'; // single or married
  isActive?: boolean;
  lastWorkingDay?: string;
  authUserId?: string;
  created_by?: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM AM/PM
  checkOutTime?: string; // HH:MM AM/PM
  workingHours?: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late' | 'On Leave';
  location: string;
  notes?: string;
  selfieCheckInUrl?: string;
  selfieCheckOutUrl?: string;
  faceVerifiedIn?: boolean;
  faceVerifiedOut?: boolean;
  faceScoreIn?: number;
  faceScoreOut?: number;
  selfie_url?: string;
  created_by?: string;
}

export interface ClientVisit {
  id: string;
  clientName: string;
  industry: string;
  employeeId: string;
  employeeName: string;
  visitType: string; // e.g. "Client Meeting", "Product Demo", "Site Visit", "Follow-up Call"
  location: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  notes?: string;
  documents?: string[];
  images?: string[]; // uploaded photos (base64 URLs)
  created_by?: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  clientId?: string;
  clientName?: string;
  employeeId: string;
  employeeName: string;
  dueDate: string;
  dueTime?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  description?: string;
  subtasks: { id: string; text: string; completed: boolean }[];
  attachments: { id: string; name: string; size: string; url?: string }[];
  startSelfie?: string;
  startSelfieTime?: string;
  startSelfieLoc?: string;
  startLat?: number;
  startLng?: number;
  startFaceVerified?: boolean;
  startFaceScore?: number;
  stopSelfie?: string;
  stopSelfieTime?: string;
  stopSelfieLoc?: string;
  stopLat?: number;
  stopLng?: number;
  stopFaceVerified?: boolean;
  stopFaceScore?: number;
  selfieRequired?: boolean;
  selfie_proof?: string;
  created_by?: string;
}

export interface GeofenceArea {
  id: string;
  name: string;
  location: string;
  radius: number; // e.g. 250
  employeesCount: number;
  status: 'Active' | 'Inactive';
  createdOn: string;
  lastUpdated: string;
  createdBy: string;
  lat: number;
  lng: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  category: 'ID Proof' | 'Company' | 'Offer Letter' | 'Legal' | 'Other';
  uploadedBy: string;
  uploadedById: string;
  uploadedDate: string;
  size: string;
  status: 'Active' | 'Inactive' | 'Pending Verification';
  fileUrl?: string; // base64 image or text content
  idNumber?: string; // e.g. Aadhaar index "XXXX XXXX 1234"
  dob?: string;
  gender?: string;
  tags?: string[];
}

export interface NotificationAlert {
  id: string;
  title: string;
  description: string;
  employeeName?: string;
  employeeRole?: string;
  location?: string;
  type: 'Attendance' | 'Visit' | 'Geofence' | 'Task' | 'Report' | 'System' | 'Alert' | 'Route' | 'Security' | 'User';
  priority: 'Low' | 'Medium' | 'High';
  time: string;
  read: boolean;
  avatar?: string;
}

export interface RouteStop {
  time: string;
  location: string;
  activity: string;
  lat: number;
  lng: number;
}

export interface RoutePath {
  employeeId: string;
  employeeName: string;
  date: string;
  startPoint: string;
  endPoint: string;
  totalDistance: string; // e.g. "32.6 KM"
  workingHours: string; // e.g. "8h 15m"
  activeTime: string; // e.g. "8h 45m"
  avgSpeed: string; // e.g. "18 km/h"
  maxSpeed: string; // e.g. "62 km/h"
  stopsCount: number;
  coordinates: { lat: number; lng: number }[];
  stops: RouteStop[];
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  industry: string;
  companySize: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  description: string;
  logoUrl?: string;
}

export interface AppPreferences {
  defaultDashboard: string;
  rowsPerPage: number;
  startOfWeek: string;
  unitSystem: string;
  theme: 'light' | 'dark' | 'system';
}

export interface ShiftPattern {
  id: string;
  name: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "18:00"
  weeklyOffDays: string[]; // e.g., ["Sunday"]
  gracePeriodMins: number; // e.g., 15
}

export interface EmployeeShiftAssignment {
  employeeId: string;
  shiftPatternId: string;
  effectiveFrom: string; // e.g., "2026-06-01"
  effectiveTo?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g., "June 2026"
  baseSalary: number;
  hra: number;
  otherAllowances: number;
  epfDeduction: number;
  esicDeduction: number;
  profTaxDeduction: number;
  tdsDeduction: number;
  otherDeductions: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Paid';
  paymentDate?: string;
  mediclaimDeduction?: number;
  customAllowance?: number;
}

export interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  yearlyAllowance: number;
  appliesToRoles: string[]; // e.g., ["All"] or specific roles
  status: 'Active' | 'Inactive';
  accrualType?: 'Yearly' | 'Monthly'; // 'Yearly' or 'Monthly' (recurring)
  carryForward?: boolean; // dynamic carry forward to next year/cycle
  maxCarryForwardDays?: number; // caps carry forward amount
  maritalStatusApplicability?: 'All' | 'Single' | 'Married'; // rule matching
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  leavePolicyId: string;
  leavePolicyName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  appliedOn: string;
  approvedBy?: string;
  remarks?: string;
}

