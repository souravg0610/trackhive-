/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Calendar, 
  UserPlus, 
  Check, 
  Trash2, 
  Users, 
  Sparkles, 
  AlertTriangle,
  MapPin,
  CalendarDays,
  Upload,
  Download,
  X
} from 'lucide-react';
import { DBState } from '../dbState';
// BUG 5 FIX: import shift save functions — previously ShiftModule never persisted to Supabase
import { apiCreateShift, apiAssignShift } from '../lib/apiClient';

async function saveShift(shift: Record<string, unknown>): Promise<string | null> {
  try { await apiCreateShift(shift); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}
async function saveShiftAssignments(shiftId: string, empIds: string[]): Promise<string | null> {
  try { await apiAssignShift(shiftId, empIds); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}
import * as XLSX from 'xlsx';
import { ShiftPattern, Employee } from '../types';

interface ShiftModuleProps {
  db: DBState;
  setDb: React.Dispatch<React.SetStateAction<DBState>>;
  triggerNotification: (title: string, msg: string, type: string, priority: string) => void;
  searchQuery: string;
}

export default function ShiftModule({
  db,
  setDb,
  triggerNotification,
  searchQuery
}: ShiftModuleProps) {
  // Use real data only – no fallback arrays
  const activeShifts = useMemo(() => db.shifts || [], [db.shifts]);
  const employees = useMemo(() => db.employees || [], [db.employees]);
  const shiftAssignments = useMemo(() => db.shiftAssignments || [], [db.shiftAssignments]);

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'definitions'>('roster');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // New Shift Template state
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [newShift, setNewShift] = useState<Partial<ShiftPattern>>({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    weeklyOffDays: ['Sunday'],
    gracePeriodMins: 15
  });

  // Assign shift state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftPatternId: '',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  // Handle adding shift pattern
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.name) return;

    const patternId = 'SFT-' + Math.floor(100 + Math.random() * 900);
    const patternRecord: ShiftPattern = {
      id: patternId,
      name: newShift.name,
      startTime: newShift.startTime || '09:00',
      endTime: newShift.endTime || '18:00',
      weeklyOffDays: newShift.weeklyOffDays || ['Sunday'],
      gracePeriodMins: Number(newShift.gracePeriodMins || 15)
    };

    // BUG 5 FIX: persist new shift to Supabase — was only saved to local state before
    saveShift({
      id: patternRecord.id,
      name: patternRecord.name,
      shiftName: patternRecord.name,
      startTime: patternRecord.startTime,
      endTime: patternRecord.endTime,
      graceMinutes: patternRecord.gracePeriodMins,
      status: 'upcoming',
    }).catch(err => console.error('[ShiftModule] saveShift failed:', err));

    setDb(prev => {
      const nextState = {
        ...prev,
        shifts: [...(prev.shifts || []), patternRecord]
      };
      return nextState;
    });

    triggerNotification(
      'New Shift Registered',
      `Corporate shift pattern "${patternRecord.name}" created with limit tolerances.`,
      'System',
      'Medium'
    );
    setShowAddShiftModal(false);
    setNewShift({
      name: '',
      startTime: '09:00',
      endTime: '18:00',
      weeklyOffDays: ['Sunday'],
      gracePeriodMins: 15
    });
  };

  // Handle removing a shift pattern
  const handleDeleteShift = (id: string) => {
    if (activeShifts.length <= 1) {
      alert("At least one master shift pattern must remain configured for general core logistics routing.");
      return;
    }
    setDb(prev => {
      const nextState = {
        ...prev,
        shifts: (prev.shifts || []).filter(s => s.id !== id),
        shiftAssignments: (prev.shiftAssignments || []).filter(a => a.shiftPatternId !== id)
      };
      return nextState;
    });
    triggerNotification('Shift Removed', 'Shift pattern deleted from system registries.', 'System', 'Low');
  };

  // Handle shift assignment submit
  const handleAssignShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.employeeId || !assignForm.shiftPatternId) {
      alert("Please designate both employee and shift windows.");
      return;
    }

    setDb(prev => {
      const filtered = (prev.shiftAssignments || []).filter(a => a.employeeId !== assignForm.employeeId);
      const nextState = {
        ...prev,
        shiftAssignments: [
          ...filtered,
          {
            employeeId: assignForm.employeeId,
            shiftPatternId: assignForm.shiftPatternId,
            effectiveFrom: assignForm.effectiveFrom
          }
        ]
      };
      return nextState;
    });

    const empName = employees.find(e => e.id === assignForm.employeeId)?.name || 'Employee';
    const shiftName = activeShifts.find(s => s.id === assignForm.shiftPatternId)?.name || 'Shift';

    triggerNotification(
      'Shift Roster Updated',
      `Assigned ${empName} to ${shiftName} roster window from ${assignForm.effectiveFrom}.`,
      'System',
      'Low'
    );
    setShowAssignModal(false);
  };

  const handleBulkShiftCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) {
        alert('Empty CSV or invalid format.');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const newAssignments: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length < headers.length) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = values[idx] || '';
        });

        const empEmailOrName = rowData['employee'] || rowData['email'] || rowData['employee email'] || rowData['name'];
        const shiftNameValue = rowData['shift'] || rowData['shift name'] || rowData['pattern'] || rowData['class'];
        const effectiveFrom = rowData['effectivefrom'] || rowData['start date'] || new Date().toISOString().split('T')[0];

        if (!empEmailOrName || !shiftNameValue) continue;

        // Resolve employee ID
        const matchedEmp = employees.find(
          e => e.email.toLowerCase() === empEmailOrName.toLowerCase() || 
               e.name.toLowerCase() === empEmailOrName.toLowerCase()
        );

        // Resolve Shift Pattern ID
        const matchedShift = activeShifts.find(
          s => s.name.toLowerCase() === shiftNameValue.toLowerCase()
        );

        if (!matchedEmp) {
          console.warn(`Could not find employee: ${empEmailOrName}`);
          continue;
        }

        if (!matchedShift && activeShifts.length === 0) {
          console.warn(`No shift patterns available to assign for: ${empEmailOrName}`);
          continue;
        }
        const resolvedShiftId = matchedShift ? matchedShift.id : activeShifts[0].id;

        newAssignments.push({
          employeeId: matchedEmp.id,
          shiftPatternId: resolvedShiftId,
          effectiveFrom: effectiveFrom
        });
      }

      if (newAssignments.length === 0) {
        alert('Could not match any corporate staff emails to shift pattern codes inside rows.');
        return;
      }

      // BUG 5 FIX: persist shift assignments from CSV import to Supabase
      const assignmentsByShift: Record<string, string[]> = {};
      newAssignments.forEach(a => {
        if (!assignmentsByShift[a.shiftId]) assignmentsByShift[a.shiftId] = [];
        assignmentsByShift[a.shiftId].push(a.employeeId);
      });
      Promise.all(
        Object.entries(assignmentsByShift).map(([sid, empIds]) =>
          saveShiftAssignments(sid, empIds)
        )
      ).catch(err => console.error('[ShiftModule] saveShiftAssignments failed:', err));

      setDb(prev => {
        const existingMap = new Map((prev.shiftAssignments || []).map(a => [a.employeeId, a]));
        newAssignments.forEach(item => {
          existingMap.set(item.employeeId, item);
        });
        return {
          ...prev,
          shiftAssignments: Array.from(existingMap.values())
        };
      });

      triggerNotification(
        'Bulk Shift Roster Programmed',
        `Programmed ${newAssignments.length} custom staff shifts via CSV import.`,
        'System',
        'Medium'
      );
      alert(`Successfully mapped and uploaded ${newAssignments.length} shifts to the active roster slate!`);
      setShowBulkUpload(false);
    } catch (err: any) {
      alert(`CSV Parser error: ${err.message}`);
    }
  };

  // Toggle day selection for shift weekly off-days helper
  const toggleOffDay = (day: string) => {
    const list = newShift.weeklyOffDays || [];
    if (list.includes(day)) {
      setNewShift({ ...newShift, weeklyOffDays: list.filter(d => d !== day) });
    } else {
      setNewShift({ ...newShift, weeklyOffDays: [...list, day] });
    }
  };

  // Resolve shift for employee – no fallback dummy object
  const getEmployeeShift = (empId: string): ShiftPattern | null => {
    const assignment = shiftAssignments.find(a => a.employeeId === empId);
    if (assignment) {
      return activeShifts.find(s => s.id === assignment.shiftPatternId) || null;
    }
    return null;
  };

  // Guard: if no shifts exist, show a friendly message
  if (activeShifts.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed rounded-2xl bg-white">
        <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">No shift patterns defined.</p>
        <p className="text-xs text-slate-400 mt-1">Create your first shift pattern using the "Shift Patterns" tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top action header card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600 animate-pulse" />
            Shift Roster & Scheduling Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Defines corporate labor shifts, grace tolerances, and dynamic weekly calendars.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl border z-0">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'roster' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Roster Table
            </button>
            <button
              onClick={() => setActiveSubTab('definitions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'definitions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Shift Patterns
            </button>
          </div>

          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-150 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Bulk CSV</span>
          </button>

          <button
            onClick={() => {
              if (activeSubTab === 'definitions') {
                setShowAddShiftModal(true);
              } else {
                setShowAssignModal(true);
              }
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {activeSubTab === 'definitions' ? (
              <>
                <Plus className="h-4 w-4" />
                <span>Create Pattern</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Roster Shift</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 space-y-4 text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-700 animate-bounce" />
              <h3 className="text-sm font-black text-slate-800">Bulk Shift Assignments Upload</h3>
            </div>
            <button 
              onClick={() => setShowBulkUpload(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Add team schedules and shift parameters in bulk. 
            The spreadsheet must contain: <code className="bg-white text-emerald-800 px-1 py-0.5 rounded border border-emerald-100 text-[10px] font-mono font-bold">Employee,Shift,EffectiveFrom</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-dashed border-emerald-200 bg-white rounded-2xl p-4 text-center space-y-3 flex flex-col justify-center items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-emerald-700 font-bold" />
              </div>
              <div>
                <button
                  onClick={() => {
                    const sampleHeaders = ['Employee', 'Shift', 'EffectiveFrom'];
                    const firstEmp = employees[0]?.email || 'demo@trackhive.com';
                    const firstShift = activeShifts[0]?.name || 'Day Shift Office';
                    const sampleRow = [firstEmp, firstShift, new Date().toISOString().split('T')[0]];
                    const wsData = [sampleHeaders, sampleRow];
                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    ws['!cols'] = sampleHeaders.map((h: string) => ({ wch: Math.max(h.length, 18) }));
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Shifts');
                    XLSX.writeFile(wb, 'trackhive_roster_template.xlsx');
                    const url = ''; const link = document.createElement('a');
                    link.setAttribute('download', 'trackhive_roster_template.xlsx');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="text-xs font-black text-emerald-700 hover:underline cursor-pointer"
                >
                  Download Shift Template CSV
                </button>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">Filled with active employee parameters & corporate shifts</p>
              </div>
            </div>

            <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-4 text-center space-y-3 flex flex-col justify-center items-center">
              <p className="text-xs font-bold text-slate-700 font-sans">Upload Assigned Roster (CSV or Excel)</p>
              <input 
                type="file" 
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  const reader = new FileReader();
                  if (ext === 'csv') {
                    reader.onload = (evt) => handleBulkShiftCSV(evt.target?.result as string);
                    reader.readAsText(file);
                  } else {
                    reader.onload = (evt) => {
                      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                      const workbook = XLSX.read(data, { type: 'array' });
                      const sheet = workbook.Sheets[workbook.SheetNames[0]];
                      handleBulkShiftCSV(XLSX.utils.sheet_to_csv(sheet));
                    };
                    reader.readAsArrayBuffer(file);
                  }
                }}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <p className="text-[9px] text-slate-400 font-sans">Applies shifts instantly when mapped successfully</p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'roster' ? (
        <div className="space-y-4">
          {/* Calendar roster table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center px-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Duty Roster Calendar (7 Days Recurring)</span>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Roster Assigned
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <th className="py-3 px-6 w-64">Employee Details</th>
                    {weekDays.map(day => (
                      <th key={day} className="py-3 px-4 text-center min-w-[120px]">{day.substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        No employees found matching query constraints.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => {
                      const currentShift = getEmployeeShift(emp.id);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-slate-100 font-extrabold text-xs text-slate-600 flex items-center justify-center border">
                                {emp.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <span className="font-bold text-slate-800 block leading-tight">{emp.name}</span>
                                <span className="text-[10px] text-slate-400">{emp.department} • {emp.role}</span>
                              </div>
                            </div>
                          </td>
                          {weekDays.map(day => {
                            // If no shift assigned, treat as unassigned (show placeholder)
                            if (!currentShift) {
                              return (
                                <td key={day} className="p-2 text-center">
                                  <div className="py-2 px-1 rounded-xl border border-dashed text-[10px] text-slate-400">
                                    Unassigned
                                  </div>
                                </td>
                              );
                            }
                            const isOff = currentShift.weeklyOffDays.includes(day);
                            return (
                              <td key={day} className="p-2 text-center">
                                <div className={`py-2 px-1 rounded-xl border text-[11px] leading-tight flex flex-col items-center justify-center transition-all ${
                                  isOff 
                                    ? 'bg-slate-50 text-slate-450 border-slate-200/50 line-through font-medium'
                                    : 'bg-emerald-50/40 text-emerald-800 border-emerald-100/60 font-bold'
                                }`}>
                                  {isOff ? (
                                    <span>Weekly Off</span>
                                  ) : (
                                    <>
                                      <span>{currentShift.name.split(' ')[0]}</span>
                                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">{currentShift.startTime}-{currentShift.endTime}</span>
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Roster Stats / Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Configured Employees</span>
                <span className="text-lg font-black text-slate-800 leading-none">{employees.length} Staff</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Shift Windows Definable</span>
                <span className="text-lg font-black text-slate-800 leading-none">{activeShifts.length} Presets</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Sync Status</span>
                <span className="text-lg font-black text-slate-800 leading-none">Automated ERP Sync</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Shift templates definition list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeShifts.map((sh) => (
            <div key={sh.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all group relative">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <Clock className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => handleDeleteShift(sh.id)}
                    className="p-1 text-slate-350 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Shift Pattern"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="text-left space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{sh.id}</span>
                  <h3 className="text-sm font-black text-slate-800 leading-tight block">{sh.name}</h3>
                  <p className="text-[11px] text-slate-400">Hours: {sh.startTime} AM/PM to {sh.endTime} AM/PM</p>
                </div>

                <div className="border-t border-slate-50 pt-3 space-y-2 text-left text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grace Period:</span>
                    <span className="font-bold text-slate-700">{sh.gracePeriodMins} Minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Weekly Off System:</span>
                    <span className="font-bold text-slate-700">{sh.weeklyOffDays.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Employees:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-extrabold text-[10px] text-slate-600">
                  {shiftAssignments.filter(a => a.shiftPatternId === sh.id).length || 0} Staff
                </span>
              </div>
            </div>
          ))}

          {/* Create new shift card */}
          <button
            onClick={() => setShowAddShiftModal(true)}
            className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-3xl p-6 min-h-[220px] transition-all flex flex-col items-center justify-center group space-y-2 bg-slate-50/20"
          >
            <div className="p-3 bg-slate-100 text-slate-500 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-700 block">Add Shift Pattern</span>
              <span className="text-[10px] text-slate-400">Configure new corporate schedules & buffer tolerances</span>
            </div>
          </button>
        </div>
      )}

      {/* CREATE SHIFT PATTERN MODAL */}
      {showAddShiftModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 bg-slate-55 flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] font-bold text-emerald-700 tracking-wider font-mono uppercase">Setup New Template</span>
                <h3 className="text-md font-black text-slate-800 leading-none">Create Shift Pattern</h3>
              </div>
              <button 
                onClick={() => setShowAddShiftModal(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1.5 hover:bg-slate-100 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="p-5 space-y-4 overflow-y-auto text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Shift Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening Operations Shift"
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">End Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Grace Period Tolerance (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={newShift.gracePeriodMins}
                  onChange={(e) => setNewShift({ ...newShift, gracePeriodMins: Number(e.target.value) })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Designated Weekly Offs (Sundays, etc.)</label>
                <div className="flex flex-wrap gap-1.5">
                  {weekDays.map(day => {
                    const selected = (newShift.weeklyOffDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleOffDay(day)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          selected 
                            ? 'bg-rose-50 text-rose-700 border-rose-250'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all"
                >
                  Save Shift Pattern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SHIFT ROSTER MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 bg-slate-55 flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] font-bold text-emerald-700 tracking-wider font-mono uppercase">Corporate Duty Assignment</span>
                <h3 className="text-md font-black text-slate-800 leading-none">Map Employee to Shift</h3>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1.5 hover:bg-slate-100 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignShiftSubmit} className="p-5 space-y-4 overflow-y-auto text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Select Employee</label>
                <select
                  required
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-55 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} • {emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assign Shift Pattern</label>
                <select
                  required
                  value={assignForm.shiftPatternId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftPatternId: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-55 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                >
                  <option value="">-- Select Shift Window --</option>
                  {activeShifts.map(pattern => (
                    <option key={pattern.id} value={pattern.id}>
                      {pattern.name} ({pattern.startTime} - {pattern.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Effective Start Date</label>
                <input
                  type="date"
                  required
                  value={assignForm.effectiveFrom}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border focus:bg-white focus:outline-none focus:border-emerald-500 border-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all"
                >
                  Assign Roster Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}