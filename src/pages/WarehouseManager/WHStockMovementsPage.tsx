// ==========================================
// WHStockMovementsPage.tsx
// Warehouse Manager — Stock Movements (CRUD + Traceability)
// Track every quantity change: Stock-In, Stock-Out,
// Transfer, Adjustment. Full audit trail.
// ==========================================

import React, { useState, useMemo } from "react";
import WarehouseLayout from "../../layout/WarehouseLayout";
import StatsCard from "../../components/ui/StatsCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import Pagination from "../../components/ui/Pagination";
import PageModal from "../../components/ui/PageModal";
import Toast from "../../components/ui/Toast";
import IconSelect from "../../components/ui/IconSelect";
import InputGroup from "../../components/ui/InputGroup";
import SecondaryButton from "../../components/ui/SecondaryButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ClipboardEdit,
  Plus,
  Eye,
  Package,
  FileText,
  Hash,
  MapPin,
  Truck,
  Archive,
} from "lucide-react";

// ------------------------------------------
// Types
// ------------------------------------------
interface StockMovement {
  id: string;
  movementId: string;
  itemCode: string;
  itemName: string;
  type: "Stock-In" | "Stock-Out" | "Transfer" | "Adjustment";
  quantity: number;
  referenceSource: string;
  referenceType: "Purchase" | "Work Order" | "Manual" | "Return" | "Shipment" | "Transfer" | "Adjustment";
  performedBy: string;
  dateTime: string;
  notes: string;
}

// ------------------------------------------
// Mock data
// ------------------------------------------
const mockMovements: StockMovement[] = [
  { id: "1", movementId: "MOV-301", itemCode: "MAT-001", itemName: "Cotton Fabric", type: "Stock-In", quantity: 50, referenceSource: "PO-2045", referenceType: "Purchase", performedBy: "Warehouse Staff A", dateTime: "2026-02-13 09:30", notes: "Received from Supplier ABC" },
  { id: "2", movementId: "MOV-302", itemCode: "SKU-001", itemName: "Basic Tee V2.0", type: "Stock-Out", quantity: 200, referenceSource: "SHP-089", referenceType: "Shipment", performedBy: "Warehouse Staff B", dateTime: "2026-02-13 10:15", notes: "Shipment to Manila outlet" },
  { id: "3", movementId: "MOV-303", itemCode: "MAT-002", itemName: "Denim Fabric", type: "Adjustment", quantity: -5, referenceSource: "ADJ-043", referenceType: "Adjustment", performedBy: "Warehouse Manager", dateTime: "2026-02-13 11:00", notes: "Approved correction from physical count" },
  { id: "4", movementId: "MOV-304", itemCode: "MAT-004", itemName: "Silk Fabric", type: "Transfer", quantity: 30, referenceSource: "TRF-012", referenceType: "Transfer", performedBy: "Warehouse Staff A", dateTime: "2026-02-13 11:45", notes: "Storage A → Storage B" },
  { id: "5", movementId: "MOV-305", itemCode: "SKU-002", itemName: "Hoodie V1.1", type: "Stock-In", quantity: 450, referenceSource: "WO-099", referenceType: "Work Order", performedBy: "Warehouse Manager", dateTime: "2026-02-12 16:30", notes: "Production intake from QA-approved batch" },
  { id: "6", movementId: "MOV-306", itemCode: "MAT-003", itemName: "Polyester Thread", type: "Stock-In", quantity: 200, referenceSource: "PO-2046", referenceType: "Purchase", performedBy: "Warehouse Staff B", dateTime: "2026-02-12 14:00", notes: "" },
  { id: "7", movementId: "MOV-307", itemCode: "SKU-001", itemName: "Basic Tee V2.0", type: "Stock-Out", quantity: 150, referenceSource: "WO-107", referenceType: "Work Order", performedBy: "Warehouse Staff A", dateTime: "2026-02-12 10:30", notes: "Material issued to production" },
  { id: "8", movementId: "MOV-308", itemCode: "MAT-006", itemName: "Zipper (Metal)", type: "Stock-In", quantity: 300, referenceSource: "PO-2044", referenceType: "Purchase", performedBy: "Warehouse Staff B", dateTime: "2026-02-11 09:00", notes: "" },
  { id: "9", movementId: "MOV-309", itemCode: "MAT-005", itemName: "Elastic Band", type: "Stock-Out", quantity: 40, referenceSource: "WO-105", referenceType: "Work Order", performedBy: "Warehouse Staff A", dateTime: "2026-02-10 15:30", notes: "Used up last stock" },
  { id: "10", movementId: "MOV-310", itemCode: "MAT-001", itemName: "Cotton Fabric", type: "Stock-In", quantity: 100, referenceSource: "RTN-005", referenceType: "Return", performedBy: "Warehouse Manager", dateTime: "2026-02-10 11:00", notes: "Returned from production — unused" },
];

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "Stock-In", label: "Stock-In" },
  { value: "Stock-Out", label: "Stock-Out" },
  { value: "Transfer", label: "Transfer" },
  { value: "Adjustment", label: "Adjustment" },
];

