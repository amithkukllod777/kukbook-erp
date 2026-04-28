import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Truck, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function DeliveryChallans() {
  const { data: challans = [], isLoading } = trpc.deliveryChallans.list.useQuery();
  const { data: nextId } = trpc.deliveryChallans.nextId.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.deliveryChallans.create.useMutation({ onSuccess: () => { utils.deliveryChallans.list.invalidate(); toast.success("Challan created"); } });
  const updateStatusMut = trpc.deliveryChallans.updateStatus.useMutation({ onSuccess: () => { utils.deliveryChallans.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.deliveryChallans.delete.useMutation({ onSuccess: () => { utils.deliveryChallans.list.invalidate(); toast.success("Deleted"); } });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], invoiceRef: "", transportMode: "", vehicleNumber: "", notes: "" });

  const filtered = useMemo(() => challans.filter((c: any) => c.customerName?.toLowerCase().includes(search.toLowerCase()) || c.challanId?.toLowerCase().includes(search.toLowerCase())), [challans, search]);

  const statusColor = (s: string) => s === "Delivered" ? "bg-green-100 text-green-800" : s === "Sent" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Challans</h1>
          <p className="text-muted-foreground">Manage delivery challans for goods dispatched</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Challan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Delivery Challan</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select onValueChange={(v) => { const c = customers.find((x: any) => x.id === Number(v)); setForm({ ...form, customerId: Number(v), customerName: c?.name || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Invoice Ref</Label><Input value={form.invoiceRef} onChange={e => setForm({ ...form, invoiceRef: e.target.value })} placeholder="INV-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Transport Mode</Label><Input value={form.transportMode} onChange={e => setForm({ ...form, transportMode: e.target.value })} placeholder="Road / Rail / Air" /></div>
                <div className="grid gap-2"><Label>Vehicle Number</Label><Input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={() => { if (!form.customerId) { toast.error("Select customer"); return; } createMut.mutate({ challanId: nextId || "DC-001", ...form }); setOpen(false); }} disabled={createMut.isPending}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search challans..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Delivery Challans ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-muted-foreground">No challans found</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Challan ID</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Invoice Ref</th><th className="pb-3 font-medium">Transport</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Actions</th></tr></thead>
                <tbody>{filtered.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">{c.challanId}</td>
                    <td className="py-3">{c.customerName}</td>
                    <td className="py-3">{c.date}</td>
                    <td className="py-3">{c.invoiceRef || "-"}</td>
                    <td className="py-3">{c.transportMode || "-"}</td>
                    <td className="py-3"><Badge className={statusColor(c.status)}>{c.status}</Badge></td>
                    <td className="py-3 flex gap-2">
                      {c.status === "Draft" && <Button size="sm" variant="outline" onClick={() => updateStatusMut.mutate({ id: c.id, status: "Sent" })}>Send</Button>}
                      {c.status === "Sent" && <Button size="sm" variant="outline" onClick={() => updateStatusMut.mutate({ id: c.id, status: "Delivered" })}>Delivered</Button>}
                      <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
