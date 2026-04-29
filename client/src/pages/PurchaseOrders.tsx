import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, CheckCircle, Truck } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);
const statusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-800", Ordered: "bg-blue-100 text-blue-800", Received: "bg-emerald-100 text-emerald-800", Cancelled: "bg-red-100 text-red-800" };

export default function PurchaseOrders() {
  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.purchaseOrders.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const { data: nextId } = trpc.purchaseOrders.nextId.useQuery();
  const createMut = trpc.purchaseOrders.create.useMutation({ onSuccess: () => { utils.purchaseOrders.list.invalidate(); utils.purchaseOrders.nextId.invalidate(); toast.success("PO created"); setOpen(false); } });
  const updateStatusMut = trpc.purchaseOrders.updateStatus.useMutation({ onSuccess: () => { utils.purchaseOrders.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.purchaseOrders.delete.useMutation({ onSuccess: () => { utils.purchaseOrders.list.invalidate(); toast.success("PO deleted"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ vendorId: 0, vendorName: "", date: new Date().toISOString().split("T")[0], expectedDate: "", total: "0", description: "" });

  const filtered = useMemo(() => orders.filter((o: any) => o.vendorName.toLowerCase().includes(search.toLowerCase()) || o.poId.includes(search)), [orders, search]);

  const openCreate = () => { setForm({ vendorId: 0, vendorName: "", date: new Date().toISOString().split("T")[0], expectedDate: "", total: "0", description: "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.vendorId) { toast.error("Select a vendor"); return; }
    createMut.mutate({ poId: nextId || "PO-001", ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1><p className="text-sm text-muted-foreground mt-1">Manage purchase orders to vendors</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New PO</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>PO #</TableHead><TableHead>Vendor</TableHead><TableHead>Date</TableHead><TableHead>Expected</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No purchase orders found</TableCell></TableRow>
              : filtered.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">{o.poId}</TableCell>
                  <TableCell className="font-medium">{o.vendorName}</TableCell>
                  <TableCell>{o.date}</TableCell>
                  <TableCell>{o.expectedDate || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[o.status] || ""}>{o.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(o.total))}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {o.status === "Draft" && <Button variant="ghost" size="icon" title="Mark Ordered" onClick={() => updateStatusMut.mutate({ id: o.id, status: "Ordered" })}><Truck className="h-4 w-4 text-blue-600" /></Button>}
                      {o.status === "Ordered" && <Button variant="ghost" size="icon" title="Mark Received" onClick={() => updateStatusMut.mutate({ id: o.id, status: "Received" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: o.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Vendor *</label>
              <Select value={String(form.vendorId || "")} onValueChange={v => { const vn = vendors.find((x: any) => x.id === Number(v)); setForm({ ...form, vendorId: Number(v), vendorName: vn?.name || "" }); }}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{vendors.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Order Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div><div><label className="text-sm font-medium">Expected Date</label><Input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} /></div></div>
            <div><label className="text-sm font-medium">Total Amount</label><Input type="number" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create PO</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
