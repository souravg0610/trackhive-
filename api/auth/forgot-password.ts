import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anonClient } from '../_lib/supabase';
import { preflight, cors, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);
  try {
    const { email } = req.body;
    const { error: e } = await anonClient().auth.resetPasswordForEmail(email.toLowerCase().trim());
    if (e) return fail(res, e.message, 400);
    return res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch(e: any) { return fail(res, e.message); }
}
