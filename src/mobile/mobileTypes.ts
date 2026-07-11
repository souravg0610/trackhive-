export interface Employee {
  id: string; // EMPxxx
  name: string;
  role: 'Super Administrator' | 'Field Agent' | 'Sales' | 'Logistics' | 'Operations' | 'Marketing';
  department: 'Management' | 'Sales' | 'Logistics' | 'Operations' | 'Marketing';
  email: string;
  phone: string;
  status: 'Online' | 'Idle' | 'Offline';
  is_active: boolean;
  avatar_url: string;
  location: string;
  last_seen: string;
  license_count: number;
  total_licenses: number;
  joining_date: string;
}

export interface AttendanceLog {
  id: string;
  type: 'Punch In' | 'Punch Out' | 'Break In' | 'Break Out';
  time: string;
  location: string;
  source: 'mobile' | 'web';
}

export interface AttendanceState {
  isPunchedIn: boolean;
  punchInTime: string;
  punchOutTime: string | null;
  logs: AttendanceLog[];
}

export interface Shift {
  id: string;
  name: string;
  timeRange: string;
  duration: string;
  location: string;
  zone: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  assignedEmployees: string[]; // Employee names
  avatarCount: number;
  overflowCount: number;
}

export interface Payslip {
  employeeId: string;
  employeeName: string;
  month: string;
  bankAccount: string;
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    special: number;
    performance: number;
    other: number;
  };
  deductions: {
    providentFund: number;
    professionalTax: number;
    incomeTax: number;
    esi: number;
    other: number;
  };
}

export interface LeaveRequest {
  id: string;
  leaveType: 'Casual Leave (CL)' | 'Sick Leave (SL)' | 'Earned Leave (EL)' | 'Comp Off (CO)';
  startDate: string;
  endDate: string;
  duration: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  phone: string;
  email: string;
}

export interface LeaveBalance {
  type: string;
  code: 'CL' | 'SL' | 'EL' | 'CO';
  left: number;
  total: number;
}

export interface ClientVisit {
  id: string;
  companyName: string;
  managerName: string;
  location: string;
  city: string;
  time: string;
  status: 'Completed' | 'Pending';
  iconColor: 'green' | 'blue' | 'amber' | 'purple';
}

export interface Task {
  id: string;
  title: string;
  clientName: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Review' | 'On Hold' | 'Completed';
  assigneeAvatar: string;
  dueDate: string;
  progress?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'leave' | 'task' | 'attendance' | 'payslip' | 'policy' | 'client' | 'performance' | 'announcement';
  read: boolean;
  linkedText?: string;
}
