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

  // temp-password
  if (req.method === 'POST') {
    const arr = new Uint8Array(12); crypto.getRandomValues(arr);
    const tempPassword = Array.from(arr, b => b.toString(36)).join('').slice(0,10) + '!A1';
    const { data: emp } = await sb.from('employees').select('email').eq('company_id', user.companyId).eq('id', id).maybeSingle();
    if (emp?.email) {
      const { data: existing } = await sb.auth.admin.listUsers();
      const authUser = (existing?.users||[]).find((u: any) => u.email === emp.email);
      if (authUser) await sb.auth.admin.updateUserById(authUser.id, { password: tempPassword });
      else await sb.auth.admin.createUser({ email: emp.email as string, password: tempPassword, email_confirm: true });
    }
    return ok(res, { tempPassword });
  }

  if (req.method === 'GET') {
    const { data, error: e } = await sb.from('employees').select('*').eq('company_id', user.companyId).eq('id', id).maybeSingle();
    if (e||!data) return fail(res, 'Not found', 404);
    return ok(res, data);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const b = req.body; const u: any = {};
    if (b.name!==undefined) u.name=b.name;
    if (b.role!==undefined) u.role=b.role;
    if (b.jobTitle!==undefined) u.job_title=b.jobTitle;
    if (b.department!==undefined) u.department=b.department;
    if (b.email!==undefined) u.email=b.email;
    if (b.phone!==undefined) u.phone=b.phone;
    if (b.reportingManager!==undefined) u.reporting_manager=b.reportingManager;
    if (b.status!==undefined) u.status=b.status;
    if (b.isActive!==undefined) u.is_active=b.isActive;
    if (b.workLocation!==undefined) u.work_location=b.workLocation;
    if (b.address!==undefined) u.address=b.address;
    if (b.avatar!==undefined) u.avatar=b.avatar;
    if (b.branch!==undefined) u.branch=b.branch;
    if (b.joiningDate!==undefined) u.joining_date=b.joiningDate;
    if (b.maritalStatus!==undefined) u.marital_status=b.maritalStatus;
    const { data, error: e } = await sb.from('employees').update(u).eq('company_id', user.companyId).eq('id', id).select().single();
    if (e) return fail(res, e.message);
    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    await sb.from('employees').update({ is_active: false, status: 'inactive' }).eq('company_id', user.companyId).eq('id', id);
    return ok(res, { deleted: true });
  }

  return fail(res, 'Method not allowed', 405);
}
