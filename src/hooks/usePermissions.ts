import { useMemo } from 'react';
import type { DBState } from '../dbState';

const FALLBACK: string[] = ['dashboard', 'notifications'];

export function usePermissions(db: DBState, role: string): string[] {
  return useMemo(
    () => db.rolePermissions?.[role] ?? FALLBACK,
    [db.rolePermissions, role]
  );
}

export function useCanAccess(db: DBState, role: string, tab: string): boolean {
  const perms = usePermissions(db, role);
  return useMemo(() => perms.includes(tab), [perms, tab]);
}
