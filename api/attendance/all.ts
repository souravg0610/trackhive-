import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const { data, error: e } = await adminClient().from('attendance').select('*').eq('company_id', user.companyId).order('date', { ascending: false }).limit(500);
  if (e) return fail(res, e.message);
  return ok(res, (data||[]).map((a: any) => ({ id: a.id, employeeId: a.employee_id, employeeName: a.employee_name, department: a.department||'', date: a.date, checkInTime: a.check_in_time||'', checkOutTime: a.check_out_time||'', workingHours: a.working_hours||'', status: a.status||'Present', location: a.location||'' })));
}
