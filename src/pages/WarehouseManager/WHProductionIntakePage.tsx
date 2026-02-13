// ==========================================
// WHProductionIntakePage.tsx
// Warehouse Manager — Production Intake (Finished Goods Receipt)
// Receive QA-approved production outputs into inventory.
// Critical ERP integration point: QA → Warehouse → Finance.
// ==========================================

import React, { useState, useMemo } from "react";
import WarehouseLayout from "../../layout/WarehouseLayout";
import StatsCard from "../../components/ui/StatsCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import Pagination from "../../components/ui/Pagination";
import PageModal from "../../components/ui/PageModal";
import Toast from "../../components/ui/Toast";
import InputGroup from "../../components/ui/InputGroup";
import IconSelect from "../../components/ui/IconSelect";
import SecondaryButton from "../../components/ui/SecondaryButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  Package,
  Eye,
  ArrowDownToLine,
  FileText,
  Hash,
  Archive,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface ProductionIntake {
  id: string;
  workOrderNo: string;
  productSku: string;
  productName: string;
  approvedQuantity: number;
  qaApprovalDate: string;
  qaApprovalStatus: "Approved";
  receiptStatus: "Pending" | "Received" | "Partial";
  receivedQuantity: number;
  receivedDate: string;
  storageLocation: string;
  receivedBy: string;
  notes: string;
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockIntake: ProductionIntake[] = [
  { id: "1", workOrderNo: "WO-102", productSku: "SKU-001", productName: "Basic Tee V2.0", approvedQuantity: 500, qaApprovalDate: "2026-02-11", qaApprovalStatus: "Approved", receiptStatus: "Pending", receivedQuantity: 0, receivedDate: "", storageLocation: "", receivedBy: "", notes: "" },
  { id: "2", workOrderNo: "WO-096", productSku: "SKU-004", productName: "Joggers V2.0", approvedQuantity: 600, qaApprovalDate: "2026-02-12", qaApprovalStatus: "Approved", receiptStatus: "Pending", receivedQuantity: 0, receivedDate: "", storageLocation: "", receivedBy: "", notes: "" },
  { id: "3", workOrderNo: "WO-101", productSku: "SKU-002", productName: "Hoodie V1.1 (Rework)", approvedQuantity: 15, qaApprovalDate: "2026-02-13", qaApprovalStatus: "Approved", receiptStatus: "Pending", receivedQuantity: 0, receivedDate: "", storageLocation: "", receivedBy: "", notes: "" },
  { id: "4", workOrderNo: "WO-099", productSku: "SKU-002", productName: "Hoodie V1.1", approvedQuantity: 450, qaApprovalDate: "2026-02-10", qaApprovalStatus: "Approved", receiptStatus: "Received", receivedQuantity: 450, receivedDate: "2026-02-12", storageLocation: "Storage A - Section 2", receivedBy: "Warehouse Manager", notes: "Full batch received. No discrepancy." },
  { id: "5", workOrderNo: "WO-095", productSku: "SKU-003", productName: "Polo Shirt V1.3", approvedQuantity: 300, qaApprovalDate: "2026-02-08", qaApprovalStatus: "Approved", receiptStatus: "Received", receivedQuantity: 300, receivedDate: "2026-02-09", storageLocation: "Storage A - Section 1", receivedBy: "Warehouse Staff A", notes: "" },
  { id: "6", workOrderNo: "WO-090", productSku: "SKU-005", productName: "Denim Jacket V1.0", approvedQuantity: 200, qaApprovalDate: "2026-02-05", qaApprovalStatus: "Approved", receiptStatus: "Received", receivedQuantity: 200, receivedDate: "2026-02-06", storageLocation: "Storage B - Section 3", receivedBy: "Warehouse Staff B", notes: "" },
  { id: "7", workOrderNo: "WO-107", productSku: "SKU-004", productName: "Joggers V2.0 (Batch 2)", approvedQuantity: 280, qaApprovalDate: "2026-02-13", qaApprovalStatus: "Approved", receiptStatus: "Partial", receivedQuantity: 150, receivedDate: "2026-02-13", storageLocation: "Storage A - Section 3", receivedBy: "Warehouse Manager", notes: "Partial receipt — remaining 130 to follow." },
];

const receiptStatusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Received", label: "Received" },
  { value: "Partial", label: "Partial" },
];

