import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, anonClient } from '../_lib/supabase';
import { signToken, signRefresh } from '../_lib/jwt';
import { preflight, cors, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);
  try {
    const { email, password, fullName, companyName, phone, industry, companySize, address } = req.body;
    const sb = adminClient();
    const emailLower = email.toLowerCase().trim();
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
    await sb.from('subscriptions').insert({ company_id: companyId, plan: 'free', max_employees: 10, expires_at: new Date(Date.now() + 30*86400000).toISOString() });
    const payload = { sub: authUserId, email: emailLower, companyId, role: 'Super Administrator', name: fullName };
    return res.status(200).json({ success: true, token: signToken(payload), refreshToken: signRefresh(payload), user: payload, companyId });
  } catch(e: any) { return fail(res, e.message); }
}
