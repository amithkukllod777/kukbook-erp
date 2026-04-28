import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, CheckCircle, Truck } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = { Ordered: "bg-blue-100 text-blue-800", InTransit: "bg-amber-100 text-amber-800", Delivered: "bg-emerald-100 text-emerald-800", Cancelled: "bg-red-100 text-red-800" };

export default function SupplyChain() {
  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.supplyChain.list.useQuery();
  const { data: nextId } = trpc.supplyChain.nextId.useQuery();
  const createMut = trpc.supplyChain.create.useMutation({ onSuccess: () => { utils.supplyChain.list.invalidate(); utils.supplyChain.nextId.invalidate(); toast.success("Order created"); setOpen(false); } });
  const updateStatusMut = trpc.supplyChain.updateStatus.useMutation({ onSuccess: () => { utils.supplyChain.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.supplyChain.delete.useMutation({ onSuccess: () => { utils.supplyChain.list.invalidate(); toast.success("Order deleted"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ supplierName: "", itemName: "", qty: 1, orderDate: new Date().toISOString().split("T")[0], expectedDate: "" });

  const filtered = useMemo(() => orders.filter((o: any) => o.supplierName.toLowerCase().includes(search.toLowerCase()) || o.itemName.toLowerCase().includes(search.toLowerCase())), [orders, search]);

  const openCreate = () => { setForm({ supplierName: "", itemName: "", qty: 1, orderDate: new Date().toISOString().split("T")[0], expectedDate: "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.supplierName || !form.itemName) { toast.error("Supplier and Item are required"); return; }
    createMut.mutate({ orderId: nextId || "SC-001", ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Supply Chain</h1><p className="text-sm text-muted-foreground mt-1">Track supply chain orders and logistics</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Order</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Supplier</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Order Date</TableHead><TableHead>Expected</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
              : filtered.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">{o.orderId}</TableCell>
                  <TableCell className="font-medium">{o.supplierName}</TableCell>
                  <TableCell>{o.itemName}</TableCell>
                  <TableCell className="text-right">{o.qty}</TableCell>
                  <TableCell>{o.orderDate}</TableCell>
                  <TableCell>{o.expectedDate || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[o.status] || ""}>{o.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {o.status === "Ordered" && <Button variant="ghost" size="icon" title="In Transit" onClick={() => updateStatusMut.mutate({ id: o.id, status: "InTransit" })}><Truck className="h-4 w-4 text-amber-600" /></Button>}
                      {o.status === "InTransit" && <Button variant="ghost" size="icon" title="Delivered" onClick={() => updateStatusMut.mutate({ id: o.id, status: "Delivered" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
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
        <DialogContent><DialogHeader><DialogTitle>New Supply Chain Order</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Supplier *</label><Input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} /></div><div><label className="text-sm font-medium">Item *</label><Input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} /></div></div>
            <div className="grid grid-cols-3 gap-4"><div><label className="text-sm font-medium">Quantity</label><Input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} /></div><div><label className="text-sm font-medium">Order Date</label><Input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} /></div><div><label className="text-sm font-medium">Expected</label><Input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create Order</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
