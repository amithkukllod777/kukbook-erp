import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default function Vendors() {
  const utils = trpc.useUtils();
  const { data: vendors = [], isLoading } = trpc.vendors.list.useQuery();
  const createMut = trpc.vendors.create.useMutation({ onSuccess: () => { utils.vendors.list.invalidate(); toast.success("Vendor created"); setOpen(false); } });
  const updateMut = trpc.vendors.update.useMutation({ onSuccess: () => { utils.vendors.list.invalidate(); toast.success("Vendor updated"); setOpen(false); } });
  const deleteMut = trpc.vendors.delete.useMutation({ onSuccess: () => { utils.vendors.list.invalidate(); toast.success("Vendor deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", category: "", address: "" });

  const filtered = useMemo(() => vendors.filter((v: any) => v.name.toLowerCase().includes(search.toLowerCase())), [vendors, search]);

  const openCreate = () => { setEditing(null); setForm({ name: "", email: "", phone: "", category: "", address: "" }); setOpen(true); };
  const openEdit = (v: any) => { setEditing(v); setForm({ name: v.name, email: v.email || "", phone: v.phone || "", category: v.category || "", address: v.address || "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, ...form }); else createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Vendors</h1><p className="text-sm text-muted-foreground mt-1">Manage your vendor/supplier records</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Vendor</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No vendors found</TableCell></TableRow>
              : filtered.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">{v.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{v.phone || "—"}</TableCell>
                  <TableCell>{v.category || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(v.balance))}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: v.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Vendor" : "New Vendor"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div></div>
            <div><label className="text-sm font-medium">Category</label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Supplier, Software, etc." /></div>
            <div><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
