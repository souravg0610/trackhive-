import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405);
  const { data, error: e } = await adminClient().from('payslips').select('*').eq('company_id', user.companyId).order('year', { ascending: false }).order('month', { ascending: false }).limit(200);
  if (e) return fail(res, e.message);
  return ok(res, data||[]);
}
