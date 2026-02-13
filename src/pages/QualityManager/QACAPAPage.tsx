// ==========================================
// QACAPAPage.tsx
// Quality Manager — CAPA (Corrective and Preventive Actions)
// CRUD: Create, Update, Add steps, Close, Verify.
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
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  ShieldCheck,
  FileText,
  Calendar,
  User,
  Link2,
  Archive,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface CAPA {
  id: string;
  capaId: string;
  linkedInspection: string;
  linkedDefect: string;
  rootCause: string;
  assignedTo: string;
  assignedDept: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Completed" | "Verified";
  correctiveSteps: string[];
  evidence: number;
  createdDate: string;
  notes: string;
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockCAPAs: CAPA[] = [
  { id: "1", capaId: "CAPA-001", linkedInspection: "INS-005", linkedDefect: "DEF-001", rootCause: "Incorrect thread tension on machine #3", assignedTo: "Maria Santos", assignedDept: "Production", dueDate: "2026-02-08", status: "Verified", correctiveSteps: ["Recalibrated machine #3", "Updated maintenance schedule", "Retrained operator"], evidence: 3, createdDate: "2026-01-28", notes: "Verified — no recurrence in 14 days." },
  { id: "2", capaId: "CAPA-002", linkedInspection: "INS-007", linkedDefect: "DEF-003", rootCause: "Supplier fabric batch defective", assignedTo: "Juan Cruz", assignedDept: "Warehouse", dueDate: "2026-02-10", status: "Completed", correctiveSteps: ["Returned defective batch to supplier", "Updated incoming inspection checklist", "Added supplier quality audit"], evidence: 2, createdDate: "2026-02-01", notes: "Awaiting QA verification." },
  { id: "3", capaId: "CAPA-003", linkedInspection: "INS-008", linkedDefect: "DEF-003", rootCause: "Recurring stitching defect — operator training gap", assignedTo: "Maria Santos", assignedDept: "Production", dueDate: "2026-02-15", status: "In Progress", correctiveSteps: ["Scheduled retraining for operators", "Updated SOP for stitching process"], evidence: 1, createdDate: "2026-02-04", notes: "Training session scheduled for Feb 14." },
  { id: "4", capaId: "CAPA-004", linkedInspection: "INS-010", linkedDefect: "DEF-006", rootCause: "Mislabeled size tags from supplier", assignedTo: "Jessa Lim", assignedDept: "QA", dueDate: "2026-02-12", status: "Completed", correctiveSteps: ["Issued corrective notice to supplier", "Added label verification step to incoming QC"], evidence: 2, createdDate: "2026-02-06", notes: "Pending verification." },
  { id: "5", capaId: "CAPA-005", linkedInspection: "INS-012", linkedDefect: "DEF-002", rootCause: "Fabric tear due to excessive tension in cutting process", assignedTo: "Maria Santos", assignedDept: "Production", dueDate: "2026-02-18", status: "Open", correctiveSteps: [], evidence: 0, createdDate: "2026-02-08", notes: "Root cause confirmed. Corrective steps pending." },
  { id: "6", capaId: "CAPA-006", linkedInspection: "INS-015", linkedDefect: "DEF-007", rootCause: "Pattern grading error for polo collar", assignedTo: "Ana Reyes", assignedDept: "QA", dueDate: "2026-02-20", status: "Open", correctiveSteps: [], evidence: 0, createdDate: "2026-02-11", notes: "Investigation ongoing." },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Verified", label: "Verified" },
];

const deptOptions = [
  { value: "Production", label: "Production" },
  { value: "QA", label: "QA" },
  { value: "Warehouse", label: "Warehouse" },
];

const ITEMS_PER_PAGE = 6;

// ==========================================
// Component
// ==========================================
const QACAPAPage: React.FC = () => {
  const [capas, setCapas] = useState<CAPA[]>(mockCAPAs);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<CAPA | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [verifyItem, setVerifyItem] = useState<CAPA | null>(null);
  const [closeItem, setCloseItem] = useState<CAPA | null>(null);

  // Form state
  const [formLinkedInsp, setFormLinkedInsp] = useState("");
  const [formLinkedDefect, setFormLinkedDefect] = useState("");
  const [formRootCause, setFormRootCause] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formAssignedDept, setFormAssignedDept] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSteps, setFormSteps] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // KPI calculations
  const kpis = useMemo(() => ({
    total: capas.length,
    open: capas.filter((c) => c.status === "Open").length,
    inProgress: capas.filter((c) => c.status === "In Progress").length,
    completed: capas.filter((c) => c.status === "Completed").length,
    verified: capas.filter((c) => c.status === "Verified").length,
  }), [capas]);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...capas];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (c) =>
          c.capaId.toLowerCase().includes(q) ||
          c.linkedInspection.toLowerCase().includes(q) ||
          c.linkedDefect.toLowerCase().includes(q) ||
          c.rootCause.toLowerCase().includes(q) ||
          c.assignedTo.toLowerCase().includes(q)
      );
    }
    if (filterStatus) data = data.filter((c) => c.status === filterStatus);
    return data;
  }, [capas, searchQuery, filterStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const resetForm = () => {
    setFormLinkedInsp("");
    setFormLinkedDefect("");
    setFormRootCause("");
    setFormAssignedTo("");
    setFormAssignedDept("");
    setFormDueDate("");
    setFormNotes("");
    setFormSteps("");
  };

  const handleCreate = () => {
    resetForm();
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEdit = (capa: CAPA) => {
    setFormLinkedInsp(capa.linkedInspection);
    setFormLinkedDefect(capa.linkedDefect);
    setFormRootCause(capa.rootCause);
    setFormAssignedTo(capa.assignedTo);
    setFormAssignedDept(capa.assignedDept);
    setFormDueDate(capa.dueDate);
    setFormNotes(capa.notes);
    setFormSteps(capa.correctiveSteps.join("\n"));
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formRootCause || !formAssignedTo || !formDueDate) {
      setToast({ message: "Please fill in all required fields.", type: "error" });
      return;
    }
    setToast({ message: isEditing ? "CAPA updated successfully." : "CAPA created successfully.", type: "success" });
    setIsFormOpen(false);
    resetForm();
  };

  const handleView = (capa: CAPA) => {
    setSelectedCapa(capa);
    setIsDetailOpen(true);
  };

  const handleVerify = (capa: CAPA) => {
    setVerifyItem(capa);
  };

  const confirmVerify = () => {
    if (verifyItem) {
      setToast({ message: `${verifyItem.capaId} — Verified. CAPA closed successfully.`, type: "success" });
      setVerifyItem(null);
    }
  };

  const handleClose = (capa: CAPA) => {
    setCloseItem(capa);
  };

  const confirmClose = () => {
    if (closeItem) {
      setToast({ message: `${closeItem.capaId} marked as Completed. Awaiting QA verification.`, type: "success" });
      setCloseItem(null);
    }
  };

  return (
    <QALayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CAPA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Corrective and Preventive Actions — Fix recurring or severe defects</p>
        </div>
        <SecondaryButton icon={Plus} onClick={handleCreate}>Create CAPA</SecondaryButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total CAPA" value={kpis.total} icon={ShieldAlert} color="bg-indigo-500" />
        <StatsCard title="Open" value={kpis.open} icon={AlertTriangle} color="bg-amber-500" />
        <StatsCard title="In Progress" value={kpis.inProgress} icon={Clock} color="bg-blue-500" />
        <StatsCard title="Completed" value={kpis.completed} icon={CheckCircle2} color="bg-emerald-500" />
        <StatsCard title="Verified" value={kpis.verified} icon={ShieldCheck} color="bg-violet-500" />
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by CAPA ID, Inspection, Defect, or Assignee…"
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
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CAPA ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Linked Insp / Defect</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Root Cause</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((capa) => (
                  <tr key={capa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{capa.capaId}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{capa.linkedInspection}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{capa.linkedDefect}</p>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{capa.rootCause}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{capa.assignedTo}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{capa.assignedDept}</p>
                    </td>
                    <td className="px-6 py-3 text-[11px] text-slate-600 dark:text-slate-400">{capa.dueDate}</td>
                    <td className="px-6 py-3"><StatusBadge status={capa.status} /></td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleView(capa)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                        {(capa.status === "Open" || capa.status === "In Progress") && (
                          <button onClick={() => handleEdit(capa)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Update"><Edit size={14} /></button>
                        )}
                        {capa.status === "In Progress" && (
                          <button
                            onClick={() => handleClose(capa)}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all active:scale-95"
                            title="Complete"
                          >
                            <CheckCircle2 size={12} />
                            Complete
                          </button>
                        )}
                        {capa.status === "Completed" && (
                          <button
                            onClick={() => handleVerify(capa)}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-left.5 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800 rounded-lg transition-all active:scale-95"
                            title="Verify"
                          >
                            <ShieldCheck size={12} />
                            Verify
                          </button>
                        )}
                        <button onClick={() => { setCapas(prev => prev.filter(x => x.id !== capa.id)); setToast({ message: "Item archived successfully", type: "success" }); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 italic">No CAPA records found.</td>
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
        title={selectedCapa?.capaId || ""}
        subtitle={`Linked: ${selectedCapa?.linkedInspection} / ${selectedCapa?.linkedDefect}`}
        badges={selectedCapa ? <StatusBadge status={selectedCapa.status} /> : undefined}
        maxWidth="max-w-3xl"
      >
        {selectedCapa && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Root Cause</label><p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedCapa.rootCause}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned To</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedCapa.assignedTo} ({selectedCapa.assignedDept})</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedCapa.dueDate}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created Date</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedCapa.createdDate}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evidence Attached</label><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedCapa.evidence} files</p></div>
            </div>

            {/* Corrective Steps */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Corrective Action Steps</label>
              {selectedCapa.correctiveSteps.length > 0 ? (
                <ol className="mt-2 space-y-2">
                  {selectedCapa.correctiveSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-400 italic mt-2">No corrective steps recorded yet.</p>
              )}
            </div>

            {selectedCapa.notes && (
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedCapa.notes}</p></div>
            )}
          </div>
        )}
      </PageModal>

      {/* Create / Edit CAPA Modal */}
      <PageModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); resetForm(); }}
        title={isEditing ? "Update CAPA" : "Create CAPA"}
        subtitle={isEditing ? "Update corrective action progress" : "Create a corrective action for a defect"}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">{isEditing ? "Update CAPA" : "Create CAPA"}</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <InputGroup id="capa-insp" label="Linked Inspection" placeholder="e.g. INS-012" icon={Link2} value={formLinkedInsp} onChange={(e) => setFormLinkedInsp(e.target.value)} />
            <InputGroup id="capa-defect" label="Linked Defect" placeholder="e.g. DEF-002" icon={Link2} value={formLinkedDefect} onChange={(e) => setFormLinkedDefect(e.target.value)} />
          </div>
          <InputGroup id="capa-root" label="Root Cause *" placeholder="Describe the root cause…" icon={FileText} value={formRootCause} onChange={(e) => setFormRootCause(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup id="capa-assign" label="Assigned To *" placeholder="e.g. Maria Santos" icon={User} value={formAssignedTo} onChange={(e) => setFormAssignedTo(e.target.value)} />
            <IconSelect label="Department" value={formAssignedDept} onChange={setFormAssignedDept} options={deptOptions} placeholder="Select department…" />
          </div>
          <InputGroup id="capa-due" label="Due Date *" type="date" icon={Calendar} value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-xs font-semibold text-slate-500">Corrective Action Steps</label>
            <textarea
              value={formSteps}
              onChange={(e) => setFormSteps(e.target.value)}
              placeholder="Enter each step on a new line…"
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
            />
          </div>
          <InputGroup id="capa-notes" label="Notes" placeholder="Additional context…" icon={FileText} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
        </div>
      </PageModal>

      {/* Verify CAPA Confirmation */}
      <ConfirmationModal
        isOpen={!!verifyItem}
        onClose={() => setVerifyItem(null)}
        onConfirm={confirmVerify}
        title="Verify CAPA Effectiveness"
        message={`Verify ${verifyItem?.capaId}? This confirms the corrective actions are effective and closes the CAPA permanently.`}
        confirmText="Verify & Close"
      />

      {/* Complete CAPA Confirmation */}
      <ConfirmationModal
        isOpen={!!closeItem}
        onClose={() => setCloseItem(null)}
        onConfirm={confirmClose}
        title="Complete CAPA"
        message={`Mark ${closeItem?.capaId} as Completed? It will still require QA verification before final closure.`}
        confirmText="Mark Complete"
      />
    </QALayout>
  );
};

export default QACAPAPage;
