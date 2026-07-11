import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from '../src/lib/serverless/supabase';
import { preflight, cors, requireUser, ok, fail } from '../src/lib/serverless/auth';
const mapAtt = (a: any) => ({ id: a.id, employeeId: a.employee_id, employeeName: a.employee_name, department: a.department||'', date: a.date, checkInTime: a.check_in_time||'', checkOutTime: a.check_out_time||'', workingHours: a.working_hours||'', status: a.status||'Present', location: a.location||'' });
export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();
  if (req.method === 'GET') {
    const all = req.url?.includes('all');
    let q = sb.from('attendance').select('*').eq('company_id', user.companyId).order('date', { ascending: false });
    if (!all) { const today = new Date().toISOString().split('T')[0]; q = (q as any).eq('date', today); } else q = (q as any).limit(500);
    const { data, error: e } = await q;
    if (e) return fail(res, e.message);
    return ok(res, (data||[]).map(mapAtt));
  }
  if (req.method === 'POST') {
    const { action, location, employeeId, employeeName, department } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    let empId=employeeId, empName=employeeName||user.name, dept=department||'Operations';
    if (!empId) { const { data: emp } = await sb.from('employees').select('id,name,department').eq('company_id',user.companyId).ilike('email',user.email).maybeSingle(); if (emp) { empId=emp.id; empName=(emp as any).name; dept=(emp as any).department||dept; } else empId=user.sub; }
    const id = `ATT-${user.companyId}-${empId}-${today}`;
    if (action==='punch-in') {
      const { data: ex } = await sb.from('attendance').select('check_in_time').eq('id',id).maybeSingle();
      if (ex?.check_in_time) return fail(res,'Already punched in today',409);
      const { data, error: e } = await sb.from('attendance').upsert({ id, company_id: user.companyId, employee_id: empId, employee_name: empName, department: dept, date: today, check_in_time: time, status: 'Present', location: location||'' }).select().single();
      if (e) return fail(res,e.message); return ok(res,data);
    }
    if (action==='punch-out') {
      const { data: rec } = await sb.from('attendance').select('check_in_time').eq('id',id).maybeSingle();
      let wh='';
      if (rec?.check_in_time) { const pt=(t: string)=>{const[hm,ap]=t.split(' ');let[h,m]=hm.split(':').map(Number);if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;return h*60+m;};const diff=pt(time)-pt(rec.check_in_time as string);wh=`${Math.floor(diff/60)}h ${diff%60}m`; }
      const { data, error: e } = await sb.from('attendance').update({ check_out_time: time, working_hours: wh, location: location||'' }).eq('id',id).select().single();
      if (e) return fail(res,e.message); return ok(res,data);
    }
    return fail(res,'Invalid action',400);
  }
  return fail(res,'Method not allowed',405);
}
