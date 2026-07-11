import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, ChevronLeft, ChevronRight, Users, 
  Clock, CheckCircle2, XCircle, MapPin, ChevronRightSquare, 
  Filter, CalendarPlus
} from 'lucide-react';
import { Shift } from '../types';
import { fetchShifts, getMobileSession } from '../apiBridge';

interface ShiftRosterProps {
  onNavigate: (screen: string) => void;
}

export default function ShiftRosterScreen({ onNavigate }: ShiftRosterProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  useEffect(() => { const s = getMobileSession(); if (s) fetchShifts(s.userId).then(setShifts); }, []);
  const [shiftsList, setShiftsList] = useState<Shift[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'>('All');
  
  // Quick Add Shift dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShiftName, setNewShiftName] = useState('General Shift');
  const [newShiftTime, setNewShiftTime] = useState('09:00 AM – 06:00 PM');
  const [newShiftDuration, setNewShiftDuration] = useState('9h');
  const [newShiftLocation, setNewShiftLocation] = useState('Hyderabad Zone');

  const filteredShifts = shiftsList.filter(sh => {
    if (activeTab === 'All') return true;
    return sh.status === activeTab;
  });

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName) return;

    const newSh: Shift = {
      id: `SH00${shiftsList.length + 1}`,
      name: newShiftName,
      timeRange: newShiftTime,
      duration: newShiftDuration,
      location: newShiftLocation,
      zone: newShiftLocation,
      status: 'Upcoming',
      assignedEmployees: ['You', 'Aarav Reddy'],
      avatarCount: 2,
      overflowCount: 1
    };

    setShiftsList([newSh, ...shiftsList]);
    setShowAddModal(false);
    // Reset forms
    setNewShiftName('General Shift');
  };

  // June 2024 dates for top strip
  const dates = [
    { day: 'Sun', date: 16, active: false },
    { day: 'Mon', date: 17, active: false },
    { day: 'Tue', date: 18, active: false },
    { day: 'Wed', date: 19, active: true },
    { day: 'Thu', date: 20, active: false },
    { day: 'Fri', date: 21, active: false },
    { day: 'Sat', date: 22, active: false }
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="shift-roster-container">
      {/* Page Title & Action Header */}
      <div className="p-4 flex justify-between items-center" id="roster-heading">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Shift Roster</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Manage and assign shifts to field employees</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-[#FFF] font-black text-xs px-2.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs tracking-wide transition cursor-pointer"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Add Shift</span>
        </button>
      </div>

      {/* Week Calendar Strip Card */}
      <div className="mx-4 p-3 bg-[#FFF] border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-xs" id="roster-week-strip">
        <button className="text-slate-400 hover:text-slate-800 p-1 transition cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex justify-between items-center gap-1.5 flex-1 mx-2" id="roster-week-days">
          {dates.map((d, i) => (
            <div 
              key={i} 
              className={`flex-1 p-1.5 rounded-xl flex flex-col items-center justify-center text-center transition ${
                d.active ? 'bg-blue-50 border border-blue-200 text-[#2563EB] font-black' : 'text-slate-500'
              }`}
            >
              <span className="text-[9px] text-slate-400 leading-none mb-1 font-bold">{d.day}</span>
              <span className="text-xs font-black leading-none">{d.date}</span>
              {d.active && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1" />}
            </div>
          ))}
        </div>

        <button className="text-slate-400 hover:text-white p-1 transition cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Shift Overview Metrics Card */}
      <div className="mx-4 mt-3 bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-4 shadow-xs" id="shift-metrics-card">
        <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-450 mb-3 block text-left">Shift Overview</h3>
        <div className="grid grid-cols-4 gap-2 text-center" id="shift-metrics-grid">
          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 mb-1">
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-extrabold leading-tight text-[#111827]">24</p>
            <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">Total</p>
          </div>

          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100 mb-1">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-extrabold leading-tight text-[#111827]">8</p>
            <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">Upcoming</p>
          </div>

          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-extrabold leading-tight text-[#111827]">12</p>
            <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">Completed</p>
          </div>

          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-red-50 text-[#EF4444] border border-red-100 mb-1">
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-extrabold leading-tight text-[#111827]">4</p>
            <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs scrollable list */}
      <div className="px-4 mt-4 overflow-x-auto flex gap-4 border-b border-[#E5E7EB] scrollbar-none" id="roster-filters">
        {(['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'] as const).map((tab) => {
          const isActive = (tab === 'All' && activeTab === 'All') || activeTab === tab;
          return (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 font-bold text-xs tracking-wide whitespace-nowrap transition-all border-b-2 leading-none relative cursor-pointer ${
                isActive 
                  ? 'text-[#2563EB] border-[#2563EB]' 
                  : 'text-slate-400 border-transparent hover:text-slate-800'
              }`}
            >
              {tab === 'All' ? 'All Shifts' : tab}
            </button>
          );
        })}
      </div>

      {/* Roster list block */}
      <div className="px-4 mt-3.5 space-y-3" id="roster-cards-list">
        {filteredShifts.map((sh) => {
          let leftColor = 'border-l-[#10B981]';
          let statusBadge = '';
          let badgeStyle = '';

          if (sh.status === 'Upcoming') {
            leftColor = 'border-l-[#2563EB]';
            statusBadge = 'Upcoming';
            badgeStyle = 'bg-blue-50 text-[#2563EB] border-blue-105';
          } else if (sh.status === 'Ongoing') {
            leftColor = 'border-l-sky-500';
            statusBadge = 'Ongoing';
            badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';
          } else if (sh.status === 'Completed') {
            leftColor = 'border-l-amber-500';
            statusBadge = 'Completed';
            badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';
          } else if (sh.status === 'Cancelled') {
            leftColor = 'border-l-[#EF4444]';
            statusBadge = 'Cancelled';
            badgeStyle = 'bg-red-50 text-[#EF4444] border-red-100';
          }

          return (
            <div 
              key={sh.id} 
              className={`bg-[#FFF] border border-[#E5E7EB] border-l-4 ${leftColor} rounded-2xl p-3.5 flex flex-col transition hover:border-[#2563EB]/40 shadow-xs`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-extrabold text-[#111827] text-xs1 leading-tight">{sh.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sh.timeRange}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-slate-500 font-extrabold">{sh.duration}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 border rounded-full ${badgeStyle}`}>
                  {statusBadge}
                </span>
              </div>

              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sh.location}</span>
                </div>

                {/* Overlapping employee stack */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  <span className="text-slate-600">{sh.overflowCount + sh.avatarCount} Staff Assured</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredShifts.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 bg-[#FFF] rounded-2xl border border-dashed border-slate-200">
            No shifts listed under this category.
          </div>
        )}
      </div>

      {/* Today's Shift Summary Footer */}
      <div className="mx-4 mt-6 bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-4 shadow-xs mb-6" id="roster-daily-summary">
        <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-450 mb-3 text-left">Shift Summary Details</h4>
        <div className="grid grid-cols-4 gap-2 text-center" id="daily-summary-grid">
          <div className="border-r border-slate-100 last:border-0 pr-1 text-center">
            <span className="text-emerald-600 block justify-center text-center">
              <Calendar className="w-4 h-4 mx-auto text-emerald-580 animate-pulse" />
            </span>
            <p className="text-base font-black leading-tight text-[#111827] mt-1">8</p>
            <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none mt-0.5">Shifts</p>
          </div>

          <div className="border-r border-slate-100 last:border-0 pr-1 text-center">
            <span className="text-[#2563EB] block justify-center text-center">
              <Users className="w-4 h-4 mx-auto text-[#2563EB]" />
            </span>
            <p className="text-base font-black leading-tight text-[#111827] mt-1">48</p>
            <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none mt-0.5">Assigned</p>
          </div>

          <div className="border-r border-slate-100 last:border-0 pr-1 text-center">
            <span className="text-amber-550 block justify-center text-center">
              <Clock className="w-4 h-4 mx-auto text-amber-500" />
            </span>
            <p className="text-base font-black leading-tight text-[#111827] mt-1">3</p>
            <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none mt-0.5">Ongoing</p>
          </div>

          <div className="pr-1 text-center">
            <span className="text-emerald-600 block justify-center text-center">
              <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600" />
            </span>
            <p className="text-base font-black leading-tight text-[#111827] mt-1">5</p>
            <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none mt-0.5">Done</p>
          </div>
        </div>
      </div>

      {/* Add Shift Modal/Dialog wizard */}
      {showAddModal && (
        <div className="absolute inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in font-sans text-left">
            <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex justify-between items-center">
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-600">Assign New Shift</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-550 hover:text-slate-900 text-[9px] font-black px-2 py-1 bg-[#FFF] rounded-lg border border-slate-205 cursor-pointer"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleAddShift} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Shift Template</label>
                <select 
                  value={newShiftName}
                  onChange={(e) => {
                    setNewShiftName(e.target.value);
                    if (e.target.value === 'General Shift') {
                      setNewShiftTime('09:00 AM – 06:00 PM');
                      setNewShiftDuration('9h');
                      setNewShiftLocation('Hyderabad Zone');
                    } else if (e.target.value === 'Morning Shift') {
                      setNewShiftTime('06:00 AM – 02:00 PM');
                      setNewShiftDuration('8h');
                      setNewShiftLocation('Secunderabad Zone');
                    } else if (e.target.value === 'Evening Shift') {
                      setNewShiftTime('02:00 PM – 10:00 PM');
                      setNewShiftDuration('8h');
                      setNewShiftLocation('Hitech City Zone');
                    } else {
                      setNewShiftTime('10:00 PM – 06:00 AM');
                      setNewShiftDuration('8h');
                      setNewShiftLocation('Uppal Zone');
                    }
                  }}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-slate-800 cursor-pointer"
                >
                  <option value="General Shift">General Shift (09:00 AM - 06:00 PM)</option>
                  <option value="Morning Shift">Morning Shift (06:00 AM - 02:00 PM)</option>
                  <option value="Evening Shift">Evening Shift (02:00 PM - 10:00 PM)</option>
                  <option value="Night Shift">Night Shift (10:00 PM - 06:00 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Duration Hour</label>
                <input 
                  type="text"
                  value={newShiftDuration}
                  onChange={(e) => setNewShiftDuration(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Zone Assignment</label>
                <input 
                  type="text"
                  value={newShiftLocation}
                  onChange={(e) => setNewShiftLocation(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-205 text-slate-750 font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#2563EB] hover:bg-blue-705 text-white font-bold text-xs py-2 rounded-lg shadow-xs transition cursor-pointer2"
                >
                  Save Shift Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
