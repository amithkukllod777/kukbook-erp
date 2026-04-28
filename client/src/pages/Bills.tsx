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

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default function Bills() {
  const utils = trpc.useUtils();
  const { data: bills = [], isLoading } = trpc.bills.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const { data: nextId } = trpc.bills.nextId.useQuery();
  const createMut = trpc.bills.create.useMutation({ onSuccess: () => { utils.bills.list.invalidate(); utils.bills.nextId.invalidate(); toast.success("Bill created"); setOpen(false); } });
  const updateStatusMut = trpc.bills.updateStatus.useMutation({ onSuccess: () => { utils.bills.list.invalidate(); toast.success("Bill paid"); } });
  const deleteMut = trpc.bills.delete.useMutation({ onSuccess: () => { utils.bills.list.invalidate(); toast.success("Bill deleted"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ vendorId: 0, vendorName: "", date: new Date().toISOString().split("T")[0], dueDate: "", amount: "0", description: "" });

  const filtered = useMemo(() => bills.filter((b: any) => b.vendorName.toLowerCase().includes(search.toLowerCase()) || b.billId.includes(search)), [bills, search]);

  const openCreate = () => { setForm({ vendorId: 0, vendorName: "", date: new Date().toISOString().split("T")[0], dueDate: "", amount: "0", description: "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.vendorId) { toast.error("Select a vendor"); return; }
    if (!form.dueDate) { toast.error("Due date is required"); return; }
    createMut.mutate({ billId: nextId || "BILL-001", ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Bills</h1><p className="text-sm text-muted-foreground mt-1">Track vendor bills and payments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Bills", filename: "bills", columns: [{ header: "Bill #", key: "billId" }, { header: "Vendor", key: "vendorName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Amount", key: "amount", format: "currency" }], data: filtered })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Bills Report", subtitle: `Generated on ${new Date().toLocaleDateString()}`, filename: "bills", columns: [{ header: "Bill #", key: "billId" }, { header: "Vendor", key: "vendorName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Amount", key: "amount", format: "currency" }], data: filtered })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Bill</Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Bill #</TableHead><TableHead>Vendor</TableHead><TableHead>Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No bills found</TableCell></TableRow>
              : filtered.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.billId}</TableCell>
                  <TableCell className="font-medium">{b.vendorName}</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell>{b.dueDate}</TableCell>
                  <TableCell><Badge variant="secondary" className={b.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{b.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(b.amount))}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {b.status === "Pending" && <Button variant="ghost" size="icon" title="Pay Bill" onClick={() => updateStatusMut.mutate({ id: b.id, status: "Paid" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: b.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Bill</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Vendor *</label>
              <Select value={String(form.vendorId || "")} onValueChange={v => { const vn = vendors.find((x: any) => x.id === Number(v)); setForm({ ...form, vendorId: Number(v), vendorName: vn?.name || "" }); }}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{vendors.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div><div><label className="text-sm font-medium">Due Date *</label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div></div>
            <div><label className="text-sm font-medium">Amount</label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create Bill</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
