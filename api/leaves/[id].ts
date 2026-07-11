import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();
  const { id } = req.query as { id: string };

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { action, reason, ...rest } = req.body;
    let update: any = { ...rest };
    if (action === 'approve') update = { status: 'approved', approved_by: user.name, approved_at: new Date().toISOString() };
    if (action === 'reject') update = { status: 'rejected', rejection_reason: reason };
    const { data, error: e } = await sb.from('leaves').update(update).eq('company_id', user.companyId).eq('id', id).select().single();
    if (e) return fail(res, e.message);
    return ok(res, data);
  }
  return fail(res, 'Method not allowed', 405);
}
