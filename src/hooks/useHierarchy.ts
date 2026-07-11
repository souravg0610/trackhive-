// ============================================================
// useHierarchy — computes which employees a user can see
// based on their role and reporting structure.
//
// Rules:
//   Super Administrator → sees ALL employees
//   Manager             → sees direct reports + their sub-reports (recursive)
//   Field Agent / etc   → sees only themselves
//
// This hook is the single source of truth for data scoping.
// Every tab (dashboard, attendance, visits, tasks, tracking)
// should filter through visibleEmployeeIds.
// ============================================================

import { useMemo } from 'react';
import type { Employee } from '../types';

export type UserScope = 'admin' | 'manager' | 'agent';

export interface HierarchyResult {
  scope: UserScope;
  visibleEmployees: Employee[];
  visibleEmployeeIds: Set<string>;
  agentEmployee: Employee | null;
  // True if user can see ALL company data
  isAdmin: boolean;
  // True if user manages a team
  isManager: boolean;
  // True if user is a field-level employee
  isAgent: boolean;
}

// Recursively collect all employees under a manager
function collectReports(
  managerName: string,
  allEmployees: Employee[],
  visited = new Set<string>(),
): Employee[] {
  const direct = allEmployees.filter(e => {
    const rm = (e.reportingManager || '').toLowerCase().trim();
    return rm === managerName.toLowerCase().trim() && !visited.has(e.id);
  });

  const result: Employee[] = [...direct];
  direct.forEach(emp => {
    if (!visited.has(emp.id)) {
      visited.add(emp.id);
      const sub = collectReports(emp.name, allEmployees, visited);
      result.push(...sub);
    }
  });
  return result;
}

const ADMIN_ROLES = ['Super Administrator'];
// Roles that can manage a team (see direct reports)
const MANAGER_ROLES = ['Manager', 'Team Lead', 'Branch Manager', 'Regional Manager', 'Supervisor'];

export function useHierarchy(
  allEmployees: Employee[],
  currentUserEmail: string,
  userRole: string,
  rolePermissions: Record<string, string[]>,
): HierarchyResult {
  return useMemo(() => {
    const email = currentUserEmail.toLowerCase();
    const agentEmployee = allEmployees.find(e => e.email.toLowerCase() === email) || null;

    // Super Administrator — sees everything
    if (ADMIN_ROLES.includes(userRole)) {
      return {
        scope: 'admin',
        visibleEmployees: allEmployees,
        visibleEmployeeIds: new Set(allEmployees.map(e => e.id)),
        agentEmployee,
        isAdmin: true,
        isManager: false,
        isAgent: false,
      };
    }

    // Check if this role has manager-level permissions
    // Either hardcoded manager roles OR role has 'employees' permission
    const hasEmployeePerm = rolePermissions?.[userRole]?.includes('employees');
    const isManagerRole = MANAGER_ROLES.some(r =>
      userRole.toLowerCase().includes(r.toLowerCase())
    ) || hasEmployeePerm;

    if (isManagerRole && agentEmployee) {
      // Manager — sees self + all direct/indirect reports
      const visited = new Set<string>([agentEmployee.id]);
      const reports = collectReports(agentEmployee.name, allEmployees, visited);
      const visible = [agentEmployee, ...reports];
      return {
        scope: 'manager',
        visibleEmployees: visible,
        visibleEmployeeIds: new Set(visible.map(e => e.id)),
        agentEmployee,
        isAdmin: false,
        isManager: true,
        isAgent: false,
      };
    }

    // Field Agent — sees only themselves
    const visible = agentEmployee ? [agentEmployee] : [];
    return {
      scope: 'agent',
      visibleEmployees: visible,
      visibleEmployeeIds: new Set(visible.map(e => e.id)),
      agentEmployee,
      isAdmin: false,
      isManager: false,
      isAgent: true,
    };
  }, [allEmployees, currentUserEmail, userRole, rolePermissions]);
}
