import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from './_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from './_lib/auth';
export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();
  if (req.method === 'GET') {
    const { data, error: e } = await sb.from('org_settings').select('*').eq('company_id', user.companyId).maybeSingle();
    if (e) return fail(res, e.message);
    return ok(res, { rolePermissions: (data as any)?.role_permissions||{}, customRoles: (data as any)?.custom_roles||[], customDepartments: (data as any)?.custom_departments||[], customBranches: (data as any)?.custom_branches||[] });
  }
  if (req.method==='PUT'||req.method==='PATCH') {
    const b=req.body; const u: any={};
    if(b.rolePermissions)u.role_permissions=b.rolePermissions; if(b.customRoles)u.custom_roles=b.customRoles; if(b.customDepartments)u.custom_departments=b.customDepartments; if(b.customBranches)u.custom_branches=b.customBranches;
    const { data, error: e } = await sb.from('org_settings').upsert({ company_id: user.companyId, ...u }).select().single();
    if (e) return fail(res, e.message); return ok(res, data);
  }
  return fail(res,'Method not allowed',405);
}
