import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const { data, error: e } = await adminClient().from('leaves').select('*').eq('company_id', user.companyId).eq('status', 'pending').order('created_at');
  if (e) return fail(res, e.message);
  return ok(res, data||[]);
}
