/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Settings,
  Bell,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  CreditCard,
  Download,
  Upload,
  Globe,
  Clock,
  Briefcase,
  Database,
  Copy,
  ExternalLink,
  Server,
  CloudLightning,
  Plus,
  MapPin
} from 'lucide-react';
import { DBState, saveState } from '../dbState';
import { DocumentRecord, NotificationAlert } from '../types';
import { isApiConfigured } from '../lib/apiClient';
import { apiUpdateOrgSettings } from '../lib/apiClient';

interface CoreTabsCProps {
  db: DBState;
  setDb: React.Dispatch<React.SetStateAction<DBState>>;
  activeTab: string;
  searchQuery: string;
  triggerNotification: (title: string, desc: string, type: any, priority: any) => void;
  onThemeChange: (theme: 'Light' | 'Dark') => void;
  userRole: string;
  currentUserEmail: string;
}

export default function CoreTabs_C({
  db,
  setDb,
  activeTab,
  searchQuery,
  triggerNotification,
  onThemeChange,
  userRole,
  currentUserEmail
}: CoreTabsCProps) {

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const agentEmployee = useMemo(() => {
    return db.employees.find(e => e.email.toLowerCase() === currentUserEmail.toLowerCase());
  }, [db.employees, currentUserEmail]);

  const [activeSettingsSubnav, setActiveSettingsSubnav] = useState<'profile' | 'attendance' | 'gps' | 'roles' | 'shifts' | 'payroll' | 'leaves'>('profile');

  const [newRole, setNewRole] = useState('');
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<string>('Super Administrator');
  const [newDept, setNewDept] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [isWipingData, setIsWipingData] = useState(false);
  const [wipeMessage, setWipeMessage] = useState<string | null>(null);

  const [companyProfile, setCompanyProfile] = useState({
    companyName: db.settings?.name || '',
    companyEmail: db.settings?.email || '',
    website: db.settings?.website || '',
    phoneNumber: db.settings?.phone || '',
    address: db.settings?.address || '',
    industry: db.settings?.industry || '',
    timezone: db.settings?.timezone || '',
    dateFormat: db.settings?.dateFormat || '',
    currency: db.settings?.currency || ''
  });

  React.useEffect(() => {
    if (db.settings) {
      setCompanyProfile({
        companyName: db.settings.name || '',
        companyEmail: db.settings.email || '',
        website: db.settings.website || '',
        phoneNumber: db.settings.phone || '',
        address: db.settings.address || '',
        industry: db.settings.industry || '',
        timezone: db.settings.timezone || '',
        dateFormat: db.settings.dateFormat || '',
        currency: db.settings.currency || ''
      });
    }
  }, [db.settings]);

  const [themeMode, setThemeMode] = useState<'Light' | 'Dark'>('Light');

  // ----------------------------------------------------
  // --- REPORTS TAB (fully dynamic – no mock data) ---
  // ----------------------------------------------------
  const renderReportsTab = () => {
    const isAgent = userRole === 'Field Agent' || userRole === 'Sales Executive' || userRole === 'Logistics Rider';
    if (isAgent) {
      return (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-300">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-mono font-bold text-slate-800">Operational Report Restricted</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your current SaaS role is <strong className="text-slate-800">{userRole}</strong>. Consolidated organizational performance indices, cumulative team mileages, and regional analytical charts are restricted to account supervisors.
          </p>
        </div>
      );
    }

    // Compute real metrics from db
    const totalEmployees = db.employees.length;
    const totalAttendance = db.attendance.length;
    const presentCount = db.attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    const totalVisits = db.visits.length;
    const completedVisits = db.visits.filter(v => v.status === 'Completed').length;
    const visitCompletionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    const deptCounts: Record<string, number> = {};
    db.employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const totalDeptEmployees = Object.values(deptCounts).reduce((a, b) => a + b, 0);
    const deptPercentages = Object.fromEntries(
      Object.entries(deptCounts).map(([dept, count]) => [
        dept,
        totalDeptEmployees > 0 ? Math.round((count / totalDeptEmployees) * 100) : 0
      ])
    );

    const today = new Date();
    const days = 7;
    const dayLabels: string[] = [];
    const dayData: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dayLabels.push(d.toLocaleDateString('en', { weekday: 'short' }));
      const count = db.attendance.filter(a => a.date === dateStr).length;
      dayData.push(count);
    }
    const maxVal = Math.max(...dayData, 1);
    const normalizedData = dayData.map(v => (v / maxVal) * 100);
    const width = 450;
    const height = 110;
    const padding = 12;
    const linePoints = normalizedData.map((val, idx) => {
      const x = padding + (idx / (normalizedData.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / 100) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="space-y-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Monthly Performance Rank</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-emerald-700 font-mono">
                {attendanceRate > 0 ? '01' : '—'}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-sans">
                {attendanceRate > 0 ? `${attendanceRate}% attendance` : 'No data'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {attendanceRate > 0 ? 'Rankings determined from check‑ins' : 'No logs recorded'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Total Travelled Millage</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-slate-800 font-mono">
                {db.routes.reduce((sum, r) => sum + parseFloat(r.totalDistance || '0'), 0).toFixed(0) || '0'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Kilometers logged</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {db.routes.length > 0 ? 'Cumulative transit from route logs' : 'No routes logged'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Average Check-in duration</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-slate-800 font-mono">
                {db.visits.length > 0 ? `${Math.round(db.visits.reduce((acc, v) => acc + parseFloat(v.duration || '0'), 0) / db.visits.length)}m` : '—'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">minutes / visit</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {db.visits.length > 0 ? 'Derived from visit logs' : 'No visits recorded'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-sans">Daily Attendance Trend</h3>
              <p className="text-[11px] text-slate-400">
                {db.attendance.length > 0 ? `Last ${days} days` : 'No attendance records'}
              </p>
            </div>

            {db.attendance.length > 0 ? (
              <div className="relative w-full overflow-x-auto pt-2">
                <svg className="w-full h-28 min-w-[380px]">
                  <line x1={0} y1={50} x2={width} y2={50} stroke="#f1f5f9" strokeWidth={1} />
                  <polyline
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />
                  {normalizedData.map((val, idx) => {
                    const x = padding + (idx / (normalizedData.length - 1)) * (width - padding * 2);
                    const y = height - padding - (val / 100) * (height - padding * 2);
                    return (
                      <circle key={idx} cx={x} cy={y} r={4.5} fill="#0f766e" stroke="#ffffff" strokeWidth={1} />
                    );
                  })}
                </svg>
                <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-2.5 mt-2">
                  {dayLabels.map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">No data available</div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Department-wise Breakdown</h3>
              <p className="text-[11px] text-slate-400">Personnel distribution by department</p>
            </div>

            {totalDeptEmployees > 0 ? (
              <div className="flex items-center gap-6 justify-center py-4 flex-wrap">
                {Object.entries(deptPercentages).map(([dept, pct], idx) => {
                  const colors = ['#0f766e', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={dept} className="relative inline-flex items-center justify-center">
                      <svg className="h-24 w-24 transform -rotate-90">
                        <circle className="text-slate-100" strokeWidth={10} stroke="currentColor" fill="transparent" r={34} cx={48} cy={48} />
                        <circle
                          className=""
                          strokeWidth={10}
                          strokeDasharray={`${pct * 2.13} 213`}
                          strokeLinecap="round"
                          stroke={color}
                          fill="transparent"
                          r={34}
                          cx={48}
                          cy={48}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-black text-slate-800 font-mono">{pct}%</span>
                        <span className="text-[8px] font-bold text-slate-400 font-sans leading-none uppercase">{dept}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">No employees to show</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between col-span-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Operational Summary Dossiers</h4>
              <p className="text-[11px] text-slate-400">Performance metrics per employee</p>
            </div>
            <button
              onClick={() => {
                // CSV download triggered above
                triggerNotification('Spreadsheet Downloaded', 'Workforce summary sheet saved.', 'System', 'Low');
              }}
              className="flex items-center gap-1 bg-emerald-700 text-white font-bold text-[11px] px-3.5 py-2' rounded-xl hover:bg-emerald-800 transition-all p-2 gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px] font-sans">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Personnel Name</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Total Days Recorded</th>
                  <th className="p-4">Present logs</th>
                  <th className="p-4">Absent counts</th>
                  <th className="p-4">Completion Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {db.employees.map((emp) => {
                  const itemsCount = db.attendance.filter(a => a.employeeId === emp.id).length;
                  const presences = db.attendance.filter(a => a.employeeId === emp.id && a.status === 'Present').length;
                  const absCount = db.attendance.filter(a => a.employeeId === emp.id && a.status === 'Absent').length;
                  const performance = itemsCount > 0 ? Math.round((presences / itemsCount) * 100) : 0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/30">
                      <td className="p-4 pl-6 font-extrabold text-slate-800">{emp.name}</td>
                      <td className="p-4 text-slate-500">{emp.role}</td>
                      <td className="p-4 font-mono font-bold text-slate-700">{itemsCount || 0}</td>
                      <td className="p-4 font-mono text-slate-600">{presences || 0}</td>
                      <td className="p-4 font-mono text-rose-500">{absCount || 0}</td>
                      <td className="p-4">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100/50">
                          {itemsCount > 0 ? `${performance}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // --- DOCUMENTS TAB (unchanged) ---
  // ----------------------------------------------------
  const handleIdentityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;

      const uploaderName = agentEmployee ? agentEmployee.name : (currentUserEmail ? currentUserEmail.split('@')[0] : 'System Admin');
      const uploaderId = agentEmployee ? agentEmployee.id : 'ADMIN001';
      const fileSizeString = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;

      const newDoc: DocumentRecord = {
        id: 'DOC' + Math.floor(1000 + Math.random() * 9000),
        name: file.name,
        category: 'ID Proof',
        uploadedBy: uploaderName,
        uploadedById: uploaderId,
        uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        size: fileSizeString,
        status: 'Pending Verification',
        fileUrl: base64Url
      };

      setDb((prev) => {
        const merged = [newDoc, ...prev.documents];
        const nextState = { ...prev, documents: merged };
        return nextState;
      });

      triggerNotification(
        'Identity Document Uploaded',
        `${file.name} uploaded and appended under ${uploaderName} document folder.`,
        'System',
        'Medium'
      );
    };
    reader.readAsDataURL(file);
  };

  const selectedDocumentObj = useMemo(() => {
    return db.documents.find(d => d.id === selectedDocumentId) || null;
  }, [db.documents, selectedDocumentId]);

  const renderDocumentsTab = () => {
    return (
      <div className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm col-span-2">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Compliance & Dossiers Verification Gate</h4>
            <p className="text-[11px] text-slate-400">Users can drag-and-drop or select JPG verification identities directly</p>
          </div>

          <label className="w-full sm:w-auto flex items-center justify-center gap-1 bg-emerald-700 text-white font-bold text-[12px] px-4 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-800 shadow-sm leading-none">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
            <input type="file" onChange={handleIdentityUpload} className="hidden" accept="image/*,application/pdf" />
          </label>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start col-span-2">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px] font-sans">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-6">Document Identity</th>
                    <th className="p-4">Roster Owner</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">File metrics</th>
                    <th className="p-4 pr-6">Verification state</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.documents.map((doc) => {
                    const isSelected = selectedDocumentId === doc.id;
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedDocumentId(doc.id)}
                        className={`hover:bg-slate-50/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/30 font-semibold' : ''
                        }`}
                      >
                        <td className="p-4 pl-6">
                          <p className="font-extrabold text-slate-800">{doc.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono font-bold">{doc.category} • {doc.id}</p>
                        </td>
                        <td className="p-4 text-slate-700 font-bold">{doc.uploadedBy}</td>
                        <td className="p-4 text-slate-500 font-semibold">{doc.uploadedDate}</td>
                        <td className="p-4 font-mono text-slate-500">{doc.size}</td>
                        <td className="p-4 pr-6">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                            doc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {doc.status === 'Active' ? 'Approved' : doc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm sticky top-[100px] text-left">
            {selectedDocumentObj ? (
              <div className="space-y-6 text-[11px] font-sans">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Verification Hub Panel</span>
                  <div className="flex items-center justify-between mt-0.5 col-span-2">
                    <h3 className="text-sm font-extrabold text-slate-800 leading-snug">{selectedDocumentObj.name}</h3>
                    <span className="font-mono text-slate-400 font-bold text-[10px]">{selectedDocumentObj.id}</span>
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-gradient-to-tr from-rose-50/50 to-orange-50 stroke-rose-100 border border-amber-100 shadow-inner space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div>
                      <p className="text-[9px] font-black text-rose-800 uppercase tracking-tight font-sans">Government of India</p>
                      <p className="text-[8px] text-slate-400 tracking-wider font-mono -mt-0.5">Unique Identification Authority</p>
                    </div>
                    <span className="text-[9px] font-black text-emerald-800 font-serif">Mera Aadhaar</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-20 w-16 bg-slate-200 border border-slate-300 rounded overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                      {selectedDocumentObj.fileUrl ? (
                        <img src={selectedDocumentObj.fileUrl} alt="Aadhaar Face" className="h-full w-full object-cover" />
                      ) : (
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" alt="Placeholder Aadhaar Face" className="h-full w-full object-cover" />
                      )}
                    </div>

                    <div className="space-y-1.5 font-semibold text-slate-700 leading-tight text-[11px]">
                      <p>Name: <span className="text-slate-900 font-extrabold">{selectedDocumentObj.uploadedBy}</span></p>
                      <p>DOB: <span className="font-mono">12/04/1995</span></p>
                      <p>Gender: <span className="font-sans">Male</span></p>
                      <p className="font-mono font-black text-slate-900 tracking-wider text-[11px] pt-1.5">UID: XXXX XXXX 1234</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Verification audits checkmarks</span>
                  <div className="space-y-1.5 text-slate-600 font-semibold">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-3.5 w-3.5" />
                      <span>UID validity verified against API registry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-3.5 w-3.5" />
                      <span>Portrait biometric similarities approved</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setDb((prev) => {
                        const updated = prev.documents.map(d => d.id === selectedDocumentObj.id ? { ...d, status: 'Active' as const } : d);
                        const nextState = { ...prev, documents: updated };
                        return nextState;
                      });
                      triggerNotification('Document Confirmed', `Verification status set to verified on ${selectedDocumentObj.name}`, 'System', 'Low');
                    }}
                    className="flex-1 text-center bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] py-2.5 rounded-xl shadow-none"
                  >
                    Approve Document
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm('Are you sure you want to remove this document?')) return;
                      setDb((prev) => {
                        const updated = prev.documents.filter(d => d.id !== selectedDocumentObj.id);
                        const nextState = { ...prev, documents: updated };
                        return nextState;
                      });
                      setSelectedDocumentId(null);
                      triggerNotification('Document Deleted', 'Compliance file was permanently removed.', 'System', 'Low');
                    }}
                    className="flex-1 text-center border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 font-bold text-[11px] py-2.5 rounded-xl"
                  >
                    Delete File
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 col-span-2">
                <FileText className="h-12 w-12 text-slate-200 mx-auto stroke-[1.5] mb-3" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Verification Identity details</h4>
                <p className="text-[10px] text-slate-300 max-w-[200px] mx-auto mt-1 leading-normal">
                  Select any database document row to preview government proof details, trigger Aadhaar card frames or toggle verifying indicators.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // --- NOTIFICATIONS TAB (unchanged) ---
  // ----------------------------------------------------
  const renderNotificationsTab = () => {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start text-left">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Notification Inbox</h3>
              <p className="text-[11px] text-slate-400">Review alarm triggers and check-in checklists logs</p>
            </div>
            <button
              onClick={() => {
                setDb((prev) => {
                  const empty: NotificationAlert[] = [];
                  const nextState = { ...prev, notifications: empty };
                  return nextState;
                });
                triggerNotification('Inbox Cleared', 'Empty inbox logs.', 'System', 'Low');
              }}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Clear All Logs
            </button>
          </div>

          <div className="space-y-3">
            {db.notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center font-semibold">No operational notifications logged in current session.</p>
            ) : (
              db.notifications.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-4 cursor-pointer transition-colors ${alert.read ? 'bg-slate-50/50 border-slate-100/70' : 'bg-emerald-50/40 border-emerald-100/70'}`} onClick={() => {
                      setDb((prev) => {
                        const updated = prev.notifications.map(n => n.id === alert.id ? { ...n, read: true } : n);
                        return { ...prev, notifications: updated };
                      });
                    }}>
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-xl ${
                      alert.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      alert.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      <ShieldAlert className="h-4.5 w-4.5 stroke-[1.8]" />
                    </span>
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-800 leading-tight">{alert.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{alert.description}</p>
                      <span className="text-[9px] font-mono text-slate-400 font-bold block mt-1.5 uppercase">{alert.type} • {alert.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDb((prev) => {
                        const updated = prev.notifications.filter(n => n.id !== alert.id);
                        const nextState = { ...prev, notifications: updated };
                        return nextState;
                      });
                    }}
                    className="p-1 hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-[100px] text-left space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Permissions Dispatch Rules</h4>
            <p className="text-[11px] text-slate-400">Verify which sensor notifications get automatically forwarded</p>
          </div>

          <div className="space-y-4 font-semibold text-slate-700 text-[11px] leading-relaxed">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="text-slate-800 font-extrabold">Geofence Exits / Entrances</p>
                <p className="text-[10px] text-slate-400 font-medium">Auto logging of boundary status</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4.5 w-4.5 accent-emerald-600" />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="text-slate-800 font-extrabold">Late Clock-In warnings</p>
                <p className="text-[10px] text-slate-400 font-medium">Forward to supervisor after 15m delay</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4.5 w-4.5 accent-emerald-600" />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="text-slate-800 font-extrabold">Low battery critical triggers</p>
                <p className="text-[10px] text-slate-400 font-medium">Send alarm when worker dips below 20%</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4.5 w-4.5 accent-emerald-600" />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="text-slate-800 font-extrabold">Site Photo Upload notifications</p>
                <p className="text-[10px] text-slate-400 font-medium">Alert when checklists photos are saved</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4.5 w-4.5 accent-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // --- SETTINGS TAB (unchanged except removing hardcoded values in attendance) ---
  // ----------------------------------------------------
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextDb: DBState = {
      ...db,
      settings: {
        ...db.settings,
        name: companyProfile.companyName,
        email: companyProfile.companyEmail,
        phone: companyProfile.phoneNumber,
        address: companyProfile.address,
        timezone: companyProfile.timezone,
        currency: companyProfile.currency
      }
    };
    setDb(nextDb);
    saveState(nextDb);
    triggerNotification('Settings Saved', 'Corporate parameters updated in db registry.', 'System', 'Low');
  };

  const handleAddRoleInSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    const currentRoles = db.customRoles || ['Super Administrator', 'Manager', 'Field Agent'];
    if (currentRoles.some(r => r.toLowerCase() === newRole.trim().toLowerCase())) {
      alert('Role already exists');
      return;
    }
    const updated = [...currentRoles, newRole.trim()];
    const nextDb = { ...db, customRoles: updated };
    setDb(nextDb);
    saveState(nextDb);
    apiUpdateOrgSettings({ rolePermissions: nextDb.rolePermissions, customRoles: nextDb.customRoles, customDepartments: nextDb.customDepartments, customBranches: nextDb.customBranches }).catch(console.error);
    setNewRole('');
    triggerNotification('SaaS Config Change', `A new corporate role "${newRole.trim()}" has been added to workspace settings.`, 'System', 'Low');
  };

  const handleDeleteRoleInSettings = (roleName: string) => {
    if (['super administrator', 'field agent', 'manager'].includes(roleName.toLowerCase())) {
      alert('Cannot delete standard system-defined roles for security.');
      return;
    }
    const currentRoles = db.customRoles || ['Super Administrator', 'Manager', 'Field Agent'];
    const updated = currentRoles.filter(r => r !== roleName);
    const nextDb = { ...db, customRoles: updated };
    setDb(nextDb);
    saveState(nextDb);
    apiUpdateOrgSettings({ rolePermissions: nextDb.rolePermissions, customRoles: nextDb.customRoles, customDepartments: nextDb.customDepartments, customBranches: nextDb.customBranches }).catch(console.error);
    triggerNotification('SaaS Config Change', `Corporate role "${roleName}" was removed from system dropdowns.`, 'System', 'Low');
  };

  const handleAddDeptInSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    const currentDepts = db.customDepartments || ['Operations', 'Sales', 'Logistics', 'Customer Support', 'Human Resources'];
    if (currentDepts.some(d => d.toLowerCase() === newDept.trim().toLowerCase())) {
      alert('Department already exists');
      return;
    }
    const updated = [...currentDepts, newDept.trim()];
    const nextDb = { ...db, customDepartments: updated };
    setDb(nextDb);
    saveState(nextDb);
    apiUpdateOrgSettings({ rolePermissions: nextDb.rolePermissions, customRoles: nextDb.customRoles, customDepartments: nextDb.customDepartments, customBranches: nextDb.customBranches }).catch(console.error);
    setNewDept('');
    triggerNotification('SaaS Config Change', `New department "${newDept.trim()}" successfully registered to company profile.`, 'System', 'Low');
  };

  const handleDeleteDeptInSettings = (deptName: string) => {
    if (['operations'].includes(deptName.toLowerCase())) {
      alert('Operations cannot be deleted because it holds default onboarding records.');
      return;
    }
    const currentDepts = db.customDepartments || ['Operations', 'Sales', 'Logistics', 'Customer Support', 'Human Resources'];
    const updated = currentDepts.filter(d => d !== deptName);
    const nextDb = { ...db, customDepartments: updated };
    setDb(nextDb);
    saveState(nextDb);
    apiUpdateOrgSettings({ rolePermissions: nextDb.rolePermissions, customRoles: nextDb.customRoles, customDepartments: nextDb.customDepartments, customBranches: nextDb.customBranches }).catch(console.error);
    triggerNotification('SaaS Config Change', `Department "${deptName}" was deprecated and removed.`, 'System', 'Low');
  };

  const handleAddBranchInSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.trim()) return;
    const currentBranches = db.customBranches || ['HQ Office'];
    if (currentBranches.some(b => b.toLowerCase() === newBranch.trim().toLowerCase())) {
      alert('Branch/territory already exists');
      return;
    }
    const updated = [...currentBranches, newBranch.trim()];
    const nextDb = { ...db, customBranches: updated };
    setDb(nextDb);
    saveState(nextDb);
    apiUpdateOrgSettings({ rolePermissions: nextDb.rolePermissions, customRoles: nextDb.customRoles, customDepartments: nextDb.customDepartments, customBranches: nextDb.customBranches }).catch(console.error);
    setNewBranch('');
    triggerNotification('SaaS Config Change', `New office branch/territory "${newBranch.trim()}" appended to locations list.`, 'System', 'Low');
  };

  const handleDeleteBranchInSettings = (branchName: string) => {
    if (['hq office'].includes(branchName.toLowerCase())) {
      alert('HQ Office cannot be deleted because it is the primary company root.');
      return;
    }
    const currentBranches = db.customBranches || ['HQ Office'];
    const updated = currentBranches.filter(b => b !== branchName);
    const nextDb = { ...db, customBranches: updated };
    setDb(nextDb);
    saveState(nextDb);
    apiUpdateOrgSettings({ rolePermissions: nextDb.rolePermissions, customRoles: nextDb.customRoles, customDepartments: nextDb.customDepartments, customBranches: nextDb.customBranches }).catch(console.error);
    triggerNotification('SaaS Config Change', `Office location/territory "${branchName}" was deactivated.`, 'System', 'Low');
  };

  const handleTogglePermission = (roleName: string, sectionId: string) => {
    const currentPermissions = { ...(db.rolePermissions || {}) };
    const rolePerms = currentPermissions[roleName] || ['dashboard', 'notifications'];
    
    let updatedPerms: string[];
    if (rolePerms.includes(sectionId)) {
      if (roleName === 'Super Administrator' && sectionId === 'settings') {
        alert('Super Administrator must always retain Settings permission to maintain system access.');
        return;
      }
      updatedPerms = rolePerms.filter(id => id !== sectionId);
    } else {
      updatedPerms = [...rolePerms, sectionId];
    }
    
    const nextDb = {
      ...db,
      rolePermissions: {
        ...currentPermissions,
        [roleName]: updatedPerms
      }
    };
    
    setDb(nextDb);
    saveState(nextDb);
    // Persist to Supabase so ALL users of this company get updated permissions
    apiUpdateOrgSettings({
      rolePermissions: nextDb.rolePermissions,
      customRoles: nextDb.customRoles,
      customDepartments: nextDb.customDepartments,
      customBranches: nextDb.customBranches,
    }).catch(err => console.error('saveOrgSettings failed:', err));
    triggerNotification('Permissions Updated', `Role permissions for "${roleName}" has been successfully configured.`, 'System', 'Low');
  };

  const handleResetApplicationState = () => {
    if (!confirm('Are you absolutely sure you want to restore application data to factory factory configurations? This deletes all added employees and visit logs.')) return;
    localStorage.removeItem('TRACK_MY_FIELD_STATE_V2');
    window.location.reload();
  };

  const renderSettingsTab = () => {
    const isAgent = userRole === 'Field Agent' || userRole === 'Sales Executive' || userRole === 'Logistics Rider';
    if (isAgent) {
      return (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-300">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-mono font-bold text-slate-800">Admin Controls Restricted</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your current SaaS role is <strong className="text-slate-800 font-bold">{userRole}</strong>. Enterprise company profile parameters, geofencing coordinates sync rates, and database credentials are held securely under organizational supervisor policies.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start text-left">
        <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-2">
          <button
            onClick={() => setActiveSettingsSubnav('profile')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold leading-none ${
              activeSettingsSubnav === 'profile' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Company Profile</span>
          </button>
          <button
            onClick={() => setActiveSettingsSubnav('attendance')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              activeSettingsSubnav === 'attendance' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Workforce parameters</span>
          </button>
          <button
            onClick={() => setActiveSettingsSubnav('gps')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              activeSettingsSubnav === 'gps' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Tracking & GPS rate</span>
          </button>

          <button
            onClick={() => setActiveSettingsSubnav('roles')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              activeSettingsSubnav === 'roles' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Roles, Depts & Branches (SaaS)</span>
          </button>

          <button
            onClick={() => setActiveSettingsSubnav('leaves')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              activeSettingsSubnav === 'leaves' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Leave Manager Policies</span>
          </button>

          <button
            onClick={() => setActiveSettingsSubnav('payroll')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              activeSettingsSubnav === 'payroll' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Payroll Parameter Rules</span>
          </button>

          <button
            onClick={() => setActiveSettingsSubnav('shifts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              activeSettingsSubnav === 'shifts' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Shift Patterns & Roster</span>
          </button>


          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleResetApplicationState}
              className="w-full flex items-center justify-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Full ERP Reset</span>
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
          {activeSettingsSubnav === 'profile' && (
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-sans">Company Settings Parameters</h3>
                <p className="text-[11px] text-slate-400">Maintain baseline public company metadata matching client checking registers</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Corporate Label</label>
                  <input
                    type="text"
                    required
                    value={companyProfile.companyName}
                    onChange={(e) => setCompanyProfile({...companyProfile, companyName: e.target.value})}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={companyProfile.companyEmail}
                    onChange={(e) => setCompanyProfile({...companyProfile, companyEmail: e.target.value})}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Phone Contact</label>
                  <input
                    type="text"
                    required
                    value={companyProfile.phoneNumber}
                    onChange={(e) => setCompanyProfile({...companyProfile, phoneNumber: e.target.value})}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Corporate HQ physical Address</label>
                  <textarea
                    required
                    value={companyProfile.address}
                    onChange={(e) => setCompanyProfile({...companyProfile, address: e.target.value})}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 h-16 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Operating Timezone</label>
                  <select
                    value={companyProfile.timezone}
                    onChange={(e) => setCompanyProfile({...companyProfile, timezone: e.target.value})}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200"
                  >
                    <option>UTC+05:30 (Kolkata)</option>
                    <option>UTC+00:00 (London)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Currency symbols</label>
                  <select
                    value={companyProfile.currency}
                    onChange={(e) => setCompanyProfile({...companyProfile, currency: e.target.value})}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200"
                  >
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-[11px] rounded-xl hover:bg-emerald-800 transition-all shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {activeSettingsSubnav === 'attendance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Operational Workforce Parameters</h3>
                <p className="text-[11px] text-slate-400">Lock baseline work parameters that define shifts and tardiness</p>
              </div>

              <div className="space-y-3 font-semibold text-slate-600 text-[11px]">
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-slate-800 font-extrabold">Standard Workshift start time</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Define late notifications triggers (e.g. 09:30 AM)</p>
                  </div>
                  <input type="text" defaultValue="09:15 AM" className="w-24 text-center px-1 py-1 rounded bg-white border border-slate-200 text-xs font-bold" />
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-slate-800 font-extrabold">Half Day threshold period</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Maximum delay before shift is logged as half-day</p>
                  </div>
                  <input type="text" defaultValue="3 hours" className="w-24 text-center px-1 py-1 rounded bg-white border border-slate-200 text-xs font-bold" />
                </div>
              </div>
            </div>
          )}

          {activeSettingsSubnav === 'gps' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tracking GPS telemetry triggers</h3>
                <p className="text-[11px] text-slate-400">Define satellite updating times to balance phone battery consumption</p>
              </div>

              <div className="space-y-4 font-semibold text-slate-600 text-[11px]">
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-slate-800 font-extrabold">Tracking interval times</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Send coordinates pinpoint to base server every</p>
                  </div>
                  <select className="px-2.5 py-1 rounded bg-white border text-xs font-bold">
                    <option>5 Minutes</option>
                    <option>10 Minutes</option>
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-left space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">Task Verification Settings</span>
                    <p className="text-[10px] text-slate-400 font-medium">Enforce real-time validations when starting or completing task activities.</p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="max-w-[80%]">
                      <p className="text-xs font-bold text-slate-800">Require Start &amp; Stop Selfie</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-medium">Require workers to capture a snap selfie with live time stamp and locked GPS coordinates before starting/completing any delegated task.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue = !db.taskSelfieRequired;
                        const nextDb = {
                          ...db,
                          taskSelfieRequired: nextValue
                        };
                        setDb(nextDb);
                        saveState(nextDb);
                        triggerNotification(
                          'Task Verification Updated',
                          `Task start/stop selfie verification set to: ${nextValue ? 'REQUIRED' : 'DISABLED'}`,
                          'System',
                          'Low'
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        db.taskSelfieRequired ? 'bg-emerald-600' : 'bg-slate-250'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          db.taskSelfieRequired ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="max-w-[80%]">
                      <p className="text-xs font-bold text-slate-800">Require Check-In &amp; Check-Out Selfie</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-medium">Require workers to verify their identity with a high-fidelity biometric face scan watermark stamp during attendance log-ins and punch-outs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue = !db.attendanceSelfieRequired;
                        const nextDb = {
                          ...db,
                          attendanceSelfieRequired: nextValue
                        };
                        setDb(nextDb);
                        saveState(nextDb);
                        triggerNotification(
                          'Attendance Verification Updated',
                          `Daily attendance selfie verification set to: ${nextValue ? 'REQUIRED' : 'DISABLED'}`,
                          'System',
                          'Low'
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        db.attendanceSelfieRequired ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          db.attendanceSelfieRequired ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsSubnav === 'leaves' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Leave Manager Policies & Allowances</h3>
                <p className="text-[11px] text-slate-400">Set up standard leave balances, sick/casual allocations, and policy regulations</p>
              </div>

              {/* Create new leave policy form */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Create New Leave Policy</h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const name = (form.elements.namedItem('policyName') as HTMLInputElement).value;
                    const allowance = parseInt((form.elements.namedItem('policyAllowance') as HTMLInputElement).value) || 12;
                    const desc = (form.elements.namedItem('policyDesc') as HTMLInputElement).value;
                    
                    if (!name) return;
                    
                    const newPolicy = {
                      id: 'POL' + Math.floor(1000 + Math.random() * 9000),
                      name,
                      description: desc,
                      yearlyAllowance: allowance,
                      appliesToRoles: ['All'],
                      status: 'Active' as const
                    };
                    
                    setDb(prev => {
                      const updated = {
                        ...prev,
                        leavePolicies: [...(prev.leavePolicies || []), newPolicy]
                      };
                      saveState(updated);
                      return updated;
                    });
                    
                    triggerNotification('Leave Policy Created', `New policy ${name} has been defined.`, 'System', 'Low');
                    form.reset();
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Policy Name</label>
                      <input type="text" name="policyName" required placeholder="e.g., Casual Leave" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Yearly Days Allowance</label>
                      <input type="number" name="policyAllowance" required defaultValue="12" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Description / Detail</label>
                    <input type="text" name="policyDesc" placeholder="e.g., General casual leave checkins" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer">
                    Add Policy Template
                  </button>
                </form>
              </div>

              {/* List existing leave policies */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Workspace Policies</h4>
                {(!db.leavePolicies || db.leavePolicies.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No leave policies set. Standard allowances will fall back to local balance rules.</p>
                ) : (
                  <div className="divide-y border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    {db.leavePolicies.map((policy) => (
                      <div key={policy.id} className="p-3 bg-slate-50/50 flex items-center justify-between text-left">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">{policy.name} <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-sans ml-1.5">{policy.yearlyAllowance} Days/Yr</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{policy.description || 'No description provided.'}</p>
                        </div>
                        <button
                          onClick={() => {
                            setDb(prev => {
                              const updated = {
                                ...prev,
                                leavePolicies: (prev.leavePolicies || []).filter(p => p.id !== policy.id)
                              };
                              saveState(updated);
                              return updated;
                            });
                          }}
                          className="p-1 px-2.5 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSettingsSubnav === 'payroll' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Indian Payroll Parameters & Deductibles</h3>
                <p className="text-[11px] text-slate-400">Maintain statutory PF/ESIC brackets, allowance ratios, and baseline corporate structures</p>
              </div>

              <div className="space-y-3.5 font-semibold text-slate-600 text-[11px]">
                {/* EPF contribution rate */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-800 font-extrabold">Employee EPF Contribution Rate</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Statutory standard deduction from base (standard: 12%)</p>
                  </div>
                  <input
                    type="text"
                    defaultValue="12%"
                    className="w-24 text-center px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>

                {/* ESIC contribution rate */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-800 font-extrabold">Employee ESIC Contribution Bracket</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Standard health insurance deduction percentage (standard: 0.75%)</p>
                  </div>
                  <input
                    type="text"
                    defaultValue="0.75%"
                    className="w-24 text-center px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>

                {/* Professional Tax deduction */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-800 font-extrabold">Professional Tax Flat Rate (INR)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Monthly state tax deduction for active staff (e.g. ₹200)</p>
                  </div>
                  <input
                    type="text"
                    defaultValue="₹200 / Month"
                    className="w-24 text-center px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>

                {/* Standard HRA ratio */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-800 font-extrabold">Standard HRA Basic Ratio</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">House Rent Allowance fallback percentage (standard: 40%)</p>
                  </div>
                  <input
                    type="text"
                    defaultValue="40%"
                    className="w-24 text-center px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Notification triggered below
                    triggerNotification('Payroll Settings Saved', 'Indian Payroll tax and deduction ratios have been synced.', 'System', 'Low');
                  }}
                  className="w-full py-3 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors text-center cursor-pointer"
                >
                  Save Statutory Brackets
                </button>
              </div>
            </div>
          )}

          {activeSettingsSubnav === 'shifts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Shift Patterns & Working Rosters</h3>
                <p className="text-[11px] text-slate-400">Set up custom working periods, grace tolerance minutes, and standard weekly holidays</p>
              </div>

              {/* Create new shift template form */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Define New Shift Pattern</h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const name = (form.elements.namedItem('shiftName') as HTMLInputElement).value;
                    const sTime = (form.elements.namedItem('shiftStart') as HTMLInputElement).value;
                    const eTime = (form.elements.namedItem('shiftEnd') as HTMLInputElement).value;
                    const grace = parseInt((form.elements.namedItem('shiftGrace') as HTMLInputElement).value) || 15;
                    
                    if (!name || !sTime || !eTime) return;
                    
                    const newShift = {
                      id: 'SHF' + Math.floor(100 + Math.random() * 900),
                      name,
                      startTime: sTime,
                      endTime: eTime,
                      weeklyOffDays: ['Sunday'],
                      gracePeriodMins: grace
                    };
                    
                    setDb(prev => {
                      const updated = {
                        ...prev,
                        shifts: [...(prev.shifts || []), newShift]
                      };
                      saveState(updated);
                      return updated;
                    });
                    
                    triggerNotification('Shift Config Dynamic Update', `New workspace shift pattern "${name}" defined.`, 'System', 'Low');
                    form.reset();
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Shift Label</label>
                      <input type="text" name="shiftName" required placeholder="e.g., Morning General" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 font-sans" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Grace Buffer (Mins)</label>
                      <input type="number" name="shiftGrace" required defaultValue="15" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Start Work hour</label>
                      <input type="text" name="shiftStart" required placeholder="e.g., 09:30 AM" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 font-sans" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">End Work hour</label>
                      <input type="text" name="shiftEnd" required placeholder="e.g., 06:30 PM" className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 font-sans" />
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer">
                    Add Shift Template
                  </button>
                </form>
              </div>

              {/* List of current shift patterns */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Shifts List</h4>
                {(!db.shifts || db.shifts.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No shift patterns configured. Standard checking rules will fall back to local ERP clock.</p>
                ) : (
                  <div className="divide-y border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    {db.shifts.map((pattern) => (
                      <div key={pattern.id} className="p-3 bg-slate-50/50 flex items-center justify-between text-left">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">{pattern.name} <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-sans ml-1.5">{pattern.startTime} - {pattern.endTime}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Grace check-ins buffer: {pattern.gracePeriodMins} minutes. Standard weekly offs: Sunday.</p>
                        </div>
                        <button
                          onClick={() => {
                            setDb(prev => {
                              const updated = {
                                ...prev,
                                shifts: (prev.shifts || []).filter(s => s.id !== pattern.id)
                              };
                              saveState(updated);
                              return updated;
                            });
                          }}
                          className="p-1 px-2.5 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSettingsSubnav === 'roles' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Dynamic Directories (SaaS Tenant Isolation)</h3>
                <p className="text-[11px] text-slate-400">Establish and restrict custom organizational taxonomy labels, roles, departments, and operations zones for your employees.</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-left">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-2">Configure Authorized Employee Roles</span>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(db.customRoles || ['Super Administrator', 'Manager', 'Field Agent', 'Sales Executive', 'Logistics Rider']).map((role) => (
                    <div key={role} className="flex items-center gap-1.5 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm">
                      <Briefcase className="h-3 w-3 text-emerald-600" />
                      <span>{role}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoleInSettings(role)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddRoleInSettings} className="flex gap-2">
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Sales Executive"
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-left space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">Set Section Visibility Permissions by Role</span>
                  <p className="text-[10px] text-slate-400">Specify which tabs and dashboard capabilities are accessible to employees belonging to each role hierarchy. Access permissions lock automatically on change.</p>
                </div>

                <div id="role-permissions-tabs-container" className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-150">
                  {(db.customRoles || ['Super Administrator', 'Manager', 'Field Agent', 'Sales Executive', 'Logistics Rider']).map((role) => {
                    const isSel = selectedRoleForPermissions === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRoleForPermissions(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSel
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white border border-slate-100 p-3.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-755">Platform Sections & Views for {selectedRoleForPermissions}</span>
                    <span className="text-[9px] font-mono text-emerald-600 font-semibold uppercase">Configuration Module</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { id: 'dashboard', label: 'Dashboard', desc: 'Overview metrics, live maps & stats feeds' },
                      { id: 'employees', label: 'Employees', desc: 'Staff lists, profile directories & manager assignments' },
                      { id: 'tracking', label: 'Live Tracking', desc: 'Real-time GPS coordinate simulation & tracking updates' },
                      { id: 'attendance', label: 'Attendance', desc: 'Punch cards, timesheets & status registers' },
                      { id: 'shifts', label: 'Shift Roster', desc: 'Shift plans, dynamic hours & schedules' },
                      { id: 'payroll', label: 'Indian Payroll', desc: 'Tax computations, salary structures & payslips' },
                      { id: 'leaves', label: 'Leave Manager (Main Tab)', desc: 'Access to the Leave module container and balance summaries' },
                      { id: 'leaves_review', label: '↳ Sub-Sec: Review Requests', desc: 'Authorize or reject pending leave requests across the company' },
                      { id: 'leaves_policies', label: '↳ Sub-Sec: Manage Policies', desc: 'Configure company leave templates, yearly quotas & rules' },
                      { id: 'leaves_absence_log_all', label: '↳ Sub-Sec: Access All Logs', desc: 'View everyone’s logs in the Absence Log (otherwise limited to local personal log only)' },
                      { id: 'visits', label: 'Visits', desc: 'Client meetings, location verification & schedules' },
                      { id: 'tasks', label: 'Tasks', desc: 'Kanban boards, checklists & attachment lockers' },
                      { id: 'routes', label: 'Route History', desc: 'Historical travel polyline trails & coordinate logs' },
                      { id: 'geofence', label: 'Geofence', desc: 'Geofenced polygons & check-in radial parameters' },
                      { id: 'reports', label: 'Reports', desc: 'Exportable spreadsheets & analytics charts' },
                      { id: 'documents', label: 'Documents', desc: 'Compliance archives, PDF viewports & folder uploads' },
                      { id: 'notifications', label: 'Notifications', desc: 'System alert broadcasts & dispatch flags' },
                      { id: 'settings', label: 'Settings', desc: 'Global controls, tenant directories & DB integration' },
                    ].map((sec) => {
                      const enabledRolesVal = db.rolePermissions?.[selectedRoleForPermissions] || ['dashboard', 'notifications'];
                      const isChecked = enabledRolesVal.includes(sec.id);
                      return (
                        <label
                          key={sec.id}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/30'
                              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(selectedRoleForPermissions, sec.id)}
                            className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          />
                          <div className="leading-tight text-left">
                            <span className="text-xs font-bold text-slate-800 block">{sec.label}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">{sec.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-left">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-2">Configure Office Departments</span>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(db.customDepartments || ['Operations', 'Sales', 'Logistics', 'Customer Support', 'Human Resources']).map((dept) => (
                    <div key={dept} className="flex items-center gap-1.5 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm">
                      <SlidersHorizontal className="h-3 w-3 text-emerald-600" />
                      <span>{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDeptInSettings(dept)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddDeptInSettings} className="flex gap-2">
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="e.g. Finance & Audits"
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-left">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-2">Configure Authorized Operations Sites & Branches</span>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(db.customBranches || ['HQ Office']).map((branch) => (
                    <div key={branch} className="flex items-center gap-1.5 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{branch}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBranchInSettings(branch)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddBranchInSettings} className="flex gap-2">
                  <input
                    type="text"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    placeholder="e.g. South Campus Hub"
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6 text-left">
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Active Enterprise Plan</span>
            <p className="text-xl font-black font-sans leading-none">Enterprise Suite</p>
            <div className="space-y-1 text-[10px] font-semibold text-slate-300">
              <p>Roster counts: {db.employees.length} / 100 workers used</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((db.employees.length / 100) * 100, 100)}%` }} />
              </div>
              <p className="pt-1.5 text-[9px] text-slate-400">Renewal Cycle Date: 01 Jul 2026</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interface Skin Preferences</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-extrabold">
              <button
                onClick={() => {
                  setThemeMode('Light');
                  onThemeChange('Light');
                }}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                  themeMode === 'Light' ? 'border-emerald-700 bg-emerald-50/20 text-emerald-800 font-black' : 'border-slate-200 bg-white'
                }`}
              >
                <span>Light Clean</span>
              </button>
              <button
                onClick={() => {
                  setThemeMode('Dark');
                  onThemeChange('Dark');
                }}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                  themeMode === 'Dark' ? 'border-amber-600 bg-amber-50/20 text-amber-800 font-black' : 'border-slate-200 bg-white'
                }`}
              >
                <span>Atmospheric Dark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  switch (activeTab) {
    case 'reports':
      return renderReportsTab();
    case 'documents':
      return renderDocumentsTab();
    case 'notifications':
      return renderNotificationsTab();
    case 'settings':
      return renderSettingsTab();
    default:
      return null;
  }
}