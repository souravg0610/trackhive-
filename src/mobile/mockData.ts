import { Employee, AttendanceLog, Shift, Payslip, LeaveRequest, LeaveBalance, ClientVisit, Task, NotificationItem } from './mobileTypes';

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_PUNCH_LOGS: AttendanceLog[] = [];

export const SHIFTS: Shift[] = [];

export const INITIAL_LEAVE_BALANCES: LeaveBalance[] = [
  { type: 'Casual Leave (CL)', code: 'CL', left: 12, total: 12 },
  { type: 'Sick Leave (SL)', code: 'SL', left: 8, total: 8 },
  { type: 'Earned Leave (EL)', code: 'EL', left: 18, total: 18 },
  { type: 'Comp Off (CO)', code: 'CO', left: 6, total: 6 }
];

export const INITIAL_LEAVE_HISTORY: LeaveRequest[] = [];

export const CLIENT_VISITS: ClientVisit[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const GOUPTA_PAYSLIP: Payslip = {
  employeeId: 'EMP001',
  employeeName: 'Sourav Gupta',
  month: 'June 2024',
  bankAccount: '**** **** **** 4567',
  earnings: {
    basic: 0,
    hra: 0,
    conveyance: 0,
    special: 0,
    performance: 0,
    other: 0
  },
  deductions: {
    providentFund: 0,
    professionalTax: 0,
    incomeTax: 0,
    esi: 0,
    other: 0
  }
};
