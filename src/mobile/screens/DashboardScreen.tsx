import { useState } from 'react';
import { 
  Users, MapPin, CheckSquare, ChevronRight, 
  Filter, Calendar, Info, Play, Square, 
  ArrowRight, ShieldCheck, HelpCircle, Activity,
  Briefcase, CheckCircle, Clock
} from 'lucide-react';
import { AttendanceState } from '../types';


interface DashboardProps {
  role: string;
  attendance: AttendanceState;
  onPunchIn: () => void;
  onPunchOut: () => void;
  onNavigate: (screen: string) => void;
  workTimeDisplay?: string;
}

export default function DashboardScreen({
  role,
  attendance,
  onPunchIn,
  onPunchOut,
  onNavigate,
  workTimeDisplay
}: DashboardProps) {
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [timeFilter, setTimeFilter] = useState('Today');

  // Dynamic Metrics calculations
  const totalEmployees = INITIAL_EMPLOYEES.length;
  const onlineEmployees = INITIAL_EMPLOYEES.filter(e => e.status === 'Online').length;
  const idleEmployees = INITIAL_EMPLOYEES.filter(e => e.status === 'Idle').length;
  const offlineEmployees = INITIAL_EMPLOYEES.filter(e => e.status === 'Offline').length;
  const onlinePct = totalEmployees > 0 ? ((onlineEmployees / totalEmployees) * 100).toFixed(0) : '0';

  const presentCount = INITIAL_EMPLOYEES.filter(e => e.status === 'Online' || e.status === 'Idle').length;
  const absentCount = INITIAL_EMPLOYEES.filter(e => e.status === 'Offline').length;
  const presentPct = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
  const absentPct = totalEmployees > 0 ? Math.round((absentCount / totalEmployees) * 100) : 0;

  const totalVisits = CLIENT_VISITS.length;
  const completedVisits = CLIENT_VISITS.filter(v => v.status === 'Completed').length;
  const visitsPct = totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(0) : '0';

  const totalTasks = INITIAL_TASKS.length;
  const completedTasksCount = INITIAL_TASKS.filter(t => t.status === 'Completed').length;
  const tasksPct = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const healthScore = totalEmployees > 0 ? presentPct : 100;

  // Sparkline SVG lines
  const sparklineGreen = "M 0 35 Q 15 10 30 25 T 60 8 T 90 22 T 120 12 T 150 22";
  const sparklineBlue = "M 0 30 Q 15 25 30 15 T 60 28 T 90 8 T 120 20 T 150 12";
  const sparklineAmber = "M 0 35 Q 15 32 30 22 T 60 12 T 90 32 T 120 20 T 150 18";
  const sparklinePurple = "M 0 32 Q 15 20 30 28 T 60 35 T 90 12 T 120 28 T 150 15";

  // Recent activity logs lists dynamically synchronized from user punch logs + default updates
  const activities = attendance.logs.slice(0, 3).map((log) => ({
    id: log.id,
    title: log.type,
    name: 'Sourav Gupta',
    time: log.time,
    type: log.type === 'Punch In' || log.type === 'Break In' ? 'in' : 'out',
    color: log.type === 'Punch In' || log.type === 'Break In'
      ? 'bg-[#DCFCE7] text-[#166534] border-[#DCFCE7]'
      : 'bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]'
  }));

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827]" id="dashboard-container">
      {/* Top Greeting Section */}
      <div className="p-4 flex justify-between items-start" id="greeting-section">
        <div>
          <p className="text-xs text-slate-500 font-medium">Good Morning,</p>
          <h2 className="text-xl font-bold font-sans tracking-tight text-[#111827]">Sourav Gupta</h2>
          <span className="inline-block mt-1 bg-[#DBEAFE] text-[#1E40AF] text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {role === 'admin' ? 'Super Admin' : 'Field Agent'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#DCFCE7] px-2.5 py-1 rounded-full text-[10px] text-[#166534] font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
          <span>Cloud Live</span>
        </div>
      </div>

      {/* Punch Status Card */}
      <div className="mx-4 p-4 rounded-2xl bg-[#FFF] border border-[#E5E7EB] flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm" id="punch-status-card">
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Current Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${attendance.isPunchedIn ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
            <span className="font-extrabold text-xs tracking-wider text-[#111827] uppercase">
              {attendance.isPunchedIn ? 'Shift Active' : 'Off Duty'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {attendance.isPunchedIn 
              ? `Punched in at ${attendance.punchInTime || '09:15 AM'}` 
              : 'Punch in to start shift Tracking'}
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <button 
            id="punch-in-btn"
            onClick={onPunchIn}
            disabled={attendance.isPunchedIn}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
              attendance.isPunchedIn 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                : 'bg-[#2563EB] hover:bg-blue-700 text-[#FFF] shadow-md shadow-blue-600/10'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <div className="text-left leading-tight">
              <span>Punch In</span>
            </div>
          </button>

          <button 
            id="punch-out-btn"
            onClick={onPunchOut}
            disabled={!attendance.isPunchedIn}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
              !attendance.isPunchedIn 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                : 'bg-[#EF4444] hover:bg-red-700 text-[#FFF] shadow-md shadow-red-600/10'
            }`}
          >
            <Square className="w-3 h-3 fill-current shrink-0" />
            <div className="text-left leading-tight">
              <span>Punch Out</span>
            </div>
          </button>
        </div>
      </div>

      {/* Overview Section Header */}
      <div className="px-4 pt-6 pb-2 flex justify-between items-center" id="overview-header">
        <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Overview Indicators</h3>
        <div className="flex gap-1.5 text-[10px] font-bold">
          <div className="flex items-center gap-1 bg-[#FFF] border border-[#E5E7EB] px-2 py-1 rounded-lg text-slate-750">
            <Filter className="w-3 h-3 text-[#2563EB]" />
            <span>All Depts</span>
          </div>
          <div className="flex items-center gap-1 bg-[#FFF] border border-[#E5E7EB] px-2 py-1 rounded-lg text-slate-755">
            <Calendar className="w-3 h-3 text-[#2563EB]" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* 2x2 Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4" id="stats-grid-2x2">
        {/* Card 1: Active Employees */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex flex-col justify-between h-[104px] relative group hover:border-[#2563EB]/40 transition-all duration-150 shadow-sm">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase leading-none">Active Team</p>
              <h4 className="text-base font-black mt-1 text-[#111827]">{onlineEmployees} <span className="text-[10.5px] font-normal text-slate-400">/ {totalEmployees}</span></h4>
              <p className="text-[9.5px] text-[#166534] mt-0.5 font-bold leading-none">{onlinePct}% Online</p>
            </div>
            <span className="p-1 px-1.5 rounded-lg bg-[#DBEAFE] text-[#1E40AF]">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-full h-8 overflow-hidden rounded-b-2xl absolute bottom-0 left-0 right-0 py-1">
            <svg className="w-full h-full" viewBox="0 0 150 40" preserveAspectRatio="none">
              <path d={sparklineGreen} fill="none" stroke="#10B981" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Card 2: Live GPS Streams */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex flex-col justify-between h-[104px] relative group hover:border-[#2563EB]/40 transition-all duration-150 shadow-sm">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase leading-none">GPS Streams</p>
              <h4 className="text-base font-black mt-1 text-[#111827]">{onlineEmployees} <span className="text-[10.5px] font-normal text-slate-400">/ {totalEmployees}</span></h4>
              <p className="text-[9.5px] text-[#1E40AF] mt-0.5 font-bold leading-none">{onlinePct}% Streaming</p>
            </div>
            <span className="p-1 px-1.5 rounded-lg bg-[#DBEAFE] text-[#1E40AF]">
              <MapPin className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-full h-8 overflow-hidden rounded-b-2xl absolute bottom-0 left-0 right-0 py-1">
            <svg className="w-full h-full" viewBox="0 0 150 40" preserveAspectRatio="none">
              <path d={sparklineBlue} fill="none" stroke="#2563EB" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Card 3: Client Visits */}
        <div 
          onClick={() => onNavigate('visits')}
          className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex flex-col justify-between h-[104px] relative group hover:border-[#2563EB]/40 transition-all duration-150 shadow-sm"
        >
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase leading-none">Client Visits</p>
              <h4 className="text-base font-black mt-1 text-[#111827]">{completedVisits} <span className="text-[10.5px] font-normal text-slate-400">/ {totalVisits}</span></h4>
              <p className="text-[9.5px] text-[#92400E] mt-0.5 font-bold leading-none">{visitsPct}% Done</p>
            </div>
            <span className="p-1 px-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E]">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-full h-8 overflow-hidden rounded-b-2xl absolute bottom-0 left-0 right-0 py-1">
            <svg className="w-full h-full" viewBox="0 0 150 40" preserveAspectRatio="none">
              <path d={sparklineAmber} fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Card 4: Tasks Completion */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex flex-col justify-between h-[104px] relative group hover:border-[#2563EB]/40 transition-all duration-150 shadow-sm"
        >
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase leading-none">Tasks Exec</p>
              <h4 className="text-base font-black mt-1 text-[#111827]">{completedTasksCount} <span className="text-[10.5px] font-normal text-slate-400">/ {totalTasks}</span></h4>
              <p className="text-[9.5px] text-fuchsia-800 mt-0.5 font-bold leading-none">{tasksPct}% Finished</p>
            </div>
            <span className="p-1 px-1.5 rounded-lg bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-100">
              <CheckSquare className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-full h-8 overflow-hidden rounded-b-2xl absolute bottom-0 left-0 right-0 py-1">
            <svg className="w-full h-full" viewBox="0 0 150 40" preserveAspectRatio="none">
              <path d={sparklinePurple} fill="none" stroke="#A21CAF" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Today's Attendance Radial Card */}
      <div 
        onClick={() => onNavigate('attendance')}
        className="cursor-pointer mx-4 mt-4 p-4 rounded-2xl bg-[#FFF] border border-[#E5E7EB] group hover:border-[#2563EB]/40 transition-all shadow-sm"
        id="today-attendance-gauge-card"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-[10px] tracking-wider uppercase text-slate-500">Attendance Index</h4>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition" />
        </div>

        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Radial Donut SVG Chart */}
          <div className="col-span-5 flex justify-center relative">
            <svg className="w-24 h-24" viewBox="0 0 36 36">
              {/* Thick background ring */}
              <path
                className="text-slate-100"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Present Ring (dynamic) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.5"
                strokeDasharray={`${presentPct} 100`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
              {/* Absent Ring (dynamic) trailing */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#EF4444"
                strokeWidth="3.5"
                strokeDasharray={`${absentPct} 100`}
                strokeDashoffset={-presentPct}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="text-lg font-black leading-none block text-[#111827]">{totalEmployees}</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none block uppercase">Total</span>
            </div>
          </div>

          <div className="col-span-7 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <div className="flex items-center gap-1.55">
                <span className="inline-block w-2 h-2 rounded-full bg-[#2563EB] mr-1.5" />
                <span>Present</span>
              </div>
              <span className="font-extrabold text-[#111827]">{presentCount} ({presentPct}%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <div className="flex items-center gap-1.55">
                <span className="inline-block w-2 h-2 rounded-full bg-[#EF4444] mr-1.5" />
                <span>Absent</span>
              </div>
              <span className="font-extrabold text-[#111827]">{absentCount} ({absentPct}%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <div className="flex items-center gap-1.55">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1.5" />
                <span>On Leave</span>
              </div>
              <span className="font-extrabold text-[#111827]">0 (0%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <div className="flex items-center gap-1.55">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1.5" />
                <span>Pending</span>
              </div>
              <span className="font-extrabold text-[#111827]">0 (0%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Circles Row */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-3" id="metric-circles-row">
        {/* Left Circular Metric */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex flex-col items-center justify-between text-center relative group hover:border-[#2563EB]/45 transition h-[155px]"
        >
          <div className="w-full flex justify-between text-left text-[9px] font-extrabold text-slate-550 uppercase tracking-wider">
            <span>Workload Progress</span>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          
          <div className="relative my-1">
            <svg className="w-16 h-16" viewBox="0 0 36 36">
              <circle
                className="text-slate-100"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                cx="18"
                cy="18"
                r="15.9155"
              />
              <path
                stroke="#701A75"
                strokeWidth="3"
                strokeDasharray={`${tasksPct} 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-xs text-[#111827]">
              {tasksPct}%
            </div>
          </div>

          <div className="w-full flex justify-between items-center mt-1">
            <p className="text-[10px] text-slate-500 font-medium">{completedTasksCount} / {totalTasks} Tasks</p>
            <ChevronRight className="w-3 h-3 text-[#2563EB] transition-all" />
          </div>
        </div>

        {/* Right Circular Metric */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex flex-col items-center justify-between text-center relative group hover:border-[#2563EB]/45 transition h-[155px]">
          <div className="w-full flex justify-between text-left text-[9px] font-extrabold text-slate-550 uppercase tracking-wider">
            <span>Corporate Health</span>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          
          <div className="relative my-1">
            <svg className="w-16 h-16" viewBox="0 0 36 36">
              <circle
                className="text-slate-100"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                cx="18"
                cy="18"
                r="15.9155"
              />
              <path
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray={`${healthScore} 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-xs text-[#111827]">
              {healthScore}%
            </div>
          </div>

          <div className="w-full flex justify-between items-center mt-1">
            <p className="text-[10px] text-[#10B981] font-bold">{healthScore > 80 ? 'Excellent' : healthScore > 50 ? 'Good' : 'Online'}</p>
            <ChevronRight className="w-3 h-3 text-[#2563EB]" />
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="mx-4 mt-6 animate-fade-in" id="recent-activity-section">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-[10px] tracking-wider uppercase text-slate-500">Live Workspace Stream</h4>
          <button 
            onClick={() => onNavigate('attendance')}
            className="text-xs font-bold text-[#2563EB] hover:underline"
          >
            Review Logs
          </button>
        </div>

        <div className="space-y-2">
          {activities.map((act) => (
            <div 
              key={act.id} 
              className="flex justify-between items-center bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${act.color}`}>
                  {act.type === 'in' ? '→' : act.type === 'out' ? '←' : '✓'}
                </span>
                <div>
                  <h5 className="text-xs font-extrabold text-[#111827]">{act.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">{act.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span>{act.time}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  act.type === 'in' ? 'bg-[#10B981]' : act.type === 'out' ? 'bg-[#EF4444]' : 'bg-[#2563EB]'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
