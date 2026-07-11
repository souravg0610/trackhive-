import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, anonClient } from '../src/lib/serverless/supabase';
import { signToken, signRefresh, verifyNoExp } from '../src/lib/serverless/jwt';
import { preflight, cors, requireUser, ok, fail } from '../src/lib/serverless/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);

  // Detect action from URL path
  const path = req.url || '';
  const isSignup       = path.includes('signup');
  const isSignin       = path.includes('signin');
  const isRefresh      = path.includes('refresh');
  const isForgot       = path.includes('forgot');
  const isMe           = path.includes('/me') || req.method === 'GET';

  // GET /auth/me
  if (isMe && req.method === 'GET') {
    const user = requireUser(req, res);
    if (!user) return;
    return res.status(200).json({ success: true, data: user, userId: user.sub, email: user.email, companyId: user.companyId, role: user.role, name: user.name });
  }

  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const body = req.body || {};

  if (isSignup) {
    try {
      const { email, password, fullName, companyName, phone, industry, companySize, address } = body;
      const sb = adminClient(); const emailLower = email.toLowerCase().trim();
      const { data: authData, error: authErr } = await sb.auth.admin.createUser({ email: emailLower, password, email_confirm: true, user_metadata: { full_name: fullName } });
      if (authErr) return fail(res, authErr.message, 400);
      const authUserId = authData.user!.id;
      const companyId = crypto.randomUUID();
      await sb.from('companies').insert({ id: companyId, company_name: companyName, email: emailLower, phone, industry: industry||null, company_size: companySize||null, address: address||null, plan: 'free', status: 'active' });
      await sb.from('users').insert({ id: authUserId, company_id: companyId, full_name: fullName, email: emailLower, role: 'Super Administrator', status: 'active' });
      const empId = 'EMP' + Date.now().toString(36).toUpperCase();
      await sb.from('employees').insert({ id: empId, company_id: companyId, name: fullName, role: 'Super Administrator', department: 'Operations', status: 'active', email: emailLower, phone, is_active: true, joining_date: new Date().toISOString().split('T')[0], created_by: fullName });
      await sb.from('org_settings').insert({ company_id: companyId, role_permissions: { 'Super Administrator': ['dashboard','employees','tracking','attendance','shifts','payroll','leaves','visits','tasks','routes','geofence','reports','documents','notifications','settings'], 'Manager': ['dashboard','employees','tracking','attendance','shifts','payroll','leaves','visits','tasks','routes','geofence','reports','documents','notifications'], 'Field Agent': ['dashboard','tracking','attendance','leaves','visits','tasks','routes','notifications'], 'Sales Executive': ['dashboard','tracking','attendance','leaves','visits','tasks','routes','notifications'], 'Logistics Rider': ['dashboard','tracking','attendance','leaves','visits','tasks','routes','notifications'] }, custom_roles: ['Super Administrator','Manager','Field Agent','Sales Executive','Logistics Rider'], custom_departments: ['Operations','Sales','Logistics','Customer Support','Human Resources'], custom_branches: ['HQ Office'] });
      await sb.from('leave_types').insert([{ company_id: companyId, type_name: 'Casual Leave', code: 'CL', total_days: 12 }, { company_id: companyId, type_name: 'Sick Leave', code: 'SL', total_days: 8 }, { company_id: companyId, type_name: 'Earned Leave', code: 'EL', total_days: 18 }, { company_id: companyId, type_name: 'Comp Off', code: 'CO', total_days: 6 }]);
      await sb.from('subscriptions').insert({ company_id: companyId, plan: 'free', max_employees: 10, expires_at: new Date(Date.now()+30*86400000).toISOString() });
      const payload = { sub: authUserId, email: emailLower, companyId, role: 'Super Administrator', name: fullName };
      return res.status(200).json({ success: true, token: signToken(payload), refreshToken: signRefresh(payload), user: payload, companyId });
    } catch(e: any) { return fail(res, e.message); }
  }

  if (isSignin) {
    try {
      const { email, password } = body;
      const emailLower = email.toLowerCase().trim();
      const sb = anonClient(); const admin = adminClient();
      const { data, error: e } = await sb.auth.signInWithPassword({ email: emailLower, password });
      if (e || !data.session) return fail(res, e?.message||'Invalid credentials', 401);
      const userId = data.user!.id;
      let companyId='', fullName=emailLower.split('@')[0], role='Field Agent';
      const { data: u } = await sb.from('users').select('company_id,full_name,role').eq('id', userId).maybeSingle();
      if (u?.company_id) { companyId=u.company_id as string; fullName=(u.full_name as string)||fullName; role=(u.role as string)||role; }
      else { const { data: emp } = await sb.from('employees').select('company_id,name,role').ilike('email', emailLower).maybeSingle(); if (emp?.company_id) { companyId=emp.company_id as string; fullName=(emp.name as string)||fullName; role=(emp.role as string)||role; await admin.from('users').upsert({ id: userId, company_id: companyId, full_name: fullName, email: emailLower, role, status: 'active' }); } }
      if (!companyId) return fail(res, 'No company linked. Contact your administrator.', 401);
      const { data: fresh } = await admin.from('users').select('role,full_name').eq('id', userId).maybeSingle();
      if (fresh?.role) role=fresh.role as string;
      if (fresh?.full_name) fullName=(fresh.full_name as string)||fullName;
      await admin.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', userId);
      const payload = { sub: userId, email: emailLower, companyId, role, name: fullName };
      return res.status(200).json({ success: true, token: signToken(payload), refreshToken: signRefresh(payload), user: payload });
    } catch(e: any) { return fail(res, e.message); }
  }

  if (isRefresh) {
    try {
      const d = verifyNoExp(body.refreshToken);
      return res.status(200).json({ success: true, token: signToken({sub:d.sub,email:d.email,companyId:d.companyId,role:d.role,name:d.name}) });
    } catch { return fail(res, 'Invalid refresh token', 401); }
  }

  if (isForgot) {
    const { error: e } = await anonClient().auth.resetPasswordForEmail(body.email.toLowerCase().trim());
    if (e) return fail(res, e.message, 400);
    return res.status(200).json({ success: true, message: 'Password reset email sent' });
  }

  return fail(res, 'Not found', 404);
}