import { useState } from 'react';
import { 
  User, Shield, Smartphone, Bell, Eye, EyeOff, 
  HelpCircle, LogOut, Code, AppWindow, Globe, Check
} from 'lucide-react';

export default function SettingsScreen() {
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans animate-fade-in" id="settings-container">
      {/* Settings Header */}
      <div className="p-4 flex justify-between items-start" id="settings-heading">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">System Settings</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Configure mobile work preference parameters</p>
        </div>
      </div>

      {/* User profile Summary Segment */}
      <div className="mx-4 p-4 rounded-2xl bg-[#FFF] border border-[#E5E7EB] flex items-center gap-3.5 shadow-xs" id="settings-profile">
        <div className="w-12 h-12 rounded-full bg-slate-50 overflow-hidden shrink-0 relative border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80" 
            alt="Sourav Gupta" 
            className="w-full h-full object-cover" 
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border border-[#FFF] rounded-full" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-[#111827]">Sourav Gupta</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">EMP001 • Super Administrator</p>
          <p className="text-[10.5px] text-slate-400 font-bold">sourav.gupta@trackhive.com</p>
        </div>
      </div>

      {/* Grouping 1: Account Settings */}
      <div className="mx-4 mt-6" id="account-settings-group">
        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-450 mb-2.5">Account & Security</h4>
        
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
          <div className="p-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700">Verification Profile</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">Verified</span>
          </div>

          <div className="p-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                <Shield className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-705">Role Permissions Mapping</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">View Logs</span>
          </div>
        </div>
      </div>

      {/* Grouping 2: App configurations */}
      <div className="mx-4 mt-5" id="app-settings-group">
        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-450 mb-2.5">Application Settings</h4>

        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
          {/* Notification toggler */}
          <div className="p-3.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                <Bell className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700">Push Notifications alerts</span>
            </div>
            <button 
              onClick={() => setAllowNotifications(!allowNotifications)}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center cursor-pointer ${
                allowNotifications ? 'bg-emerald-520 bg-[#10B981]' : 'bg-slate-200'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-[#FFF] shadow-md absolute transition-all ${
                allowNotifications ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Sync mode offline */}
          <div className="p-3.5 flex justify-between items-center font-sans">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700">Background Offline Sync</span>
            </div>
            <button 
              onClick={() => setOfflineSync(!offlineSync)}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center cursor-pointer ${
                offlineSync ? 'bg-[#10B981]' : 'bg-slate-200'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-[#FFF] shadow-md absolute transition-all ${
                offlineSync ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="p-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                <Globe className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700">Language Priority</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">English (IN)</span>
          </div>
        </div>
      </div>

      {/* Support details */}
      <div className="mx-4 mt-5" id="support-group">
        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-450 mb-2.5">Help & Documentation</h4>

        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs font-sans">
          <div className="p-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 font-sans">
                <HelpCircle className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700">Support Ticketing</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Contact Admin</span>
          </div>

          <div className="p-3.5 flex justify-between items-center hover:bg-red-50/50 cursor-pointer transition text-red-500">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-red-50 border border-red-100 rounded-lg text-red-600">
                <LogOut className="w-4 h-4" />
              </span>
              <span className="text-xs font-black">Secure Sign Out</span>
            </div>
          </div>
        </div>
      </div>

      {/* App Version Block */}
      <div className="px-4 mt-8 text-center" id="app-settings-logo-footer">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-sans">
          TrackHive Mobile Applet
        </p>
        <p className="text-[9.5px] text-slate-500 font-bold mt-1 flex items-center justify-center gap-1">
          <Code className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>v2.4.1 Production Core</span>
        </p>
        
        <div className="inline-flex items-center gap-1 mt-3 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[9px] font-bold">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>SaaS Server Live Syncing</span>
        </div>
      </div>
    </div>
  );
}
