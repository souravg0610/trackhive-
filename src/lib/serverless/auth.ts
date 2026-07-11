import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, JwtPayload } from './jwt';
export const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' };
export function cors(res: VercelResponse) { Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); }
export function preflight(req: VercelRequest, res: VercelResponse): boolean { cors(res); if(req.method==='OPTIONS'){res.status(200).end();return true;} return false; }
export function getUser(req: VercelRequest): JwtPayload|null { const a=req.headers.authorization||''; if(!a.startsWith('Bearer '))return null; try{return verifyToken(a.slice(7));}catch{return null;} }
export function requireUser(req: VercelRequest, res: VercelResponse): JwtPayload|null { const u=getUser(req); if(!u){res.status(401).json({success:false,message:'Unauthorized'});return null;} return u; }
export function ok(res: VercelResponse, data: unknown, status=200) { return res.status(status).json({success:true,data}); }
export function fail(res: VercelResponse, msg: string, status=500) { return res.status(status).json({success:false,message:msg}); }
