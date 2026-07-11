import { useState, useEffect } from 'react';
import { 
  Search, Calendar, Sliders, MapPin, MoreVertical, 
  Building2, ChevronRight, CheckCircle2, Clock, BarChart3,
  CheckCircle, Plus
} from 'lucide-react';
import { ClientVisit } from '../types';
import { fetchVisits, pushVisitStatusUpdate, getMobileSession } from '../apiBridge';

export default function ClientVisitsScreen() {
  useEffect(() => { const s = getMobileSession(); if (s) fetchVisits(s.userId).then(setVisits); }, []);
  const [visits, setVisits] = useState<ClientVisit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Completed' | 'Pending'>('All');

  // Calculates stats dynamically based on state
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const pendingCount = visits.filter(v => v.status === 'Pending').length;
  const totalCount = visits.length;

  const handleToggleStatus = (id: string) => {
    setVisits(visits.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: v.status === 'Completed' ? 'Pending' : 'Completed'
        };
      }
      return v;
    }));
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'All') return matchesSearch;
    return matchesSearch && v.status === activeFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="client-visits-container">
      {/* Title block */}
      <div className="p-4 flex justify-between items-start" id="visits-heading">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">Client Visits</h2>
            <span className="bg-[#DBEAFE] text-[#1E40AF] text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
              Live Tracker
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Track and manage client meetings in real-time</p>
        </div>
      </div>

      {/* Summary metric horizontal row */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4" id="visits-metrics-strip">
        {/* Completed */}
        <button 
          onClick={() => setActiveFilter(activeFilter === 'Completed' ? 'All' : 'Completed')}
          className={`p-2.5 rounded-2xl border flex flex-col justify-between h-[96px] text-left transition-all ${
            activeFilter === 'Completed' 
              ? 'bg-[#DCFCE7] border-[#166534] shadow-sm' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 w-full mb-1">
            <span className="text-[8.5px] uppercase tracking-wider font-extrabold">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
          </div>
          <div>
            <h5 className="text-lg font-black text-[#166534] leading-none">{completedCount}</h5>
            <p className="text-[9px] text-slate-400 mt-1 font-bold leading-none">This Month</p>
          </div>
          <div className="w-full h-2">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 6 Q25 1 50 6 T100 2" fill="none" stroke="#166534" strokeWidth="1" />
            </svg>
          </div>
        </button>

        {/* Pending */}
        <button 
          onClick={() => setActiveFilter(activeFilter === 'Pending' ? 'All' : 'Pending')}
          className={`p-2.5 rounded-2xl border flex flex-col justify-between h-[96px] text-left transition-all ${
            activeFilter === 'Pending' 
              ? 'bg-[#FEF3C7] border-[#92400E] shadow-sm' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 w-full mb-1">
            <span className="text-[8.5px] uppercase tracking-wider font-bold">Pending</span>
            <Clock className="w-3.5 h-3.5 text-[#92400E]" />
          </div>
          <div>
            <h5 className="text-lg font-black text-[#92400E] leading-none">{pendingCount}</h5>
            <p className="text-[9px] text-slate-400 mt-1 font-bold leading-none">This Month</p>
          </div>
          <div className="w-full h-2">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 4 Q25 8 50 2 T100 6" fill="none" stroke="#92400E" strokeWidth="1" />
            </svg>
          </div>
        </button>

        {/* Total Visits */}
        <button 
          onClick={() => setActiveFilter('All')}
          className={`p-2.5 rounded-2xl border flex flex-col justify-between h-[96px] text-left transition-all ${
            activeFilter === 'All' 
              ? 'bg-blue-50 border-blue-200 shadow-sm' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <div className="flex justify-between items-center text-slate-505 w-full mb-1">
            <span className="text-[8.5px] uppercase tracking-wider font-bold">Total</span>
            <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div>
            <h5 className="text-lg font-black text-[#2563EB] leading-none">{totalCount}</h5>
            <p className="text-[9px] text-slate-400 mt-1 font-bold leading-none">Scheduled</p>
          </div>
          <div className="w-full h-2">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 8 Q25 4 50 6 T100 3" fill="none" stroke="#2563EB" strokeWidth="1" />
            </svg>
          </div>
        </button>
      </div>

      {/* Search and Filters Strip */}
      <div className="px-4 flex gap-2 items-center" id="visits-search-bar">
        {/* Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-450">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input 
            type="text" 
            placeholder="Search clients, location or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFF] border border-[#E5E7EB] text-xs py-2 pl-8.5 pr-3 rounded-lg text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Date Filter Selection */}
        <button className="bg-[#FFF] border border-[#E5E7EB] hover:bg-slate-50 text-[10px] px-2.5 py-2.5 rounded-lg flex items-center gap-1 font-bold transition tracking-wide leading-none select-none">
          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-slate-700">20 Jun 2024</span>
        </button>

        {/* Funnel filters */}
        <button className="bg-[#FFF] border border-[#E5E7EB] hover:bg-slate-100 p-2 rounded-lg flex items-center text-slate-500 transition">
          <Sliders className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Visits List header */}
      <div className="px-4 pt-5 pb-2.5 flex items-baseline gap-2" id="visits-list-label">
        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Live Client Logs</h4>
        <span className="text-[10px] font-bold text-slate-400">{filteredVisits.length} Listed</span>
      </div>

      {/* Visit Card elements stack */}
      <div className="px-4 space-y-2.5" id="visits-cards-stack">
        {filteredVisits.map((v) => {
          let iconColorClass = 'text-[#166534] bg-[#DCFCE7] border-[#DCFCE7]';
          let borderHighlight = 'hover:border-[#2563EB]/40';

          if (v.iconColor === 'blue') {
            iconColorClass = 'text-[#1E40AF] bg-[#DBEAFE] border-[#DBEAFE]';
          } else if (v.iconColor === 'amber') {
            iconColorClass = 'text-[#92400E] bg-[#FEF3C7] border-[#FEF3C7]';
          } else if (v.iconColor === 'purple') {
            iconColorClass = 'text-indigo-800 bg-indigo-50 border-indigo-100';
          }

          const isCompleted = v.status === 'Completed';

          return (
            <div 
              key={v.id} 
              className={`bg-[#FFF] border border-[#E5E7EB] ${borderHighlight} rounded-2xl p-3.5 flex justify-between items-center transition-all shadow-xs group`}
            >
              <div className="flex items-center gap-3">
                {/* Visual Icon Box */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm shrink-0 ${iconColorClass}`}>
                  <Building2 className="w-4.5 h-4.5" />
                </div>

                <div>
                  <h5 className="text-xs font-extrabold text-[#111827]">{v.companyName}</h5>
                  <p className="text-[10px] text-slate-550 mt-0.5 font-medium">Manager: <span className="text-[#111827] font-bold">{v.managerName}</span></p>
                  <div className="flex items-center gap-1 text-[9.5px] text-slate-450 mt-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{v.location}, {v.city}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action trigger Column */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-600 leading-tight font-sans">{v.time}</p>
                  
                  {/* Stateful Toggle status button */}
                  <button
                    onClick={() => handleToggleStatus(v.id)}
                    className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full transition-all block cursor-pointer ${
                      isCompleted 
                        ? 'bg-[#DCFCE7] text-[#166534] border-[#DCFCE7] hover:bg-green-105' 
                        : 'bg-[#FEF3C7] text-[#92400E] border-[#FEF3C7] hover:bg-amber-105'
                    }`}
                  >
                    {v.status}
                  </button>
                </div>

                <div className="p-1 cursor-pointer hover:text-[#2563EB] transition text-slate-400 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredVisits.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-400 bg-[#FFF] rounded-2xl border border-dashed border-slate-200">
            No client visits match your search query.
          </div>
        )}
      </div>

      <div className="p-4" id="visits-interactive-helper">
        <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider">
          💡 Click the status button on any card to toggle between Completed/Pending!
        </p>
      </div>
    </div>
  );
}
