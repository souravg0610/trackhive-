import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

const mapEmp = (e: any) => ({ id: e.id, name: e.name, role: e.role, jobTitle: e.job_title||'', department: e.department||'', email: e.email||'', phone: e.phone||'', reportingManager: e.reporting_manager||'', status: e.status||'active', isActive: e.is_active!==false, joiningDate: e.joining_date||'', workLocation: e.work_location||'', address: e.address||'', avatar: e.avatar||'', maritalStatus: e.marital_status||'Single', created_by: e.created_by||'', branch: e.branch||'' });

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  const user = requireUser(req, res);
  if (!user) return;
  const sb = adminClient();

  if (req.method === 'GET') {
    const { data, error: e } = await sb.from('employees').select('*').eq('company_id', user.companyId).order('name');
    if (e) return fail(res, e.message);
    return ok(res, (data||[]).map(mapEmp));
  }

  if (req.method === 'POST') {
    const b = req.body;
    const { data, error: e } = await sb.from('employees').insert({ id: b.id||('EMP'+Date.now().toString(36).toUpperCase()), company_id: user.companyId, name: b.name, role: b.role||'Field Agent', job_title: b.jobTitle||'', department: b.department||'Operations', email: b.email||'', phone: b.phone||'', reporting_manager: b.reportingManager||'', status: b.status||'active', is_active: b.isActive!==false, joining_date: b.joiningDate||new Date().toISOString().split('T')[0], work_location: b.workLocation||'', address: b.address||'', avatar: b.avatar||'', marital_status: b.maritalStatus||'Single', created_by: b.created_by||user.name, branch: b.branch||'' }).select().single();
    if (e) return fail(res, e.message);
    return ok(res, data, 201);
  }

  return fail(res, 'Method not allowed', 405);
}
