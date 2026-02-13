// ==========================================
// QAApprovalsPage.tsx
// Quality Manager — Approvals / Rejections
// QA Manager decides whether each batch is acceptable.
// Actions: Approve (Pass), Reject (Fail), Re-inspect.
// ==========================================

import React, { useState, useMemo } from "react";
import QALayout from "../../layout/QALayout";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import Pagination from "../../components/ui/Pagination";
import PageModal from "../../components/ui/PageModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Toast from "../../components/ui/Toast";
import ProgressBar from "../../components/ui/ProgressBar";
import SecondaryButton from "../../components/ui/SecondaryButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface ApprovalItem {
  id: string;
  inspectionId: string;
  workOrder: string;
  sku: string;
  productName: string;
  defectRate: number;
  majorDefects: number;
  checklistScore: number;
  submittedBy: string;
  timeSubmitted: string;
  recommendation: "Pass" | "Fail";
  defectBreakdown: { type: string; count: number; severity: string }[];
  attachments: number;
  notes: string;
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockApprovals: ApprovalItem[] = [
  {
    id: "1", inspectionId: "INS-021", workOrder: "WO-102", sku: "SKU-001", productName: "Basic Tee V2.0",
    defectRate: 0.8, majorDefects: 0, checklistScore: 92, submittedBy: "Ana Reyes", timeSubmitted: "10 min ago",
    recommendation: "Pass",
    defectBreakdown: [{ type: "Stitching", count: 2, severity: "Low" }, { type: "Finishing", count: 2, severity: "Low" }],
    attachments: 3, notes: "Minor defects only. Batch quality meets standards.",
  },
  {
    id: "2", inspectionId: "INS-022", workOrder: "WO-107", sku: "SKU-004", productName: "Joggers V2.0",
    defectRate: 0, majorDefects: 0, checklistScore: 100, submittedBy: "Ana Reyes", timeSubmitted: "25 min ago",
    recommendation: "Pass",
    defectBreakdown: [],
    attachments: 2, notes: "No defects. Perfect batch.",
  },
  {
    id: "3", inspectionId: "INS-019", workOrder: "WO-105", sku: "SKU-005", productName: "Denim Jacket V1.0",
    defectRate: 5.0, majorDefects: 8, checklistScore: 58, submittedBy: "Carlos Tan", timeSubmitted: "1 hour ago",
    recommendation: "Fail",
    defectBreakdown: [{ type: "Fabric Defect", count: 8, severity: "High" }, { type: "Stitching", count: 2, severity: "Medium" }],
    attachments: 5, notes: "Fabric tear on 8 units. Rework recommended. CAPA required.",
  },
  {
    id: "4", inspectionId: "INS-020", workOrder: "WO-099", sku: "SKU-002", productName: "Hoodie V1.1",
    defectRate: 0, majorDefects: 0, checklistScore: 100, submittedBy: "Ana Reyes", timeSubmitted: "2 hours ago",
    recommendation: "Pass",
    defectBreakdown: [],
    attachments: 2, notes: "Clean batch. No issues.",
  },
  {
    id: "5", inspectionId: "INS-025", workOrder: "WO-096", sku: "SKU-004", productName: "Joggers (Batch 1)",
    defectRate: 1.2, majorDefects: 1, checklistScore: 78, submittedBy: "Carlos Tan", timeSubmitted: "3 hours ago",
    recommendation: "Pass",
    defectBreakdown: [{ type: "Color Issue", count: 3, severity: "Medium" }, { type: "Stitching", count: 4, severity: "Low" }],
    attachments: 4, notes: "Conditional pass — minor color variation on 3 units.",
  },
];

const ITEMS_PER_PAGE = 6;

