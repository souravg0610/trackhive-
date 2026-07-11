// ============================================================
// AUTH — TrackHive SaaS login + signup
// ZERO Supabase imports. ZERO Supabase keys. Every call goes
// through the NestJS backend via apiClient.ts. The browser
// never sees a database credential of any kind.
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, ArrowRight, ShieldAlert, Eye, EyeOff,
  Compass, Calendar, FileText, Briefcase,
} from 'lucide-react';
import {
  apiSignUp, apiSignIn, apiGetMe, isApiConfigured, getApiToken,
} from '../lib/apiClient';
import { Session } from '../lib/storageKeys';
import TrackHiveLogo from './TrackHiveLogo';

interface AuthProps {
  onAuthSuccess: (email: string, fullName?: string) => void;
  onBypass: () => void;
  defaultSignUp?: boolean;
  onBackToLanding?: () => void;
}

export default function Auth({
  onAuthSuccess, onBypass, defaultSignUp = false, onBackToLanding,
}: AuthProps) {
  const [isSignUp, setIsSignUp]             = useState(defaultSignUp);
  const [isForgotPw, setIsForgotPw]         = useState(false);
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [fullName, setFullName]             = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [companyName, setCompanyName]       = useState('');
  const [companyPhone, setCompanyPhone]     = useState('');
  const [industry, setIndustry]             = useState('Logistics');
  const [companySize, setCompanySize]       = useState('11-50 employees');
  const [companyAddress, setCompanyAddress] = useState('');
  const [loading, setLoading]               = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { setIsSignUp(defaultSignUp); }, [defaultSignUp]);

  // ── Auto-login if a valid token already exists (page refresh) ──
  useEffect(() => {
    const token = getApiToken();
    if (!token) { setCheckingSession(false); return; }

    // If email already in storage, auto-login immediately without spinner
    // This prevents the dashboard from being blocked while apiGetMe() runs
    const cachedEmail = localStorage.getItem('th_user_email');
    const cachedName  = localStorage.getItem('th_user_name');
    if (cachedEmail) {
      setCheckingSession(false);
      onAuthSuccess(cachedEmail, cachedName || cachedEmail.split('@')[0]);
      // Still verify token in background and refresh role/name
      apiGetMe().then(user => {
        Session.set('COMPANY_ID', user.companyId);
        Session.set('USER_NAME', user.name);
        Session.set('USER_ROLE', user.role);
        localStorage.setItem('th_user_email', user.email);
        localStorage.setItem('th_user_name', user.name);
      }).catch(() => {
        // Token expired — force logout
        localStorage.clear();
        window.location.href = '/';
      });
      return;
    }

    apiGetMe()
      .then(user => {
        Session.set('COMPANY_ID', user.companyId);
        Session.set('USER_NAME', user.name);
        Session.set('USER_ROLE', user.role);
        localStorage.setItem('th_user_email', user.email);
        localStorage.setItem('th_user_name', user.name);
        setCheckingSession(false);
        onAuthSuccess(user.email, user.name);
      })
      .catch(() => {
        localStorage.clear();
        setCheckingSession(false);
      });
  }, [onAuthSuccess]);

  // ── Forgot password ───────────────────────────────────────
  const handleForgotPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMsg({ type: 'error', text: 'Enter your registered email.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      // Password reset goes through the backend, which calls
      // Supabase Auth server-side. No Supabase client in the browser.
      const res = await fetch(`${(import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Reset failed.');
      setMsg({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Reset failed.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Sign up / Sign in ─────────────────────────────────────
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMsg({ type: 'error', text: 'Email and password are required.' });
      return;
    }
    if (!isApiConfigured()) {
      setMsg({ type: 'error', text: 'Backend API is not configured. Add VITE_API_URL to .env.local' });
      return;
    }
    setLoading(true);
    setMsg(null);
    const emailLower = email.toLowerCase().trim();

    try {
      if (isSignUp) {
        // ── SIGN UP ──────────────────────────────────────
        if (!companyName || !companyPhone || !companyAddress) {
          throw new Error('Company name, phone, and address are required.');
        }
        const adminName = fullName.trim() || emailLower.split('@')[0];

        const result = await apiSignUp({
          email: emailLower,
          password,
          fullName: adminName,
          companyName,
          phone: companyPhone,
          industry,
          companySize,
          address: companyAddress,
        });

        Session.set('COMPANY_ID', result.companyId);
        Session.set('USER_NAME', adminName);
        Session.set('USER_ROLE', 'Super Administrator');
        Session.set('USER_DEPT', 'Operations');

        setMsg({ type: 'success', text: `Welcome ${adminName}! Opening your workspace...` });
        setTimeout(() => onAuthSuccess(emailLower, adminName), 1000);

      } else {
        // ── SIGN IN ──────────────────────────────────────
        const result = await apiSignIn(emailLower, password);

        Session.set('COMPANY_ID', result.user.companyId);
        Session.set('USER_NAME', result.user.name);
        Session.set('USER_ROLE', result.user.role);
        localStorage.setItem('th_user_email', emailLower);
        localStorage.setItem('th_user_name', result.user.name);
        
        setMsg({ type: 'success', text: `Welcome back, ${result.user.name}!` });
        setTimeout(() => onAuthSuccess(emailLower, result.user.name), 800);
      }
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state while checking existing session ──────────
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-800 overflow-hidden font-sans">

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:col-span-4 bg-[#032B25] relative overflow-hidden flex-col justify-between p-10 text-left">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)]" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-4">
            <TrackHiveLogo isDarkBg className="scale-[1.05] origin-left" />
            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 bg-emerald-900/40 border border-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold tracking-widest rounded-full">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
              <span>Workforce Management Suite</span>
            </div>
          </div>
          <div className="pt-6 space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Track. Manage.</h1>
            <h1 className="text-4xl font-extrabold text-emerald-400 tracking-tight leading-none">Achieve More.</h1>
            <p className="text-slate-300/80 text-xs leading-relaxed max-w-sm pt-2">
              TrackHive helps organisations streamline field operations, monitor attendance, manage tasks, and ensure real-time productivity.
            </p>
          </div>
          <div className="pt-6 space-y-3.5 max-w-sm">
            {[
              { icon: Compass,   title: 'Real-time Location Stream', desc: 'High-definition path replay and geofence tracking.' },
              { icon: Calendar,  title: 'Attendance Verification',   desc: 'Smart check-in/out and biometric coordinates.' },
              { icon: FileText,  title: 'Task & Visit Descriptors',  desc: 'Assign custom client locations and compliance checks.' },
              { icon: Briefcase, title: 'Insights & Analytics',      desc: 'Integrated dashboard panels and detailed reports.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-2.5 bg-[#04332c]/50 rounded-xl hover:bg-[#04332c] transition-colors">
                <Icon className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="text-[10px] text-slate-300/60 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 p-3 bg-emerald-950/40 border border-emerald-500/10 rounded-2xl flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-white leading-none">Secure & Reliable</p>
            <p className="text-[10px] text-slate-400 mt-1">JWT-secured API. No database keys ever reach the browser.</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="col-span-1 lg:col-span-8 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-y-auto bg-slate-50">
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 text-left space-y-6">

          <div>
            {onBackToLanding && (
              <button type="button" onClick={onBackToLanding}
                className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-800 mb-4 uppercase tracking-wider cursor-pointer">
                ← Back
              </button>
            )}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <TrackHiveLogo className="scale-90" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">
              {isForgotPw ? 'Reset Password' : isSignUp ? 'Create Your Workspace' : 'Welcome Back!'}
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">
              {isForgotPw ? 'Enter your email address' : isSignUp ? 'Set up your company profile' : 'Sign in to continue'}
            </p>
          </div>

          {/* API connection status */}
          <div className={`p-2.5 px-3.5 rounded-xl border flex items-center justify-between text-[10px] font-bold ${
            isApiConfigured()
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-100'
          }`}>
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isApiConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isApiConfigured() ? 'API connected' : 'API not configured — set VITE_API_URL'}
            </span>
            <span className="opacity-75 uppercase font-mono text-[9px]">SaaS</span>
          </div>

          {!isForgotPw && (
            <div className="flex border-b border-slate-100">
              {['Sign In', 'Sign Up'].map((label, idx) => (
                <button key={label} type="button"
                  onClick={() => { setIsSignUp(idx === 1); setMsg(null); }}
                  className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                    isSignUp === (idx === 1) ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}>{label}</button>
              ))}
            </div>
          )}

          {msg && (
            <div className={`p-3.5 rounded-xl text-xs flex gap-2.5 ${
              msg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-950'
                : 'bg-rose-50 border border-rose-100 text-rose-950'
            }`}>
              <span className="font-extrabold">{msg.type === 'success' ? '✓' : '⚠'}</span>
              <p className="font-semibold">{msg.text}</p>
            </div>
          )}

          {isForgotPw ? (
            <form onSubmit={handleForgotPw} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 text-slate-400" />
                  <input type="email" placeholder="your@email.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                    required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setIsForgotPw(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline block mx-auto cursor-pointer">
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                      <input type="text" placeholder="Rahul Sharma" value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                        required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Work Email</label>
                      <input type="email" placeholder="name@company.com" value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                        required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Company Name</label>
                      <input type="text" placeholder="Acme Logistics" value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                        required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                      <input type="tel" placeholder="+91..." value={companyPhone}
                        onChange={e => setCompanyPhone(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                        required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Industry</label>
                      <select value={industry} onChange={e => setIndustry(e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500">
                        {['Logistics','Sales','Field Services','Construction','Healthcare','Retail','Other'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Size</label>
                      <select value={companySize} onChange={e => setCompanySize(e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500">
                        {['1-10 employees','11-50 employees','51-200 employees','201-500 employees','500+ employees'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Address</label>
                    <input type="text" placeholder="Headquarters address" value={companyAddress}
                      onChange={e => setCompanyAddress(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                      required />
                  </div>
                </div>
              )}

              {!isSignUp && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 text-slate-400" />
                    <input type="email" placeholder="name@company.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                      required />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  {!isSignUp && (
                    <button type="button" onClick={() => setIsForgotPw(true)}
                      className="text-[9px] font-extrabold text-emerald-700 hover:text-emerald-800">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 text-slate-400" />
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-xs font-semibold pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500"
                    required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest shadow-md hover:from-emerald-800 hover:to-emerald-900 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                {loading
                  ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>{isSignUp ? 'Create Workspace' : 'Sign In'}</span><ArrowRight className="h-3.5 w-3.5" /></>
                }
              </button>
            </form>
          )}

          {/* Demo access */}
          {!isForgotPw && (
            <div onClick={onBypass}
              className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 cursor-pointer hover:bg-emerald-100/50 transition-all text-left group">
              <ShieldAlert className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-black text-emerald-800 flex items-center gap-1">
                  <span>Demo Mode</span>
                  <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest">Quick</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Launch a demo workspace instantly — no credentials required.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] tracking-wide font-mono">
          © 2026 TrackHive ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}