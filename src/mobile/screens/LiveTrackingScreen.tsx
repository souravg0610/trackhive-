import { useState } from 'react';
import { 
  Search, RefreshCw, Sliders, MapPin, 
  Plus, Minus, Target, ChevronRight,
  User, Compass, Clock, UserX, Users
} from 'lucide-react';
import { Employee } from '../types';

interface LiveTrackingProps {
  employees: Employee[];
  onNavigate: (screen: string) => void;
}

export default function LiveTrackingScreen({ employees, onNavigate }: LiveTrackingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Online' | 'Idle' | 'Offline'>('All');

  const onlineCount = employees.filter(e => e.status === 'Online').length;
  const idleCount = employees.filter(e => e.status === 'Idle').length;
  const offlineCount = employees.filter(e => e.status === 'Offline').length;
  const totalCount = employees.length;

  const onlinePct = totalCount > 0 ? ((onlineCount / totalCount) * 100).toFixed(0) : '0';
  const idlePct = totalCount > 0 ? ((idleCount / totalCount) * 100).toFixed(0) : '0';
  const offlinePct = totalCount > 0 ? ((offlineCount / totalCount) * 100).toFixed(0) : '0';

  // Filter employees based on search query and status chip
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' ? true : emp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Highlight points for map pins mapped dynamically from employees array
  const mapPins = employees.map((emp, index) => {
    const positions = [
      { x: '45%', y: '16%' },
      { x: '25%', y: '45%' },
      { x: '58%', y: '43%' },
      { x: '82%', y: '52%' },
      { x: '72%', y: '78%' },
      { x: '35%', y: '65%' },
      { x: '65%', y: '25%' },
      { x: '20%', y: '20%' },
    ];
    const pos = positions[index % positions.length];
    return {
      name: emp.name,
      x: pos.x,
      y: pos.y,
      status: emp.status,
      avatar: emp.avatar_url,
      area: emp.location.toUpperCase()
    };
  });

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="live-tracking-container">
      {/* Title with Controls */}
      <div className="p-4 flex justify-between items-center" id="tracking-title-area">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Live Tracking</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Track field employees in real-time coordinates</p>
        </div>
        <div className="flex gap-1.5 text-xs text-slate-550 font-bold">
          <button className="flex items-center gap-1 bg-[#FFF] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#2563EB] transition cursor-pointer shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-1 bg-[#FFF] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer shadow-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-505" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Status Summary Toggles */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4" id="tracking-summary-cards">
        <button 
          onClick={() => setFilterStatus(filterStatus === 'Online' ? 'All' : 'Online')}
          className={`p-2.5 rounded-xl border flex flex-col justify-between h-[80px] text-left transition-all cursor-pointer ${
            filterStatus === 'Online' 
              ? 'bg-[#DCFCE7] border-[#10B981] shadow-xs' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <span className="flex items-center gap-1 text-[8.5px] text-slate-550 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse inline-block" />
            Online
          </span>
          <div>
            <h4 className="text-sm font-black mt-1 text-slate-800">{onlineCount}</h4>
            <p className="text-[9px] font-bold text-emerald-700 leading-none mt-1">{onlinePct}%</p>
          </div>
        </button>

        <button 
          onClick={() => setFilterStatus(filterStatus === 'Idle' ? 'All' : 'Idle')}
          className={`p-2.5 rounded-xl border flex flex-col justify-between h-[80px] text-left transition-all cursor-pointer ${
            filterStatus === 'Idle' 
              ? 'bg-[#FEF3C7] border-[#F59E0B] shadow-xs' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <span className="flex items-center gap-1 text-[8.5px] text-slate-550 font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            Idle
          </span>
          <div>
            <h4 className="text-sm font-black mt-1 text-slate-805">{idleCount}</h4>
            <p className="text-[9px] font-bold text-amber-705 leading-none mt-1">{idlePct}%</p>
          </div>
        </button>

        <button 
          onClick={() => setFilterStatus(filterStatus === 'Offline' ? 'All' : 'Offline')}
          className={`p-2.5 rounded-xl border flex flex-col justify-between h-[80px] text-left transition-all cursor-pointer ${
            filterStatus === 'Offline' 
              ? 'bg-[#F3F4F6] border-slate-350 shadow-xs' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <span className="flex items-center gap-1 text-[8.5px] text-slate-550 font-bold uppercase tracking-wider">
            <UserX className="w-3.5 h-3.5 text-slate-500" />
            Offline
          </span>
          <div>
            <h4 className="text-sm font-black mt-1 text-slate-805">{offlineCount}</h4>
            <p className="text-[9px] font-bold text-slate-500 leading-none mt-1">{offlinePct}%</p>
          </div>
        </button>

        <button 
          onClick={() => setFilterStatus('All')}
          className={`p-2.5 rounded-xl border flex flex-col justify-between h-[80px] text-left transition-all cursor-pointer ${
            filterStatus === 'All' 
              ? 'bg-blue-50 border-blue-200 shadow-xs' 
              : 'bg-[#FFF] border-[#E5E7EB]'
          }`}
        >
          <span className="flex items-center gap-1 text-[8.5px] text-[#2563EB] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[#2563EB]" />
            Total
          </span>
          <div>
            <h4 className="text-sm font-black mt-1 text-[#2563EB]">{totalCount}</h4>
            <p className="text-[9px] font-bold text-blue-700 leading-none mt-1">100%</p>
          </div>
        </button>
      </div>

      {/* Map View Interactive Canvas container */}
      <div className="mx-4 rounded-2xl bg-slate-50 border border-[#E5E7EB] overflow-hidden relative shadow-inner h-[280px]" id="map-canvas-container">
        {/* Search floating on map */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input 
              type="text" 
              placeholder="Search map terminal or node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFF]/90 border border-[#E5E7EB] text-xs py-1.5 pl-8 pr-3 rounded-lg text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] shadow-xs"
            />
          </div>
        </div>

        {/* Map Blueprint simulation */}
        <div className="w-full h-full relative opacity-95 select-none pb-4" id="hyderabad-map-canvas">
          {/* Subtle grid lines background */}
          <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-75" />

          {/* Map Vector Paths overlay (Hyderabad streets sketch) */}
          <svg className="absolute inset-0 w-full h-full text-slate-205" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="50" x2="400" y2="100" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="#E2E8F0" strokeWidth="1.2" />
            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#CBD5E1" strokeWidth="2" strokeOpacity="0.4" />
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#CBD5E1" strokeWidth="2" strokeOpacity="0.4" />
            {/* outer highway loop */}
            <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeOpacity="0.7" />
          </svg>

          {/* Area Label Text grids */}
          <div className="absolute top-[8%] left-[22%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Miyapur</div>
          <div className="absolute top-[12%] left-[45%] text-[9px] font-bold text-[#10B981] uppercase tracking-widest">Bachupally</div>
          <div className="absolute top-[30%] left-[25%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kukatpally</div>
          <div className="absolute top-[32%] left-[68%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Begumpet</div>
          <div className="absolute top-[28%] left-[84%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ecil</div>
          <div className="absolute top-[48%] left-[10%] text-[9px] font-bold text-[#1e3a5f]/70 uppercase tracking-widest font-mono">Hitech City</div>
          <div className="absolute top-[38%] left-[34%] text-[9px] font-bold text-[#2563EB] uppercase tracking-wide">Jubilee Hills</div>
          <div className="absolute top-[48%] left-[55%] text-[9px] font-bold text-slate-404 uppercase tracking-widest">Secunderabad</div>
          <div className="absolute top-[40%] left-[90%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uppal</div>
          <div className="absolute top-[68%] left-[28%] text-[9px] font-bold text-slate-404 uppercase tracking-widest">Tolichowki</div>
          <div className="absolute top-[72%] left-[62%] text-[9px] font-bold text-slate-404 uppercase tracking-widest font-mono">LB Nagar</div>
          <div className="absolute top-[75%] left-[78%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vanasthalipuram</div>
          <div className="absolute top-[90%] left-[30%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Saroornagar</div>
          <div className="absolute top-[88%] left-[60%] text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kothapet</div>

          {/* Centered Big Label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[13px] uppercase font-black text-slate-350 tracking-[0.25em]">
            HQ Zone Grid
          </div>

          {/* Highway badges */}
          <div className="absolute top-[38%] right-[22%] bg-amber-400 text-slate-900 text-[7px] font-black px-1 rounded-sm leading-none py-0.5">65</div>
          <div className="absolute bottom-[40%] right-[35%] bg-amber-400 text-slate-900 text-[7px] font-black px-1 rounded-sm leading-none py-0.5">163</div>
          <div className="absolute bottom-[20%] left-[45%] bg-amber-400 text-slate-900 text-[7px] font-black px-1 rounded-sm leading-none py-0.5">765</div>

          {/* Live Map Pins from state */}
          {mapPins.map((pin, idx) => {
            let ringColor = 'border-emerald-500';
            let dotBg = 'bg-emerald-500';
            if (pin.status === 'Idle') {
              ringColor = 'border-amber-500';
              dotBg = 'bg-amber-500';
            } else if (pin.status === 'Offline') {
              ringColor = 'border-slate-300';
              dotBg = 'bg-slate-400';
            }

            const imgUrl = pin.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80';

            return (
              <div 
                key={idx} 
                style={{ left: pin.x, top: pin.y }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
              >
                {/* Image Avatar */}
                <div className={`w-8 h-8 rounded-full border-2 ${ringColor} bg-[#FFF] overflow-hidden relative shadow-md`}>
                  <img src={imgUrl} alt={pin.name} className="w-full h-full object-cover" />
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${dotBg} border border-[#FFF]`} />
                </div>
                {/* Small indicator label */}
                <span className="mt-1 bg-[#FFF] border border-[#E5E7EB] text-[6.5px] font-bold text-slate-700 px-1 rounded tracking-wide leading-none py-0.5 block whitespace-nowrap shadow-xs">
                  {pin.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Map controls floating bottom-right */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10" id="map-controls">
          <button className="w-7 h-7 bg-[#FFF]/90 border border-[#E5E7EB] rounded-lg flex items-center justify-center text-slate-700 hover:text-[#2563EB] transition shadow-xs cursor-pointer">
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 bg-[#FFF]/90 border border-[#E5E7EB] rounded-lg flex items-center justify-center text-slate-700 hover:text-[#2563EB] transition shadow-xs cursor-pointer">
            <Minus className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 bg-[#2563EB] text-[#FFF] rounded-lg flex items-center justify-center hover:bg-md-blue transition shadow-xs mt-1 cursor-pointer">
            <Target className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Employee List Section */}
      <div className="mx-4 mt-6" id="employee-list-section">
        <h4 className="font-bold text-[10px] tracking-wider uppercase text-slate-500 mb-3">
          Field Agents Status ({filteredEmployees.length})
        </h4>

        {/* Search lists input */}
        <div className="relative mb-3">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input 
            type="text" 
            placeholder="Search matching field agent profile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFF] border border-[#E5E7EB] text-xs py-2 pl-9 pr-4 rounded-lg text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] shadow-xs"
          />
        </div>

        <div className="space-y-2.5" id="employee-tracking-cards">
          {filteredEmployees.map((emp) => {
            let statusColor = 'text-green-650';
            let statusBg = 'bg-green-500';
            if (emp.status === 'Idle') {
              statusColor = 'text-[#D97706]';
              statusBg = 'bg-amber-500';
            } else if (emp.status === 'Offline') {
              statusColor = 'text-slate-400';
              statusBg = 'bg-slate-400';
            }

            return (
              <div 
                key={emp.id} 
                className="bg-[#FFF] border border-[#E5E7EB] hover:border-[#2563EB]/40 rounded-2xl p-3 flex justify-between items-center transition shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  {/* Photo with dot */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 relative overflow-hidden flex-shrink-0">
                    <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                    <span className={`absolute bottom-0 left-0 w-3 h-3 rounded-full ${statusBg} border-2 border-[#FFF]`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black tracking-tight text-[#111827] mb-0.5">{emp.name}</h5>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                      {emp.status}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">{emp.last_seen}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 bg-[#FFF] rounded-xl border border-dashed border-slate-205" id="empty-employees-tracking">
              No employees match the active query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