// ==========================================
// Component
// ==========================================
const QAApprovalsPage: React.FC = () => {
  const [approvals] = useState<ApprovalItem[]>(mockApprovals);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<ApprovalItem | null>(null);
  const [approveItem, setApproveItem] = useState<ApprovalItem | null>(null);
  const [rejectItem, setRejectItem] = useState<ApprovalItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [reinspectItem, setReinspectItem] = useState<ApprovalItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...approvals];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (a) =>
          a.inspectionId.toLowerCase().includes(q) ||
          a.workOrder.toLowerCase().includes(q) ||
          a.productName.toLowerCase().includes(q) ||
          a.sku.toLowerCase().includes(q)
      );
    }
    return data;
  }, [approvals, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const handleReview = (item: ApprovalItem) => {
    setReviewItem(item);
    setIsReviewOpen(true);
  };

  const handleApprove = (item: ApprovalItem) => {
    setApproveItem(item);
  };

  const confirmApprove = () => {
    if (approveItem) {
      setToast({ message: `${approveItem.inspectionId} — Batch APPROVED. Sent to warehouse intake.`, type: "success" });
      setApproveItem(null);
      setIsReviewOpen(false);
    }
  };

  const handleReject = (item: ApprovalItem) => {
    setRejectItem(item);
    setRejectRemarks("");
  };

  const confirmReject = () => {
    if (!rejectRemarks.trim()) {
      setToast({ message: "Remarks are required when rejecting a batch.", type: "error" });
      return;
    }
    if (rejectItem) {
      setToast({ message: `${rejectItem.inspectionId} — Batch REJECTED. CAPA required.`, type: "success" });
      setRejectItem(null);
      setIsReviewOpen(false);
    }
  };

  const handleReinspect = (item: ApprovalItem) => {
    setReinspectItem(item);
  };

  const confirmReinspect = () => {
    if (reinspectItem) {
      setToast({ message: `${reinspectItem.inspectionId} sent back for re-inspection.`, type: "success" });
      setReinspectItem(null);
      setIsReviewOpen(false);
    }
  };

  return (
    <QALayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Approvals / Rejections</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Final QA decision on inspected batches — Approve, Reject, or Re-inspect</p>
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by Inspection ID, WO, or Product…"
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inspection ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Work Order</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Defect Rate</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Major Defects</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted By</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rec.</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.inspectionId}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{item.workOrder}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.sku}</p>
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{item.defectRate}%</td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{item.majorDefects}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{item.submittedBy}</td>
                    <td className="px-6 py-3 text-[11px] text-slate-500 dark:text-slate-400">{item.timeSubmitted}</td>
                    <td className="px-6 py-3"><StatusBadge status={item.recommendation === "Pass" ? "Passed" : "Failed"} /></td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleReview(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Review"><Eye size={14} /></button>
                        <button
                          onClick={() => handleApprove(item)}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all active:scale-95"
                          title="Approve"
                        >
                          <CheckCircle2 size={12} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item)}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-all active:scale-95"
                          title="Reject"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleReinspect(item)}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg transition-all active:scale-95"
                          title="Re-inspect"
                        >
                          <RotateCcw size={12} />
                          Re-inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400 italic">No inspections awaiting approval.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} endIndex={endIndex} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* Review Decision Panel Modal */}
      <PageModal
        isOpen={isReviewOpen}
        onClose={() => { setIsReviewOpen(false); setReviewItem(null); }}
        title={`QA Review — ${reviewItem?.inspectionId}`}
        subtitle={`${reviewItem?.workOrder} · ${reviewItem?.sku} — ${reviewItem?.productName}`}
        badges={reviewItem ? <StatusBadge status={reviewItem.recommendation === "Pass" ? "Passed" : "Failed"} /> : undefined}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsReviewOpen(false); setReviewItem(null); }}>Close</SecondaryButton>
            <button
              onClick={() => reviewItem && handleReinspect(reviewItem)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Re-inspect
            </button>
            <button
              onClick={() => reviewItem && handleReject(reviewItem)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => reviewItem && handleApprove(reviewItem)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Approve
            </button>
          </div>
        }
      >
        {reviewItem && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Defect Rate</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{reviewItem.defectRate}%</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Major Defects</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{reviewItem.majorDefects}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Attachments</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{reviewItem.attachments} photos</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Submitted By</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{reviewItem.submittedBy}</p></div>
            </div>

            {/* Checklist Score */}
            <ProgressBar value={reviewItem.checklistScore} label="Checklist Score" status={reviewItem.checklistScore >= 80 ? "on-track" : reviewItem.checklistScore >= 60 ? "at-risk" : "delayed"} height="h-2.5" />

            {/* Defect Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Defect Breakdown</h3>
              {reviewItem.defectBreakdown.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-left">Type</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-left">Count</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-left">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {reviewItem.defectBreakdown.map((d, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300">{d.type}</td>
                          <td className="px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200">{d.count}</td>
                          <td className="px-4 py-2"><StatusBadge status={d.severity} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No defects reported.</p>
              )}
            </div>

            {/* Recommendation */}
            <div className={`p-4 rounded-xl border ${reviewItem.recommendation === "Pass" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"}`}>
              <div className="flex items-center gap-2 mb-1">
                {reviewItem.recommendation === "Pass" ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-600" />}
                <span className={`text-sm font-bold ${reviewItem.recommendation === "Pass" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                  System Recommendation: {reviewItem.recommendation}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">{reviewItem.notes}</p>
            </div>
          </div>
        )}
      </PageModal>

      {/* Approve Confirmation */}
      <ConfirmationModal
        isOpen={!!approveItem}
        onClose={() => setApproveItem(null)}
        onConfirm={confirmApprove}
        title="Approve Batch"
        message={`Approve ${approveItem?.inspectionId} (${approveItem?.productName})? The batch will be sent to Warehouse Intake.`}
        confirmText="Approve"
      />

      {/* Reject Modal */}
      <PageModal
        isOpen={!!rejectItem}
        onClose={() => setRejectItem(null)}
        title={`Reject Batch — ${rejectItem?.inspectionId}`}
        subtitle="Rejection requires remarks and will trigger CAPA"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => setRejectItem(null)}>Cancel</SecondaryButton>
            <button
              onClick={confirmReject}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Confirm Reject
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
            <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Rejecting this batch will trigger CAPA creation and may require production rework.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Rejection Remarks *</label>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="Provide detailed reason for rejection…"
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>
      </PageModal>

      {/* Re-inspect Confirmation */}
      <ConfirmationModal
        isOpen={!!reinspectItem}
        onClose={() => setReinspectItem(null)}
        onConfirm={confirmReinspect}
        title="Send for Re-inspection"
        message={`Send ${reinspectItem?.inspectionId} back for re-inspection? The batch will return to the inspection queue.`}
        confirmText="Re-inspect"
      />
    </QALayout>
  );
};

export default QAApprovalsPage;
