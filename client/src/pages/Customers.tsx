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

export default function Customers() {
  const utils = trpc.useUtils();
  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const createMut = trpc.customers.create.useMutation({ onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer created"); setOpen(false); } });
  const updateMut = trpc.customers.update.useMutation({ onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer updated"); setOpen(false); } });
  const deleteMut = trpc.customers.delete.useMutation({ onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", address: "" });

  const filtered = useMemo(() => customers.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase())), [customers, search]);

  const openCreate = () => { setEditing(null); setForm({ name: "", email: "", phone: "", city: "", address: "" }); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, email: c.email || "", phone: c.phone || "", city: c.city || "", address: c.address || "" }); setOpen(true); };
  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); }
    else { createMut.mutate(form); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Customers</h1><p className="text-sm text-muted-foreground mt-1">Manage your customer records</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>City</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              : filtered.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell>{c.city || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(c.balance))}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Customer" : "New Customer"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
