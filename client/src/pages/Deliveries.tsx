import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CheckCircle, Truck } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = { Pending: "bg-gray-100 text-gray-800", Assigned: "bg-blue-100 text-blue-800", InTransit: "bg-amber-100 text-amber-800", Delivered: "bg-emerald-100 text-emerald-800" };

export default function Deliveries() {
  const utils = trpc.useUtils();
  const { data: deliveries = [], isLoading } = trpc.deliveries.list.useQuery();
  const { data: staff = [] } = trpc.deliveryStaff.list.useQuery();
  const { data: nextId } = trpc.deliveries.nextId.useQuery();
  const createMut = trpc.deliveries.create.useMutation({ onSuccess: () => { utils.deliveries.list.invalidate(); utils.deliveries.nextId.invalidate(); toast.success("Delivery created"); setOpen(false); } });
  const updateStatusMut = trpc.deliveries.updateStatus.useMutation({ onSuccess: () => { utils.deliveries.list.invalidate(); toast.success("Status updated"); } });
  const assignMut = trpc.deliveries.assign.useMutation({ onSuccess: () => { utils.deliveries.list.invalidate(); toast.success("Assigned"); setAssignOpen(false); } });

  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [assignStaffId, setAssignStaffId] = useState(0);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customerName: "", address: "", invoiceId: "" });

  const filtered = useMemo(() => deliveries.filter((d: any) => d.customerName.toLowerCase().includes(search.toLowerCase()) || d.deliveryId.includes(search)), [deliveries, search]);

  const openCreate = () => { setForm({ customerName: "", address: "", invoiceId: "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.customerName) { toast.error("Customer name is required"); return; }
    createMut.mutate({ deliveryId: nextId || "DEL-001", ...form });
  };
  const openAssign = (d: any) => { setAssignTarget(d); setAssignStaffId(0); setAssignOpen(true); };
  const handleAssign = () => {
    if (!assignStaffId) { toast.error("Select a staff member"); return; }
    const s = staff.find((x: any) => x.id === assignStaffId);
    assignMut.mutate({ id: assignTarget.id, staffId: assignStaffId, staffName: s?.name || "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Deliveries</h1><p className="text-sm text-muted-foreground mt-1">Track and manage deliveries</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Delivery</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search deliveries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Address</TableHead><TableHead>Staff</TableHead><TableHead>Invoice</TableHead><TableHead>Status</TableHead><TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No deliveries found</TableCell></TableRow>
              : filtered.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm">{d.deliveryId}</TableCell>
                  <TableCell className="font-medium">{d.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">{d.address || "—"}</TableCell>
                  <TableCell>{d.staffName || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell className="font-mono text-sm">{d.invoiceId || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[d.status] || ""}>{d.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.status === "Pending" && <Button variant="ghost" size="sm" onClick={() => openAssign(d)}>Assign</Button>}
                      {d.status === "Assigned" && <Button variant="ghost" size="icon" title="In Transit" onClick={() => updateStatusMut.mutate({ id: d.id, status: "InTransit" })}><Truck className="h-4 w-4 text-amber-600" /></Button>}
                      {d.status === "InTransit" && <Button variant="ghost" size="icon" title="Delivered" onClick={() => updateStatusMut.mutate({ id: d.id, status: "Delivered" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Delivery</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Customer Name *</label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Invoice ID</label><Input value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} placeholder="INV-001" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent><DialogHeader><DialogTitle>Assign Delivery Staff</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Select Staff</label>
            <Select value={String(assignStaffId || "")} onValueChange={v => setAssignStaffId(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Choose staff" /></SelectTrigger>
              <SelectContent>{staff.filter((s: any) => s.active).map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button><Button onClick={handleAssign} disabled={assignMut.isPending}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
