import { useState, useRef, useEffect, useCallback } from 'react';
import { getInitialState, type DBState } from '../dbState';
import { getApiToken } from '../lib/apiClient';
import {
  apiGetEmployees, apiGetTodayAttendance, apiGetVisits, apiGetTasks,
  apiGetGeofences, apiGetDocuments, apiGetNotifications, apiGetOrgSettings,
  apiGetShifts, apiGetPayslips, apiGetPendingLeaves,
} from '../lib/apiClient';

function mapEmployee(e: Record<string, unknown>) {
  return {
    id:               e.id as string,
    name:             e.name as string,
    role:             ((e.role as string) || 'Field Agent') as string,
    jobTitle:         (e.job_title as string) || '',
    department:       (e.department as string) || 'Operations',
    status:           (e.status as 'active' | 'stopped' | 'offline') || 'active',
    isActive:         e.is_active !== false,
    lastWorkingDay:   (e.last_working_day as string) || '',
    phone:            (e.phone as string) || '',
    email:            (e.email as string) || '',
    joiningDate:      (e.joining_date as string) || '',
    reportingManager: (e.reporting_manager as string) || '',
    workLocation:     (e.work_location as string) || '',
    address:          (e.address as string) || '',
    avatar:           (e.avatar as string) || '',
    maritalStatus:    ((e.marital_status as string) || 'Single') as 'Single' | 'Married',
    created_by:       (e.created_by as string) || '',
  };
}

function mapAttendance(a: Record<string, unknown>) {
  return {
    id:            a.id as string,
    employeeId:    (a.employee_id as string) || '',
    employeeName:  a.employee_name as string,
    department:    (a.department as string) || '',
    date:          a.date as string,
    checkInTime:   (a.check_in_time as string) || '',
    checkOutTime:  (a.check_out_time as string) || '',
    workingHours:  (a.working_hours as string) || '',
    status:        a.status as 'Present' | 'Absent' | 'Half Day' | 'Late' | 'On Leave',
    location:      (a.location as string) || '',
    notes:         (a.notes as string) || '',
    selfie_url:    (a.selfie_url as string) || '',
    created_by:    (a.created_by as string) || '',
  };
}

function mapVisit(v: Record<string, unknown>) {
  return {
    id:            v.id as string,
    clientName:    v.client_name as string,
    industry:      (v.industry as string) || '',
    employeeId:    (v.employee_id as string) || '',
    employeeName:  v.employee_name as string,
    visitType:     v.visit_type as string,
    location:      (v.location as string) || '',
    checkInTime:   (v.check_in_time as string) || '',
    checkOutTime:  (v.check_out_time as string) || '',
    duration:      (v.duration as string) || '',
    status:        v.status as 'Completed' | 'Pending' | 'Cancelled',
    notes:         (v.notes as string) || '',
    documents:     (v.documents as string[]) || [],
    images:        (v.images as string[]) || [],
    created_by:    (v.created_by as string) || '',
  };
}

function mapTask(t: Record<string, unknown>) {
  return {
    id:            t.id as string,
    title:         t.title as string,
    clientName:    (t.client_name as string) || '',
    employeeId:    (t.employee_id as string) || '',
    employeeName:  t.employee_name as string,
    dueDate:       (t.due_date as string) || '',
    dueTime:       (t.due_time as string) || '',
    priority:      t.priority as 'Low' | 'Medium' | 'High',
    status:        t.status as 'Pending' | 'In Progress' | 'Completed' | 'Overdue',
    description:   (t.description as string) || '',
    subtasks:      (t.subtasks as { id: string; text: string; completed: boolean }[]) || [],
    attachments:   (t.attachments as { id: string; name: string; size: string }[]) || [],
    selfie_proof:  (t.selfie_proof as string) || '',
    created_by:    (t.created_by as string) || '',
  };
}

function mapGeofence(g: Record<string, unknown>) {
  return {
    id:             g.id as string,
    name:           g.name as string,
    location:       (g.location as string) || '',
    radius:         g.radius as number,
    employeesCount: (g.employees_count as number) || 0,
    status:         g.status as 'Active' | 'Inactive',
    createdOn:      (g.created_on as string) || '',
    lastUpdated:    (g.last_updated as string) || '',
    createdBy:      (g.created_by as string) || '',
    lat:            g.lat as number,
    lng:            g.lng as number,
  };
}

function mapDocument(d: Record<string, unknown>) {
  return {
    id:            d.id as string,
    name:          d.name as string,
    category:      d.category as 'ID Proof' | 'Company' | 'Offer Letter' | 'Legal' | 'Other',
    uploadedBy:    d.uploaded_by as string,
    uploadedById:  (d.uploaded_by_id as string) || '',
    uploadedDate:  (d.uploaded_date as string) || '',
    size:          (d.size as string) || '',
    status:        d.status as 'Active' | 'Inactive' | 'Pending Verification',
    idNumber:      (d.id_number as string) || '',
    dob:           (d.dob as string) || '',
    gender:        d.gender as 'Male' | 'Female' | 'Other' | undefined,
    tags:          (d.tags as string[]) || [],
    fileUrl:       (d.file_url as string) || '',
  };
}

function mapNotification(n: Record<string, unknown>) {
  return {
    id:           n.id as string,
    title:        n.title as string,
    description:  n.description as string,
    employeeName: (n.employee_name as string) || '',
    employeeRole: (n.employee_role as string) || '',
    location:     (n.location as string) || '',
    type:         n.type as string,
    priority:     n.priority as 'Low' | 'Medium' | 'High',
    time:         (n.time as string) || 'Just now',
    read:         !!n.read,
    avatar:       (n.avatar as string) || '',
  };
}

