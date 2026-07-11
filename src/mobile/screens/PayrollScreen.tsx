import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronDown, MoreVertical, MapPin, 
  Wallet, ChevronUp, FileText, Info, Download, 
  CheckCircle, Landmark, Banknote
} from 'lucide-react';
import { fetchPayslip, getMobileSession } from '../apiBridge';

export default function PayrollScreen() {
  const [payslip, setPayslip] = useState<any>(null);
  useEffect(() => { const s = getMobileSession(); if (s) fetchPayslip(s.userId).then(p => { if (p) setPayslip(p); }); }, []);
  const [earningsExpanded, setEarningsExpanded] = useState(true);
  const [deductionsExpanded, setDeductionsExpanded] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // June 2024 salary details

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans" id="payroll-container">
      {/* Title block */}
      <div className="p-4 flex justify-between items-center" id="payroll-heading">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Indian Payroll</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Corporate overview and salary details</p>
        </div>
        <button className="bg-[#FFF] border border-[#E5E7EB] hover:bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition cursor-pointer shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-slate-700">June 2024</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Employee Identity profile Card */}
      <div className="mx-4 p-4 rounded-2xl bg-[#FFF] border border-[#E5E7EB] shadow-xs relative" id="payroll-profile-card">
        <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
          <MoreVertical className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row gap-4 items-center md:items-start" id="payroll-profile-identity">
          {/* Circular Photo */}
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 overflow-hidden relative shadow-xs">
            <img 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80" 
              alt="Sourav Gupta" 
              className="w-full h-full object-cover" 
            />
            <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#FFF]" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="font-extrabold text-[#111827] text-base leading-tight">Sourav Gupta</h3>
            <p className="text-slate-500 text-xs mt-0.5 font-bold">Super Administrator</p>
            <span className="inline-block mt-2 bg-blue-50 text-[#1E40AF] border border-blue-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider leading-none">
              EMP001
            </span>
            <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] text-slate-500 mt-2 font-bold">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Hyderabad, Telangana</span>
            </div>
          </div>
        </div>

        {/* Pay cycle grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4 pt-3.5 border-t border-slate-100 text-xs" id="payroll-meta-params">
          <div className="flex justify-between border-r border-slate-100 pr-2">
            <span className="text-slate-400 font-bold">Pay Cycle</span>
            <span className="font-bold text-slate-805">Monthly</span>
          </div>
          <div className="flex justify-between pl-2">
            <span className="text-slate-400 font-bold font-sans">Pay Date</span>
            <span className="font-bold text-slate-805">30 Jun 2024</span>
          </div>

          <div className="flex justify-between border-r border-slate-100 pr-2 pt-1">
            <span className="text-slate-400 font-bold">Emp Type</span>
            <span className="font-bold text-slate-855">Full Time</span>
          </div>
          <div className="flex justify-between pl-2 pt-1">
            <span className="text-slate-400 font-bold">Bank A/C</span>
            <span className="font-sans font-bold text-slate-855 tracking-wider">**** 4567</span>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Accordion */}
      <div className="mx-4 mt-4 bg-[#FFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs" id="earnings-accordion">
        <button 
          onClick={() => setEarningsExpanded(!earningsExpanded)}
          className="w-full flex justify-between items-center bg-blue-50/20 px-4 py-3 border-b border-[#E5E7EB] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#2563EB]" />
            <span className="font-black text-xs tracking-wide uppercase text-slate-700">Earnings Breakdown</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xs text-[#2563EB]">₹ 78,500.00</span>
            {earningsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {earningsExpanded && (
          <div className="p-4 text-xs font-medium space-y-3 bg-[#FFF]" id="earnings-table-block">
            <div className="grid grid-cols-12 text-[10px] text-slate-400 uppercase tracking-wider font-bold pb-1.5 border-b border-slate-100">
              <div className="col-span-6">Earning Component</div>
              <div className="col-span-3 text-right">Amount (₹)</div>
              <div className="col-span-3 text-right">YTD (₹)</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Basic Salary</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 40,000.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 4,80,000.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">House Rent Allowance (HRA)</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 16,000.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 1,92,000.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Conveyance Allowance</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 4,800.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 57,600.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Special Allowance</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 12,500.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 1,50,000.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Performance Bonus</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 5,000.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 60,000.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Other Allowance</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 300.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 3,600.00</div>
            </div>

            <div className="grid grid-cols-12 font-extrabold text-emerald-700 pt-3 border-t border-slate-100">
              <div className="col-span-6 text-slate-700">Total Gross Earnings</div>
              <div className="col-span-3 text-right font-sans">₹ 78,500.00</div>
              <div className="col-span-3 text-right font-sans">₹ 9,43,200.00</div>
            </div>
          </div>
        )}
      </div>

      {/* Deductions Breakdown Accordion */}
      <div className="mx-4 mt-3 bg-[#FFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs" id="deductions-accordion">
        <button 
          onClick={() => setDeductionsExpanded(!deductionsExpanded)}
          className="w-full flex justify-between items-center bg-red-50/10 px-4 py-3 border-b border-[#E5E7EB] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#EF4444]" />
            <span className="font-black text-xs tracking-wide uppercase text-slate-700">Deductions Breakdown</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xs text-[#EF4444]">₹ 13,472.00</span>
            {deductionsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {deductionsExpanded && (
          <div className="p-4 text-xs font-medium space-y-3 bg-[#FFF]" id="deductions-table-block">
            <div className="grid grid-cols-12 text-[10px] text-slate-400 uppercase tracking-wider font-bold pb-1.5 border-b border-slate-100">
              <div className="col-span-6">Deduction Component</div>
              <div className="col-span-3 text-right">Amount (₹)</div>
              <div className="col-span-3 text-right">YTD (₹)</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Provident Fund (PF)</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 4,800.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 57,600.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Professional Tax</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 200.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 2,400.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Income Tax (TDS)</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 6,500.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 78,000.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold font-sans">ESI Employee Contribution</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 972.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 11,664.00</div>
            </div>

            <div className="grid grid-cols-12 text-slate-700">
              <div className="col-span-6 text-[#111827] font-bold">Other Deductions</div>
              <div className="col-span-3 text-right font-sans font-bold">₹ 1,000.00</div>
              <div className="col-span-3 text-right text-slate-400 font-sans font-bold">₹ 12,000.00</div>
            </div>

            <div className="grid grid-cols-12 font-extrabold text-[#EF4444] pt-3 border-t border-slate-100">
              <div className="col-span-6 text-slate-750">Total Deductions</div>
              <div className="col-span-3 text-right font-sans">₹ 13,472.00</div>
              <div className="col-span-3 text-right font-sans">₹ 1,61,664.00</div>
            </div>
          </div>
        )}
      </div>

      {/* Net Pay Card with absolute grid Watermarked text background */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-[#DCFCE7] border border-green-200 relative overflow-hidden shadow-xs animate-fade-in" id="payroll-netpay-card">
        {/* Cash ghost watermark stacked inside */}
        <div className="absolute right-2 top-2 text-[#166534]/5 rotate-12 z-0 font-extrabold select-none pointer-events-none">
          <Banknote className="w-32 h-32 text-[#166534]/5" strokeWidth={1} />
        </div>

        <div className="relative z-10" id="payroll-netpay-text">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="p-1.5 rounded-full bg-[#166534]/10 text-[#166534]">
              <Wallet className="w-3.5 h-3.5" />
            </span>
            <span className="font-black text-xs tracking-wider uppercase text-emerald-800">Net Pay (Take Home)</span>
          </div>
          
          <h1 className="text-3xl font-black text-[#166534] mt-2 tracking-tight">
            ₹ 65,028.00
          </h1>

          <p className="text-[10px] font-bold text-emerald-850 mt-2">
            In words: Sixty Five Thousand Twenty Eight Rupees Only
          </p>
        </div>
      </div>

      {/* Note and Download row */}
      <div className="mx-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-505" id="payroll-concluding-note">
        <div className="flex items-start gap-2 max-w-[280px]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-[10.5px] font-medium">
            <span className="font-extrabold text-slate-700">Note:</span> This is a system-generated secure pay document register in standard corporate field force metrics.
          </p>
        </div>

        <button 
          id="download-pay-slip-btn"
          onClick={handleDownload}
          className="w-full sm:w-auto bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/20 font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition leading-none text-xs cursor-pointer shadow-xs"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 shrink-0" />
              <span>Download payslip</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
