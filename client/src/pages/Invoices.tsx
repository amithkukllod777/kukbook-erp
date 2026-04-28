import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, CheckCircle, Send, FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToCSV, exportInvoicePDF } from "@/lib/export";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);
const statusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-800", Sent: "bg-blue-100 text-blue-800", Paid: "bg-emerald-100 text-emerald-800", Overdue: "bg-red-100 text-red-800" };

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const GST_RATES = ["0", "5", "12", "18", "28"];

export default function Invoices() {
  const utils = trpc.useUtils();
  const { activeCompany } = useCompany();
  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: nextId } = trpc.invoices.nextId.useQuery();
  const { data: companyDetails } = trpc.company.getById.useQuery(
    { id: activeCompany?.id || 0 },
    { enabled: !!activeCompany?.id }
  );
  const createMut = trpc.invoices.create.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); utils.invoices.nextId.invalidate(); toast.success("Invoice created"); setOpen(false); } });
  const updateStatusMut = trpc.invoices.updateStatus.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.invoices.delete.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Invoice deleted"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [gstRate, setGstRate] = useState("18");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [form, setForm] = useState({ customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], dueDate: "", discount: "0", lines: [{ description: "", qty: 1, rate: "0", discount: "0", amount: "0" }] });

  const filtered = useMemo(() => invoices.filter((i: any) => {
    const matchSearch = i.customerName.toLowerCase().includes(search.toLowerCase()) || i.invoiceId.includes(search);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  }), [invoices, search, filterStatus]);

  const subtotal = form.lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const discountAmt = Number(form.discount || 0);
  const taxableValue = Math.max(0, subtotal - discountAmt);

  // GST calculation: IGST if inter-state, CGST+SGST if intra-state
  const companyState = companyDetails?.state || "";
  const isInterState = placeOfSupply && companyState && placeOfSupply !== companyState;
  const gstPercent = Number(gstRate);
  const gstAmount = Math.round(taxableValue * gstPercent / 100 * 100) / 100;
  const cgst = isInterState ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const sgst = isInterState ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const igst = isInterState ? gstAmount : 0;
  const total = taxableValue + gstAmount;

  const addLine = () => setForm({ ...form, lines: [...form.lines, { description: "", qty: 1, rate: "0", discount: "0", amount: "0" }] });
  const removeLine = (i: number) => { if (form.lines.length <= 1) return; setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }); };
  const updateLine = (i: number, field: string, value: any) => {
    const lines = [...form.lines];
    (lines[i] as any)[field] = value;
    if (field === "qty" || field === "rate" || field === "discount") {
      const lineTotal = Number(lines[i].qty) * Number(lines[i].rate);
      const lineDisc = Number(lines[i].discount || 0);
      lines[i].amount = String(lineTotal - lineDisc);
    }
    setForm({ ...form, lines });
  };

  const openCreate = () => {
    setForm({ customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], dueDate: "", discount: "0", lines: [{ description: "", qty: 1, rate: "0", discount: "0", amount: "0" }] });
    setGstRate("18");
    setPlaceOfSupply("");
    setOpen(true);
  };

  const handleCustomerChange = (customerId: number) => {
    const c = customers.find((c: any) => c.id === customerId);
    setForm({ ...form, customerId, customerName: c?.name || "" });
    // Auto-set place of supply from customer's state
    if (c?.state) setPlaceOfSupply(c.state);
  };

  const handleSave = () => {
    if (!form.customerId) { toast.error("Select a customer"); return; }
    if (!form.dueDate) { toast.error("Due date is required"); return; }
    if (!placeOfSupply) { toast.error("Place of supply is required for GST"); return; }
    createMut.mutate({
      invoiceId: nextId || "INV-001",
      customerId: form.customerId,
      customerName: form.customerName,
      date: form.date,
      dueDate: form.dueDate,
      status: "Draft",
      subtotal: String(taxableValue),
      cgst: String(cgst),
      sgst: String(sgst),
      igst: String(igst),
      total: String(total),
      lines: form.lines.map(l => ({ ...l, rate: String(l.rate), amount: String(l.amount) })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Track and manage customer invoices with GST</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Invoices", filename: "invoices", columns: [{ header: "Invoice #", key: "invoiceId" }, { header: "Customer", key: "customerName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Subtotal", key: "subtotal", format: "currency" }, { header: "CGST", key: "cgst", format: "currency" }, { header: "SGST", key: "sgst", format: "currency" }, { header: "IGST", key: "igst", format: "currency" }, { header: "Total", key: "total", format: "currency" }], data: filtered })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Invoices Report", subtitle: `Generated on ${new Date().toLocaleDateString()}`, filename: "invoices", columns: [{ header: "Invoice #", key: "invoiceId" }, { header: "Customer", key: "customerName" }, { header: "Date", key: "date" }, { header: "Status", key: "status" }, { header: "Subtotal", key: "subtotal", format: "currency" }, { header: "CGST", key: "cgst", format: "currency" }, { header: "SGST", key: "sgst", format: "currency" }, { header: "IGST", key: "igst", format: "currency" }, { header: "Total", key: "total", format: "currency" }], data: filtered })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">GST</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
              : filtered.map((inv: any) => {
                const invGst = Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoiceId}</TableCell>
                    <TableCell className="font-medium">{inv.customerName}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell><Badge className={statusColors[inv.status] || ""} variant="secondary">{inv.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(inv.subtotal))}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {invGst > 0 ? fmt(invGst) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmt(Number(inv.total))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Download PDF" onClick={() => exportInvoicePDF(inv)}><FileDown className="h-4 w-4 text-primary" /></Button>
                        {inv.status === "Draft" && <Button variant="ghost" size="icon" title="Mark as Sent" onClick={() => updateStatusMut.mutate({ id: inv.id, status: "Sent" })}><Send className="h-4 w-4 text-blue-600" /></Button>}
                        {(inv.status === "Sent" || inv.status === "Overdue") && <Button variant="ghost" size="icon" title="Mark as Paid" onClick={() => updateStatusMut.mutate({ id: inv.id, status: "Paid" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: inv.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1"><label className="text-sm font-medium">Customer *</label>
                <Select value={String(form.customerId || "")} onValueChange={v => handleCustomerChange(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Due Date *</label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>

            {/* GST Section */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
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
              <div className="flex items-end">
                <div className="text-sm">
                  {companyState && <p className="text-muted-foreground">Company: <span className="font-medium">{companyState}</span></p>}
                  {placeOfSupply && (
                    <p className={isInterState ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                      {isInterState ? "Inter-State → IGST" : "Intra-State → CGST + SGST"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Line Items</label><Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="w-[80px]">Qty</TableHead><TableHead className="w-[100px]">Rate</TableHead><TableHead className="w-[100px]">Discount</TableHead><TableHead className="w-[100px]">Amount</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {form.lines.map((line, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={line.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Item description" /></TableCell>
                        <TableCell><Input type="number" value={line.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} /></TableCell>
                        <TableCell><Input type="number" value={line.rate} onChange={e => updateLine(i, "rate", e.target.value)} /></TableCell>
                        <TableCell><Input type="number" value={line.discount} onChange={e => updateLine(i, "discount", e.target.value)} placeholder="0" /></TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{fmt(Number(line.amount))}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30"><TableCell colSpan={4} className="text-right text-sm">Subtotal</TableCell><TableCell className="text-right tabular-nums">{fmt(subtotal)}</TableCell><TableCell /></TableRow>
                    <TableRow className="bg-muted/30"><TableCell colSpan={4} className="text-right text-sm">Discount</TableCell><TableCell><Input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="text-right h-8" /></TableCell><TableCell /></TableRow>
                    <TableRow className="bg-muted/30"><TableCell colSpan={4} className="text-right text-sm font-medium">Taxable Value</TableCell><TableCell className="text-right font-medium tabular-nums">{fmt(taxableValue)}</TableCell><TableCell /></TableRow>
                    {!isInterState && gstPercent > 0 && (
                      <>
                        <TableRow className="bg-blue-50/50"><TableCell colSpan={4} className="text-right text-sm text-blue-700">CGST @ {gstPercent / 2}%</TableCell><TableCell className="text-right tabular-nums text-blue-700">{fmt(cgst)}</TableCell><TableCell /></TableRow>
                        <TableRow className="bg-blue-50/50"><TableCell colSpan={4} className="text-right text-sm text-blue-700">SGST @ {gstPercent / 2}%</TableCell><TableCell className="text-right tabular-nums text-blue-700">{fmt(sgst)}</TableCell><TableCell /></TableRow>
                      </>
                    )}
                    {isInterState && gstPercent > 0 && (
                      <TableRow className="bg-orange-50/50"><TableCell colSpan={4} className="text-right text-sm text-orange-700">IGST @ {gstPercent}%</TableCell><TableCell className="text-right tabular-nums text-orange-700">{fmt(igst)}</TableCell><TableCell /></TableRow>
                    )}
                    <TableRow className="bg-muted/50"><TableCell colSpan={4} className="text-right font-bold">Total</TableCell><TableCell className="text-right font-bold tabular-nums text-lg">{fmt(total)}</TableCell><TableCell /></TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
