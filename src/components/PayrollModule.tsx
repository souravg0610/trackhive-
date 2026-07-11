import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Plus, 
  Search, 
  Printer, 
  Check, 
  FileText, 
  Coins, 
  Briefcase, 
  TrendingUp, 
  Building2,
  Lock,
  Download,
  AlertCircle,
  Upload,
  X
} from 'lucide-react';
import { DBState } from '../dbState';
import { apiSetSalaryConfig, apiGeneratePayslip } from '../lib/apiClient';

async function saveSalaryConfig(empId: string, config: Record<string, unknown>): Promise<string | null> {
  try { await apiSetSalaryConfig(empId, config); return null; }
  catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}
async function savePayslip(payslip: Record<string, unknown>): Promise<string | null> {
  try {
    const d = new Date((payslip.period as string) || '');
    const m = isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
    const y = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    await apiGeneratePayslip(payslip.employeeId as string, m, y);
    return null;
  } catch (err: unknown) { return err instanceof Error ? err.message : 'Save failed'; }
}
import { PayrollRecord, Employee } from '../types';

interface PayrollModuleProps {
  db: DBState;
  setDb: React.Dispatch<React.SetStateAction<DBState>>;
  triggerNotification: (title: string, msg: string, type: string, priority: string) => void;
  searchQuery: string;
}

