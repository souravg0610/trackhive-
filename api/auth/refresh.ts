import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signToken, verifyNoExp } from '../_lib/jwt';
import { preflight, cors, fail } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);
  try {
    const { refreshToken } = req.body;
    const d = verifyNoExp(refreshToken);
    return res.status(200).json({ success: true, token: signToken({ sub: d.sub, email: d.email, companyId: d.companyId, role: d.role, name: d.name }) });
  } catch { return fail(res, 'Invalid refresh token', 401); }
}
