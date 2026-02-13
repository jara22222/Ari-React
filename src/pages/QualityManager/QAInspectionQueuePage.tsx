// ==========================================
// QAInspectionQueuePage.tsx
// Quality Manager — Inspection Queue (Main Daily Page)
// Shows all production outputs requiring quality
// inspection. Supports assign, start, open form,
// and mark for approval.
// ==========================================

import React, { useState, useMemo } from "react";
import QALayout from "../../layout/QALayout";
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
  ClipboardList,
  Clock,
  AlertTriangle,
  Play,
  UserPlus,
  FileSearch,
  CheckCircle2,
  Eye,
  Package,
  FileText,
  Search,
  Archive,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface InspectionQueue {
  id: string;
  inspectionId: string;
  workOrderNo: string;
  productSku: string;
  productName: string;
  quantity: number;
  priority: "Normal" | "Urgent";
  assignedInspector: string;
  dueDate: string;
  status: "Pending" | "In Progress" | "For Approval";
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockQueue: InspectionQueue[] = [
  { id: "1", inspectionId: "INS-021", workOrderNo: "WO-102", productSku: "SKU-001", productName: "Basic Tee V2.0", quantity: 500, priority: "Normal", assignedInspector: "Ana Reyes", dueDate: "2026-02-13", status: "Pending" },
  { id: "2", inspectionId: "INS-022", workOrderNo: "WO-107", productSku: "SKU-004", productName: "Joggers V2.0", quantity: 400, priority: "Normal", assignedInspector: "Ana Reyes", dueDate: "2026-02-13", status: "In Progress" },
  { id: "3", inspectionId: "INS-018", workOrderNo: "WO-108", productSku: "SKU-007", productName: "Cargo Pants V1.2", quantity: 350, priority: "Urgent", assignedInspector: "—", dueDate: "2026-02-11", status: "Pending" },
  { id: "4", inspectionId: "INS-023", workOrderNo: "WO-110", productSku: "SKU-001", productName: "Basic Tee V2.0 (Batch 2)", quantity: 500, priority: "Normal", assignedInspector: "—", dueDate: "2026-02-15", status: "Pending" },
  { id: "5", inspectionId: "INS-019", workOrderNo: "WO-105", productSku: "SKU-005", productName: "Denim Jacket V1.0", quantity: 200, priority: "Urgent", assignedInspector: "Carlos Tan", dueDate: "2026-02-12", status: "For Approval" },
  { id: "6", inspectionId: "INS-020", workOrderNo: "WO-099", productSku: "SKU-002", productName: "Hoodie V1.1", quantity: 450, priority: "Normal", assignedInspector: "Ana Reyes", dueDate: "2026-02-13", status: "For Approval" },
  { id: "7", inspectionId: "INS-024", workOrderNo: "WO-111", productSku: "SKU-003", productName: "Polo Shirt V1.3", quantity: 300, priority: "Normal", assignedInspector: "—", dueDate: "2026-02-16", status: "Pending" },
  { id: "8", inspectionId: "INS-025", workOrderNo: "WO-096", productSku: "SKU-004", productName: "Joggers (Batch 1)", quantity: 600, priority: "Normal", assignedInspector: "Carlos Tan", dueDate: "2026-02-14", status: "In Progress" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "For Approval", label: "For Approval" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "Normal", label: "Normal" },
  { value: "Urgent", label: "Urgent" },
];

const inspectorOptions = [
  { value: "Ana Reyes", label: "Ana Reyes" },
  { value: "Carlos Tan", label: "Carlos Tan" },
  { value: "Jessa Lim", label: "Jessa Lim" },
];

const ITEMS_PER_PAGE = 6;

// ------------------------------------------
// Checklist items for the inspection form
// ------------------------------------------
const defaultChecklist = [
  { id: "c1", criteria: "Fabric weight within tolerance", result: "" },
  { id: "c2", criteria: "Stitching straight and even", result: "" },
  { id: "c3", criteria: "No loose threads", result: "" },
  { id: "c4", criteria: "Color matches approved swatch", result: "" },
  { id: "c5", criteria: "Label placement correct", result: "" },
  { id: "c6", criteria: "Size measurements within spec", result: "" },
  { id: "c7", criteria: "No stains or marks", result: "" },
  { id: "c8", criteria: "Zipper/button function correct", result: "" },
];

// ==========================================
// Component
// ==========================================
const QAInspectionQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<InspectionQueue[]>(mockQueue);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InspectionQueue | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignItem, setAssignItem] = useState<InspectionQueue | null>(null);
  const [assignInspector, setAssignInspector] = useState("");
  const [startItem, setStartItem] = useState<InspectionQueue | null>(null);
  const [isInspectionFormOpen, setIsInspectionFormOpen] = useState(false);
  const [inspFormItem, setInspFormItem] = useState<InspectionQueue | null>(null);

  // Inspection form state
  const [checklist, setChecklist] = useState(defaultChecklist.map((c) => ({ ...c })));
  const [defectType, setDefectType] = useState("");
  const [defectSeverity, setDefectSeverity] = useState("");
  const [defectQty, setDefectQty] = useState("");
  const [defectNotes, setDefectNotes] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // KPI calculations
  const kpis = useMemo(() => ({
    total: queue.length,
    pending: queue.filter((q) => q.status === "Pending").length,
    inProgress: queue.filter((q) => q.status === "In Progress").length,
    forApproval: queue.filter((q) => q.status === "For Approval").length,
    urgent: queue.filter((q) => q.priority === "Urgent").length,
  }), [queue]);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...queue];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.inspectionId.toLowerCase().includes(q) ||
          item.workOrderNo.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          item.productSku.toLowerCase().includes(q)
      );
    }
    if (filterStatus) data = data.filter((item) => item.status === filterStatus);
    if (filterPriority) data = data.filter((item) => item.priority === filterPriority);
    return data;
  }, [queue, searchQuery, filterStatus, filterPriority]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const handleView = (item: InspectionQueue) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleAssign = (item: InspectionQueue) => {
    setAssignItem(item);
    setAssignInspector("");
    setIsAssignOpen(true);
  };

  const confirmAssign = () => {
    if (!assignInspector) {
      setToast({ message: "Please select an inspector.", type: "error" });
      return;
    }
    setToast({ message: `${assignItem?.inspectionId} assigned to ${assignInspector}.`, type: "success" });
    setIsAssignOpen(false);
    setAssignItem(null);
  };

  const handleStart = (item: InspectionQueue) => {
    setStartItem(item);
  };

  const confirmStart = () => {
    if (startItem) {
      setToast({ message: `${startItem.inspectionId} — Inspection started.`, type: "success" });
      setStartItem(null);
    }
  };

  const handleOpenForm = (item: InspectionQueue) => {
    setInspFormItem(item);
    setChecklist(defaultChecklist.map((c) => ({ ...c, result: "" })));
    setDefectType("");
    setDefectSeverity("");
    setDefectQty("");
    setDefectNotes("");
    setInspectionNotes("");
    setIsInspectionFormOpen(true);
  };

  const handleSubmitInspection = () => {
    const incomplete = checklist.filter((c) => !c.result);
    if (incomplete.length > 0) {
      setToast({ message: `Please complete all checklist items. ${incomplete.length} remaining.`, type: "error" });
      return;
    }
    setToast({ message: `${inspFormItem?.inspectionId} — Inspection submitted for QA approval.`, type: "success" });
    setIsInspectionFormOpen(false);
    setInspFormItem(null);
  };

  const handleSaveDraft = () => {
    setToast({ message: `${inspFormItem?.inspectionId} — Draft saved.`, type: "success" });
    setIsInspectionFormOpen(false);
    setInspFormItem(null);
  };

  const updateChecklistResult = (id: string, result: string) => {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, result } : c)));
  };

  const checklistPassCount = checklist.filter((c) => c.result === "Pass").length;
  const checklistFailCount = checklist.filter((c) => c.result === "Fail").length;

  return (
    <QALayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inspection Queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All production outputs requiring quality inspection</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total in Queue" value={kpis.total} icon={ClipboardList} color="bg-indigo-500" />
        <StatsCard title="Pending" value={kpis.pending} icon={Clock} color="bg-slate-500" />
        <StatsCard title="In Progress" value={kpis.inProgress} icon={Search} color="bg-blue-500" />
        <StatsCard title="For Approval" value={kpis.forApproval} icon={CheckCircle2} color="bg-emerald-500" />
        <StatsCard title="Urgent" value={kpis.urgent} icon={AlertTriangle} color="bg-rose-500" />
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by Inspection ID, WO, or Product…"
      >
        <div className="p-3 space-y-3">
          <IconSelect label="Status" value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }} options={statusOptions} placeholder="All Statuses" />
          <IconSelect label="Priority" value={filterPriority} onChange={(v) => { setFilterPriority(v); setCurrentPage(1); }} options={priorityOptions} placeholder="All Priorities" />
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
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inspector</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.inspectionId}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{item.workOrderNo}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.productSku}</p>
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                    <td className="px-6 py-3"><StatusBadge status={item.priority} /></td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{item.assignedInspector}</td>
                    <td className="px-6 py-3 text-[11px] text-slate-600 dark:text-slate-400">{item.dueDate}</td>
                    <td className="px-6 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleView(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                        {item.assignedInspector === "—" && (
                          <button
                            onClick={() => handleAssign(item)}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800 rounded-lg transition-all active:scale-95"
                            title="Assign Inspector"
                          >
                            <UserPlus size={12} />
                            Assign
                          </button>
                        )}
                        {item.status === "Pending" && item.assignedInspector !== "—" && (
                          <button
                            onClick={() => handleStart(item)}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all active:scale-95"
                            title="Start Inspection"
                          >
                            <Play size={12} />
                            Start
                          </button>
                        )}
                        {item.status === "In Progress" && (
                          <button
                            onClick={() => handleOpenForm(item)}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg transition-all active:scale-95"
                            title="Open Inspection Form"
                          >
                            <FileSearch size={12} />
                            Inspect
                          </button>
                        )}
                        <button onClick={() => { setQueue(prev => prev.filter(x => x.id !== item.id)); setToast({ message: "Item archived successfully", type: "success" }); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400 italic">No inspections in queue.</td>
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
        title={selectedItem?.inspectionId || ""}
        subtitle={`${selectedItem?.workOrderNo} · ${selectedItem?.productSku} — ${selectedItem?.productName}`}
        badges={selectedItem ? <><StatusBadge status={selectedItem.status} /><StatusBadge status={selectedItem.priority} /></> : undefined}
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantity to Inspect</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedItem.quantity} pcs</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedItem.dueDate}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Inspector</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedItem.assignedInspector}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</label><p className="mt-1"><StatusBadge status={selectedItem.priority} /></p></div>
            </div>
          </div>
        )}
      </PageModal>

      {/* Assign Inspector Modal */}
      <PageModal
        isOpen={isAssignOpen}
        onClose={() => { setIsAssignOpen(false); setAssignItem(null); }}
        title={`Assign Inspector — ${assignItem?.inspectionId}`}
        subtitle={`${assignItem?.productName} · ${assignItem?.workOrderNo}`}
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsAssignOpen(false); setAssignItem(null); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={confirmAssign} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">Assign Inspector</PrimaryButton>
          </div>
        }
      >
        <IconSelect label="Select Inspector" value={assignInspector} onChange={setAssignInspector} options={inspectorOptions.map((o) => ({ value: o.value, label: o.label }))} placeholder="Choose an inspector…" />
      </PageModal>

      {/* Start Inspection Confirmation */}
      <ConfirmationModal
        isOpen={!!startItem}
        onClose={() => setStartItem(null)}
        onConfirm={confirmStart}
        title="Start Inspection"
        message={`Start inspection ${startItem?.inspectionId} for ${startItem?.productName} (${startItem?.workOrderNo})? Status will change to In Progress.`}
        confirmText="Start"
      />

      {/* Inspection Form Modal */}
      <PageModal
        isOpen={isInspectionFormOpen}
        onClose={() => { setIsInspectionFormOpen(false); setInspFormItem(null); }}
        title={`Inspection Form — ${inspFormItem?.inspectionId}`}
        subtitle={`${inspFormItem?.productName} · ${inspFormItem?.workOrderNo} · Qty: ${inspFormItem?.quantity} pcs`}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={handleSaveDraft}>Save Draft</SecondaryButton>
            <PrimaryButton onClick={handleSubmitInspection} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">Submit for Approval</PrimaryButton>
          </div>
        }
      >
        {inspFormItem && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inspection ID</label><p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{inspFormItem.inspectionId}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Work Order</label><p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{inspFormItem.workOrderNo}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{inspFormItem.productName}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Batch Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{inspFormItem.dueDate}</p></div>
            </div>

            {/* Checklist Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Quality Checklist</h3>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">#</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Criteria</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {checklist.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 text-xs text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300">{item.criteria}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateChecklistResult(item.id, "Pass")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${item.result === "Pass" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
                            >
                              Pass
                            </button>
                            <button
                              onClick={() => updateChecklistResult(item.id, "Fail")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${item.result === "Fail" ? "bg-rose-500 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600"}`}
                            >
                              Fail
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[11px] font-medium text-slate-500">
                <span className="text-emerald-600">Pass: {checklistPassCount}</span>
                <span className="text-rose-600">Fail: {checklistFailCount}</span>
                <span>Pending: {checklist.length - checklistPassCount - checklistFailCount}</span>
              </div>
            </div>

            {/* Defect Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Log Defects (if any)</h3>
              <div className="grid grid-cols-2 gap-4">
                <IconSelect label="Defect Type" value={defectType} onChange={setDefectType} options={[
                  { value: "Stitching", label: "Stitching" },
                  { value: "Fabric Defect", label: "Fabric Defect" },
                  { value: "Color Issue", label: "Color Issue" },
                  { value: "Size Mismatch", label: "Size Mismatch" },
                  { value: "Finishing", label: "Finishing" },
                  { value: "Label Error", label: "Label Error" },
                  { value: "Other", label: "Other" },
                ]} placeholder="Select type…" />
                <IconSelect label="Severity" value={defectSeverity} onChange={setDefectSeverity} options={[
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                ]} placeholder="Select severity…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup id="defect-qty" label="Quantity Affected" type="number" placeholder="e.g. 15" icon={Package} value={defectQty} onChange={(e) => setDefectQty(e.target.value)} />
                <InputGroup id="defect-notes" label="Defect Notes" placeholder="Describe the defect…" icon={FileText} value={defectNotes} onChange={(e) => setDefectNotes(e.target.value)} />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Inspection Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Total Defects</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{defectQty || "0"}</p></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Defect Rate</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{defectQty && inspFormItem ? `${((Number(defectQty) / inspFormItem.quantity) * 100).toFixed(1)}%` : "0%"}</p></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Suggested Result</label><p className="mt-0.5"><StatusBadge status={checklistFailCount > 0 || Number(defectQty) > 0 ? "Failed" : "Passed"} /></p></div>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Inspection Notes (optional)</label>
              <textarea
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Additional notes for this inspection…"
                className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}
      </PageModal>
    </QALayout>
  );
};

export default QAInspectionQueuePage;
