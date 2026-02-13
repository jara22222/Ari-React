// ==========================================
// QAInspectionRecordsPage.tsx
// Quality Manager — Inspection Records (History)
// View all completed inspections. Supports
// view details, export, and reopen actions.
// ==========================================

import React, { useState, useMemo } from "react";
import QALayout from "../../layout/QALayout";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import Pagination from "../../components/ui/Pagination";
import PageModal from "../../components/ui/PageModal";
import Toast from "../../components/ui/Toast";
import InputGroup from "../../components/ui/InputGroup";
import SecondaryButton from "../../components/ui/SecondaryButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import IconSelect from "../../components/ui/IconSelect";
import ProgressBar from "../../components/ui/ProgressBar";
import {
  Eye,
  Download,
  RotateCcw,
  FileText,
  Archive,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface InspectionRecord {
  id: string;
  inspectionId: string;
  workOrder: string;
  sku: string;
  productName: string;
  result: "Approved" | "Rejected";
  defectCount: number;
  defectRate: number;
  inspector: string;
  qaDecisionBy: string;
  dateCompleted: string;
  checklistScore: number;
  notes: string;
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockRecords: InspectionRecord[] = [
  { id: "1", inspectionId: "INS-015", workOrder: "WO-095", sku: "SKU-003", productName: "Polo Shirt V1.2", result: "Approved", defectCount: 1, defectRate: 0.3, inspector: "Ana Reyes", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-10", checklistScore: 95, notes: "Minor label offset on 1 unit." },
  { id: "2", inspectionId: "INS-014", workOrder: "WO-094", sku: "SKU-001", productName: "Basic Tee V1.5", result: "Approved", defectCount: 0, defectRate: 0, inspector: "Carlos Tan", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-09", checklistScore: 100, notes: "" },
  { id: "3", inspectionId: "INS-013", workOrder: "WO-093", sku: "SKU-002", productName: "Hoodie V1.0", result: "Rejected", defectCount: 18, defectRate: 4.5, inspector: "Ana Reyes", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-08", checklistScore: 62, notes: "Multiple stitching defects. CAPA required." },
  { id: "4", inspectionId: "INS-012", workOrder: "WO-092", sku: "SKU-005", productName: "Denim Jacket V1.0", result: "Rejected", defectCount: 15, defectRate: 7.5, inspector: "Carlos Tan", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-07", checklistScore: 54, notes: "Fabric tear detected on 15 units." },
  { id: "5", inspectionId: "INS-011", workOrder: "WO-091", sku: "SKU-004", productName: "Joggers V1.8", result: "Approved", defectCount: 2, defectRate: 0.5, inspector: "Ana Reyes", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-06", checklistScore: 90, notes: "Two units with minor color variation." },
  { id: "6", inspectionId: "INS-010", workOrder: "WO-090", sku: "SKU-001", productName: "Basic Tee V1.5 (B2)", result: "Approved", defectCount: 0, defectRate: 0, inspector: "Jessa Lim", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-05", checklistScore: 100, notes: "" },
  { id: "7", inspectionId: "INS-009", workOrder: "WO-089", sku: "SKU-006", productName: "Tank Top V1.0", result: "Approved", defectCount: 3, defectRate: 1.0, inspector: "Carlos Tan", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-04", checklistScore: 88, notes: "Minor finishing defects." },
  { id: "8", inspectionId: "INS-008", workOrder: "WO-088", sku: "SKU-002", productName: "Hoodie V1.0 (B2)", result: "Rejected", defectCount: 22, defectRate: 5.5, inspector: "Ana Reyes", qaDecisionBy: "Lorna Garcia", dateCompleted: "2026-02-03", checklistScore: 48, notes: "Recurring stitching issue. CAPA-003 created." },
];

const resultOptions = [
  { value: "", label: "All Results" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const ITEMS_PER_PAGE = 6;

// ==========================================
// Component
// ==========================================
const QAInspectionRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<InspectionRecord[]>(mockRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterResult, setFilterResult] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [reopenRecord, setReopenRecord] = useState<InspectionRecord | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...records];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (r) =>
          r.inspectionId.toLowerCase().includes(q) ||
          r.workOrder.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.inspector.toLowerCase().includes(q)
      );
    }
    if (filterResult) data = data.filter((r) => r.result === filterResult);
    return data;
  }, [records, searchQuery, filterResult]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const handleView = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleExport = (record: InspectionRecord) => {
    setToast({ message: `Exporting inspection report for ${record.inspectionId}…`, type: "success" });
  };

  const handleReopen = (record: InspectionRecord) => {
    setReopenRecord(record);
    setReopenReason("");
    setIsReopenOpen(true);
  };

  const confirmReopen = () => {
    if (!reopenReason.trim()) {
      setToast({ message: "Please provide a reason for reopening.", type: "error" });
      return;
    }
    setToast({ message: `${reopenRecord?.inspectionId} reopened for re-inspection.`, type: "success" });
    setIsReopenOpen(false);
    setReopenRecord(null);
  };

  return (
    <QALayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inspection Records</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Historical inspection records and audit trail</p>
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by Inspection ID, WO, Product, or Inspector…"
      >
        <div className="p-3">
          <IconSelect label="Result" value={filterResult} onChange={(v) => { setFilterResult(v); setCurrentPage(1); }} options={resultOptions} placeholder="All Results" />
        </div>
      </TableToolbar>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inspection ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Work Order</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Defects</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inspector</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">QA Decision By</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{record.inspectionId}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{record.workOrder}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{record.productName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{record.sku}</p>
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={record.result} /></td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{record.defectCount}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{record.inspector}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{record.qaDecisionBy}</td>
                    <td className="px-6 py-3 text-[11px] text-slate-600 dark:text-slate-400">{record.dateCompleted}</td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleView(record)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View Details"><Eye size={14} /></button>
                        <button onClick={() => handleExport(record)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Export"><Download size={14} /></button>
                        <button
                          onClick={() => handleReopen(record)}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg transition-all active:scale-95"
                          title="Reopen"
                        >
                          <RotateCcw size={12} />
                          Reopen
                        </button>
                        <button onClick={() => { setRecords(prev => prev.filter(x => x.id !== record.id)); setToast({ message: "Item archived successfully", type: "success" }); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400 italic">No inspection records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} endIndex={endIndex} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* Detail Modal */}
      <PageModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedRecord?.inspectionId || ""}
        subtitle={`${selectedRecord?.workOrder} · ${selectedRecord?.sku} — ${selectedRecord?.productName}`}
        badges={selectedRecord ? <StatusBadge status={selectedRecord.result} /> : undefined}
      >
        {selectedRecord && (
          <div className="space-y-5">
            <ProgressBar value={selectedRecord.checklistScore} label="Checklist Score" status={selectedRecord.checklistScore >= 80 ? "on-track" : selectedRecord.checklistScore >= 60 ? "at-risk" : "delayed"} height="h-2.5" />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Defect Count</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedRecord.defectCount}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Defect Rate</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedRecord.defectRate}%</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inspector</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedRecord.inspector}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">QA Decision By</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedRecord.qaDecisionBy}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Completed</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedRecord.dateCompleted}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Result</label><p className="mt-1"><StatusBadge status={selectedRecord.result} /></p></div>
            </div>
            {selectedRecord.notes && (
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedRecord.notes}</p></div>
            )}
          </div>
        )}
      </PageModal>

      {/* Reopen Modal */}
      <PageModal
        isOpen={isReopenOpen}
        onClose={() => { setIsReopenOpen(false); setReopenRecord(null); }}
        title={`Reopen Inspection — ${reopenRecord?.inspectionId}`}
        subtitle="This action requires a reason and will be audit-logged"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsReopenOpen(false); setReopenRecord(null); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={confirmReopen} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">Reopen Inspection</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
            <RotateCcw size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Reopening an inspection will move it back to the inspection queue for re-evaluation. A reason is required for the audit trail.</p>
          </div>
          <InputGroup id="reopen-reason" label="Reason for Reopening *" placeholder="e.g. Customer complaint, new evidence…" icon={FileText} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />
        </div>
      </PageModal>
    </QALayout>
  );
};

export default QAInspectionRecordsPage;
