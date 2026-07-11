import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET!;
export interface JwtPayload { sub: string; email: string; companyId: string; role: string; name: string; }
export const signToken   = (p: JwtPayload) => jwt.sign(p, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN||'7d' });
export const signRefresh = (p: JwtPayload) => jwt.sign(p, SECRET, { expiresIn: '30d' });
export const verifyToken = (t: string)     => jwt.verify(t, SECRET) as JwtPayload;
export const verifyNoExp = (t: string)     => jwt.verify(t, SECRET, { ignoreExpiration: true }) as JwtPayload;
