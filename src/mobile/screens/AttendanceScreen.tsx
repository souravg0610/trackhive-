import { useState } from 'react';
import { 
  ArrowLeft, Bell, MoreVertical, LogIn, LogOut, 
  Users, UserX, Clock, Calendar, ChevronLeft, ChevronRight, 
  MapPin, Smartphone, Coffee, ChevronDown, ChevronUp,
  FileCheck2, Briefcase, ClipboardCheck, BarChart3, Info
} from 'lucide-react';
import { AttendanceState, AttendanceLog } from '../types';

interface AttendanceProps {
  attendance: AttendanceState;
  onPunchIn: () => void;
  onPunchOut: () => void;
  onNavigate: (screen: string) => void;
}

export default function AttendanceScreen({
  attendance,
  onPunchIn,
  onPunchOut,
  onNavigate
}: AttendanceProps) {
  const [expandedLog, setExpandedLog] = useState(false);

  // June 2024 calendar dates
  const days = [
    { dayName: 'Sun', dateNum: 16, status: 'off' },
    { dayName: 'Mon', dateNum: 17, status: 'present' },
    { dayName: 'Tue', dateNum: 18, status: 'present' },
    { dayName: 'Wed', dateNum: 19, status: 'absent' },
    { dayName: 'Thu', dateNum: 20, status: 'today' },
    { dayName: 'Fri', dateNum: 21, status: 'present' },
    { dayName: 'Sat', dateNum: 22, status: 'off' }
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827]" id="attendance-container">
      {/* Sub Header Segment */}
      <div className="p-4 flex justify-between items-start" id="attendance-welcome-bar">
        <div>
          <p className="text-xs text-slate-500 font-medium">Good Morning,</p>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Sourav Gupta</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-bold">Super Administrator</p>
        </div>
        <div className="bg-[#DCFCE7] text-[#166534] duration-150 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse" />
          <span>Cloud Engaged</span>
        </div>
      </div>

      {/* Taller Punch Action Panel */}
      <div className="grid grid-cols-2 gap-3 px-4" id="attendance-actions">
        <button 
          onClick={onPunchIn}
          disabled={attendance.isPunchedIn}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-150 ${
            attendance.isPunchedIn 
              ? 'bg-[#F3F4F6] border-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-50 border-blue-200 text-[#2563EB] hover:bg-blue-100 shadow-xs'
          }`}
        >
          <LogIn className="w-5 h-5 mb-1 text-[#2563EB]" />
          <span className="font-extrabold text-xs">Punch In</span>
          <span className="text-[10px] text-slate-550 mt-1">Last: {attendance.punchInTime || '09:15 AM'}</span>
        </button>

        <button 
          onClick={onPunchOut}
          disabled={!attendance.isPunchedIn}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-150 ${
            !attendance.isPunchedIn 
              ? 'bg-[#F3F4F6] border-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-red-50 border border-red-200 text-[#EF4444] hover:bg-rose-100 shadow-xs'
          }`}
        >
          <LogOut className="w-5 h-5 mb-1 text-[#EF4444]" />
          <span className="font-extrabold text-xs">Punch Out</span>
          <span className="text-[10px] text-slate-550 mt-1">Last: 06:45 PM</span>
        </button>
      </div>

      {/* Attendance Horizontal Summary Cards */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-4" id="attendance-stat-cards">
        {/* Present card */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-2.5 flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase tracking-wider font-bold">Present</span>
            <Users className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div>
            <h5 className="text-base font-black text-[#2563EB] leading-none">87</h5>
            <p className="text-[9px] text-[#4B5563] mt-1 leading-none">98.9% of 88</p>
          </div>
          <div className="w-full h-3">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 8 Q25 2 50 8 T100 2" fill="none" stroke="#2563EB" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Absent card */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-2.5 flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase tracking-wider font-bold">Absent</span>
            <UserX className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div>
            <h5 className="text-base font-black text-[#EF4444] leading-none">1</h5>
            <p className="text-[9px] text-[#4B5563] mt-1 leading-none">1.1% of 88</p>
          </div>
          <div className="w-full h-3">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 3 Q25 8 50 3 T100 8" fill="none" stroke="#EF4444" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* On Leave Card */}
        <div 
          onClick={() => onNavigate('leaves')}
          className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-2.5 flex flex-col justify-between h-[105px]"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase tracking-wider font-bold">On Leave</span>
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div>
            <h5 className="text-base font-black text-[#F59E0B] leading-none">0</h5>
            <p className="text-[9px] text-[#4B5563] mt-1 leading-none">0% of 88</p>
          </div>
          <div className="w-full h-3">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q25 5 50 5 T100 5" fill="none" stroke="#FFC107" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Calendar Strip Panel */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-[#FFF] border border-[#E5E7EB]" id="attendance-calendar-strip">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <span className="font-bold text-sm text-[#111827]">June 2024</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <button className="bg-slate-50 hover:bg-slate-100 font-bold text-[10px] text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition">
            Today
          </button>
        </div>

        {/* Week Columns */}
        <div className="grid grid-cols-7 gap-1 text-center" id="calendar-days-columns">
          {days.map((d, index) => {
            const isToday = d.status === 'today';
            let dotColor = 'bg-slate-205';
            let textColor = 'text-slate-600';

            if (d.status === 'present') {
              dotColor = 'bg-[#2563EB]';
              textColor = 'text-slate-900 font-bold';
            } else if (d.status === 'absent') {
              dotColor = 'bg-red-500';
              textColor = 'text-red-500 font-bold';
            } else if (d.status === 'off') {
              dotColor = 'bg-slate-300';
              textColor = 'text-slate-400';
            } else if (isToday) {
              dotColor = 'bg-[#2563EB]';
              textColor = 'text-[#2563EB] font-bold';
            }

            return (
              <div 
                key={index} 
                className={`p-1.5 rounded-xl flex flex-col justify-between items-center h-[65px] transition-all duration-150 ${
                  isToday 
                    ? 'border-2 border-[#2563EB] bg-blue-50/40 shadow-xs' 
                    : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-bold leading-none">{d.dayName}</span>
                <span className={`text-xs mt-1 leading-none ${textColor}`}>{d.dateNum}</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${dotColor}`} />
              </div>
            );
          })}
        </div>

        {/* Legend Row */}
        <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-4 px-1" id="calendar-legend">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Rest Day</span>
          </div>
        </div>
      </div>

      {/* Today's Punch Log Table */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-[#FFF] border border-[#E5E7EB]" id="punch-log-panel">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-[10px] tracking-wider uppercase text-slate-500">Punch Activity Logs</h4>
          <span className="text-[9.5px] text-slate-600 flex items-center gap-1 font-bold bg-slate-50 px-20 py-1.5 rounded-lg border border-slate-100">
            <Calendar className="w-3 h-3 text-[#2563EB]" />
            20 June 2024
          </span>
        </div>

        {/* Table Grid */}
        <div className="overflow-x-auto text-[11px] text-slate-655" id="punch-grid">
          <div className="grid grid-cols-12 gap-1 uppercase tracking-wider text-[9px] text-slate-500 font-extrabold pb-2.5 border-b border-slate-100">
            <div className="col-span-3">Action</div>
            <div className="col-span-3">Logged</div>
            <div className="col-span-4">Terminal GPS</div>
            <div className="col-span-2 text-right">Source</div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
            {attendance.logs.map((log) => {
              const isPunchIn = log.type === 'Punch In';
              const isPunchOut = log.type === 'Punch Out';
              const isBreakIn = log.type === 'Break In';
              const isBreakOut = log.type === 'Break Out';

              let badgeColor = 'text-[#2563EB]';
              let Icon = LogIn;

              if (isPunchOut) {
                badgeColor = 'text-[#EF4444]';
                Icon = LogOut;
              } else if (isBreakIn) {
                badgeColor = 'text-sky-600';
                Icon = Coffee;
              } else if (isBreakOut) {
                badgeColor = 'text-amber-600';
                Icon = Coffee;
              }

              return (
                <div key={log.id} className="grid grid-cols-12 gap-1 py-3 items-center hover:bg-slate-50/50 px-0.5 rounded-lg">
                  <div className={`col-span-3 font-bold flex items-center gap-1 ${badgeColor}`}>
                    <Icon className="w-3 h-3 shrink-0" />
                    <span>{log.type}</span>
                  </div>
                  <div className="col-span-3 font-semibold text-slate-800">{log.time}</div>
                  <div className="col-span-4 flex items-center gap-1 text-[10px] text-slate-500 pr-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{log.location}</span>
                  </div>
                  <div className="col-span-2 flex justify-end text-slate-400">
                    <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View All toggler */}
        <button 
          id="toggle-past-log"
          onClick={() => setExpandedLog(!expandedLog)}
          className="mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-bold text-center text-[#2563EB] pt-2 border-t border-slate-100 hover:underline"
        >
          <span>{expandedLog ? 'Collapse History' : 'View Full History'}</span>
          {expandedLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expandedLog && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100 text-slate-500" id="extended-history-log">
            <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest">Past 3 Days</p>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-705">
              <span>19 Jun 2024</span>
              <span className="text-[#EF4444] font-medium bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">1 Absent</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-705">
              <span>18 Jun 2024</span>
              <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">9.5 Hrs Present (09:00 - 18:30)</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-705">
              <span>17 Jun 2024</span>
              <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">9.2 Hrs Present (09:12 - 18:24)</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links Row Grid */}
      <div className="mx-4 mt-4 animate-fade-in" id="quick-links-panel">
        <h4 className="font-bold text-[10px] tracking-wider uppercase text-slate-500 mb-2.5">Reference Tools</h4>
        <div className="grid grid-cols-2 gap-3" id="quick-links-tiles-row">
          <div 
            onClick={() => onNavigate('attendance')}
            className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex justify-between items-center hover:border-[#2563EB]/40 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 text-[#2563EB] rounded-xl border border-blue-100">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">My Attendance</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition-all" />
          </div>

          <div 
            onClick={() => onNavigate('leaves')}
            className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex justify-between items-center hover:border-[#2563EB]/40 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-50 text-[#F59E0B] rounded-xl border border-amber-100">
                <Briefcase className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">My Leave</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition-all" />
          </div>

          <div 
            onClick={() => onNavigate('tasks')}
            className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex justify-between items-center hover:border-[#2563EB]/40 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-[#F5F3FF] text-indigo-600 rounded-xl border border-indigo-100">
                <ClipboardCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">My Tasks</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition-all" />
          </div>

          <div 
            onClick={() => onNavigate('payroll')}
            className="cursor-pointer bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex justify-between items-center hover:border-[#2563EB]/40 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">My Payroll</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}
