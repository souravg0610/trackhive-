import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, Play, CheckCircle, 
  Plus, ChevronRight, MoreVertical, Flag, ToggleLeft, 
  ArrowRight, ShieldAlert, Layers
} from 'lucide-react';
import { Task } from '../types';
import { fetchTasks, pushTaskStatus, getMobileSession } from '../apiBridge';

export default function TaskManagementScreen() {
  useEffect(() => { const s = getMobileSession(); if (s) fetchTasks(s.userId).then(setTasks); }, []);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // STATE FOR ADDING NEW TASK
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<Task['status']>('To Do');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClient, setNewTaskClient] = useState('Acme Corporation');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Completed metrics
  const doneCount = tasks.filter(t => t.status === 'Completed').length + 24; // Base baseline from screenshot
  const activeCount = tasks.filter(t => t.status !== 'Completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

  const handleCycleStatus = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        let nextStatus: Task['status'] = 'To Do';
        if (t.status === 'To Do') nextStatus = 'In Progress';
        else if (t.status === 'In Progress') nextStatus = 'Review';
        else if (t.status === 'Review') nextStatus = 'On Hold';
        else if (t.status === 'On Hold') nextStatus = 'Completed';
        else if (t.status === 'Completed') nextStatus = 'To Do';

        return {
          ...t,
          status: nextStatus,
          progress: nextStatus === 'In Progress' ? 40 : nextStatus === 'Review' ? 80 : nextStatus === 'On Hold' ? 20 : undefined
        };
      }
      return t;
    }));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const newTaskItem: Task = {
      id: `TSK0${tasks.length + 1}`,
      title: newTaskTitle,
      clientName: newTaskClient,
      priority: newTaskPriority,
      status: targetStatus,
      dueDate: '25 Jun',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      progress: targetStatus === 'In Progress' ? 30 : undefined
    };

    setTasks([newTaskItem, ...tasks]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const openAddModal = (status: Task['status']) => {
    setTargetStatus(status);
    setShowAddModal(true);
  };

  // Split tasks by column type
  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const reviewTasks = tasks.filter(t => t.status === 'Review');
  const onHoldTasks = tasks.filter(t => t.status === 'On Hold');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="tasks-container">
      {/* Header Info */}
      <div className="p-4 flex justify-between items-start" id="tasks-heading">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Task Management</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Kanban board workflow for assigned field duties</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4" id="tasks-horizontal-summary">
        {/* Done */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-2.5 flex flex-col justify-between h-[96px] shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Tasks Done</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 font-bold" />
          </div>
          <div>
            <h5 className="text-base font-black text-emerald-700 leading-none">{doneCount}</h5>
            <p className="text-[9px] text-[#4B5563] mt-1 font-bold leading-none">This Month</p>
          </div>
          <div className="w-full h-2">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 8 Q25 1 50 8 T100 2" fill="none" stroke="#10B981" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Active counter */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-2.5 flex flex-col justify-between h-[96px] shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Active</span>
            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div>
            <h5 className="text-base font-black text-[#2563EB] leading-none">{activeCount}</h5>
            <p className="text-[9px] text-[#4B5563] mt-1 font-bold leading-none">In Operations</p>
          </div>
          <div className="w-full h-2">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 4 Q25 8 50 2 T100 6" fill="none" stroke="#2563EB" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* High Priority count */}
        <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-2.5 flex flex-col justify-between h-[96px] shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase tracking-wider font-bold">Priority</span>
            <Flag className="w-3.5 h-3.5 text-[#EF4444]" fill="#EF4444" />
          </div>
          <div>
            <h5 className="text-base font-black text-[#EF4444] leading-none">{highPriorityCount}</h5>
            <p className="text-[9px] text-[#4B5563] mt-1 font-bold leading-none">Critical Attention</p>
          </div>
          <div className="w-full h-2">
            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 6 M10 8 Q40 1 70 8 T100 4" fill="none" stroke="#EF4444" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Kanban Board columns section */}
      <div className="px-4 animate-fade-in" id="kanban-section">
        <div className="flex justify-between items-baseline mb-3">
          <h3 className="font-bold text-[10px] tracking-wider uppercase text-slate-500">Field Duty Kanban</h3>
          <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-extrabold">Scroll Horizontal ⇄</span>
        </div>

        {/* Horizontal Container scrollable columns */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin select-none pr-4" id="kanban-horizontal-scroll">
          
          {/* Column 1: To Do */}
          <div className="min-w-[195px] max-w-[195px] bg-[#FFF]/40 rounded-2xl p-2.5 border border-[#E5E7EB]" id="kanban-col-todo">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-700">To Do</span>
              </div>
              <span className="bg-[#FFF] border border-[#E5E7EB] text-[9px] text-slate-600 px-2 py-0.5 rounded-full font-bold">{todoTasks.length}</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {todoTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleCycleStatus(t.id)}
                  className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2.5 hover:border-[#2563EB]/40 transition cursor-pointer relative group flex flex-col justify-between min-h-[96px] shadow-xs"
                >
                  <div>
                    <h5 className="font-bold text-[11px] leading-tight text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors">{t.title}</h5>
                    <p className="text-[9px] text-slate-500 font-bold mb-1 truncate block">{t.clientName}</p>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[8px] bg-amber-50 text-[#D97706] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase leading-none">
                      {t.priority}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-bold">{t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => openAddModal('To Do')}
              className="mt-2.5 flex items-center justify-center gap-1 w-full text-[10px] font-black text-[#2563EB] hover:bg-slate-50 py-1.5 bg-[#FFF] border border-dashed border-blue-200 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Column 2: In Progress */}
          <div className="min-w-[195px] max-w-[195px] bg-[#FFF]/40 rounded-2xl p-2.5 border border-[#E5E7EB]" id="kanban-col-inprogress">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-[#2563EB]">In Progress</span>
              </div>
              <span className="bg-[#FFF] border border-[#E5E7EB] text-[9px] text-[#2563EB] px-2 py-0.5 rounded-full font-bold">{inProgressTasks.length}</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {inProgressTasks.map(t => {
                const priorityBadge = t.priority === 'High' 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : t.priority === 'Medium' 
                    ? 'bg-amber-50 text-amber-700' 
                    : 'bg-green-50 text-emerald-805';

                return (
                  <div 
                    key={t.id} 
                    onClick={() => handleCycleStatus(t.id)}
                    className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2.5 hover:border-[#2563EB]/40 transition cursor-pointer relative group flex flex-col justify-between min-h-[110px] shadow-xs"
                  >
                    <div>
                      <h5 className="font-bold text-[11px] leading-tight text-[#111827] mb- group-hover:text-[#2563EB] transition-colors">{t.title}</h5>
                      <p className="text-[9px] text-slate-500 font-bold mb-1 truncate block">{t.clientName}</p>
                    </div>

                    <div className="mt-1">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                        <div style={{ width: `${t.progress || 50}%` }} className="h-full bg-[#2563EB]" />
                      </div>
                      <span className="text-[8px] text-[#2563EB] font-bold float-right">{t.progress || 50}% done</span>
                    </div>

                    <div className="flex justify-between items-center mt-1.5">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase leading-none ${priorityBadge}`}>
                        {t.priority}
                      </span>
                      <span className="text-[8.5px] text-slate-400 font-bold">{t.dueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => openAddModal('In Progress')}
              className="mt-2.5 flex items-center justify-center gap-1 w-full text-[10px] font-black text-[#2563EB] hover:bg-slate-50 py-1.5 bg-[#FFF] border border-dashed border-blue-200 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Column 3: Review */}
          <div className="min-w-[195px] max-w-[195px] bg-[#FFF]/40 rounded-2xl p-2.5 border border-[#E5E7EB]" id="kanban-col-review">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-800">Review</span>
              </div>
              <span className="bg-[#FFF] border border-[#E5E7EB] text-[9px] text-amber-705 px-2 py-0.5 rounded-full font-bold">{reviewTasks.length}</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {reviewTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleCycleStatus(t.id)}
                  className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2.5 hover:border-[#2563EB]/40 transition cursor-pointer relative group flex flex-col justify-between min-h-[110px] shadow-xs"
                >
                  <div>
                    <h5 className="font-bold text-[11px] leading-tight text-[#111827] mb- group-hover:text-[#2563EB] transition-colors">{t.title}</h5>
                    <p className="text-[9px] text-slate-500 font-bold mb-1 truncate block">{t.clientName}</p>
                  </div>

                  <div className="mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                      <div style={{ width: `${t.progress || 80}%` }} className="h-full bg-amber-500" />
                    </div>
                    <span className="text-[8px] text-amber-700 font-bold float-right">{t.progress || 80}% checked</span>
                  </div>

                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[8px] bg-amber-50 text-[#92400E] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase leading-none">
                      {t.priority}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-bold">{t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => openAddModal('Review')}
              className="mt-2.5 flex items-center justify-center gap-1 w-full text-[10px] font-black text-[#2563EB] hover:bg-slate-50 py-1.5 bg-[#FFF] border border-dashed border-blue-200 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Column 4: On Hold */}
          <div className="min-w-[195px] max-w-[195px] bg-[#FFF]/40 rounded-2xl p-2.5 border border-[#E5E7EB]" id="kanban-col-onhold">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span className="text-violet-700">On Hold</span>
              </div>
              <span className="bg-[#FFF] border border-[#E5E7EB] text-[9px] text-violet-705 px-2 py-0.5 rounded-full font-bold">{onHoldTasks.length}</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {onHoldTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleCycleStatus(t.id)}
                  className="bg-[#FFF] border border-[#E5E7EB] rounded-xl p-2.5 hover:border-[#2563EB]/40 transition cursor-pointer relative group flex flex-col justify-between min-h-[110px] shadow-xs"
                >
                  <div>
                    <h5 className="font-bold text-[11px] leading-tight text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors">{t.title}</h5>
                    <p className="text-[9px] text-slate-500 font-bold mb-1 truncate block">{t.clientName}</p>
                  </div>

                  <div className="mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                      <div style={{ width: `${t.progress || 20}%` }} className="h-full bg-[#8B5CF6]" />
                    </div>
                    <span className="text-[8px] text-violet-605 font-bold float-right">{t.progress || 20}% hold</span>
                  </div>

                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[8px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase leading-none">
                      {t.priority}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-bold">{t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => openAddModal('On Hold')}
              className="mt-2.5 flex items-center justify-center gap-1 w-full text-[10px] font-black text-[#2563EB] hover:bg-slate-50 py-1.5 bg-[#FFF] border border-dashed border-blue-200 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completed Tasks Feed section */}
      <div className="mx-4 mt-6 mb-6" id="completed-tasks-list">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Completed List</h4>
          <span className="text-[10px] font-bold text-[#2563EB] cursor-pointer">View All</span>
        </div>

        <div className="space-y-2.5">
          {completedTasks.slice(0, 5).map((ct, idx) => (
            <div 
              key={ct.id || idx} 
              className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl p-3 flex justify-between items-center shadow-xs hover:border-[#2563EB]/40 transition"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </span>
                <div>
                  <h5 className="text-xs font-black text-[#111827] leading-snug">{ct.title}</h5>
                  <p className="text-[9.5px] text-slate-500 font-bold mt-0.5">{ct.clientName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-700 leading-tight">Completed</p>
                  <p className="text-[8.5px] text-slate-400 font-mono mt-0.5 font-bold">{ct.dueDate}</p>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-405" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Helper Tip row */}
      <div className="p-4" id="visits-interactive-helper">
        <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider">
          💡 Click any task card to transition it through stages! (To Do ➔ In Progress ➔ Review ➔ Completed)
        </p>
      </div>

      {/* Stateful Add Task modal popover */}
      {showAddModal && (
        <div className="absolute inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFF] border border-[#E5E7EB] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in font-sans text-left">
            <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex justify-between items-center">
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-600">New {targetStatus} Duty</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-900 text-[9px] font-black px-2 py-1 bg-[#FFF] rounded-lg border border-slate-205"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Verify Client Addresses"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Corporate Client</label>
                <select
                  value={newTaskClient}
                  onChange={(e) => setNewTaskClient(e.target.value)}
                  className="w-full bg-[#FFF] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB] text-[#111827]"
                >
                  <option value="Acme Corporation">Acme Corporation</option>
                  <option value="Brightstar Retail Pvt. Ltd.">Brightstar Retail Pvt. Ltd.</option>
                  <option value="Galaxy Distributors">Galaxy Distributors</option>
                  <option value="Techno World">Techno World</option>
                  <option value="Sri Sai Traders">Sri Sai Traders</option>
                  <option value="Future Mart">Future Mart</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        newTaskPriority === p 
                          ? 'bg-blue-50 text-[#2563EB] border-[#2563EB] font-black' 
                          : 'bg-[#FFF] border-[#E5E7EB] text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
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
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg shadow-xs transition cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
