// ==========================================
// WHStockAdjustmentsPage.tsx
// Warehouse Manager — Stock Adjustments (Controlled CRUD)
// Correct discrepancies while maintaining audit integrity.
// Workflow: Create request → Approval → Apply → Audit log.
// Direct quantity editing is NOT allowed.
// ==========================================

import React, { useState, useMemo } from "react";
import WarehouseLayout from "../../layout/WarehouseLayout";
import StatsCard from "../../components/ui/StatsCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import Pagination from "../../components/ui/Pagination";
import PageModal from "../../components/ui/PageModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Toast from "../../components/ui/Toast";
import IconSelect from "../../components/ui/IconSelect";
import InputGroup from "../../components/ui/InputGroup";
import SecondaryButton from "../../components/ui/SecondaryButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  ClipboardEdit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  Hash,
  Archive,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface StockAdjustment {
  id: string;
  adjustmentId: string;
  itemCode: string;
  itemName: string;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  reason: string;
  requestedBy: string;
  requestedDate: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  approvedBy: string;
  approvedDate: string;
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockAdjustments: StockAdjustment[] = [
  { id: "1", adjustmentId: "ADJ-045", itemCode: "MAT-002", itemName: "Denim Fabric", oldQuantity: 90, newQuantity: 85, difference: -5, reason: "Physical count discrepancy — 5 rolls missing from storage.", requestedBy: "Warehouse Staff A", requestedDate: "2026-02-13", approvalStatus: "Approved", approvedBy: "Branch Admin", approvedDate: "2026-02-13" },
  { id: "2", adjustmentId: "ADJ-046", itemCode: "MAT-005", itemName: "Elastic Band", oldQuantity: 0, newQuantity: 10, difference: 10, reason: "Unreported return from production found during audit.", requestedBy: "Warehouse Staff B", requestedDate: "2026-02-13", approvalStatus: "Pending", approvedBy: "", approvedDate: "" },
  { id: "3", adjustmentId: "ADJ-047", itemCode: "MAT-002", itemName: "Denim Fabric", oldQuantity: 85, newQuantity: 35, difference: -50, reason: "Large discrepancy found during physical count. Investigation required.", requestedBy: "Warehouse Manager", requestedDate: "2026-02-12", approvalStatus: "Pending", approvedBy: "", approvedDate: "" },
  { id: "4", adjustmentId: "ADJ-044", itemCode: "MAT-003", itemName: "Polyester Thread", oldQuantity: 100, newQuantity: 120, difference: 20, reason: "Supplier delivered extra that was not recorded.", requestedBy: "Warehouse Staff A", requestedDate: "2026-02-11", approvalStatus: "Approved", approvedBy: "Branch Admin", approvedDate: "2026-02-11" },
  { id: "5", adjustmentId: "ADJ-043", itemCode: "MAT-007", itemName: "Button (Shell)", oldQuantity: 1250, newQuantity: 1200, difference: -50, reason: "Inventory reconciliation — shrinkage during handling.", requestedBy: "Warehouse Staff B", requestedDate: "2026-02-10", approvalStatus: "Approved", approvedBy: "Branch Admin", approvedDate: "2026-02-10" },
  { id: "6", adjustmentId: "ADJ-042", itemCode: "MAT-001", itemName: "Cotton Fabric", oldQuantity: 120, newQuantity: 110, difference: -10, reason: "Damaged material discarded.", requestedBy: "Warehouse Manager", requestedDate: "2026-02-09", approvalStatus: "Rejected", approvedBy: "Branch Admin", approvedDate: "2026-02-09" },
  { id: "7", adjustmentId: "ADJ-041", itemCode: "MAT-006", itemName: "Zipper (Metal)", oldQuantity: 480, newQuantity: 500, difference: 20, reason: "Found uncounted box during reorganization.", requestedBy: "Warehouse Staff A", requestedDate: "2026-02-08", approvalStatus: "Approved", approvedBy: "Branch Admin", approvedDate: "2026-02-08" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const itemOptions = [
  { value: "MAT-001", label: "MAT-001 — Cotton Fabric" },
  { value: "MAT-002", label: "MAT-002 — Denim Fabric" },
  { value: "MAT-003", label: "MAT-003 — Polyester Thread" },
  { value: "MAT-004", label: "MAT-004 — Silk Fabric" },
  { value: "MAT-005", label: "MAT-005 — Elastic Band" },
  { value: "MAT-006", label: "MAT-006 — Zipper (Metal)" },
  { value: "MAT-007", label: "MAT-007 — Button (Shell)" },
];

const ITEMS_PER_PAGE = 6;

// ==========================================
// Component
// ==========================================
const WHStockAdjustmentsPage: React.FC = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(mockAdjustments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAdj, setSelectedAdj] = useState<StockAdjustment | null>(null);
  const [approveAdj, setApproveAdj] = useState<StockAdjustment | null>(null);
  const [rejectAdj, setRejectAdj] = useState<StockAdjustment | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Create form
  const [formItem, setFormItem] = useState("");
  const [formOldQty, setFormOldQty] = useState("");
  const [formNewQty, setFormNewQty] = useState("");
  const [formReason, setFormReason] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // KPIs
  const kpis = useMemo(() => ({
    total: adjustments.length,
    pending: adjustments.filter((a) => a.approvalStatus === "Pending").length,
    approved: adjustments.filter((a) => a.approvalStatus === "Approved").length,
    rejected: adjustments.filter((a) => a.approvalStatus === "Rejected").length,
  }), [adjustments]);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...adjustments];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (a) =>
          a.adjustmentId.toLowerCase().includes(q) ||
          a.itemCode.toLowerCase().includes(q) ||
          a.itemName.toLowerCase().includes(q)
      );
    }
    if (filterStatus) data = data.filter((a) => a.approvalStatus === filterStatus);
    return data;
  }, [adjustments, searchQuery, filterStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Computed difference
  const computedDifference = formOldQty && formNewQty ? Number(formNewQty) - Number(formOldQty) : 0;

  const resetForm = () => {
    setFormItem(""); setFormOldQty(""); setFormNewQty(""); setFormReason("");
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleSaveAdjustment = () => {
    if (!formItem || !formOldQty || !formNewQty || !formReason.trim()) {
      setToast({ message: "Please fill in all required fields including a reason.", type: "error" });
      return;
    }
    setToast({ message: "Adjustment request created. Pending approval.", type: "success" });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleView = (adj: StockAdjustment) => {
    setSelectedAdj(adj);
    setIsDetailOpen(true);
  };

  const handleApprove = (adj: StockAdjustment) => {
    setApproveAdj(adj);
  };

  const confirmApprove = () => {
    if (approveAdj) {
      setToast({ message: `${approveAdj.adjustmentId} approved. Quantity updated and audit log recorded.`, type: "success" });
      setApproveAdj(null);
    }
  };

  const handleReject = (adj: StockAdjustment) => {
    setRejectReason("");
    setRejectAdj(adj);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setToast({ message: "Please provide a rejection reason.", type: "error" });
      return;
    }
    if (rejectAdj) {
      setToast({ message: `${rejectAdj.adjustmentId} rejected.`, type: "success" });
      setRejectAdj(null);
    }
  };

  return (
    <WarehouseLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Adjustments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Correct discrepancies with approval workflow — audit-safe</p>
        </div>
        <SecondaryButton icon={Plus} onClick={handleCreate}>Request Adjustment</SecondaryButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Adjustments" value={kpis.total} icon={ClipboardEdit} color="bg-indigo-500" />
        <StatsCard title="Pending Approval" value={kpis.pending} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Approved" value={kpis.approved} icon={CheckCircle2} color="bg-emerald-500" />
        <StatsCard title="Rejected" value={kpis.rejected} icon={XCircle} color="bg-rose-500" />
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by adjustment ID or item…"
      >
        <div className="p-3">
          <IconSelect label="Status" value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }} options={statusOptions} placeholder="All Statuses" />
        </div>
      </TableToolbar>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adj. ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Old Qty</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Qty</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Difference</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{adj.adjustmentId}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{adj.itemName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{adj.itemCode}</p>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{adj.oldQuantity}</td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{adj.newQuantity}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold ${adj.difference > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {adj.difference > 0 ? `+${adj.difference}` : adj.difference}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{adj.requestedBy}</td>
                    <td className="px-6 py-3"><StatusBadge status={adj.approvalStatus} /></td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleView(adj)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                        {adj.approvalStatus === "Pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(adj)}
                              className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all active:scale-95"
                              title="Approve"
                            >
                              <CheckCircle2 size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(adj)}
                              className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-all active:scale-95"
                              title="Reject"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => { setAdjustments(prev => prev.filter(x => x.id !== adj.id)); setToast({ message: "Item archived successfully", type: "success" }); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400 italic">No stock adjustments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} endIndex={endIndex} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* Create Adjustment Modal */}
      <PageModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); resetForm(); }}
        title="Request Stock Adjustment"
        subtitle="Submit a controlled quantity correction for approval"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveAdjustment} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">Submit Request</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-1">
          <IconSelect label="Item *" value={formItem} onChange={setFormItem} options={itemOptions} placeholder="Select item…" />
          <InputGroup id="adj-old" label="Old Quantity (current system qty) *" type="number" placeholder="e.g. 90" icon={Hash} value={formOldQty} onChange={(e) => setFormOldQty(e.target.value)} />
          <InputGroup id="adj-new" label="New Quantity (corrected qty) *" type="number" placeholder="e.g. 85" icon={Hash} value={formNewQty} onChange={(e) => setFormNewQty(e.target.value)} />

          {formOldQty && formNewQty && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Computed Difference</span>
              <span className={`text-sm font-bold ${computedDifference > 0 ? "text-emerald-600" : computedDifference < 0 ? "text-rose-600" : "text-slate-600"}`}>
                {computedDifference > 0 ? `+${computedDifference}` : computedDifference}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-xs font-semibold text-slate-500">Reason for Adjustment *</label>
            <textarea
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="Explain the discrepancy and reason for this adjustment…"
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Adjustments require Branch Admin approval before quantity is changed. All adjustments are audit-logged.</p>
          </div>
        </div>
      </PageModal>

      {/* Detail Modal */}
      <PageModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedAdj(null); }}
        title={selectedAdj?.adjustmentId || ""}
        subtitle={`${selectedAdj?.itemCode} — ${selectedAdj?.itemName}`}
        badges={selectedAdj ? <StatusBadge status={selectedAdj.approvalStatus} /> : undefined}
      >
        {selectedAdj && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="text-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Old Qty</label>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAdj.oldQuantity}</p>
              </div>
              <div className="text-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Qty</label>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAdj.newQuantity}</p>
              </div>
              <div className="text-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Difference</label>
                <p className={`text-lg font-bold mt-1 ${selectedAdj.difference > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedAdj.difference > 0 ? `+${selectedAdj.difference}` : selectedAdj.difference}
                </p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</label>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{selectedAdj.reason}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requested By</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedAdj.requestedBy}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Requested</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedAdj.requestedDate}</p></div>
              {selectedAdj.approvedBy && (
                <>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reviewed By</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedAdj.approvedBy}</p></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Review Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedAdj.approvedDate}</p></div>
                </>
              )}
            </div>
          </div>
        )}
      </PageModal>

      {/* Approve Confirmation */}
      <ConfirmationModal
        isOpen={!!approveAdj}
        onClose={() => setApproveAdj(null)}
        onConfirm={confirmApprove}
        title="Approve Adjustment"
        message={`Approve ${approveAdj?.adjustmentId}? This will change ${approveAdj?.itemName} quantity from ${approveAdj?.oldQuantity} to ${approveAdj?.newQuantity} (${approveAdj && approveAdj.difference > 0 ? "+" : ""}${approveAdj?.difference}).`}
        confirmText="Approve"
      />

      {/* Reject Modal */}
      <PageModal
        isOpen={!!rejectAdj}
        onClose={() => setRejectAdj(null)}
        title={`Reject ${rejectAdj?.adjustmentId}`}
        subtitle="Provide a reason for rejecting this adjustment"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => setRejectAdj(null)}>Cancel</SecondaryButton>
            <button
              onClick={confirmReject}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Reject Adjustment
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
            <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Rejecting this adjustment means the inventory quantity will remain unchanged. The reason will be recorded in the audit log.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Rejection Reason *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this adjustment being rejected?"
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-none"
            />
          </div>
        </div>
      </PageModal>
    </WarehouseLayout>
  );
};

export default WHStockAdjustmentsPage;