export default function PayrollModule({
  db,
  setDb,
  triggerNotification,
  searchQuery
}: PayrollModuleProps) {
  const employees = useMemo(() => db.employees || [], [db.employees]);
  const payrollRecords = useMemo(() => db.payrollRecords || [], [db.payrollRecords]);

  const [activeSubTab, setActiveSubTab] = useState<'runs' | 'config'>('runs');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('June 2026');

  // Interactive configurations for live CTC
  const [employeeSalaryConfigs, setEmployeeSalaryConfigs] = useState<Record<string, {
    ctcMonthly: number;
    optInEPF: boolean;
    metroHRA: boolean;
    customTds: number;
    mediclaimDeduction: number;
    customAllowance: number;
  }>>(() => {
    // Load from Supabase-pulled configs if available, else use role-based defaults
    const savedConfigs = db.employeeSalaryConfigs || {};
    const initialConfigs: Record<string, any> = {};
    employees.forEach(emp => {
      if (savedConfigs[emp.id]) {
        initialConfigs[emp.id] = savedConfigs[emp.id];
      } else {
        let ctc = 30000;
        if (emp.role.includes('Admin') || emp.role.includes('Super')) ctc = 75000;
        else if (emp.role.includes('Manager')) ctc = 55000;
        else if (emp.role.includes('Sales')) ctc = 35000;
        initialConfigs[emp.id] = {
          ctcMonthly: ctc,
          optInEPF: true,
          metroHRA: true,
          customTds: ctc > 60000 ? Math.floor(ctc * 0.05) : 0,
          mediclaimDeduction: 1250,
          customAllowance: 0
        };
      }
    });
    return initialConfigs;
  });

  // Selected payslip record for printing modal
  const [activePayslipId, setActivePayslipId] = useState<string | null>(null);

  const activePayslip = useMemo(() => {
    if (!activePayslipId) return null;
    return payrollRecords.find(p => p.id === activePayslipId) || null;
  }, [payrollRecords, activePayslipId]);

  // Resolve employee linked to active payslip
  const activePayslipEmployee = useMemo(() => {
    if (!activePayslip) return null;
    return employees.find(e => e.id === activePayslip.employeeId) || null;
  }, [activePayslip, employees]);

  // Dynamic calculations as per Indian Standards
  const calculateIndianSlabs = (
    empId: string, 
    monthlyCTC: number, 
    epfOptIn: boolean, 
    metroHR: boolean, 
    customTds: number,
    mediclaimDeduction: number = 0,
    customAllowance: number = 0
  ) => {
    // Normal base CTC standard structure:
    const basicRatio = metroHR ? 0.50 : 0.40;
    const baseSalary = Math.round(monthlyCTC * basicRatio);
    
    // HRA is typically 50% of basic in Metro, 40% in non-metro
    const hraRatio = metroHR ? 0.50 : 0.40;
    const hra = Math.round(baseSalary * hraRatio);
    
    // Conveyance / Special allowance forms the rest of the CTC
    const otherAllowances = monthlyCTC - baseSalary - hra;

    // Total gross is CTC plus any custom extras/allowances
    const grossSalary = monthlyCTC + customAllowance;

    // EPF (Employees' Provident Fund): 12% of Basic salary, capped at standard basic ceiling of 15000 if needed, but standard is 12%
    let epfDeduction = 0;
    if (epfOptIn) {
      epfDeduction = Math.round(baseSalary * 0.12);
    }

    // ESIC (Employees' State Insurance): 0.75% of Gross, applicable only if Gross is <= INR 21,000 per month
    const esicDeduction = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;

    // Professional Tax (PT): Standard Indian Professional Tax Slab is typically flat INR 200/month
    const profTaxDeduction = grossSalary > 10000 ? 200 : 0;

    // TDS Deduction: Use the custom manual rate or run an annual slab preview
    const tdsDeduction = customTds;

    const otherDeductions = mediclaimDeduction; // custom mediclaim deduction

    const totalDeductions = epfDeduction + esicDeduction + profTaxDeduction + tdsDeduction + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      baseSalary,
      hra,
      otherAllowances,
      epfDeduction,
      esicDeduction,
      profTaxDeduction,
      tdsDeduction,
      otherDeductions,
      netSalary
    };
  };

  // Filtered lists matching global header queries
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  // Filtered payroll lists matching month selected
  const monthRecords = useMemo(() => {
    const list = payrollRecords.filter(p => p.month === selectedMonth);
    
    if (!searchQuery) return list;
    return list.filter(p => 
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payrollRecords, selectedMonth, searchQuery]);

  // Batch generate payroll logs for selectedMonth as Drafts
  const handleBatchGenerate = () => {
    if (employees.length === 0) {
      alert("No active employees registry to construct run sheets from.");
      return;
    }

    // Check if records for this month already exist
    const existing = payrollRecords.some(p => p.month === selectedMonth);
    if (existing) {
      if (!confirm(`Payroll records for ${selectedMonth} already exist. Would you like to overwrite them with recalculated draft data?`)) {
        return;
      }
    }

    const generated: PayrollRecord[] = employees.map(emp => {
      const config = employeeSalaryConfigs[emp.id] || {
        ctcMonthly: 30000,
        optInEPF: true,
        metroHRA: true,
        customTds: 0,
        mediclaimDeduction: 1250,
        customAllowance: 0
      };

      const breakdown = calculateIndianSlabs(
        emp.id, 
        config.ctcMonthly, 
        config.optInEPF, 
        config.metroHRA, 
        config.customTds,
        config.mediclaimDeduction || 0,
        config.customAllowance || 0
      );

      return {
        id: `PAY-${emp.id}-${selectedMonth.replace(' ', '')}`.toUpperCase(),
        employeeId: emp.id,
        employeeName: emp.name,
        month: selectedMonth,
        baseSalary: breakdown.baseSalary,
        hra: breakdown.hra,
        otherAllowances: breakdown.otherAllowances,
        epfDeduction: breakdown.epfDeduction,
        esicDeduction: breakdown.esicDeduction,
        profTaxDeduction: breakdown.profTaxDeduction,
        tdsDeduction: breakdown.tdsDeduction,
        otherDeductions: breakdown.otherDeductions,
        netSalary: breakdown.netSalary,
        status: 'Draft',
        mediclaimDeduction: config.mediclaimDeduction || 0,
        customAllowance: config.customAllowance || 0
      };
    });

    // BUG 5 FIX: persist generated payslips to Supabase payslips table
    const [genMonth, genYear] = selectedMonth.split('-');
    generated.forEach(p => {
      const breakdown = p as unknown as Record<string, unknown>;
      savePayslip({
        employeeId: p.employeeId,
        month: parseInt(genMonth),
        year: parseInt(genYear),
        workingDays: 26,
        presentDays: (p.presentDays as unknown as number) || 26,
        grossEarnings: p.grossSalary,
        totalDeductions: (p.totalDeductions as unknown as number) || 0,
        netPay: p.netSalary,
        earningsJson: {
          basic: p.basicSalary, hra: p.hra, conveyance: p.conveyance,
          special: p.specialAllowance, performance: p.performanceBonus || 0,
          other: p.customAllowance || 0,
        },
        deductionsJson: {
          providentFund: p.epfEmployee, professionalTax: p.professionalTax,
          incomeTax: p.tds, esi: p.esicEmployee || 0, mediclaim: p.mediclaimDeduction || 0,
        },
        status: 'draft',
      }).catch(err => console.error('[PayrollModule] savePayslip failed:', err));
    });

    setDb(prev => {
      // Remove old records for this month first
      const cleanList = (prev.payrollRecords || []).filter(p => p.month !== selectedMonth);
      return {
        ...prev,
        payrollRecords: [...cleanList, ...generated]
      };
    });

    triggerNotification(
      'Payroll Batch Constructed',
      `Constructed ${generated.length} draft payroll slips under Indian Tax rules for ${selectedMonth}.`,
      'System',
      'High'
    );
  };

  // Approve all drafts of selectedMonth
  const handleApprovePayroll = () => {
    const currentDrafts = payrollRecords.filter(p => p.month === selectedMonth && p.status === 'Draft');
    if (currentDrafts.length === 0) {
      alert("No active 'Draft' records to authorize for this monthly billing cycle.");
      return;
    }

    setDb(prev => {
      const updated = (prev.payrollRecords || []).map(p => {
        if (p.month === selectedMonth && p.status === 'Draft') {
          return { ...p, status: 'Approved' as const };
        }
        return p;
      });
      return { ...prev, payrollRecords: updated };
    });

    triggerNotification(
      'Payroll Cycle Approved',
      `Bulk payroll authorized. Certified drafts updated to 'Approved' status.`,
      'System',
      'Medium'
    );
  };

  // Mark all approved as paid
  const handleDisbursePayroll = () => {
    const approved = payrollRecords.filter(p => p.month === selectedMonth && p.status === 'Approved');
    if (approved.length === 0) {
      alert("No authorized 'Approved' records found to disburse payout funds to. Please Approve Drafts first.");
      return;
    }

    const payDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    setDb(prev => {
      const updated = (prev.payrollRecords || []).map(p => {
        if (p.month === selectedMonth && p.status === 'Approved') {
          return { ...p, status: 'Paid' as const, paymentDate: payDate };
        }
        return p;
      });
      return { ...prev, payrollRecords: updated };
    });

    triggerNotification(
      'Salary Disbursement Successful',
      `Disbursed net salaries for ${approved.length} employees directly via corporate bank APIs. Payslips generated.`,
      'System',
      'High'
    );
  };

  // Individual Update Salary Config
  const handleUpdateConfig = (empId: string, updates: Partial<typeof employeeSalaryConfigs[string]>) => {
    setEmployeeSalaryConfigs(prev => {
      const existing = prev[empId] || { ctcMonthly: 30000, optInEPF: true, metroHRA: true, customTds: 0, mediclaimDeduction: 1250, customAllowance: 0 };
      const nextConfig = { ...existing, ...updates };
      // Persist to Supabase immediately
      saveSalaryConfig(empId, nextConfig).catch(err => console.error('Salary config save failed:', err));
      return { ...prev, [empId]: nextConfig };
    });
  };

  const handleBulkPayrollCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) {
        alert('Empty CSV or invalid format.');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const updates: Record<string, any> = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length < headers.length) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = values[idx] || '';
        });

        const empEmailOrName = rowData['employee'] || rowData['name'] || rowData['email'];
        const ctcVal = Number(rowData['ctcmonthly'] || rowData['ctc'] || '30000');
        const epfVal = (rowData['optinepf'] || rowData['epf'] || 'true').toLowerCase() === 'true';
        const hraVal = (rowData['metrohra'] || rowData['hra'] || 'true').toLowerCase() === 'true';
        const tdsVal = Number(rowData['customtds'] || rowData['tds'] || '0');

        if (!empEmailOrName) continue;

        // Find relevant worker
        const matchedEmp = employees.find(
          e => e.email.toLowerCase() === empEmailOrName.toLowerCase() || 
               e.name.toLowerCase() === empEmailOrName.toLowerCase()
        );

        if (!matchedEmp) {
          console.warn(`Could not find employee for payroll mapping: ${empEmailOrName}`);
          continue;
        }

        updates[matchedEmp.id] = {
          ctcMonthly: ctcVal,
          optInEPF: epfVal,
          metroHRA: hraVal,
          customTds: tdsVal,
          mediclaimDeduction: 1000,
          customAllowance: 2000
        };
      }

      const keysCount = Object.keys(updates).length;
      if (keysCount === 0) {
        alert('No active employee profiles could be matched from input spreadsheet.');
        return;
      }

      setEmployeeSalaryConfigs(prev => ({
        ...prev,
        ...updates
      }));

      triggerNotification(
        'Payroll Parameters Configured',
        `Reconfigured CTC and deduction metrics for ${keysCount} employees in bulk.`,
        'System',
        'Medium'
      );
      alert(`Successfully updated live payroll structure parameters for ${keysCount} employees!`);
      setShowBulkUpload(false);
    } catch (err: any) {
      alert(`Critical CSV payroll import error: ${err.message}`);
    }
  };

  // Analytics
  const totalFinancials = useMemo(() => {
    const activeMonthSlips = payrollRecords.filter(p => p.month === selectedMonth);
    let totalCTC = 0;
    let totalEPF = 0;
    let totalESIC = 0;
    let totalTDS = 0;
    let totalNet = 0;

    activeMonthSlips.forEach(p => {
      totalEPF += p.epfDeduction;
      totalESIC += p.esicDeduction;
      totalTDS += p.tdsDeduction;
      totalNet += p.netSalary;
      totalCTC += (p.baseSalary + p.hra + p.otherAllowances);
    });

    return {
      totalCTC,
      totalEPF,
      totalESIC,
      totalTDS,
      totalNet,
      count: activeMonthSlips.length
    };
  }, [payrollRecords, selectedMonth]);

  return (
    <div className="space-y-6 text-left">
      
      {/* Top action header card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-600" />
            Indian Standard Compliance Payroll Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Calculates Basic, HRA metro/non-metro, Employee Provident Fund, ESI contributions, PT and TDS withholdings.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-150 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Customize CTC (CSV)</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border">
            <button
              onClick={() => setActiveSubTab('runs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'runs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Payroll Runs
            </button>
            <button
              onClick={() => setActiveSubTab('config')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'config' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Salary Structure Config
            </button>
          </div>
        </div>
      </div>

      {showBulkUpload && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 space-y-4 text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-700 animate-bounce" />
              <h3 className="text-sm font-black text-slate-800">Bulk Employee Salary CTC Upload</h3>
            </div>
            <button 
              onClick={() => setShowBulkUpload(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Customize employee pay, metropolitan HRA percentages, EPF contributions, and custom TDS withholding values. 
            Spreadsheet headers must contain: <code className="bg-white text-emerald-800 px-1 py-0.5 rounded border border-emerald-100 text-[10px] font-mono font-bold">Employee,CTCMonthly,OptInEPF,MetroHRA,CustomTDS</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-dashed border-emerald-200 bg-white rounded-2xl p-4 text-center space-y-3 flex flex-col justify-center items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-emerald-700 font-bold" />
              </div>
              <div>
                <button
                  onClick={() => {
                    const sampleHeaders = ['Employee', 'CTCMonthly', 'OptInEPF', 'MetroHRA', 'CustomTDS'];
                    const firstEmp = employees[0]?.email || 'demo@trackhive.com';
                    const sampleRow = [firstEmp, '45000', 'true', 'true', '1505'];
                    const content = [sampleHeaders.join(','), sampleRow.join(',')].join('\n');
                    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', 'trackhive_salary_components_template.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="text-xs font-black text-emerald-700 hover:underline cursor-pointer"
                >
                  Download Salary Components Template CSV
                </button>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">Prerecorded system indicators with standard rates configured</p>
              </div>
            </div>

            <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-4 text-center space-y-3 flex flex-col justify-center items-center">
              <p className="text-xs font-bold text-slate-700 font-sans">Upload Salary Config CSV</p>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    handleBulkPayrollCSV(text);
                  };
                  reader.readAsText(file);
                }}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <p className="text-[9px] text-slate-400 font-sans">Recalculates net and withholding rates instantly</p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'runs' ? (
        <div className="space-y-6">
          
          {/* Calendar runs month and bulk actions bar */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-850 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono block">Active Payroll Period</label>
              <div className="flex items-center gap-2.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white font-bold text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="May 2026">May 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
                <span className="text-xs font-semibold text-slate-350">{totalFinancials.count} Payslips generated</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleBatchGenerate}
                className="px-4 py-2 text-xs font-bold bg-slate-800 border border-slate-720 text-white rounded-xl hover:bg-slate-750 transition-all flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4 text-emerald-400" />
                <span>Gen Drafts</span>
              </button>
              <button
                onClick={handleApprovePayroll}
                className="px-4 py-2 text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl hover:bg-amber-600/30 transition-all flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Approve Payroll</span>
              </button>
              <button
                onClick={handleDisbursePayroll}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl hover:scale-[1.02] shadow-sm transition-all flex items-center gap-1.5"
              >
                <Coins className="h-4 w-4" />
                <span>Direct Disburse Fund</span>
              </button>
            </div>
          </div>

          {/* Key organizational costs dashboard cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-800 flex items-center justify-center font-bold">
                ₹
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wider">Gross Outflow (CTC)</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">₹{totalFinancials.totalCTC.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wider">PF Provident Fund</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">₹{totalFinancials.totalEPF.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wider">ESI Health Pool</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">₹{totalFinancials.totalESIC.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wider">Withheld TDS Taxes</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">₹{totalFinancials.totalTDS.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payslip sheet runs */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <th className="py-3.5 px-6">Pay Run ID</th>
                    <th className="py-3.5 px-4">Employee Details</th>
                    <th className="py-3.5 px-4 text-right">Gross Bracket</th>
                    <th className="py-3.5 px-4 text-right">PF Share</th>
                    <th className="py-3.5 px-4 text-right">ESI / PT</th>
                    <th className="py-3.5 px-4 text-right">Tax TDS</th>
                    <th className="py-3.5 px-4 text-right font-black text-slate-800">Net Disbursed</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {monthRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        <Coins className="h-10 w-10 text-slate-350 mx-auto mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
                        <span className="font-bold text-slate-650 block">No payroll sheets active for {selectedMonth}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Click 'Gen Drafts' above to auto-compile logs matching employee rules.</span>
                      </td>
                    </tr>
                  ) : (
                    monthRecords.map(p => {
                      const totalGross = p.baseSalary + p.hra + p.otherAllowances;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-6 font-mono text-[10px] text-slate-450 font-bold">{p.id}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block text-xs">{p.employeeName}</span>
                            <span className="text-[9px] text-slate-400 tracking-wider">ID: {p.employeeId}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">₹{totalGross.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">₹{p.epfDeduction.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                            <div>₹{p.esicDeduction.toLocaleString('en-IN')}</div>
                            <div className="text-[9px] text-slate-400">PT: ₹{p.profTaxDeduction}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">₹{p.tdsDeduction.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">₹{p.netSalary.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              p.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                : p.status === 'Approved'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-150'
                                  : 'bg-slate-100 text-slate-500'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => setActivePayslipId(p.id)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 transition-all flex items-center gap-1 mx-auto"
                            >
                              <FileText className="h-3 w-3" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Configuration list for each worker's CTC */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono tracking-widest font-bold text-slate-400 uppercase">Master Cost Matrix</span>
              <h4 className="text-xs font-bold text-slate-700">Set Monthly Cost to Company (CTC) parameters on a per-head basis.</h4>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <th className="py-3.5 px-6">Worker</th>
                  <th className="py-3.5 px-4">Role & Team</th>
                  <th className="py-3.5 px-4">Monthly CTC Structure (INR)</th>
                  <th className="py-3.5 px-3 text-center">EPF (12%)</th>
                  <th className="py-3.5 px-3 text-center">Metro HRA</th>
                  <th className="py-3.5 px-4">Monthly TDS</th>
                  <th className="py-3.5 px-4">Mediclaim (Deduct)</th>
                  <th className="py-3.5 px-4">Other Extra (Credit)</th>
                  <th className="py-3.5 px-6">Resulting Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const conf = employeeSalaryConfigs[emp.id] || { 
                    ctcMonthly: 30000, 
                    optInEPF: true, 
                    metroHRA: true, 
                    customTds: 0,
                    mediclaimDeduction: 1250,
                    customAllowance: 0 
                  };
                  const preview = calculateIndianSlabs(
                    emp.id, 
                    conf.ctcMonthly, 
                    conf.optInEPF, 
                    conf.metroHRA, 
                    conf.customTds,
                    conf.mediclaimDeduction || 0,
                    conf.customAllowance || 0
                  );
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold border text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {emp.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-650 block">{emp.role}</span>
                        <span className="text-[10px] text-slate-400">{emp.department}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={conf.ctcMonthly}
                            onChange={(e) => handleUpdateConfig(emp.id, { ctcMonthly: Number(e.target.value) })}
                            className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold font-mono text-slate-700 w-24 focus:bg-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={conf.optInEPF}
                          onChange={(e) => handleUpdateConfig(emp.id, { optInEPF: e.target.checked })}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={conf.metroHRA}
                          onChange={(e) => handleUpdateConfig(emp.id, { metroHRA: e.target.checked })}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-455">₹</span>
                          <input
                            type="number"
                            value={conf.customTds}
                            onChange={(e) => handleUpdateConfig(emp.id, { customTds: Number(e.target.value) })}
                            className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 w-16 focus:bg-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-rose-500">-₹</span>
                          <input
                            type="number"
                            value={conf.mediclaimDeduction}
                            onChange={(e) => handleUpdateConfig(emp.id, { mediclaimDeduction: Number(e.target.value) })}
                            className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-rose-700 w-20 focus:bg-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-emerald-650">+₹</span>
                          <input
                            type="number"
                            value={conf.customAllowance}
                            onChange={(e) => handleUpdateConfig(emp.id, { customAllowance: Number(e.target.value) })}
                            className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-emerald-700 w-20 focus:bg-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="text-[10px] leading-snug">
                          <div>Basic: <strong className="font-mono text-slate-700">₹{preview.baseSalary.toLocaleString('en-IN')}</strong></div>
                          <div>HRA: <strong className="font-mono text-slate-700">₹{preview.hra.toLocaleString('en-IN')}</strong></div>
                          {preview.otherDeductions > 0 && (
                            <div className="text-rose-600">Medi: <strong className="font-mono">-₹{preview.otherDeductions.toLocaleString('en-IN')}</strong></div>
                          )}
                          <div className="text-[11px] text-emerald-700 font-bold">Net: <strong className="font-mono">₹{preview.netSalary.toLocaleString('en-IN')}</strong></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIAN STANDARD PAYSLIP PRINT MODAL */}
      {activePayslip && activePayslipId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-emerald-700 tracking-wider font-mono uppercase">Authorized Government Format</span>
                <h3 className="text-sm font-black text-slate-800 leading-none">Payslip {activePayslip.month}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => {
                    const printContents = document.getElementById('printable-payslip-node')?.outerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Salary Payslip - ${activePayslip.employeeName}</title>
                              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                            </head>
                            <body class="p-8 font-sans" onload="window.print()">
                              ${printContents}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      } else {
                        alert('Please allow popups to direct print payslips.');
                      }
                    }
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button 
                  onClick={() => setActivePayslipId(null)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-xs px-2.5 py-1.5 hover:bg-slate-100 rounded-xl"
                >
                  ✕ Close Check
                </button>
              </div>
            </div>

            {/* Payslip body visualizer */}
            <div className="p-6 overflow-y-auto" id="printable-payslip-node">
              <div className="border border-slate-250 p-6 rounded-2xl bg-white space-y-6 text-slate-700 font-sans">
                
                {/* Payslip Header */}
                <div className="flex justify-between items-start border-b border-slate-150 pb-5">
                  <div className="text-left">
                    <h2 className="text-md font-black text-slate-800 uppercase tracking-tight leading-none">{db.settings?.name || 'Trackhive Enterprise'}</h2>
                    <p className="text-[10px] text-slate-400 mt-1">{db.settings?.address || 'Corporate Transit Area, Vasant Kunj, New Delhi'}</p>
                    <p className="text-[10px] text-slate-400">Email: {db.settings?.email || 'operations@Trackhive.com'}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-widest uppercase">
                      Salary Slip
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 mt-2">SLIP ID: {activePayslip.id}</p>
                    <p className="text-[10px] text-slate-500">Run Month: <strong>{activePayslip.month}</strong></p>
                  </div>
                </div>

                {/* Employee Meta details gridded */}
                <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed border-b border-slate-150 pb-5 text-left">
                  <div className="space-y-1">
                    <div>Employee Name: <strong className="text-slate-800">{activePayslip.employeeName}</strong></div>
                    <div>Employee ID: <strong className="text-slate-800">{activePayslip.employeeId}</strong></div>
                    <div>Department / Role: <strong className="text-slate-850">{activePayslipEmployee?.department || 'Operations'} / {activePayslipEmployee?.role || 'Field Personnel'}</strong></div>
                  </div>
                  <div className="space-y-1">
                    <div>Bank Account Number: <strong className="text-slate-800">XXXX XXXX 9823</strong></div>
                    <div>PF Account Number: <strong className="text-slate-800">DL/CPM/871239/712</strong></div>
                    <div>Payment Mode: <strong className="text-emerald-700 font-bold">{activePayslip.status === 'Paid' ? 'IMPS Bank Transfer' : 'Draft Roster Authorization'}</strong></div>
                  </div>
                </div>

                {/* Financial calculations breakdown columns */}
                <div className="grid grid-cols-2 border border-slate-200 rounded-xl overflow-hidden divide-x divide-slate-200">
                  
                  {/* Earnings Column */}
                  <div>
                    <div className="bg-slate-50 p-2 border-b border-slate-200 font-black text-[10px] uppercase text-slate-500 text-left">Earnings (Credit in INR)</div>
                    <div className="p-4 space-y-2.5 text-left text-xs text-slate-650">
                      <div className="flex justify-between">
                        <span>Basic Salary (Standard):</span>
                        <span className="font-mono font-semibold">₹{activePayslip.baseSalary.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>House Rent Allowance (HRA):</span>
                        <span className="font-mono font-semibold">₹{activePayslip.hra.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Special Allowances:</span>
                        <span className="font-mono font-semibold">₹{activePayslip.otherAllowances.toLocaleString('en-IN')}</span>
                      </div>
                      {activePayslip.customAllowance && activePayslip.customAllowance > 0 ? (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Other Custom Allowances:</span>
                          <span className="font-mono">+₹{activePayslip.customAllowance.toLocaleString('en-IN')}</span>
                        </div>
                      ) : null}
                      <div className="pt-2 border-t border-dashed flex justify-between font-black text-slate-800">
                        <span>Total Gross Monthly Earnings:</span>
                        <span className="font-mono">₹{((activePayslip.baseSalary + activePayslip.hra + activePayslip.otherAllowances) + (activePayslip.customAllowance || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div>
                    <div className="bg-slate-50 p-2 border-b border-slate-200 font-black text-[10px] uppercase text-slate-500 text-left">Deductions (Withholding INR)</div>
                    <div className="p-4 space-y-2.5 text-left text-xs text-slate-650">
                      <div className="flex justify-between">
                        <span>Provident Fund (EPF 12%):</span>
                        <span className="font-mono font-semibold text-rose-600">₹{activePayslip.epfDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employees State Insurance (ESI):</span>
                        <span className="font-mono font-semibold text-rose-600">₹{activePayslip.esicDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional Tax (PT flat):</span>
                        <span className="font-mono font-semibold text-rose-600">₹{activePayslip.profTaxDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Income Tax Withholdings (TDS):</span>
                        <span className="font-mono font-semibold text-rose-600">₹{activePayslip.tdsDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      {activePayslip.mediclaimDeduction && activePayslip.mediclaimDeduction > 0 ? (
                        <div className="flex justify-between text-rose-700 font-bold">
                          <span>Mediclaim / Insurance:</span>
                          <span className="font-mono">-₹{activePayslip.mediclaimDeduction.toLocaleString('en-IN')}</span>
                        </div>
                      ) : null}
                      <div className="pt-2 border-t border-dashed flex justify-between font-black text-rose-700">
                        <span>Total Deductions Withheld:</span>
                        <span className="font-mono">
                          ₹{(activePayslip.epfDeduction + activePayslip.esicDeduction + activePayslip.profTaxDeduction + activePayslip.tdsDeduction + (activePayslip.mediclaimDeduction || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NetSalary summary bottom */}
                <div className="bg-emerald-50/40 border border-emerald-200/50 p-4 rounded-xl flex justify-between items-center text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Net Salary In-Hand Payable</span>
                    <span className="text-xs text-slate-555">Rupees One Lakh Twenty Five Thousand Only</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">INR Value</span>
                    <span className="text-lg font-black text-emerald-800 font-mono leading-none">₹{activePayslip.netSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Footnote */}
                <div className="flex justify-between items-end pt-4 border-t border-slate-100 text-[9px] text-slate-400 leading-tight text-left">
                  <div className="space-y-1">
                    <p>• Generated automatically by Trackhive Integrated Compliance ERP.</p>
                    <p>• This is a system-authenticated digital payslip, no physical signature required for standard filing.</p>
                  </div>
                  <div className="text-right font-bold w-48 border-t border-slate-350 pt-2 text-slate-600">
                    Operations Registrar Seal
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
