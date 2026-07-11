import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Shield,
  Briefcase,
  AlertCircle,
  Search,
  Filter,
  Users,
  ChevronRight,
  Info,
  CalendarDays,
  FileSpreadsheet,
  Check,
  X,
  Sparkles,
  Award,
  Upload
} from 'lucide-react';
import { DBState } from '../dbState';
// BUG 5 FIX: import leave save functions — previously LeaveModule never persisted to Supabase
import { apiApplyLeave } from '../lib/apiClient';

async function saveLeave(leave: Record<string, unknown>): Promise<string | null> {
  try { await apiApplyLeave(leave); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}
async function saveManyLeaves(leaves: Record<string, unknown>[]): Promise<string | null> {
  try { for (const l of leaves) await apiApplyLeave(l); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}
import { LeavePolicy, LeaveApplication, Employee } from '../types';

interface LeaveModuleProps {
  db: DBState;
  setDb: React.Dispatch<React.SetStateAction<DBState>>;
  triggerNotification: (title: string, msg: string, type: string, priority: string) => void;
  searchQuery: string;
  currentUserEmail: string;
}

export default function LeaveModule({
  db,
  setDb,
  triggerNotification,
  searchQuery,
  currentUserEmail
}: LeaveModuleProps) {
  // Safe references
  const employees = useMemo(() => db.employees || [], [db.employees]);
  const leavePolicies = useMemo(() => db.leavePolicies || [], [db.leavePolicies]);
  const leaveApplications = useMemo(() => db.leaveApplications || [], [db.leaveApplications]);

  // 🔒 Guard: if there are no employees, show a message and stop rendering
  if (employees.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed rounded-2xl bg-white">
        <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">No employee records found.</p>
        <p className="text-xs text-slate-400 mt-1">Add employees first to manage leave applications.</p>
      </div>
    );
  }

  // Determine current user context – now we safely have at least one employee
  const currentUserObj = useMemo(() => {
    const emailLower = currentUserEmail.toLowerCase().trim();
    const found = employees.find(e => e.email.toLowerCase() === emailLower);
    // If not found, use the first employee (could be an admin, but no dummy data)
    return found || employees[0];
  }, [employees, currentUserEmail]);

  const userRole = currentUserObj.role || 'Super Administrator';

  const matchesPermission = (permissionId: string, defaultAdminVal: boolean) => {
    const role = currentUserObj.role || 'Super Administrator';
    const rolePerms = db.rolePermissions?.[role];
    if (!rolePerms) {
      return role === 'Super Administrator' || role === 'Manager' ? defaultAdminVal : false;
    }
    return rolePerms.includes(permissionId);
  };

  const hasReviewPerm = useMemo(() => matchesPermission('leaves_review', true), [currentUserObj, db.rolePermissions]);
  const hasPoliciesPerm = useMemo(() => matchesPermission('leaves_policies', true), [currentUserObj, db.rolePermissions]);
  const hasAbsenceLogAllPerm = useMemo(() => matchesPermission('leaves_absence_log_all', true), [currentUserObj, db.rolePermissions]);

  const isAdminOrManager = useMemo(() => {
    return hasReviewPerm || hasPoliciesPerm;
  }, [hasReviewPerm, hasPoliciesPerm]);

  const defaultSubTab = useMemo(() => {
    return hasReviewPerm ? 'pending' : 'status';
  }, [hasReviewPerm]);

  // Main UI Tab control
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'pending' | 'policies' | 'records'>('status');

  React.useEffect(() => {
    setActiveSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Filter query states
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Apply Form State
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Policy Modal State
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    yearlyAllowance: 12,
    appliesToRoles: ['All'],
    status: 'Active' as 'Active' | 'Inactive',
    accrualType: 'Yearly' as 'Yearly' | 'Monthly',
    carryForward: false,
    maxCarryForwardDays: 10,
    maritalStatusApplicability: 'All' as 'All' | 'Single' | 'Married'
  });

  // Approver decision modal / inline state
  const [decisionRemarks, setDecisionRemarks] = useState<Record<string, string>>({});

  // 1. Calculate dynamic statistics for the dashboard
  const stats = useMemo(() => {
    const pending = leaveApplications.filter(a => a.status === 'Pending').length;
    const approvedThisMonth = leaveApplications.filter(a => {
      if (a.status !== 'Approved') return false;
      const appMonth = new Date(a.startDate).getMonth();
      const currMonth = new Date().getMonth();
      return appMonth === currMonth;
    }).length;

    const activeRulesCount = leavePolicies.filter(p => p.status === 'Active').length;

    return {
      pending,
      approvedThisMonth,
      activeRulesCount,
      totalPolicies: leavePolicies.length
    };
  }, [leaveApplications, leavePolicies]);

  // Calculate dynamic quota summary for CURRENT USER
  const userQuotas = useMemo(() => {
    const userRole = currentUserObj.role || 'Super Administrator';
    const userMaritalStatus = currentUserObj.maritalStatus || 'Single';

    // Find policies applicable to this user's role and marital status
    const applicablePolicies = leavePolicies.filter(p => {
      if (p.status !== 'Active') return false;
      const roleMatch = p.appliesToRoles.includes('All') || p.appliesToRoles.includes(userRole);
      const maritalMatch = !p.maritalStatusApplicability || p.maritalStatusApplicability === 'All' || p.maritalStatusApplicability === userMaritalStatus;
      return roleMatch && maritalMatch;
    });

    const currentMonthNumber = new Date().getMonth() + 1;

    return applicablePolicies.map(p => {
      const isMonthly = p.accrualType === 'Monthly';
      const accruedDaysSoFar = isMonthly
        ? parseFloat(((p.yearlyAllowance / 12) * currentMonthNumber).toFixed(1))
        : p.yearlyAllowance;

      const carryForwardDays = p.carryForward
        ? Math.min(5, p.maxCarryForwardDays !== undefined ? p.maxCarryForwardDays : 10)
        : 0;

      const totalEntitledDays = accruedDaysSoFar + carryForwardDays;

      const approvedDays = leaveApplications
        .filter(a => a.employeeEmail.toLowerCase() === currentUserEmail.toLowerCase() && a.leavePolicyId === p.id && a.status === 'Approved')
        .reduce((sum, current) => sum + current.totalDays, 0);

      const pendingDays = leaveApplications
        .filter(a => a.employeeEmail.toLowerCase() === currentUserEmail.toLowerCase() && a.leavePolicyId === p.id && a.status === 'Pending')
        .reduce((sum, current) => sum + current.totalDays, 0);

      const remaining = parseFloat(Math.max(0, totalEntitledDays - approvedDays).toFixed(1));

      return {
        policy: p,
        yearlyAllowance: p.yearlyAllowance,
        isMonthly,
        accruedDaysSoFar,
        carryForwardDays,
        totalEntitledDays,
        approvedDays,
        pendingDays,
        remaining
      };
    });
  }, [leavePolicies, leaveApplications, currentUserObj, currentUserEmail]);

  // Helper: Calculate total difference in days inclusive
  const calculateDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatedFormDays = useMemo(() => {
    return calculateDays(startDate, endDate);
  }, [startDate, endDate]);

  // 2. Handle adding a new leave policy (Administrators)
  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.name.trim()) return;

    const newPolicy: LeavePolicy = {
      id: `LP-${Math.floor(100 + Math.random() * 900)}`,
      name: policyForm.name,
      description: policyForm.description,
      yearlyAllowance: policyForm.yearlyAllowance,
      appliesToRoles: policyForm.appliesToRoles,
      status: policyForm.status,
      accrualType: policyForm.accrualType,
      carryForward: policyForm.carryForward,
      maxCarryForwardDays: policyForm.carryForward ? policyForm.maxCarryForwardDays : undefined,
      maritalStatusApplicability: policyForm.maritalStatusApplicability
    };

    setDb(prev => {
      const nextPolicies = [...(prev.leavePolicies || []), newPolicy];
      return {
        ...prev,
        leavePolicies: nextPolicies
      };
    });

    triggerNotification(
      'New Leave Policy Added',
      `Leave applicability policy '${policyForm.name}' (${policyForm.accrualType} accrual) has been defined.`,
      'System',
      'Medium'
    );

    setPolicyForm({
      name: '',
      description: '',
      yearlyAllowance: 12,
      appliesToRoles: ['All'],
      status: 'Active',
      accrualType: 'Yearly',
      carryForward: false,
      maxCarryForwardDays: 10,
      maritalStatusApplicability: 'All'
    });
    setShowPolicyModal(false);
  };

  // Toggle Policy status dynamically
  const handleTogglePolicyStatus = (id: string) => {
    setDb(prev => {
      const nextPolicies = (prev.leavePolicies || []).map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'Active' ? 'Inactive' : 'Active';
          return { ...p, status: nextStatus };
        }
        return p;
      });
      return { ...prev, leavePolicies: nextPolicies };
    });
  };

  // Delete Policy
  const handleDeletePolicy = (id: string) => {
    if (!confirm('Are you sure you want to delete this Leave Policy template? Historial calculations based on this policy will remain in database but off new requests.')) return;
    setDb(prev => {
      const nextPolicies = (prev.leavePolicies || []).filter(p => p.id !== id);
      return { ...prev, leavePolicies: nextPolicies };
    });
  };

  // 3. Handle applying for leave (Employee Portal)
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedPolicyId) {
      setFormError('Please select a leave category.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Please choose valid dates.');
      return;
    }

    const requestedDays = calculateDays(startDate, endDate);
    if (requestedDays <= 0) {
      setFormError('Start date must be on or before the end date.');
      return;
    }

    const policy = leavePolicies.find(p => p.id === selectedPolicyId);
    if (!policy) {
      setFormError('Invalid leave category.');
      return;
    }

    const quotaInfo = userQuotas.find(q => q.policy.id === selectedPolicyId);
    if (quotaInfo && quotaInfo.remaining < requestedDays) {
      if (!confirm(`⚠️ Warning: You have ${quotaInfo.remaining} days remaining but requested ${requestedDays} days. Submitting this may result in unpaid leave (Loss of Pay) for any excess duration. Do you wish to continue?`)) {
        return;
      }
    }

    const hasOverlap = leaveApplications.some(app => {
      if (app.employeeEmail.toLowerCase() !== currentUserEmail.toLowerCase()) return false;
      if (app.status === 'Rejected') return false;

      const appStart = new Date(app.startDate).getTime();
      const appEnd = new Date(app.endDate).getTime();
      const currStart = new Date(startDate).getTime();
      const currEnd = new Date(endDate).getTime();

      return Math.max(appStart, currStart) <= Math.min(appEnd, currEnd);
    });

    if (hasOverlap) {
      setFormError('You already have another approved/pending leave request for this period.');
      return;
    }

    const newApplication: LeaveApplication = {
      id: `LAP-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: currentUserObj.id || 'EMP-TEMP',
      employeeName: currentUserObj.name || 'Current User',
      employeeEmail: currentUserEmail,
      leavePolicyId: policy.id,
      leavePolicyName: policy.name,
      startDate,
      endDate,
      totalDays: requestedDays,
      reason: reason.trim() || 'No remarks provided.',
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    // BUG 5 FIX: persist to Supabase — was only saved to local state before
    saveLeave(newApplication as unknown as Record<string, unknown>).catch(err =>
      console.error('[LeaveModule] saveLeave failed:', err)
    );

    setDb(prev => {
      const nextApplications = [newApplication, ...(prev.leaveApplications || [])];
      return {
        ...prev,
        leaveApplications: nextApplications
      };
    });

    triggerNotification(
      'Leave Leave Applied Successfully',
      `${currentUserObj.name} requested ${requestedDays} days for '${policy.name}' (${startDate} to ${endDate}).`,
      'System',
      'Medium'
    );

    setFormSuccess(`✓ Your request for ${requestedDays} days of ${policy.name} has been submitted for approval.`);
    setStartDate('');
    setEndDate('');
    setReason('');
    setSelectedPolicyId('');
  };

  // 4. Handle Approvals Action (Administrators)
  const handleProcessLeave = (applicationId: string, isApproval: boolean) => {
    const remarks = decisionRemarks[applicationId] || '';
    const application = leaveApplications.find(a => a.id === applicationId);

    if (!application) return;

    const nextStatus = isApproval ? 'Approved' : 'Rejected';

    // BUG 5 FIX: persist approval/rejection to Supabase
    const updatedApp = leaveApplications.find(a => a.id === applicationId);
    if (updatedApp) {
      const statusValue = approved ? 'approved' : 'rejected';
      saveLeave({
        ...updatedApp,
        status: statusValue,
        approvedBy: currentUserEmail,
        rejectionReason: approved ? '' : (rejectionReason || ''),
      } as unknown as Record<string, unknown>).catch(err =>
        console.error('[LeaveModule] saveLeave (approve/reject) failed:', err)
      );
    }

    setDb(prev => {
      const nextApplications = (prev.leaveApplications || []).map(a => {
        if (a.id === applicationId) {
          return {
            ...a,
            status: nextStatus,
            approvedBy: currentUserObj.name,
            remarks: remarks.trim() || undefined
          } as LeaveApplication;
        }
        return a;
      });

      let updatedAttendance = [...(prev.attendance || [])];
      if (isApproval) {
        const start = new Date(application.startDate);
        const end = new Date(application.endDate);
        const loopDate = new Date(start);

        while (loopDate <= end) {
          const dateStr = loopDate.toISOString().split('T')[0];
          const existingIndex = updatedAttendance.findIndex(
            log => log.employeeId === application.employeeId && log.date === dateStr
          );

          if (existingIndex > -1) {
            updatedAttendance[existingIndex] = {
              ...updatedAttendance[existingIndex],
              status: 'On Leave',
              notes: `Approved ${application.leavePolicyName}: ${application.reason}`
            };
          } else {
            updatedAttendance.push({
              id: `ATT-${Math.floor(10000 + Math.random() * 90000)}`,
              employeeId: application.employeeId,
              employeeName: application.employeeName,
              department: employees.find(e => e.id === application.employeeId)?.department || 'Operations',
              date: dateStr,
              checkInTime: '09:00 AM',
              checkOutTime: '06:00 PM',
              workingHours: '8h',
              status: 'On Leave',
              location: 'Remote Out-Of-Office Plan',
              notes: `Approved Leave (${application.leavePolicyName})`
            });
          }
          loopDate.setDate(loopDate.getDate() + 1);
        }
      }

      return {
        ...prev,
        leaveApplications: nextApplications,
        attendance: updatedAttendance
      };
    });

    triggerNotification(
      `Leave Request ${nextStatus}`,
      `Request of ${application.employeeName} for ${application.totalDays} Days has been ${nextStatus.toLowerCase()}.`,
      'System',
      isApproval ? 'Medium' : 'Low'
    );

    setDecisionRemarks(prev => {
      const next = { ...prev };
      delete next[applicationId];
      return next;
    });
  };

  // Cancel Pending Leave Application (Employees)
  const handleCancelApplication = (id: string) => {
    if (!confirm('Are you sure you want to retract/delete this leave request?')) return;
    setDb(prev => {
      const nextApps = (prev.leaveApplications || []).filter(a => a.id !== id);
      return { ...prev, leaveApplications: nextApps };
    });
  };

  const handleBulkLeaveCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) {
        alert('Empty CSV or invalid format.');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const newLeaves: LeaveApplication[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length < headers.length) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = values[idx] || '';
        });

        const empEmailOrName = rowData['employee'] || rowData['name'] || rowData['email'];
        const policyName = rowData['policyname'] || rowData['policy'] || 'Casual Leave';
        const start = rowData['startdate'] || rowData['start'] || new Date().toISOString().split('T')[0];
        const end = rowData['enddate'] || rowData['end'] || new Date().toISOString().split('T')[0];
        const resValue = rowData['reason'] || 'SaaS legacy migration import';
        const statValue = (rowData['status'] || 'Approved') as any;

        if (!empEmailOrName) continue;

        const matchedEmp = employees.find(
          e => e.email.toLowerCase() === empEmailOrName.toLowerCase() || 
               e.name.toLowerCase() === empEmailOrName.toLowerCase()
        );

        if (!matchedEmp) {
          console.warn(`Could not find employee: ${empEmailOrName}`);
          continue;
        }

        const matchedPolicy = leavePolicies.find(
          p => p.name.toLowerCase() === policyName.toLowerCase()
        );

        const resolvedPolicyId = matchedPolicy ? matchedPolicy.id : (leavePolicies[0]?.id || 'POL-01');

        const assignedId = 'APP' + Math.floor(1000 + Math.random() * 9000);
        newLeaves.push({
          id: assignedId,
          employeeId: matchedEmp.id,
          employeeName: matchedEmp.name,
          employeeEmail: matchedEmp.email,
          leavePolicyId: resolvedPolicyId,
          leavePolicyName: matchedPolicy ? matchedPolicy.name : 'Casual Leave',
          startDate: start,
          endDate: end,
          totalDays: calculateDays(start, end) || 1,
          status: statValue,
          appliedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          reason: resValue
        });
      }

      if (newLeaves.length === 0) {
        alert('Could not resolve or map employee emails to active records inside rows.');
        return;
      }

      // BUG 5 FIX: persist imported leaves to Supabase
      saveManyLeaves(newLeaves as unknown as Record<string, unknown>[]).catch(err =>
        console.error('[LeaveModule] saveManyLeaves (import) failed:', err)
      );

      setDb(prev => ({
        ...prev,
        leaveApplications: [...newLeaves, ...(prev.leaveApplications || [])]
      }));

      triggerNotification(
        'Past Leaves Restored',
        `Restored ${newLeaves.length} legacy leave records into system registry.`,
        'System',
        'Medium'
      );
      alert(`Successfully restored ${newLeaves.length} leave logs!`);
      setShowBulkUpload(false);
    } catch (err: any) {
      alert(`CSV Parser error: ${err.message}`);
    }
  };

  // Live filter matching for database logs
  const filteredApplications = useMemo(() => {
    return leaveApplications.filter(a => {
      // If user is restricted, they must only see their own leave requests
      if (!hasAbsenceLogAllPerm) {
        if (a.employeeEmail.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim()) {
          return false;
        }
      }

      const matchesSearch = searchQuery
        ? a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.leavePolicyName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesEmployee = employeeFilter ? a.employeeId === employeeFilter : true;
      const matchesType = typeFilter ? a.leavePolicyId === typeFilter : true;
      const matchesStatus = statusFilter ? a.status === statusFilter : true;

      return matchesSearch && matchesEmployee && matchesType && matchesStatus;
    });
  }, [leaveApplications, searchQuery, employeeFilter, typeFilter, statusFilter, hasAbsenceLogAllPerm, currentUserEmail]);

  // Pending reviews subset
  const pendingApplications = useMemo(() => {
    return leaveApplications.filter(a => a.status === 'Pending');
  }, [leaveApplications]);

  // -------- RENDER --------
  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div id="stat-pending-approvals" className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Approvals</span>
            <span className="text-3xl font-black text-amber-600 mt-1 block font-mono">{stats.pending}</span>
            <span className="text-[10.5px] font-semibold text-slate-450 mt-1 block">Awaiting manager actions</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div id="stat-leave-approved" className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approved This Month</span>
            <span className="text-3xl font-black text-emerald-700 mt-1 block font-mono">{stats.approvedThisMonth}</span>
            <span className="text-[10.5px] font-semibold text-slate-450 mt-1 block">Active absences recorded</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div id="stat-active-rules" className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Policies</span>
            <span className="text-3xl font-black text-blue-700 mt-1 block font-mono">{stats.activeRulesCount}</span>
            <span className="text-[10.5px] font-semibold text-slate-450 mt-1 block">Applicable leave frameworks</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div id="stat-current-member" className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between text-left">
          <div>
            <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">ERP Operator Profiles</span>
            <span className="text-[13px] font-black truncate max-w-[140px] mt-1 block">{currentUserObj.name}</span>
            <span className="text-[10px] font-medium text-slate-300 mt-0.5 block font-mono">{currentUserObj.role}</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-800 border border-slate-750 flex items-center justify-center">
            {isAdminOrManager ? (
              <Shield className="h-5 w-5 text-emerald-400" />
            ) : (
              <Award className="h-5 w-5 text-blue-400" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Selection Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-150 p-4 rounded-3xl shadow-sm">
        <div className="flex flex-wrap bg-slate-105 p-1 rounded-xl border w-full sm:w-auto">
          <button
            onClick={() => { setActiveSubTab('status'); setFormError(null); setFormSuccess(null); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'status' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Apply Leave Request
          </button>
          
          {hasReviewPerm && (
            <button
              onClick={() => { setActiveSubTab('pending'); setFormError(null); setFormSuccess(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-750'
              }`}
            >
              In Review ({pendingApplications.length})
            </button>
          )}

          {hasPoliciesPerm && (
            <button
              onClick={() => { setActiveSubTab('policies'); setFormError(null); setFormSuccess(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'policies' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-755'
              }`}
            >
              Leave Policies Framework
            </button>
          )}

          <button
            onClick={() => { setActiveSubTab('records'); setFormError(null); setFormSuccess(null); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'records' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-750'
            }`}
          >
            Absence Log
          </button>
        </div>

        {isAdminOrManager && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasReviewPerm && (
              <button
                onClick={() => setShowBulkUpload(!showBulkUpload)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-705 rounded-xl hover:bg-slate-105 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload className="h-4 w-4 text-emerald-600" />
                <span>Bulk csv Upload</span>
              </button>
            )}

            {activeSubTab === 'policies' && hasPoliciesPerm && (
              <button
                onClick={() => setShowPolicyModal(true)}
                className="px-3.5 py-2 text-xs font-bold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Create Policy</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Bulk Leave Database Upload Panel */}
      {showBulkUpload && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 space-y-4 text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-700 animate-bounce" />
              <h3 className="text-sm font-black text-slate-800 font-sans">Bulk Past Leaves Excel Import</h3>
            </div>
            <button 
              onClick={() => setShowBulkUpload(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Onboard legacy absence logs or seed custom leave durations in bulk. 
            Required headers: <code className="bg-white text-emerald-800 px-1 py-0.5 rounded border border-emerald-100 text-[10px] font-mono font-bold">Employee,PolicyName,StartDate,EndDate,Reason,Status</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-dashed border-emerald-200 bg-white rounded-2xl p-4 text-center space-y-3 flex flex-col justify-center items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
                <FileSpreadsheet className="h-5 w-5 text-emerald-700 font-bold" />
              </div>
              <div>
                <button
                  onClick={() => {
                    const sampleHeaders = ['Employee', 'PolicyName', 'StartDate', 'EndDate', 'Reason', 'Status'];
                    const firstEmp = employees[0]?.email || 'demo@trackhive.com';
                    const sampleRow = [firstEmp, 'Casual Leave', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], 'Family Vacation Event', 'Approved'];
                    const content = [sampleHeaders.join(','), sampleRow.join(',')].join('\n');
                    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', 'trackhive_leaves_template.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="text-xs font-black text-emerald-700 hover:underline cursor-pointer"
                >
                  Download Leave Template CSV
                </button>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">Preconfigured field formats for error-free importing</p>
              </div>
            </div>

            <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-4 text-center space-y-3 flex flex-col justify-center items-center">
              <p className="text-xs font-bold text-slate-700 font-sans">Upload Completed CSV Spreadsheet</p>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    handleBulkLeaveCSV(text);
                  };
                  reader.readAsText(file);
                }}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <p className="text-[9px] text-slate-400 font-sans">Maintains complete compliance history instantly</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab Layout Selector Renders */}
      {activeSubTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* User Leave quota statistics card */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-6 text-left">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Personal Leave Quotas</span>
            </h3>
            
            <div className="space-y-4">
              {leavePolicies.map(pol => {
                const used = leaveApplications
                  .filter(a => a.employeeId === currentUserObj.id && a.leavePolicyId === pol.id && a.status === 'Approved')
                  .reduce((sum, current) => sum + current.totalDays, 0);
                const remaining = Math.max(0, pol.yearlyAllowance - used);
                const progressWidth = pol.yearlyAllowance > 0 ? Math.min(100, (used / pol.yearlyAllowance) * 100) : 0;

                return (
                  <div key={pol.id} className="space-y-2 border-b border-slate-50 pb-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{pol.name}</span>
                      <span className="font-mono font-bold text-emerald-800">{remaining} / {pol.yearlyAllowance} days free</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to submit a leave request */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl text-left space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Plus className="h-4 w-4 text-emerald-600" />
              <span>Apply Non-Overlapping Leave Period</span>
            </h3>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Select Applicable Policy Framework</label>
                <select 
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-55 bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">Choose Policy...</option>
                  {leavePolicies.map(pol => (
                    <option key={pol.id} value={pol.id}>{pol.name} ({pol.yearlyAllowance} days allowance)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Absence Commences Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Absence Terminates Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Applicant Remarks & Medical Reasons</label>
                <textarea 
                  rows={2}
                  placeholder="Detail explanation or health constraints for this requested period..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              {calculatedFormDays > 0 && (
                <div className="col-span-1 md:col-span-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold leading-none">
                  ✓ Calculated Leave Duration: {calculatedFormDays} Days
                </div>
              )}

              <div className="col-span-1 md:col-span-2 text-right">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-800 transition-all cursor-pointer"
                >
                  File Off-Duty Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'pending' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-left px-6">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Absence Requests Undergoing Managerial Review</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Applicant Employee</th>
                  <th className="p-4">Framework Policy</th>
                  <th className="p-4">Duration & Dates</th>
                  <th className="p-4">Applicant Description</th>
                  <th className="p-4 pr-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold whitespace-nowrap">
                      No matching absence requests require approval logs.
                    </td>
                  </tr>
                ) : (
                  pendingApplications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-extrabold text-slate-800 text-[13px]">{app.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">{app.employeeEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[10.5px] bg-slate-100 border border-slate-200/50 text-slate-705 px-2 py-0.5 rounded-full font-bold">
                          {app.leavePolicyName}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-extrabold text-slate-700">{app.startDate} → {app.endDate}</p>
                          <p className="text-[10px] font-black text-emerald-800 mt-0.5">{app.totalDays} Absences days total</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-500 max-w-xs truncate" title={app.reason}>{app.reason}</p>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleProcessLeave(app.id, true)}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-100 text-[11px] cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessLeave(app.id, false)}
                            className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-xl font-bold hover:bg-red-155 hover:bg-red-100 text-[11px] cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {leavePolicies.map(pol => (
            <div key={pol.id} className="bg-white border border-slate-200 rounded-3xl p-6 text-left space-y-4 hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">{pol.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Policy code: {pol.id}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  pol.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                }`}>
                  {pol.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-sans min-h-[40px]">{pol.description}</p>

              <div className="border-t border-slate-50 pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black font-mono">Allowance</span>
                  <span className="font-extrabold text-slate-700">{pol.yearlyAllowance} Days</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black font-mono">Accrual Mode</span>
                  <span className="font-extrabold text-slate-700">{pol.accrualType}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black font-mono">Rollover rollover</span>
                  <span className="font-extrabold text-slate-700">{pol.carryForward ? 'Enabled ✔' : 'None'}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black font-mono">Target Roster</span>
                  <span className="font-extrabold text-slate-700 truncate block">{(pol.appliesToRoles || []).join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'records' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-left px-6">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Total Absences Historic Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Applicant staff</th>
                  <th className="p-4">Leave Policy</th>
                  <th className="p-4">Commence / Terminate</th>
                  <th className="p-4">Absence duration</th>
                  <th className="p-4">Reason Statement</th>
                  <th className="p-4 text-center">Status Flag</th>
                  <th className="p-4 pr-6 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                      No matching leave records could be mapped.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-extrabold text-slate-800">{app.employeeName}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5">{app.employeeEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700 text-[11px] font-mono">{app.leavePolicyName}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-550">
                        {app.startDate} to {app.endDate}
                      </td>
                      <td className="p-4 font-bold text-slate-700 text-left">
                        {app.totalDays} Days
                      </td>
                      <td className="p-4 max-w-xs truncate text-[11.5px] text-slate-500" title={app.reason}>
                        {app.reason}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono uppercase tracking-widest ${
                          app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          app.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleCancelApplication(app.id)}
                          className="bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Delete request record log"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Policy Creation Modal Frame Overlay */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 text-left space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Briefcase className="h-5 w-5 text-emerald-600 animate-pulse" />
                <span>Define Leave Policy Framework</span>
              </h3>
              <button 
                onClick={() => setShowPolicyModal(false)}
                className="text-slate-450 hover:text-slate-650 cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Policy Title Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Sick Leave Allowance"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Policy Overview Description</label>
                <textarea 
                  rows={2}
                  placeholder="Provide parameters and criteria details of the policy frame..."
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Yearly Days Free</label>
                  <input 
                    type="number"
                    value={policyForm.yearlyAllowance}
                    onChange={(e) => setPolicyForm({ ...policyForm, yearlyAllowance: Number(e.target.value) })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider font-mono">Accrual Scheduling</label>
                  <select 
                    value={policyForm.accrualType}
                    onChange={(e) => setPolicyForm({ ...policyForm, accrualType: e.target.value as any })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Yearly">Yearly (Full Pre-seed)</option>
                    <option value="Monthly">Monthly Accruals</option>
                  </select>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-600 font-sans">Enable Accumulation Rollovers</span>
                <input 
                  type="checkbox"
                  checked={policyForm.carryForward}
                  onChange={(e) => setPolicyForm({ ...policyForm, carryForward: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-800 transition-all cursor-pointer"
              >
                Define Active Policy ✔
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}