import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, ChevronRight, Briefcase, Clock, 
  ArrowLeft, CheckCircle2, AlertCircle, XCircle, Info,
  Smartphone, Mail, UploadCloud, CalendarDays, CheckSquare,
  Square
} from 'lucide-react';
import { LeaveBalance, LeaveRequest } from '../types';
import { fetchLeaveBalance, fetchLeaveHistory, pushLeaveRequest, getMobileSession } from '../apiBridge';

export default function LeaveManagerScreen() {
  useEffect(() => { const s = getMobileSession(); if (s) { fetchLeaveBalance(s.userId).then(setLeaveBalances); fetchLeaveHistory(s.userId).then(setLeaveHistory); } }, []);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([
    { type: 'Casual Leave (CL)', code: 'CL', left: 12, total: 12 },
    { type: 'Sick Leave (SL)',   code: 'SL', left: 8,  total: 8  },
    { type: 'Earned Leave (EL)', code: 'EL', left: 18, total: 18 },
    { type: 'Comp Off (CO)',     code: 'CO', left: 6,  total: 6  },
  ]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  useEffect(() => {
    const s = getMobileSession();
    if (s) {
      fetchLeaveBalance(s.userId).then(setLeaveBalances);
      fetchLeaveHistory(s.userId).then(setLeaveHistory);
    }
  }, []);

  const [showForm, setShowForm] = useState(false);
  
  // STATE
  const [balances, setBalances] = useState<LeaveBalance[]>([
    { type: 'Casual Leave (CL)', code: 'CL', left: 12, total: 12 },
    { type: 'Sick Leave (SL)',   code: 'SL', left: 8,  total: 8  },
    { type: 'Earned Leave (EL)', code: 'EL', left: 18, total: 18 },
    { type: 'Comp Off (CO)',     code: 'CO', left: 6,  total: 6  },
  ]);
  const [history, setHistory] = useState<LeaveRequest[]>([]);

  // FORM INPUTS
  const [leaveType, setLeaveType] = useState<string>('Casual Leave (CL)');
  const [startDate, setStartDate] = useState('2024-06-20');
  const [endDate, setEndDate] = useState('2024-06-22');
  const [durationDays, setDurationDays] = useState(3);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('sourav.gupta@trackhive.com');
  const [charCount, setCharCount] = useState(0);

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    const daysCount = calculateDays(val, endDate);
    setDurationDays(daysCount);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    const daysCount = calculateDays(startDate, val);
    setDurationDays(daysCount);
  };

  const handleReasonChange = (val: string) => {
    if (val.length <= 200) {
      setReason(val);
      setCharCount(val.length);
    }
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    // Formatting June dates for view
    const opt: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedStart = new Date(startDate).toLocaleDateString('en-GB', opt);
    const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', opt);

    const newRequest: LeaveRequest = {
      id: `LR00${history.length + 1}`,
      leaveType: leaveType as any,
      startDate: formattedStart,
      endDate: formattedEnd,
      duration: isHalfDay ? '0.5 Day' : `${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}`,
      status: 'Pending',
      reason: reason,
      phone: phone,
      email: email
    };

    setHistory([newRequest, ...history]);
    
    // Deduct leave balance code appropriately
    let typeCode: 'CL' | 'SL' | 'EL' | 'CO' = 'CL';
    if (leaveType.includes('SL')) typeCode = 'SL';
    if (leaveType.includes('EL')) typeCode = 'EL';
    if (leaveType.includes('CO')) typeCode = 'CO';

    setBalances(balances.map(b => {
      if (b.code === typeCode) {
        return {
          ...b,
          left: Math.max(0, b.left - (isHalfDay ? 0.5 : durationDays))
        };
      }
      return b;
    }));

    // Reset Form
    setReason('');
    setCharCount(0);
    setShowForm(false);
  };

  // If form is active, show the Apply Leave sub-screen directly inside the emulator frame!
  if (showForm) {
    return (
      <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="leave-form-container">
        {/* Custom Header with back button */}
        <div className="p-4 flex items-center gap-3 bg-slate-50 border-b border-[#E5E7EB]">
          <button 
            id="back-to-leaves"
            onClick={() => setShowForm(false)}
            className="text-slate-500 hover:text-slate-900 transition mr-1 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-black tracking-tight text-[#111827]">Apply Leave Request</h2>
        </div>

        <form onSubmit={handleSubmitLeave} className="p-4 space-y-4 text-left">
          {/* Leave Type Selector horizontal row */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Leave Category</label>
            <p className="text-[10px] text-slate-400 mb-2">Select the type of leave you want to allocate</p>
            
            <div className="grid grid-cols-4 gap-2" id="leave-type-selector">
              {[
                { label: 'Casual Leave', code: 'CL', value: 'Casual Leave (CL)', color: 'border-[#2563EB] bg-blue-50/40 text-[#2563EB]', dot: 'bg-emerald-500' },
                { label: 'Sick Leave', code: 'SL', value: 'Sick Leave (SL)', color: 'border-sky-400 bg-sky-50 text-sky-800', dot: 'bg-sky-500' },
                { label: 'Earned Leave', code: 'EL', value: 'Earned Leave (EL)', color: 'border-indigo-400 bg-indigo-50 text-indigo-800', dot: 'bg-indigo-600' },
                { label: 'Comp Off', code: 'CO', value: 'Comp Off (CO)', color: 'border-amber-400 bg-amber-50 text-amber-800', dot: 'bg-amber-500' }
              ].map((item, idx) => {
                const isSelected = leaveType === item.value;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLeaveType(item.value)}
                    className={`p-2 rounded-xl border text-center flex flex-col justify-between items-center h-[90px] transition duration-150 cursor-pointer ${
                      isSelected 
                        ? 'border-2 border-[#2563EB] bg-blue-50/40 text-[#2563EB] shadow-xs' 
                        : 'border-[#E5E7EB] bg-[#FFF] text-slate-400'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#2563EB] animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[9px] font-bold tracking-tight mt-1 truncate w-full">{item.label}</span>
                    <span className="text-[10px] font-bold opacity-80">{item.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leave Durations - Start date and End date side-by-side */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Leave Duration</label>
            <p className="text-[10px] text-slate-400 mb-2">Select start and end date of your leave</p>
            
            <div className="grid grid-cols-2 gap-3" id="leave-dates">
              <div>
                <label className="block text-[9px] text-slate-455 font-bold uppercase tracking-wider mb-1">Start Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg py-1.5 pl-8 pr-2 text-[10.5px] font-bold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-slate-455 font-bold uppercase tracking-wider mb-1">End Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg py-1.5 pl-8 pr-2 text-[10.5px] font-bold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            {/* Total Duration read-only badge */}
            <div className="flex justify-between items-center bg-[#FFF]/80 border border-[#E5E7EB] rounded-lg p-2.5 mt-3 text-xs shadow-xs" id="duration-badge">
              <div>
                <span className="text-slate-400 font-bold">Total Duration:</span>
                <span className="font-extrabold text-[#2563EB] ml-1.5">{isHalfDay ? '0.5 Day' : `${durationDays} Days`}</span>
              </div>
              
              {/* Half Day Checkbox */}
              <button
                type="button"
                onClick={() => setIsHalfDay(!isHalfDay)}
                className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#111827] cursor-pointer"
              >
                {isHalfDay ? (
                  <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Half Day</span>
                <Info className="w-3 h-3 text-slate-400 animate-pulse" />
              </button>
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Reason for Leave</label>
            <div className="relative">
              <textarea
                placeholder="Explain reason for leave..."
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                rows={3}
                className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827] placeholder-slate-400 resize-none font-medium"
              />
              <span className="absolute bottom-2.5 right-3 text-[9px] font-bold text-slate-400 leading-none">
                {charCount}/200
              </span>
            </div>
          </div>

          {/* Contacts optional box */}
          <div>
            <label className="block text-slate-505 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">Contact During Leave (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-405">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg py-1.5 pl-8 pr-2 text-[10px] font-bold text-[#111827] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-405">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg py-1.5 pl-8 pr-2 text-[10px] font-bold text-[#111827] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attachment upload zone */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Attachment (Optional)</label>
            <div className="border border-dashed border-slate-200 hover:border-[#2563EB]/45 rounded-xl p-4 text-center cursor-pointer bg-slate-50 flex flex-col items-center">
              <UploadCloud className="w-7 h-7 text-[#2563EB] mb-1" />
              <p className="text-xs font-bold text-slate-700">Upload medical cert or slip</p>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold">PDF, JPG, PNG (Max 5MB)</p>
            </div>
          </div>

          {/* blue important note badge */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 flex gap-2">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <h5 className="text-[10px] font-black text-[#1E40AF] uppercase tracking-wider mb-1">Important Details</h5>
              <ul className="list-disc pl-3 text-[9px] text-[#4B5563] space-y-1 leading-normal font-bold">
                <li>Your leave claim will be sent to the Super Admin for authorization workflow.</li>
                <li>Live status indicators update upon review response.</li>
              </ul>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-xs transition-all text-xs border border-blue-100 cursor-pointer"
            >
              Submit Leave Request
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="w-full text-center text-slate-400 hover:text-slate-600 font-bold text-xs mt-3 block cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="leave-manager-dashboard">
      {/* Leave Header */}
      <div className="p-4 flex justify-between items-center" id="leave-dashboard-heading">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Leave Manager</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Manage details and request approvals</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* Grid of Balances 2x2 */}
      <div className="px-4" id="leave-balances-grid-heading">
        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-2.5">Yearly Leave Balances</h4>
        
        <div className="grid grid-cols-2 gap-3" id="balances-grid">
          {balances.map((b, idx) => {
            const ratio = (b.left / b.total) * 100;
            let barColor = 'bg-[#10B981]';
            let iconBg = 'bg-[#DCFCE7] text-[#166534]';

            if (b.code === 'SL') {
              barColor = 'bg-[#2563EB]';
              iconBg = 'bg-blue-50 text-[#2563EB]';
            } else if (b.code === 'EL') {
              barColor = 'bg-indigo-600';
              iconBg = 'bg-indigo-50 text-indigo-700';
            } else if (b.code === 'CO') {
              barColor = 'bg-amber-500';
              iconBg = 'bg-amber-50 text-amber-800';
            }

            return (
              <div 
                key={idx} 
                className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3.5 flex flex-col justify-between h-[115px] shadow-xs"
              >
                <div className="flex justify-between items-start text-xs">
                  <span className="font-extrabold text-[10px] text-slate-500 tracking-tight leading-none truncate max-w-[100px]">{b.type}</span>
                  <span className={`p-1 rounded-lg ${iconBg}`}>
                    <CalendarDays className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="my-1.5">
                  <span className="text-2xl font-black text-[#111827] leading-none">{b.left}</span>
                  <span className="text-[9px] text-slate-400 ml-1 font-bold block mt-1 uppercase tracking-wide">Days Unused</span>
                </div>

                <div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div style={{ width: `${ratio}%` }} className={`h-full ${barColor}`} />
                  </div>
                  <div className="flex justify-between text-[8.5px] font-bold text-slate-400 mt-1.5 leading-none">
                    <span>{ratio.toFixed(0)}% Left</span>
                    <span>{b.left} / {b.total} Days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History section list */}
      <div className="mx-4 mt-6" id="leave-history-section">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Application Requests History</h4>
          <span className="text-[10px] font-bold text-[#2563EB] cursor-pointer">View All</span>
        </div>

        <div className="space-y-2.5">
          {history.map((item) => {
            let statusBadge = '';
            if (item.status === 'Approved') {
              statusBadge = 'bg-[#DCFCE7] text-[#166534] border border-[#DCFCE7]';
            } else if (item.status === 'Rejected') {
              statusBadge = 'bg-red-50 text-red-700 border border-red-100';
            } else {
              statusBadge = 'bg-[#FEF3C7] text-[#92400E] border border-[#FEF3C7]';
            }

            // Splitting startDate "20 Jun 2024" -> "20", "JUN"
            const parts = item.startDate.split(' ');
            const day = parts[0] || '20';
            const month = (parts[1] || 'JUN').toUpperCase();

            return (
              <div 
                key={item.id}
                className="bg-[#FFF] border border-[#E5E7EB] hover:border-[#2563EB]/40 rounded-2xl p-3.5 flex justify-between items-center transition shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  {/* Visual Date block */}
                  <div className="w-10 h-11 rounded-xl bg-slate-50 border border-slate-150 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-xs font-black text-[#111827] leading-none mb-0.5">{day}</span>
                    <span className="text-[8px] font-black text-[#2563EB] leading-none">{month}</span>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-[#111827]">{item.leaveType.split(' ')[0]} Leave</h5>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{item.startDate} ({item.duration})</p>
                    <p className="text-[9px] text-[#4B5563] mt-1 truncate max-w-[170px] font-bold italic">"{item.reason}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${statusBadge}`}>
                    {item.status}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