const refTypeOptions = [
  { value: "", label: "All Sources" },
  { value: "Purchase", label: "Purchase" },
  { value: "Work Order", label: "Work Order" },
  { value: "Manual", label: "Manual" },
  { value: "Return", label: "Return" },
  { value: "Shipment", label: "Shipment" },
];

const movementTypeCreateOptions = [
  { value: "Stock-In", label: "Stock-In" },
  { value: "Stock-Out", label: "Stock-Out" },
  { value: "Transfer", label: "Transfer" },
];

const itemOptions = [
  { value: "MAT-001", label: "MAT-001 — Cotton Fabric" },
  { value: "MAT-002", label: "MAT-002 — Denim Fabric" },
  { value: "MAT-003", label: "MAT-003 — Polyester Thread" },
  { value: "MAT-004", label: "MAT-004 — Silk Fabric" },
  { value: "MAT-005", label: "MAT-005 — Elastic Band" },
  { value: "MAT-006", label: "MAT-006 — Zipper (Metal)" },
  { value: "SKU-001", label: "SKU-001 — Basic Tee V2.0" },
  { value: "SKU-002", label: "SKU-002 — Hoodie V1.1" },
];

const ITEMS_PER_PAGE = 7;

// ------------------------------------------
// Helper: movement type badge
// ------------------------------------------
const getTypeBadge = (type: StockMovement["type"]) => {
  const styles: Record<string, string> = {
    "Stock-In": "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    "Stock-Out": "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
    Transfer: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    Adjustment: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${styles[type]}`}>
      {type}
    </span>
  );
};

// ==========================================
// Component
// ==========================================
const WHStockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterRefType, setFilterRefType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMov, setSelectedMov] = useState<StockMovement | null>(null);

  // Create form
  const [formMovType, setFormMovType] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formFromLoc, setFormFromLoc] = useState("");
  const [formToLoc, setFormToLoc] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // KPIs
  const kpis = useMemo(() => ({
    total: movements.length,
    stockIn: movements.filter((m) => m.type === "Stock-In").length,
    stockOut: movements.filter((m) => m.type === "Stock-Out").length,
    transfers: movements.filter((m) => m.type === "Transfer").length,
    adjustments: movements.filter((m) => m.type === "Adjustment").length,
  }), [movements]);

  // Filtered data
  const filtered = useMemo(() => {
    let data = [...movements];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (m) =>
          m.movementId.toLowerCase().includes(q) ||
          m.itemCode.toLowerCase().includes(q) ||
          m.itemName.toLowerCase().includes(q) ||
          m.referenceSource.toLowerCase().includes(q)
      );
    }
    if (filterType) data = data.filter((m) => m.type === filterType);
    if (filterRefType) data = data.filter((m) => m.referenceType === filterRefType);
    return data;
  }, [movements, searchQuery, filterType, filterRefType]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const resetForm = () => {
    setFormMovType(""); setFormItem(""); setFormQty(""); setFormReference(""); setFormDestination(""); setFormFromLoc(""); setFormToLoc(""); setFormNotes("");
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleSaveMovement = () => {
    if (!formMovType || !formItem || !formQty) {
      setToast({ message: "Please fill in all required fields.", type: "error" });
      return;
    }
    if (formMovType === "Stock-Out" && Number(formQty) <= 0) {
      setToast({ message: "Quantity must be greater than 0.", type: "error" });
      return;
    }
    if (formMovType === "Transfer" && (!formFromLoc || !formToLoc)) {
      setToast({ message: "Both origin and destination locations are required for transfers.", type: "error" });
      return;
    }
    const typeLabel = formMovType === "Stock-In" ? "Stock-in recorded. Inventory increased." : formMovType === "Stock-Out" ? "Stock-out recorded. Inventory decreased." : "Transfer recorded successfully.";
    setToast({ message: typeLabel, type: "success" });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleView = (mov: StockMovement) => {
    setSelectedMov(mov);
    setIsDetailOpen(true);
  };

  return (
    <WarehouseLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Movements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track every quantity change with full traceability</p>
        </div>
        <SecondaryButton icon={Plus} onClick={handleCreate}>Record Movement</SecondaryButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total Movements" value={kpis.total} icon={ArrowLeftRight} color="bg-indigo-500" />
        <StatsCard title="Stock-In" value={kpis.stockIn} icon={ArrowDownToLine} color="bg-emerald-500" />
        <StatsCard title="Stock-Out" value={kpis.stockOut} icon={ArrowUpFromLine} color="bg-rose-500" />
        <StatsCard title="Transfers" value={kpis.transfers} icon={Truck} color="bg-blue-500" />
        <StatsCard title="Adjustments" value={kpis.adjustments} icon={ClipboardEdit} color="bg-amber-500" />
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        placeholder="Search by movement ID, item, or reference…"
      >
        <div className="p-3 space-y-2">
          <IconSelect label="Movement Type" value={filterType} onChange={(v) => { setFilterType(v); setCurrentPage(1); }} options={typeOptions} placeholder="All Types" />
          <IconSelect label="Reference Source" value={filterRefType} onChange={(v) => { setFilterRefType(v); setCurrentPage(1); }} options={refTypeOptions} placeholder="All Sources" />
        </div>
      </TableToolbar>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Movement ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Performed By</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{mov.movementId}</td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{mov.itemName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{mov.itemCode}</p>
                    </td>
                    <td className="px-6 py-3">{getTypeBadge(mov.type)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold ${mov.quantity > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{mov.referenceSource}</p>
                      <p className="text-[10px] text-slate-400">{mov.referenceType}</p>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">{mov.performedBy}</td>
                    <td className="px-6 py-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{mov.dateTime}</td>
                    <td className="px-6 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button onClick={() => handleView(mov)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                        <button onClick={() => { setMovements(prev => prev.filter(x => x.id !== mov.id)); setToast({ message: "Item archived successfully", type: "success" }); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400 italic">No stock movements found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} endIndex={endIndex} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* Create Movement Modal */}
      <PageModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); resetForm(); }}
        title="Record Stock Movement"
        subtitle="Log a stock-in, stock-out, or transfer"
        footer={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveMovement} className="!w-auto !py-2.5 !px-6 !rounded-xl !text-xs">Record Movement</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-1">
          <IconSelect label="Movement Type *" value={formMovType} onChange={setFormMovType} options={movementTypeCreateOptions} placeholder="Select type…" />
          <IconSelect label="Item *" value={formItem} onChange={setFormItem} options={itemOptions} placeholder="Select item…" />
          <InputGroup id="mov-qty" label="Quantity *" type="number" placeholder="e.g. 50" icon={Hash} value={formQty} onChange={(e) => setFormQty(e.target.value)} />

          {formMovType === "Stock-In" && (
            <InputGroup id="mov-ref" label="Source Reference" placeholder="e.g. PO-2045" icon={Package} value={formReference} onChange={(e) => setFormReference(e.target.value)} />
          )}

          {formMovType === "Stock-Out" && (
            <InputGroup id="mov-dest" label="Destination" placeholder="e.g. Production / Shipment" icon={MapPin} value={formDestination} onChange={(e) => setFormDestination(e.target.value)} />
          )}

          {formMovType === "Transfer" && (
            <>
              <InputGroup id="mov-from" label="From Location *" placeholder="e.g. Storage A" icon={MapPin} value={formFromLoc} onChange={(e) => setFormFromLoc(e.target.value)} />
              <InputGroup id="mov-to" label="To Location *" placeholder="e.g. Storage B" icon={MapPin} value={formToLoc} onChange={(e) => setFormToLoc(e.target.value)} />
            </>
          )}

          <InputGroup id="mov-notes" label="Notes (optional)" placeholder="Additional details…" icon={FileText} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />

          {formMovType === "Stock-Out" && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Stock-out cannot exceed available quantity. System will prevent negative stock unless override policy is active.</p>
            </div>
          )}

          {formMovType === "Stock-In" && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Stock-in will increase inventory and create an audit log entry.</p>
            </div>
          )}
        </div>
      </PageModal>

      {/* Detail Modal */}
      <PageModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedMov(null); }}
        title={selectedMov?.movementId || ""}
        subtitle={`${selectedMov?.itemCode} — ${selectedMov?.itemName}`}
        badges={selectedMov ? getTypeBadge(selectedMov.type) : undefined}
      >
        {selectedMov && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantity</label><p className={`text-sm font-bold mt-1 ${selectedMov.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{selectedMov.quantity > 0 ? `+${selectedMov.quantity}` : selectedMov.quantity}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reference</label><p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedMov.referenceSource}</p><p className="text-[10px] text-slate-400">{selectedMov.referenceType}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performed By</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedMov.performedBy}</p></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date/Time</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedMov.dateTime}</p></div>
            </div>
            {selectedMov.notes && (
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label><p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedMov.notes}</p></div>
            )}
          </div>
        )}
      </PageModal>
    </WarehouseLayout>
  );
};

export default WHStockMovementsPage;
