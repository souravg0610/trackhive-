import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();

  if (req.method === 'GET') {
    const status = req.query.status as string;
    let q = sb.from('leaves').select('*').eq('company_id', user.companyId);
    if (status) q = (q as any).eq('status', status);
    const { data, error: e } = await (q as any).order('created_at', { ascending: false });
    if (e) return fail(res, e.message);
    return ok(res, data||[]);
  }

  if (req.method === 'POST') {
    const payload = req.body;
    const id = 'LVA-' + crypto.randomUUID();
    const start = new Date(payload.startDate); const end = new Date(payload.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime()-start.getTime())/86400000)+1);
    const { data, error: e } = await sb.from('leaves').insert({ ...payload, id, company_id: user.companyId, total_days: totalDays, status: 'pending', applied_on: new Date().toISOString().split('T')[0] }).select().single();
    if (e) return fail(res, e.message);
    return ok(res, data, 201);
  }
  return fail(res, 'Method not allowed', 405);
}
