import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  const user = requireUser(req, res);
  if (!user) return;
  const sb = adminClient();
  const { id } = req.query as { id: string };

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = req.body; const update = { ...body };
    const { data, error: e } = await sb.from('documents').update(update).eq('company_id', user.companyId).eq('id', id).select().single();
    if (e) return fail(res, e.message);
    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    await sb.from('documents').delete().eq('company_id', user.companyId).eq('id', id);
    return ok(res, { deleted: true });
  }

  return fail(res, 'Method not allowed', 405);
}
