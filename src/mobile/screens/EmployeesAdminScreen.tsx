import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Phone, Mail, Map, 
  ChevronRight, Building, Plus, Trash2, ShieldAlert,
  Sliders, ArrowUpRight
} from 'lucide-react';
import { Employee } from '../types';
import { fetchEmployees, getMobileSession } from '../apiBridge';

export default function EmployeesAdminScreen() {
  useEffect(() => { fetchEmployees().then(setEmpList); }, []);
  const [empList, setEmpList] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState<'All' | 'Developer' | 'Executive' | 'Director' | 'Administrator'>('All');

  // New Employee Modal state
  const [showModal, setShowModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState<'Super Administrator' | 'Field Agent' | 'Sales' | 'Logistics' | 'Operations' | 'Marketing'>('Field Agent');
  const [empZone, setEmpZone] = useState('Hitech City, Hyderabad');
  const [empPhone, setEmpPhone] = useState('+91 95000 12345');
  const [empEmail, setEmpEmail] = useState('');

  const filteredEmployees = empList.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (designationFilter === 'All') return matchesSearch;
    // Map abstract selector
    if (designationFilter === 'Developer' && emp.role.toLowerCase().includes('engineer')) return matchesSearch;
    if (designationFilter === 'Executive' && emp.role.toLowerCase().includes('executive')) return matchesSearch;
    if (designationFilter === 'Director' && emp.role.toLowerCase().includes('head')) return matchesSearch;
    if (designationFilter === 'Administrator' && emp.role.toLowerCase().includes('admin')) return matchesSearch;

    return matchesSearch;
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;

    // Female / male photo cycle based on names
    const randPhoto = empList.length % 2 === 0
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';

    const newEmp: Employee = {
      id: `EMP0${empList.length + 1}`,
      name: empName,
      role: empRole,
      department: 'Operations',
      location: empZone,
      status: 'Online',
      last_seen: 'Just now',
      avatar_url: randPhoto,
      phone: empPhone,
      email: empEmail || `${empName.toLowerCase().replace(/\s+/g, '')}@trackhive.com`,
      is_active: true,
      license_count: 0,
      total_licenses: 20,
      joining_date: 'Jun 2024'
    };

    setEmpList([newEmp, ...empList]);
    
    // Reset Form
    setEmpName('');
    setEmpRole('Field Agent');
    setEmpZone('Hitech City, Hyderabad');
    setEmpPhone('+91 95000 12345');
    setEmpEmail('');
    setShowModal(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmpList(empList.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="employees-admin-container">
      {/* Page Heading & Trigger */}
      <div className="p-4 flex justify-between items-center" id="emp-admin-heading">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827] flex items-center gap-1.5">
            <span>Workforce Grid</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold">Manage corporate field agents and roles</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Corporate Summary stat indicators */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4" id="emp-summary-grids">
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2 text-center shadow-xs">
          <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none">Total Head</p>
          <p className="text-sm font-black text-[#111827] mt-1.5 leading-none">{empList.length}</p>
        </div>
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2 text-center shadow-xs">
          <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none">Active Shifts</p>
          <p className="text-sm font-black text-emerald-700 mt-1.5 leading-none">12</p>
        </div>
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2 text-center shadow-xs">
          <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none">Field Visits</p>
          <p className="text-sm font-black text-[#2563EB] mt-1.5 leading-none">8</p>
        </div>
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2 text-center shadow-xs">
          <p className="text-[9px] text-[#4B5563] font-bold uppercase leading-none">Approvals</p>
          <p className="text-sm font-black text-[#F59E0B] mt-1.5 leading-none">4</p>
        </div>
      </div>

      {/* Search filtration row */}
      <div className="px-4 flex gap-2 items-center" id="emp-search-strip">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input 
            type="text" 
            placeholder="Search name, ID or city locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFF] border border-[#E5E7EB] text-xs py-2 pl-9 pr-3 rounded-lg text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <button className="bg-[#FFF] border border-[#E5E7EB] hover:bg-slate-50 p-2 rounded-lg flex items-center text-slate-505 transition">
          <Sliders className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Designation tabs selectrow */}
      <div className="px-4 mt-4 overflow-x-auto flex gap-4 border-b border-slate-100 scrollbar-none" id="emp-tabs-selector">
        {(['All', 'Developer', 'Executive', 'Director', 'Administrator'] as const).map((tab) => {
          const isActive = designationFilter === tab;
          return (
            <button 
              key={tab}
              onClick={() => setDesignationFilter(tab)}
              className={`pb-2 font-extrabold text-xs tracking-wide whitespace-nowrap border-b-2 leading-none relative transition-all ${
                isActive 
                  ? 'text-[#2563EB] border-[#2563EB]' 
                  : 'text-slate-400 border-transparent hover:text-slate-800'
              }`}
            >
              {tab === 'Developer' ? 'Tech/Developers' : tab === 'Director' ? 'Leaders/Directors' : tab}
            </button>
          );
        })}
      </div>

      {/* Employee List Stack */}
      <div className="px-4 mt-4 space-y-2.5" id="emp-list-stack">
        {filteredEmployees.map((emp) => {
          const isVerifiedAdmin = emp.role.toLowerCase().includes('admin') || emp.role.toLowerCase().includes('head');
          
          return (
            <div 
              key={emp.id} 
              className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-3.5 flex flex-col transition hover:border-[#2563EB]/40 shadow-xs"
            >
              {/* Profile Details header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 relative bg-slate-50 border border-slate-205">
                    <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#111827] leading-tight flex items-center gap-1.5">
                      <span>{emp.name}</span>
                      {isVerifiedAdmin && (
                        <span className="bg-blue-50 text-[#1E40AF] border border-blue-100 text-[7px] font-black uppercase px-1 rounded-sm leading-none py-0.5">
                          Admin Priority
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{emp.role}</p>
                    <p className="text-[9px] text-[#2563EB] font-bold uppercase mt-1 tracking-wider">{emp.id}</p>
                  </div>
                </div>

                {/* Trash delete button */}
                <button 
                  onClick={() => handleDeleteEmployee(emp.id)}
                  className="text-slate-400 hover:text-red-650 p-1.5 transition rounded-lg hover:bg-slate-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Grid detail row at card bottom */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1">
                  <Map className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.location || 'Hyderabad Zone'}</span>
                </div>
                <div className="flex items-center gap-1 justify-end font-sans">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{emp.phone || '+91 98765 00000'}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-400 bg-[#FFF] rounded-xl border border-dashed border-slate-200">
            No employees found matching the filtration queries.
          </div>
        )}
      </div>

      {/* Stateful Add Employee Dialogue popover */}
      {showModal && (
        <div className="absolute inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in font-sans text-left">
            <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex justify-between items-center">
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-600">Register Staff</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-900 text-[9px] font-black px-2 py-1 bg-[#FFF] rounded-lg border border-slate-200"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Jasprit Bumrah"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Designation Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Field Executive"
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value as any)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Headquarters Zone</label>
                <input 
                  type="text" 
                  placeholder="e.g. Secunderabad, Hyderabad"
                  value={empZone}
                  onChange={(e) => setEmpZone(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-205 text-slate-700 font-bold text-xs py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
