import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from './_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from './_lib/auth';

const mapEmp = (e: any) => ({ id: e.id, name: e.name, role: e.role, jobTitle: e.job_title||'', department: e.department||'', email: e.email||'', phone: e.phone||'', reportingManager: e.reporting_manager||'', status: e.status||'active', isActive: e.is_active!==false, joiningDate: e.joining_date||'', workLocation: e.work_location||'', address: e.address||'', avatar: e.avatar||'', maritalStatus: e.marital_status||'Single', created_by: e.created_by||'', branch: e.branch||'' });

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length-1];
  const id = (last !== 'employees' && last !== 'bulk-import' && last !== 'temp-password' && !last.startsWith('api')) ? last : null;

  if (req.method === 'POST' && last === 'bulk-import') {
    const list = (req.body.employees||req.body||[]).map((e: any) => ({ id: e.id||('EMP'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5)), company_id: user.companyId, name: e.name, role: e.role||'Field Agent', job_title: e.jobTitle||'', department: e.department||'Operations', email: e.email||'', phone: e.phone||'', reporting_manager: e.reportingManager||'', status: e.status||'active', is_active: e.isActive!==false, joining_date: e.joiningDate||new Date().toISOString().split('T')[0], work_location: e.workLocation||'', address: e.address||'', avatar: e.avatar||'', marital_status: e.maritalStatus||'Single', created_by: e.created_by||user.name, branch: e.branch||'' }));
    const { data, error: e } = await sb.from('employees').upsert(list).select();
    if (e) return fail(res, e.message);
    return res.status(200).json({ success: true, data, count: (data||[]).length, succeeded: (data||[]).length, failed: 0, total: list.length });
  }

  if (req.method === 'POST' && last === 'temp-password' && id) {
    const arr = new Uint8Array(12); crypto.getRandomValues(arr);
    const tempPassword = Array.from(arr, b => b.toString(36)).join('').slice(0,10)+'!A1';
    const { data: emp } = await sb.from('employees').select('email').eq('company_id', user.companyId).eq('id', id).maybeSingle();
    if (emp?.email) { const { data: ex } = await sb.auth.admin.listUsers(); const au = (ex?.users||[]).find((u: any) => u.email===emp.email); if (au) await sb.auth.admin.updateUserById(au.id,{password:tempPassword}); else await sb.auth.admin.createUser({email:emp.email as string,password:tempPassword,email_confirm:true}); }
    return ok(res, { tempPassword });
  }

  if (id && req.method === 'GET') { const { data, error: e } = await sb.from('employees').select('*').eq('company_id', user.companyId).eq('id', id).maybeSingle(); if (e||!data) return fail(res,'Not found',404); return ok(res, data); }
  if (id && (req.method==='PUT'||req.method==='PATCH')) {
    const b=req.body; const u: any={};
    if(b.name!==undefined)u.name=b.name; if(b.role!==undefined)u.role=b.role; if(b.jobTitle!==undefined)u.job_title=b.jobTitle; if(b.department!==undefined)u.department=b.department; if(b.email!==undefined)u.email=b.email; if(b.phone!==undefined)u.phone=b.phone; if(b.reportingManager!==undefined)u.reporting_manager=b.reportingManager; if(b.status!==undefined)u.status=b.status; if(b.isActive!==undefined)u.is_active=b.isActive; if(b.workLocation!==undefined)u.work_location=b.workLocation; if(b.address!==undefined)u.address=b.address; if(b.avatar!==undefined)u.avatar=b.avatar; if(b.branch!==undefined)u.branch=b.branch; if(b.joiningDate!==undefined)u.joining_date=b.joiningDate; if(b.maritalStatus!==undefined)u.marital_status=b.maritalStatus;
    const { data, error: e } = await sb.from('employees').update(u).eq('company_id', user.companyId).eq('id', id).select().single(); if (e) return fail(res, e.message); return ok(res, data);
  }
  if (id && req.method==='DELETE') { await sb.from('employees').update({is_active:false,status:'inactive'}).eq('company_id',user.companyId).eq('id',id); return ok(res,{deleted:true}); }

  if (req.method==='GET') { const { data, error: e } = await sb.from('employees').select('*').eq('company_id', user.companyId).order('name'); if (e) return fail(res,e.message); return ok(res,(data||[]).map(mapEmp)); }
  if (req.method==='POST') {
    const b=req.body;
    const { data, error: e } = await sb.from('employees').insert({ id: b.id||('EMP'+Date.now().toString(36).toUpperCase()), company_id: user.companyId, name: b.name, role: b.role||'Field Agent', job_title: b.jobTitle||'', department: b.department||'Operations', email: b.email||'', phone: b.phone||'', reporting_manager: b.reportingManager||'', status: b.status||'active', is_active: b.isActive!==false, joining_date: b.joiningDate||new Date().toISOString().split('T')[0], work_location: b.workLocation||'', address: b.address||'', avatar: b.avatar||'', marital_status: b.maritalStatus||'Single', created_by: b.created_by||user.name, branch: b.branch||'' }).select().single();
    if (e) return fail(res, e.message); return ok(res, data, 201);
  }
  return fail(res, 'Method not allowed', 405);
}
