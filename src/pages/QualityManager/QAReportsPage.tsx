// ==========================================
// QAReportsPage.tsx
// Quality Manager — Quality Reports (Branch-only)
// Shows: Approval vs rejection rate, top defect types,
// defect trend, rework count, CAPA completion rate,
// inspection turnaround time. Filterable + exportable.
// ==========================================

import React, { useState } from "react";
import QALayout from "../../layout/QALayout";
import ReportCard from "../../components/ui/ReportCard";
import StatsCard from "../../components/ui/StatsCard";
import DefectTrendChart, { type TrendDataPoint } from "../../components/ui/DefectTrendChart";
import Toast from "../../components/ui/Toast";
import SecondaryButton from "../../components/ui/SecondaryButton";
import {
  CheckCircle2,
  XCircle,
  Bug,
  TrendingDown,
  RotateCcw,
  ShieldCheck,
  Clock,
  Download,
  Lock,
} from "lucide-react";

// ------------------------------------------
// Mock report data
// ------------------------------------------
const approvalRejectionData = [
  { period: "Week 1 (Jan 27 – Feb 2)", approved: 8, rejected: 2, rate: "20%" },
  { period: "Week 2 (Feb 3 – Feb 9)", approved: 10, rejected: 3, rate: "23%" },
  { period: "Week 3 (Feb 10 – Feb 13)", approved: 6, rejected: 1, rate: "14%" },
];

const topDefectTypesData = [
  { type: "Stitching", count: 34, pctTotal: "44%" },
  { type: "Fabric Defect", count: 18, pctTotal: "23%" },
  { type: "Color Issue", count: 12, pctTotal: "15%" },
  { type: "Size Mismatch", count: 8, pctTotal: "10%" },
  { type: "Finishing", count: 5, pctTotal: "6%" },
];

const defectTrendData: TrendDataPoint[] = [
  { label: "Jan 27", value: 5 },
  { label: "Jan 28", value: 8 },
  { label: "Jan 29", value: 3 },
  { label: "Jan 30", value: 7 },
  { label: "Jan 31", value: 6 },
  { label: "Feb 1", value: 4 },
  { label: "Feb 2", value: 2 },
  { label: "Feb 3", value: 9 },
  { label: "Feb 4", value: 11 },
  { label: "Feb 5", value: 6 },
  { label: "Feb 6", value: 8 },
  { label: "Feb 7", value: 14 },
  { label: "Feb 8", value: 7 },
  { label: "Feb 9", value: 5 },
];

const capaCompletionData = [
  { status: "Verified", count: 1 },
  { status: "Completed (awaiting verification)", count: 2 },
  { status: "In Progress", count: 1 },
  { status: "Open", count: 2 },
];

const turnaroundData = [
  { metric: "Average Inspection Time", value: "1.4 days" },
  { metric: "Fastest Inspection", value: "0.5 days" },
  { metric: "Slowest Inspection", value: "3.2 days" },
  { metric: "Overdue Inspections", value: "2" },
];

// ==========================================
// Component
// ==========================================
const QAReportsPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState("2026-01-27");
  const [filterDateTo, setFilterDateTo] = useState("2026-02-13");

  const handleExport = (reportName: string) => {
    setToast({ message: `Exporting "${reportName}" report…`, type: "success" });
  };

  // Computed KPIs
  const totalApproved = approvalRejectionData.reduce((s, r) => s + r.approved, 0);
  const totalRejected = approvalRejectionData.reduce((s, r) => s + r.rejected, 0);
  const overallRejRate = totalApproved + totalRejected > 0 ? ((totalRejected / (totalApproved + totalRejected)) * 100).toFixed(1) : "0";

  return (
    <QALayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Page Header — consistent with PLM pages */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quality Reports</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Branch-level quality analytics and report generation</p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton icon={Download} onClick={() => handleExport("Full Quality Report")}>Export All</SecondaryButton>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-semibold">
              <Lock size={12} />Branch: Manila
            </div>
          </div>
        </div>

        {/* KPI Summary Cards — 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Overall Rejection Rate" value={`${overallRejRate}%`} icon={XCircle} color="bg-rose-500" trend={`${totalRejected} rejected / ${totalApproved + totalRejected} total`} trendUp={false} />
          <StatsCard title="Total Inspections" value={totalApproved + totalRejected} icon={CheckCircle2} color="bg-emerald-500" trend={`${totalApproved} approved`} trendUp={true} />
          <StatsCard title="Avg Turnaround" value="1.4 days" icon={Clock} color="bg-blue-500" trend="Fastest: 0.5 days" trendUp={true} />
        </div>

        {/* Date Range Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Report Filters</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">From:</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">To:</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Approval vs Rejection Rate */}
          <ReportCard title="Approval vs Rejection Rate" icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-900/30" onExport={() => handleExport("Approval Rate")}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">Period</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">Approved</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">Rejected</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">Reject Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {approvalRejectionData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-xs text-slate-700 dark:text-slate-300 py-2.5">{row.period}</td>
                      <td className="text-xs font-bold text-emerald-600 py-2.5 text-left">{row.approved}</td>
                      <td className="text-xs font-bold text-rose-600 py-2.5 text-left">{row.rejected}</td>
                      <td className="text-xs font-bold text-slate-800 dark:text-slate-200 py-2.5 text-left">{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard>

          {/* 2. Top Defect Types */}
          <ReportCard title="Top Defect Types" icon={Bug} iconColor="text-rose-600" iconBg="bg-rose-50 dark:bg-rose-900/30" onExport={() => handleExport("Defect Types")}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">Type</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">Count</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase py-2 text-left">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {topDefectTypesData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-xs text-slate-700 dark:text-slate-300 py-2.5">{row.type}</td>
                      <td className="text-xs font-bold text-slate-800 dark:text-slate-200 py-2.5 text-left">{row.count}</td>
                      <td className="text-xs font-bold text-slate-600 dark:text-slate-400 py-2.5 text-left">{row.pctTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard>
        </div>

        {/* Defect Trend Chart (full width) — Modern with gradient and animation */}
        <DefectTrendChart
          title="Defect Trend by Date"
          data={defectTrendData}
          gradientFrom="#f43f5e"
          gradientTo="#fb7185"
          icon={TrendingDown}
          iconBg="bg-rose-50 dark:bg-rose-900/30"
          iconColor="text-rose-600 dark:text-rose-400"
          maxBarHeight={100}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Rework / Re-inspection Count */}
          <ReportCard title="Rework & Re-inspection" icon={RotateCcw} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-900/30" onExport={() => handleExport("Rework Count")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">3</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Re-inspections This Period</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">47</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Units Reworked</p>
              </div>
            </div>
          </ReportCard>

          {/* 4. CAPA Completion Rate */}
          <ReportCard title="CAPA Completion Rate" icon={ShieldCheck} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-900/30" onExport={() => handleExport("CAPA Completion")}>
            <div className="space-y-3">
              {capaCompletionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300">{item.status}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Total CAPA</span>
                <span className="text-xs font-bold text-indigo-600">6</span>
              </div>
            </div>
          </ReportCard>
        </div>

        {/* 5. Inspection Turnaround Time */}
        <ReportCard title="Inspection Turnaround Time" icon={Clock} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-900/30" onExport={() => handleExport("Turnaround Time")}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {turnaroundData.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{item.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{item.metric}</p>
              </div>
            ))}
          </div>
        </ReportCard>
      </div>
    </QALayout>
  );
};

export default QAReportsPage;
