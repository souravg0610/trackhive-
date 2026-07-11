import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient } from './_lib/supabase';
import { preflight, cors, requireUser, ok, fail } from './_lib/auth';
export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return; cors(res);
  const user = requireUser(req, res); if (!user) return;
  const sb = adminClient();
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts.length > 2 ? parts[parts.length-1] : null;
  if (req.method === 'GET') {
    const page = parseInt(url.searchParams.get('page')||'1');
    const limit = parseInt(url.searchParams.get('limit')||'500');
    const status = url.searchParams.get('status');
    let q = sb.from('tasks').select('*', { count: 'exact' }).eq('company_id', user.companyId).order('created_at', { ascending: false });
    if (status) q = (q as any).eq('status', status);
    q = (q as any).limit(Math.min(limit, 500));
    const { data, error: e, count } = await q;
    if (e) return fail(res, e.message);
    return res.status(200).json({ success: true, data: data||[], meta: { page, limit, total: count||0, pages: Math.ceil((count||0)/limit) } });
  }
  if (req.method === 'POST') {
    const body = req.body;
    if ('tasks' === 'leaves') {
      const id2 = 'LVA-' + crypto.randomUUID();
      const start = new Date(body.startDate); const end = new Date(body.endDate);
      const totalDays = Math.max(1, Math.ceil((end.getTime()-start.getTime())/86400000)+1);
      const { data, error: e } = await sb.from('tasks').insert({ ...body, id: id2, company_id: user.companyId, total_days: totalDays, status: 'pending', applied_on: new Date().toISOString().split('T')[0] }).select().single();
      if (e) return fail(res, e.message); return ok(res, data, 201);
    }
    const { data, error: e } = await sb.from('tasks').insert({ ...body, company_id: user.companyId }).select().single();
    if (e) return fail(res, e.message); return ok(res, data, 201);
  }
  if (id && (req.method==='PUT'||req.method==='PATCH')) {
    const body = req.body; let update = { ...body };
    if ('tasks'==='leaves' && body.action) { if(body.action==='approve')update={status:'approved',approved_by:user.name,approved_at:new Date().toISOString()};if(body.action==='reject')update={status:'rejected',rejection_reason:body.reason}; }
    const { data, error: e } = await sb.from('tasks').update(update).eq('company_id', user.companyId).eq('id', id).select().single();
    if (e) return fail(res, e.message); return ok(res, data);
  }
  if (id && req.method==='DELETE') { await sb.from('tasks').delete().eq('company_id',user.companyId).eq('id',id); return ok(res,{deleted:true}); }
  return fail(res,'Method not allowed',405);
}