const locationOptions = [
  { value: "Storage A - Section 1", label: "Storage A - Section 1" },
  { value: "Storage A - Section 2", label: "Storage A - Section 2" },
  { value: "Storage A - Section 3", label: "Storage A - Section 3" },
  { value: "Storage B - Section 1", label: "Storage B - Section 1" },
  { value: "Storage B - Section 2", label: "Storage B - Section 2" },
  { value: "Storage B - Section 3", label: "Storage B - Section 3" },
];

const ITEMS_PER_PAGE = 6;

// ==========================================
// Component
// ==========================================
const WHProductionIntakePage: React.FC = () => {
  const [intake, setIntake] = useState<ProductionIntake[]>(mockIntake);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<ProductionIntake | null>(null);

  // Receive form
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveLocation, setReceiveLocation] = useState("");
  const [receiveNotes, setReceiveNotes] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // KPIs
  const kpis = useMemo(() => ({
    total: intake.length,
    pending: intake.filter((i) => i.receiptStatus === "Pending").length,
    received: intake.filter((i) => i.receiptStatus === "Received").length,
    partial: intake.filter((i) => i.receiptStatus === "Partial").length,
    totalApproved: intake.reduce((sum, i) => sum + i.approvedQuantity, 0),
  }), [intake]);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...intake];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (i) =>
          i.workOrderNo.toLowerCase().includes(q) ||
          i.productSku.toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q)
      );
    }
    if (filterStatus) data = data.filter((i) => i.receiptStatus === filterStatus);
    return data;
  }, [intake, searchQuery, filterStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const handleReceive = (item: ProductionIntake) => {
    setSelectedIntake(item);
    setReceiveQty(String(item.approvedQuantity - item.receivedQuantity));
    setReceiveLocation("");
    setReceiveNotes("");
    setIsReceiveOpen(true);
  };

  const handleSaveReceive = () => {
    if (!receiveQty || !receiveLocation) {
      setToast({ message: "Please fill in quantity received and storage location.", type: "error" });
      return;
    }
    if (Number(receiveQty) <= 0) {
      setToast({ message: "Quantity must be greater than 0.", type: "error" });
      return;
    }
    const remaining = (selectedIntake?.approvedQuantity || 0) - (selectedIntake?.receivedQuantity || 0);
    if (Number(receiveQty) > remaining) {
      setToast({ message: `Cannot receive more than remaining quantity (${remaining}).`, type: "error" });
      return;
    }
    setToast({ message: `${selectedIntake?.workOrderNo} — ${receiveQty} pcs received into ${receiveLocation}. Finished goods inventory updated. Finance costing triggered.`, type: "success" });
    setIsReceiveOpen(false);
    setSelectedIntake(null);
  };

  const handleView = (item: ProductionIntake) => {
    setSelectedIntake(item);
    setIsDetailOpen(true);
  };

  return (
    <WarehouseLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Production Intake</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Receive QA-approved production outputs into warehouse inventory</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Batches" value={kpis.total} icon={PackageCheck} color="bg-indigo-500" />
        <StatsCard title="Pending Receipt" value={kpis.pending} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Fully Received" value={kpis.received} icon={CheckCircle2} color="bg-emerald-500" />
        <StatsCard title="Partial Receipt" value={kpis.partial} icon={Package} color="bg-blue-500" />
      </div>

      {/* Workflow Info */}
      <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
            <PackageCheck size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-violet-800 dark:text-violet-300">ERP Workflow: QA Approved → Warehouse Intake → Finance Costing</p>
            <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">Receiving goods triggers inventory increase, marks the work order as received, and updates finance costing data.</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by WO#, SKU, or product name…"
      >
        <div className="p-3">
          <IconSelect label="Receipt Status" value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }} options={receiptStatusOptions} placeholder="All Statuses" />
        </div>
      </TableToolbar>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Work Order</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Qty</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">QA Approved</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receipt Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Received</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.workOrderNo}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.productSku}</p>
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{item.approvedQuantity} pcs</td>
                    <td className="px-6 py-3 text-[11px] text-slate-500 dark:text-slate-400">{item.qaApprovalDate}</td>
                    <td className="px-6 py-3"><StatusBadge status={item.receiptStatus} /></td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold ${item.receivedQuantity >= item.approvedQuantity ? "text-emerald-600 dark:text-emerald-400" : item.receivedQuantity > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                        {item.receivedQuantity} / {item.approvedQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleView(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                        {item.receiptStatus !== "Received" && (
                          <button
                            onClick={() => handleReceive(item)}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all active:scale-95"
                            title="Receive Goods"
                          >
                            <ArrowDownToLine size={12} />
                            Receive
                          </button>
                        )}
                        <button onClick={() => { setIntake(prev => prev.filter(x => x.id !== item.id)); setToast({ message: "Item archived successfully", type: "success" }); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 italic">No production intake records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} endIndex={endIndex} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* Receive Goods Modal */}
      <PageModal
        isOpen={isReceiveOpen}
        onClose={() => { setIsReceiveOpen(false); setSelectedIntake(null); }}
        title={`Receive Goods — ${selectedIntake?.workOrderNo}`}
        subtitle={`${selectedIntake?.productSku} — ${selectedIntake?.productName} · Approved: ${selectedIntake?.approvedQuantity} pcs`}
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsReceiveOpen(false); setSelectedIntake(null); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveReceive} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">Receive Goods</PrimaryButton>
          </div>
        }
      >
        {selectedIntake && (
          <div className="space-y-1">
            {selectedIntake.receivedQuantity > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-4">
                <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                  Previously received: {selectedIntake.receivedQuantity} pcs. Remaining: {selectedIntake.approvedQuantity - selectedIntake.receivedQuantity} pcs.
                </p>
              </div>
            )}
            <InputGroup id="recv-qty" label="Quantity Received *" type="number" placeholder={`Max: ${selectedIntake.approvedQuantity - selectedIntake.receivedQuantity}`} icon={Hash} value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} />
            <IconSelect label="Storage Location *" value={receiveLocation} onChange={setReceiveLocation} options={locationOptions} placeholder="Select location…" />
            <InputGroup id="recv-notes" label="Notes (optional)" placeholder="Any remarks about the received goods…" icon={FileText} value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)} />
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Receiving will: (1) Increase finished goods inventory, (2) Mark work order as received, (3) Trigger finance costing update.</p>
            </div>
          </div>
        )}
      </PageModal>

      {/* Detail Modal */}
      <PageModal
        isOpen={isDetailOpen && !isReceiveOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedIntake(null); }}
        title={selectedIntake?.workOrderNo || ""}
        subtitle={`${selectedIntake?.productSku} — ${selectedIntake?.productName}`}
        badges={selectedIntake ? <StatusBadge status={selectedIntake.receiptStatus} /> : undefined}
      >
        {selectedIntake && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved Quantity</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedIntake.approvedQuantity} pcs</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Received Quantity</label><p className={`text-sm font-bold mt-1 ${selectedIntake.receivedQuantity >= selectedIntake.approvedQuantity ? "text-emerald-600" : "text-amber-600"}`}>{selectedIntake.receivedQuantity} pcs</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">QA Approval Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedIntake.qaApprovalDate}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receipt Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedIntake.receivedDate || "—"}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Storage Location</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedIntake.storageLocation || "—"}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Received By</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedIntake.receivedBy || "—"}</p></div>
            </div>
            {selectedIntake.notes && (
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedIntake.notes}</p></div>
            )}
          </div>
        )}
      </PageModal>
    </WarehouseLayout>
  );
};

export default WHProductionIntakePage;
