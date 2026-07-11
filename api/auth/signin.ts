import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, anonClient } from '../_lib/supabase';
import { signToken, signRefresh } from '../_lib/jwt';
import { preflight, cors, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase().trim();
    const sb = anonClient(); const admin = adminClient();
    const { data, error: e } = await sb.auth.signInWithPassword({ email: emailLower, password });
    if (e || !data.session) return fail(res, e?.message || 'Invalid credentials', 401);
    const userId = data.user!.id;
    let companyId = '', fullName = emailLower.split('@')[0], role = 'Field Agent';
    const { data: u } = await sb.from('users').select('company_id,full_name,role').eq('id', userId).maybeSingle();
    if (u?.company_id) { companyId = u.company_id as string; fullName = (u.full_name as string)||fullName; role = (u.role as string)||role; }
    else {
      const { data: emp } = await sb.from('employees').select('company_id,name,role').ilike('email', emailLower).maybeSingle();
      if (emp?.company_id) { companyId = emp.company_id as string; fullName = (emp.name as string)||fullName; role = (emp.role as string)||role; await admin.from('users').upsert({ id: userId, company_id: companyId, full_name: fullName, email: emailLower, role, status: 'active' }); }
    }
    if (!companyId) return fail(res, 'No company linked. Contact your administrator.', 401);
    const { data: fresh } = await admin.from('users').select('role,full_name').eq('id', userId).maybeSingle();
    if (fresh?.role) role = fresh.role as string;
    if (fresh?.full_name) fullName = (fresh.full_name as string)||fullName;
    await admin.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', userId);
    const payload = { sub: userId, email: emailLower, companyId, role, name: fullName };
    return res.status(200).json({ success: true, token: signToken(payload), refreshToken: signRefresh(payload), user: payload });
  } catch(e: any) { return fail(res, e.message); }
}
