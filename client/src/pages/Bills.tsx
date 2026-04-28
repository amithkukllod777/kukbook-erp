import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, CheckCircle, FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const GST_RATES = ["0", "5", "12", "18", "28"];

// TDS Sections for vendor payments
const TDS_SECTIONS = [
  { code: "194C", description: "Payment to Contractor", individual: 1, others: 2 },
  { code: "194J", description: "Professional/Technical Fees", individual: 10, others: 10 },
  { code: "194H", description: "Commission/Brokerage", individual: 5, others: 5 },
  { code: "194I(a)", description: "Rent - Plant & Machinery", individual: 2, others: 2 },
  { code: "194I(b)", description: "Rent - Land/Building/Furniture", individual: 10, others: 10 },
  { code: "194A", description: "Interest (other than securities)", individual: 10, others: 10 },
  { code: "194D", description: "Insurance Commission", individual: 5, others: 10 },
  { code: "194Q", description: "Purchase of Goods (>50L)", individual: 0.1, others: 0.1 },
];

export default function Bills() {
  const utils = trpc.useUtils();
  const { activeCompany } = useCompany();
  const { data: bills = [], isLoading } = trpc.bills.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const { data: nextId } = trpc.bills.nextId.useQuery();
  const { data: companyDetails } = trpc.company.getById.useQuery(
    { id: activeCompany?.id || 0 },
    { enabled: !!activeCompany?.id }
  );
  const createMut = trpc.bills.create.useMutation({ onSuccess: () => { utils.bills.list.invalidate(); utils.bills.nextId.invalidate(); toast.success("Bill created"); setOpen(false); } });
  const updateStatusMut = trpc.bills.updateStatus.useMutation({ onSuccess: () => { utils.bills.list.invalidate(); toast.success("Bill paid"); } });
  const deleteMut = trpc.bills.delete.useMutation({ onSuccess: () => { utils.bills.list.invalidate(); toast.success("Bill deleted"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [tdsSection, setTdsSection] = useState("");
  const [form, setForm] = useState({ vendorId: 0, vendorName: "", date: new Date().toISOString().split("T")[0], dueDate: "", subtotal: "0", description: "" });

  const filtered = useMemo(() => bills.filter((b: any) => b.vendorName.toLowerCase().includes(search.toLowerCase()) || b.billId.includes(search)), [bills, search]);

  const taxableValue = Math.max(0, Number(form.subtotal || 0));
  const companyState = companyDetails?.state || "";
  const isInterState = placeOfSupply && companyState && placeOfSupply !== companyState;
  const gstPercent = Number(gstRate);
  const gstAmount = Math.round(taxableValue * gstPercent / 100 * 100) / 100;
  const cgst = isInterState ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const sgst = isInterState ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const igst = isInterState ? gstAmount : 0;
  const totalBeforeTds = taxableValue + gstAmount;

  // TDS Calculation
  const selectedTds = TDS_SECTIONS.find(s => s.code === tdsSection);
  const tdsRate = selectedTds ? selectedTds.others : 0;
  const tdsAmount = tdsEnabled && tdsRate > 0 ? Math.round(taxableValue * tdsRate / 100 * 100) / 100 : 0;
  const netPayable = totalBeforeTds - tdsAmount;

  const openCreate = () => {
    setForm({ vendorId: 0, vendorName: "", date: new Date().toISOString().split("T")[0], dueDate: "", subtotal: "0", description: "" });
    setGstRate("18");
    setPlaceOfSupply("");
    setTdsEnabled(false);
    setTdsSection("");
    setOpen(true);
  };

  const handleVendorChange = (vendorId: number) => {
    const v = vendors.find((x: any) => x.id === vendorId);
    setForm({ ...form, vendorId, vendorName: v?.name || "" });
    if (v?.state) setPlaceOfSupply(v.state);
  };

  const handleSave = () => {
    if (!form.vendorId) { toast.error("Select a vendor"); return; }
    if (!form.dueDate) { toast.error("Due date is required"); return; }
    if (!placeOfSupply) { toast.error("Place of supply is required for GST"); return; }
    createMut.mutate({
      billId: nextId || "BILL-001",
      vendorId: form.vendorId,
      vendorName: form.vendorName,
      date: form.date,
      dueDate: form.dueDate,
      subtotal: String(taxableValue),
      cgst: String(cgst),
      sgst: String(sgst),
      igst: String(igst),
      amount: String(netPayable),
      description: form.description,
      tdsSection: tdsEnabled ? tdsSection : undefined,
      tdsRate: tdsEnabled ? String(tdsRate) : undefined,
      tdsAmount: tdsEnabled ? String(tdsAmount) : undefined,
      tdsNetPayable: tdsEnabled ? String(netPayable) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Bills</h1><p className="text-sm text-muted-foreground mt-1">Track vendor bills with GST & TDS</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Bills", filename: "bills", columns: [{ header: "Bill #", key: "billId" }, { header: "Vendor", key: "vendorName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Subtotal", key: "subtotal", format: "currency" }, { header: "CGST", key: "cgst", format: "currency" }, { header: "SGST", key: "sgst", format: "currency" }, { header: "IGST", key: "igst", format: "currency" }, { header: "TDS", key: "tdsAmount", format: "currency" }, { header: "Total", key: "amount", format: "currency" }], data: filtered })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Bills Report", subtitle: `Generated on ${new Date().toLocaleDateString()}`, filename: "bills", columns: [{ header: "Bill #", key: "billId" }, { header: "Vendor", key: "vendorName" }, { header: "Date", key: "date" }, { header: "Status", key: "status" }, { header: "Subtotal", key: "subtotal", format: "currency" }, { header: "TDS Sec", key: "tdsSection" }, { header: "TDS", key: "tdsAmount", format: "currency" }, { header: "Net Payable", key: "amount", format: "currency" }], data: filtered })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Bill</Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Bill #</TableHead><TableHead>Vendor</TableHead><TableHead>Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>TDS</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">GST</TableHead><TableHead className="text-right">Net Payable</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No bills found</TableCell></TableRow>
              : filtered.map((b: any) => {
                const billGst = Number(b.cgst || 0) + Number(b.sgst || 0) + Number(b.igst || 0);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{b.billId}</TableCell>
                    <TableCell className="font-medium">{b.vendorName}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.dueDate}</TableCell>
                    <TableCell><Badge variant="secondary" className={b.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{b.status}</Badge></TableCell>
                    <TableCell>{b.tdsSection ? <Badge variant="outline" className="text-xs">{b.tdsSection} @ {b.tdsRate}%</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(b.subtotal || 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{billGst > 0 ? fmt(billGst) : "—"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmt(Number(b.amount))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.status === "Pending" && <Button variant="ghost" size="icon" title="Pay Bill" onClick={() => updateStatusMut.mutate({ id: b.id, status: "Paid" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: b.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Bill</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Vendor *</label>
              <Select value={String(form.vendorId || "")} onValueChange={v => handleVendorChange(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{vendors.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Due Date *</label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>

            {/* GST Section */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <div>
                <label className="text-sm font-medium text-blue-800">Place of Supply *</label>
                <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-800">GST Rate</label>
                <Select value={gstRate} onValueChange={setGstRate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={r}>{r}%</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {placeOfSupply && (
                <div className="col-span-2 text-sm">
                  {companyState && <span className="text-muted-foreground mr-2">Company: {companyState}</span>}
                  <span className={isInterState ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                    {isInterState ? "Inter-State → IGST" : "Intra-State → CGST + SGST"}
                  </span>
                </div>
              )}
            </div>

            <div><label className="text-sm font-medium">Taxable Amount (₹)</label><Input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} /></div>

            {/* TDS Section */}
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="tds-toggle" checked={tdsEnabled} onChange={e => setTdsEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="tds-toggle" className="text-sm font-medium text-amber-800">Apply TDS (Tax Deducted at Source)</label>
              </div>
              {tdsEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-amber-700">TDS Section</label>
                    <Select value={tdsSection} onValueChange={setTdsSection}>
                      <SelectTrigger><SelectValue placeholder="Select TDS section" /></SelectTrigger>
                      <SelectContent>
                        {TDS_SECTIONS.map(s => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.code} — {s.description} ({s.others}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTds && taxableValue > 0 && (
                    <div className="text-sm space-y-1 p-2 bg-amber-100/50 rounded">
                      <div className="flex justify-between"><span>TDS Rate (Sec {selectedTds.code})</span><span className="font-medium">{tdsRate}%</span></div>
                      <div className="flex justify-between"><span>TDS Amount (on ₹{taxableValue.toLocaleString("en-IN")})</span><span className="font-medium text-amber-800">{fmt(tdsAmount)}</span></div>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Threshold: ₹30,000 single / ₹1,00,000 aggregate (194C)</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary Breakdown */}
            {taxableValue > 0 && (
              <div className="text-sm space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between"><span>Taxable Value</span><span className="tabular-nums">{fmt(taxableValue)}</span></div>
                {gstPercent > 0 && !isInterState && (
                  <>
                    <div className="flex justify-between text-blue-700"><span>CGST @ {gstPercent / 2}%</span><span className="tabular-nums">{fmt(cgst)}</span></div>
                    <div className="flex justify-between text-blue-700"><span>SGST @ {gstPercent / 2}%</span><span className="tabular-nums">{fmt(sgst)}</span></div>
                  </>
                )}
                {gstPercent > 0 && isInterState && (
                  <div className="flex justify-between text-orange-700"><span>IGST @ {gstPercent}%</span><span className="tabular-nums">{fmt(igst)}</span></div>
                )}
                <div className="flex justify-between border-t pt-1"><span>Gross Total</span><span className="tabular-nums">{fmt(totalBeforeTds)}</span></div>
                {tdsEnabled && tdsAmount > 0 && (
                  <div className="flex justify-between text-amber-700"><span>Less: TDS ({tdsSection} @ {tdsRate}%)</span><span className="tabular-nums">- {fmt(tdsAmount)}</span></div>
                )}
                <div className="flex justify-between font-bold border-t pt-1"><span>Net Payable to Vendor</span><span className="tabular-nums">{fmt(netPayable)}</span></div>
              </div>
            )}

            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create Bill</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
