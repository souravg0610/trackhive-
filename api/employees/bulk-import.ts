import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);
  const sb = adminClient();
  const list = (req.body.employees || req.body || []).map((e: any) => ({ id: e.id||('EMP'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5)), company_id: user.companyId, name: e.name, role: e.role||'Field Agent', job_title: e.jobTitle||'', department: e.department||'Operations', email: e.email||'', phone: e.phone||'', reporting_manager: e.reportingManager||'', status: e.status||'active', is_active: e.isActive!==false, joining_date: e.joiningDate||new Date().toISOString().split('T')[0], work_location: e.workLocation||'', address: e.address||'', avatar: e.avatar||'', marital_status: e.maritalStatus||'Single', created_by: e.created_by||user.name, branch: e.branch||'' }));
  const { data, error: e } = await sb.from('employees').upsert(list).select();
  if (e) return fail(res, e.message);
  return res.status(200).json({ success: true, data, count: (data||[]).length, succeeded: (data||[]).length, failed: 0, total: list.length });
}
