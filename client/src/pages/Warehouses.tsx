import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Warehouses() {
  const utils = trpc.useUtils();
  const { data: warehouses = [], isLoading } = trpc.warehouses.list.useQuery();
  const createMut = trpc.warehouses.create.useMutation({ onSuccess: () => { utils.warehouses.list.invalidate(); toast.success("Warehouse created"); setOpen(false); } });
  const updateMut = trpc.warehouses.update.useMutation({ onSuccess: () => { utils.warehouses.list.invalidate(); toast.success("Warehouse updated"); setOpen(false); } });
  const deleteMut = trpc.warehouses.delete.useMutation({ onSuccess: () => { utils.warehouses.list.invalidate(); toast.success("Warehouse deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", location: "", capacity: 0, manager: "" });

  const openCreate = () => { setEditing(null); setForm({ name: "", location: "", capacity: 0, manager: "" }); setOpen(true); };
  const openEdit = (w: any) => { setEditing(w); setForm({ name: w.name, location: w.location || "", capacity: w.capacity || 0, manager: w.manager || "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, ...form }); else createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Warehouses</h1><p className="text-sm text-muted-foreground mt-1">Manage warehouse locations and capacity</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Warehouse</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="shadow-sm"><CardContent className="p-6"><div className="h-24 animate-pulse bg-muted rounded" /></CardContent></Card>) :
        warehouses.length === 0 ? <Card className="col-span-full shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">No warehouses found. Add your first warehouse.</CardContent></Card> :
        warehouses.map((w: any) => (
          <Card key={w.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><WarehouseIcon className="h-5 w-5 text-primary" /></div>
                  <div><h3 className="font-semibold">{w.name}</h3><p className="text-sm text-muted-foreground">{w.location || "No location"}</p></div>
                </div>
                <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: w.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Capacity</p><p className="text-lg font-semibold">{w.capacity?.toLocaleString() || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Manager</p><p className="text-sm font-medium">{w.manager || "—"}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Warehouse" : "New Warehouse"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Location</label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Capacity</label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></div><div><label className="text-sm font-medium">Manager</label><Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
