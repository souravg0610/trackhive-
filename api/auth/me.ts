import type { VercelRequest, VercelResponse } from '@vercel/node';
import { preflight, cors, requireUser } from '../_lib/auth';

export default async function(req: VercelRequest, res: VercelResponse) {
  if (preflight(req, res)) return;
  cors(res);
  const user = requireUser(req, res);
  if (!user) return;
  return res.status(200).json({ success: true, data: user, userId: user.sub, email: user.email, companyId: user.companyId, role: user.role, name: user.name });
}
