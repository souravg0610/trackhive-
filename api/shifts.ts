import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../src/lib/serverless/supabase';
import { preflight, cors, requireUser, ok, fail } from '../src/lib/serverless/auth';
export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();
  if (req.method === 'GET') {
    const { data: shifts, error: e } = await sb.from('shifts').select('*').eq('company_id', user.companyId).order('created_at', { ascending: false });
    if (e) return fail(res, e.message);
    const { data: assignments } = await sb.from('shift_assignments').select('shift_id,employee_id').eq('company_id', user.companyId);
    const map: Record<string,string[]> = {};
    for (const a of (assignments||[]) as any[]) { if(!map[a.shift_id])map[a.shift_id]=[]; map[a.shift_id].push(a.employee_id); }
    return ok(res, (shifts||[]).map((s: any) => ({ ...s, assignedEmployees: map[s.id]||[] })));
  }
  if (req.method === 'POST') {
    const b = req.body;
    const { data, error: e } = await sb.from('shifts').insert({ company_id: user.companyId, shift_name: b.shiftName||b.shift_name||b.name||'New Shift', start_time: b.startTime||b.start_time||'09:00', end_time: b.endTime||b.end_time||'18:00', location: b.location||'', zone: b.zone||'', shift_type: b.shiftType||b.shift_type||'general', status: b.status||'upcoming', grace_minutes: b.graceMinutes??b.grace_minutes??15 }).select().single();
    if (e) return fail(res, e.message);
    const empIds = (b.employeeIds||b.employee_ids||[]) as string[];
    if (empIds.length && data) { const today = new Date().toISOString().split('T')[0]; await sb.from('shift_assignments').insert(empIds.map((eid: string) => ({ company_id: user.companyId, shift_id: (data as any).id, employee_id: eid, assigned_date: today }))); }
    return ok(res, data, 201);
  }
  return fail(res, 'Method not allowed', 405);
}