export function useDBState(userEmail: string) {
  const [db, setDbRaw] = useState<DBState>(() => getInitialState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasPulled = useRef(false);
  const pulledForEmail = useRef('');
  const pullInProgress = useRef(false);

  // Reset ONLY on logout (userEmail becomes empty string)
  const prevEmailRef = useRef('');
  useEffect(() => {
    if (!userEmail && prevEmailRef.current) {
      // Genuine logout — wipe data
      setDbRaw(getInitialState());
      hasPulled.current = false;
      pulledForEmail.current = '';
      setSyncError(null);
    }
    prevEmailRef.current = userEmail;
  }, [userEmail]);

  // Pull all data — waits for JWT token to be available
  useEffect(() => {
    if (!userEmail) return;
    if (hasPulled.current || pullInProgress.current) return;

    let cancelled = false;

    // Hard timeout — guarantee isSyncing clears after 10s no matter what
    const syncTimeout = setTimeout(() => {
      if (!cancelled) {
        setIsSyncing(false);
        pullInProgress.current = false;
      }
    }, 10000);

    const doPull = async () => {
      // Poll for token — Auth.tsx stores it just before calling onAuthSuccess
      let token = getApiToken();
      let attempts = 0;
      while (!token && attempts < 15) {
        await new Promise(r => setTimeout(r, 200));
        token = getApiToken();
        attempts++;
      }
      if (!token || cancelled) {
        // No token after 3s — stop syncing, let auth handle it
        clearTimeout(syncTimeout);
        setIsSyncing(false);
        pullInProgress.current = false;
        return;
      }
      if (hasPulled.current) return;

      pullInProgress.current = true;
      hasPulled.current = true;
      pulledForEmail.current = userEmail;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const [
          employeesRaw, attendanceRaw, visitsResult, tasksResult,
          geofencesRaw, documentsResult, notificationsRaw,
          orgSettings, payslipsRaw, pendingLeavesRaw, shiftsRaw,
        ] = await Promise.all([
          apiGetEmployees().catch(e => { console.error('[useDBState] employees failed:', e); return []; }),
          apiGetTodayAttendance().catch(e => { console.error('[useDBState] attendance failed:', e); return []; }),
          apiGetVisits(1, 500).catch(e => { console.error('[useDBState] visits failed:', e); return { data: [], meta: { page: 1, limit: 500, total: 0, pages: 0 } }; }),
          apiGetTasks(1, 500).catch(e => { console.error('[useDBState] tasks failed:', e); return { data: [], meta: { page: 1, limit: 500, total: 0, pages: 0 } }; }),
          apiGetGeofences().catch(e => { console.error('[useDBState] geofences failed:', e); return []; }),
          apiGetDocuments(1, 200).catch(e => { console.error('[useDBState] documents failed:', e); return { data: [], meta: { page: 1, limit: 200, total: 0, pages: 0 } }; }),
          apiGetNotifications().catch(e => { console.error('[useDBState] notifications failed:', e); return []; }),
          apiGetOrgSettings().catch(e => { console.error('[useDBState] orgSettings failed:', e); return null; }),
          apiGetPayslips().catch(e => { console.error('[useDBState] payslips failed:', e); return []; }),
          apiGetPendingLeaves().catch(e => { console.error('[useDBState] leaves failed:', e); return []; }),
          apiGetShifts().catch(e => { console.error('[useDBState] shifts failed:', e); return []; }),
        ]);
        console.log('[useDBState] pull complete — employees:', (employeesRaw as any[]).length);

        if (cancelled) return;

        setDbRaw(prev => ({
          ...prev,
          employees:         (employeesRaw as Record<string, unknown>[]).map(mapEmployee),
          attendance:        (attendanceRaw as Record<string, unknown>[]).map(mapAttendance),
          visits:            visitsResult.data.map(mapVisit),
          tasks:             tasksResult.data.map(mapTask),
          geofences:         (geofencesRaw as Record<string, unknown>[]).map(mapGeofence),
          documents:         documentsResult.data.map(mapDocument),
          notifications:     (notificationsRaw as Record<string, unknown>[]).map(mapNotification),
          leaveApplications: pendingLeavesRaw as DBState['leaveApplications'],
          ...(orgSettings && Object.keys(orgSettings.rolePermissions ?? {}).length > 0
            ? { rolePermissions: orgSettings.rolePermissions } : {}),
          ...(orgSettings?.customRoles?.length
            ? { customRoles: orgSettings.customRoles } : {}),
          ...(orgSettings?.customDepartments?.length
            ? { customDepartments: orgSettings.customDepartments } : {}),
          ...(orgSettings?.customBranches?.length
            ? { customBranches: orgSettings.customBranches } : {}),
        }));
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Pull failed';
          setSyncError(msg);
          console.error('[useDBState] pull error:', err);
          hasPulled.current = false; // allow retry
        }
      } finally {
        clearTimeout(syncTimeout);
        pullInProgress.current = false;
        if (!cancelled) setIsSyncing(false);
      }
    };

    doPull();
    return () => {
      // Don't cancel pull on email change — only on unmount
      // cancelled = true would kill in-flight requests when auth completes
      clearTimeout(syncTimeout);
    };
  }, [userEmail]);

  const setDb = useCallback((updater: DBState | ((prev: DBState) => DBState)) => {
    setDbRaw(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  return { db, setDb, isSyncing, syncError };
}