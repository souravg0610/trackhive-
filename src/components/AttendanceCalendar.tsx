/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AttendanceLog } from '../types';

interface AttendanceCalendarProps {
  logs: AttendanceLog[];
  selectedEmployeeId?: string | null;
  isLoading?: boolean;
  onMonthChange?: (year: number, month: number) => void;
}

export default function AttendanceCalendar({ 
  logs, 
  selectedEmployeeId = null,
  isLoading = false,
  onMonthChange 
}: AttendanceCalendarProps) {
  // Get current date for initial state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calculate days in month and first day index
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create grid arrays
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const emptyDays = Array.from({ length: firstDayIndex });

  // Get status for a specific day from backend logs
  const getStatusForDay = (dayNum: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    // Filter by employee if selected, otherwise show all
    const filteredLogs = selectedEmployeeId 
      ? logs.filter(log => log.employeeId === selectedEmployeeId && log.date === formattedDate)
      : logs.filter(log => log.date === formattedDate);

    if (filteredLogs.length === 0) return null;

    // Check statuses with priority order
    const statuses = filteredLogs.map(l => l.status);
    if (statuses.includes('Absent')) return 'Absent';
    if (statuses.includes('Half Day')) return 'Half Day';
    if (statuses.includes('Late')) return 'Late';
    if (statuses.includes('Present')) return 'Present';
    return null;
  };

  // Navigation handlers
  const nextMonth = () => {
    let newMonth, newYear;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1;
      newYear = currentYear;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    if (onMonthChange) {
      onMonthChange(newYear, newMonth);
    }
  };

  const prevMonth = () => {
    let newMonth, newYear;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1;
      newYear = currentYear;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    if (onMonthChange) {
      onMonthChange(newYear, newMonth);
    }
  };

  // Get attendance statistics for the current month
  const getMonthStats = () => {
    const totalDays = daysInMonth;
    let present = 0, absent = 0, late = 0, halfDay = 0, notMarked = 0;

    days.forEach(day => {
      const status = getStatusForDay(day);
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Late') late++;
      else if (status === 'Half Day') halfDay++;
      else notMarked++;
    });

    return { totalDays, present, absent, late, halfDay, notMarked };
  };

  const stats = getMonthStats();

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-slate-600 font-medium">Loading attendance data...</span>
        </div>
      </div>
    );
  }

  // Show empty state when no logs
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Attendance Calendar</h3>
            <p className="text-[11px] text-slate-400">Track and monitor historical logs day-by-day</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-bold text-slate-700 px-2 min-w-[100px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="text-4xl mb-4">📋</div>
          <p className="font-medium text-slate-600">No attendance records found</p>
          <p className="text-sm">Attendance data will appear here when employees start clocking in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      {/* Calendar Header Nav */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Attendance Calendar</h3>
          <p className="text-[11px] text-slate-400">
            {selectedEmployeeId ? 'Employee attendance overview' : 'Team attendance overview'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[12px] font-bold text-slate-700 px-2 min-w-[100px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Month Stats Summary */}
      <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block">Total</span>
          <span className="text-sm font-bold text-slate-700">{stats.totalDays}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block">✅ Present</span>
          <span className="text-sm font-bold text-emerald-600">{stats.present}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block">❌ Absent</span>
          <span className="text-sm font-bold text-rose-600">{stats.absent}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block">⏰ Late</span>
          <span className="text-sm font-bold text-amber-600">{stats.late}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block">🌓 Half Day</span>
          <span className="text-sm font-bold text-blue-600">{stats.halfDay}</span>
        </div>
      </div>

      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-y-2 text-center border-b border-slate-100 pb-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
          <span key={idx} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-3.5 gap-x-1.5 text-center">
        {emptyDays.map((_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const status = getStatusForDay(day);
          const todayObj = new Date();
          const isToday = day === todayObj.getDate() && currentMonth === todayObj.getMonth() && currentYear === todayObj.getFullYear();

          let borderStyle = "";
          let textStyle = "text-slate-700 hover:bg-slate-50";
          let dotColor = "transparent";

          if (isToday) {
            borderStyle = "border-2 border-emerald-500 text-emerald-800 font-bold bg-emerald-50/50";
          }

          if (status === 'Present') {
            dotColor = 'bg-emerald-500';
          } else if (status === 'Late') {
            dotColor = 'bg-amber-500';
          } else if (status === 'Half Day') {
            dotColor = 'bg-blue-500';
          } else if (status === 'Absent') {
            dotColor = 'bg-rose-500';
          }

          return (
            <div
              key={day}
              className={`relative h-10 w-full flex flex-col items-center justify-center rounded-xl text-[12px] font-semibold cursor-pointer select-none transition-colors ${textStyle} ${borderStyle}`}
            >
              <span>{day}</span>
              {status && (
                <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${dotColor}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Color Indicators Legend */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Present</span>
          <span className="text-slate-300 ml-1">({stats.present})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Absent</span>
          <span className="text-slate-300 ml-1">({stats.absent})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span>Half Day</span>
          <span className="text-slate-300 ml-1">({stats.halfDay})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Late</span>
          <span className="text-slate-300 ml-1">({stats.late})</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span>Not Marked</span>
          <span className="text-slate-300 ml-1">({stats.notMarked})</span>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
        {selectedEmployeeId ? 'Showing attendance for selected employee' : 'Showing team-wide attendance'}
        {logs.length > 0 && ` • ${logs.length} total records`}
      </div>
    </div>
  );
}