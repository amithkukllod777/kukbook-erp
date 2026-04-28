import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function DeliveryStaff() {
  const utils = trpc.useUtils();
  const { data: staff = [], isLoading } = trpc.deliveryStaff.list.useQuery();
  const { data: nextId } = trpc.deliveryStaff.nextId.useQuery();
  const createMut = trpc.deliveryStaff.create.useMutation({ onSuccess: () => { utils.deliveryStaff.list.invalidate(); utils.deliveryStaff.nextId.invalidate(); toast.success("Staff added"); setOpen(false); } });
  const updateMut = trpc.deliveryStaff.update.useMutation({ onSuccess: () => { utils.deliveryStaff.list.invalidate(); toast.success("Staff updated"); setOpen(false); } });
  const deleteMut = trpc.deliveryStaff.delete.useMutation({ onSuccess: () => { utils.deliveryStaff.list.invalidate(); toast.success("Staff removed"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ staffId: "", name: "", phone: "", email: "", vehicleType: "", vehicleNumber: "" });

  const filtered = useMemo(() => staff.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase())), [staff, search]);

  const openCreate = () => { setEditing(null); setForm({ staffId: "", name: "", phone: "", email: "", vehicleType: "", vehicleNumber: "" }); setOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ staffId: s.staffId, name: s.name, phone: s.phone || "", email: s.email || "", vehicleType: s.vehicleType || "", vehicleNumber: s.vehicleNumber || "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) { const { staffId, ...rest } = form; updateMut.mutate({ id: editing.id, ...rest }); }
    else { createMut.mutate({ ...form, staffId: nextId || "DS-001" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Delivery Staff</h1><p className="text-sm text-muted-foreground mt-1">Manage delivery personnel</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Vehicle</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No delivery staff found</TableCell></TableRow>
              : filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.staffId}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email || "—"}</TableCell>
                  <TableCell>{s.vehicleType ? `${s.vehicleType} (${s.vehicleNumber || "—"})` : "—"}</TableCell>
                  <TableCell><Badge variant={s.active ? "default" : "secondary"} className={s.active ? "bg-emerald-100 text-emerald-800" : ""}>{s.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: s.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Staff" : "New Delivery Staff"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div><div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Vehicle Type</label><Input value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} placeholder="Bike, Van, Truck" /></div><div><label className="text-sm font-medium">Vehicle Number</label><Input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
