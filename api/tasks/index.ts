import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  const user = requireUser(req, res);
  if (!user) return;
  const sb = adminClient();

  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '500');
    const from = (page-1)*limit;
    const status = req.query.status as string;
    let q = sb.from('tasks').select('*', { count: 'exact' }).eq('company_id', user.companyId).order('created_at', { ascending: false });
    if (status) q = (q as any).eq('status', status);
    if (limit < 500) q = (q as any).range(from, from+limit-1); else q = (q as any).limit(500);
    const { data, error: e, count } = await q;
    if (e) return fail(res, e.message);
    return res.status(200).json({ success: true, data: data||[], meta: { page, limit, total: count||0, pages: Math.ceil((count||0)/limit) } });
  }

  if (req.method === 'POST') {
    const { data, error: e } = await sb.from('tasks').insert({ ...req.body, company_id: user.companyId }).select().single();
    if (e) return fail(res, e.message);
    return ok(res, data, 201);
  }

  return fail(res, 'Method not allowed', 405);
}
