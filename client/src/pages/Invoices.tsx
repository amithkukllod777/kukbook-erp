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

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
const statusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-800", Sent: "bg-blue-100 text-blue-800", Paid: "bg-emerald-100 text-emerald-800", Overdue: "bg-red-100 text-red-800" };

export default function Invoices() {
  const utils = trpc.useUtils();
  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: nextId } = trpc.invoices.nextId.useQuery();
  const createMut = trpc.invoices.create.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); utils.invoices.nextId.invalidate(); toast.success("Invoice created"); setOpen(false); } });
  const updateStatusMut = trpc.invoices.updateStatus.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.invoices.delete.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Invoice deleted"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], dueDate: "", lines: [{ description: "", qty: 1, rate: "0", amount: "0" }] });

  const filtered = useMemo(() => invoices.filter((i: any) => {
    const matchSearch = i.customerName.toLowerCase().includes(search.toLowerCase()) || i.invoiceId.includes(search);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  }), [invoices, search, filterStatus]);

  const total = form.lines.reduce((s, l) => s + Number(l.amount || 0), 0);

  const addLine = () => setForm({ ...form, lines: [...form.lines, { description: "", qty: 1, rate: "0", amount: "0" }] });
  const removeLine = (i: number) => { if (form.lines.length <= 1) return; setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }); };
  const updateLine = (i: number, field: string, value: any) => {
    const lines = [...form.lines];
    (lines[i] as any)[field] = value;
    if (field === "qty" || field === "rate") { lines[i].amount = String(Number(lines[i].qty) * Number(lines[i].rate)); }
    setForm({ ...form, lines });
  };

  const openCreate = () => {
    setForm({ customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], dueDate: "", lines: [{ description: "", qty: 1, rate: "0", amount: "0" }] });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.customerId) { toast.error("Select a customer"); return; }
    if (!form.dueDate) { toast.error("Due date is required"); return; }
    createMut.mutate({ invoiceId: nextId || "INV-001", customerId: form.customerId, customerName: form.customerName, date: form.date, dueDate: form.dueDate, status: "Draft", total: String(total), lines: form.lines.map(l => ({ ...l, rate: String(l.rate), amount: String(l.amount) })) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Track and manage customer invoices</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Invoices", filename: "invoices", columns: [{ header: "Invoice #", key: "invoiceId" }, { header: "Customer", key: "customerName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Total", key: "total", format: "currency" }], data: filtered })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Invoices Report", subtitle: `Generated on ${new Date().toLocaleDateString()}`, filename: "invoices", columns: [{ header: "Invoice #", key: "invoiceId" }, { header: "Customer", key: "customerName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Total", key: "total", format: "currency" }], data: filtered })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
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
            <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
              : filtered.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoiceId}</TableCell>
                  <TableCell className="font-medium">{inv.customerName}</TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell>{inv.dueDate}</TableCell>
                  <TableCell><Badge className={statusColors[inv.status] || ""} variant="secondary">{inv.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(inv.total))}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Download PDF" onClick={() => exportInvoicePDF(inv)}><FileDown className="h-4 w-4 text-primary" /></Button>
                      {inv.status === "Draft" && <Button variant="ghost" size="icon" title="Mark as Sent" onClick={() => updateStatusMut.mutate({ id: inv.id, status: "Sent" })}><Send className="h-4 w-4 text-blue-600" /></Button>}
                      {(inv.status === "Sent" || inv.status === "Overdue") && <Button variant="ghost" size="icon" title="Mark as Paid" onClick={() => updateStatusMut.mutate({ id: inv.id, status: "Paid" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: inv.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1"><label className="text-sm font-medium">Customer *</label>
                <Select value={String(form.customerId || "")} onValueChange={v => { const c = customers.find((c: any) => c.id === Number(v)); setForm({ ...form, customerId: Number(v), customerName: c?.name || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Due Date *</label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Line Items</label><Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="w-[80px]">Qty</TableHead><TableHead className="w-[110px]">Rate</TableHead><TableHead className="w-[110px]">Amount</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {form.lines.map((line, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={line.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Item description" /></TableCell>
                        <TableCell><Input type="number" value={line.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} /></TableCell>
                        <TableCell><Input type="number" value={line.rate} onChange={e => updateLine(i, "rate", e.target.value)} /></TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(line.amount))}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50"><TableCell colSpan={3} className="text-right font-semibold">Total</TableCell><TableCell className="text-right font-bold">{fmt(total)}</TableCell><TableCell /></TableRow>
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
