// STUB — Supabase client removed from frontend.
// All data flows through the NestJS backend via apiClient.ts.
// This file kept as stub to prevent import errors during migration.

export function getSupabase() { return null; }
export function isSupabaseConfigured() { return false; }
export function getSupabaseCredentials() {
  return { url: '', key: '', source: 'backend' as const, isConnected: true };
}
export function saveLocalCredentials(_url: string, _key: string): void {}
