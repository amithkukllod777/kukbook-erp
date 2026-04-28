import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default function Inventory() {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.inventory.list.useQuery();
  const createMut = trpc.inventory.create.useMutation({ onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Item created"); setOpen(false); } });
  const updateMut = trpc.inventory.update.useMutation({ onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Item updated"); setOpen(false); } });
  const deleteMut = trpc.inventory.delete.useMutation({ onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Item deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ sku: "", name: "", category: "", qty: 0, cost: "0", reorder: 10, hsnCode: "", gstRate: "18.00" });

  const filtered = useMemo(() => items.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const openCreate = () => { setEditing(null); setForm({ sku: "", name: "", category: "", qty: 0, cost: "0", reorder: 10, hsnCode: "", gstRate: "18.00" }); setOpen(true); };
  const openEdit = (i: any) => { setEditing(i); setForm({ sku: i.sku, name: i.name, category: i.category || "", qty: i.qty, cost: String(i.cost), reorder: i.reorder, hsnCode: i.hsnCode || "", gstRate: String(i.gstRate || "18.00") }); setOpen(true); };
  const handleSave = () => {
    if (!form.sku || !form.name) { toast.error("SKU and Name are required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, ...form }); else createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Inventory</h1><p className="text-sm text-muted-foreground mt-1">Track stock levels and manage items</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>HSN</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
              : filtered.map((i: any) => {
                const lowStock = i.qty <= i.reorder;
                return (
                  <TableRow key={i.id} className={lowStock ? "bg-amber-50/50" : ""}>
                    <TableCell className="font-mono text-sm">{i.sku}</TableCell>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="text-muted-foreground">{i.category || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{i.hsnCode || "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{i.gstRate ? `${i.gstRate}%` : "—"}</TableCell>
                    <TableCell className="text-right">{i.qty}</TableCell>
                    <TableCell className="text-right">{fmt(Number(i.cost))}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(i.qty * Number(i.cost))}</TableCell>
                    <TableCell>
                      {lowStock ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Low Stock</Badge> : <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">In Stock</Badge>}
                    </TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: i.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">SKU *</label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div><div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div></div>
            <div className="grid grid-cols-3 gap-4"><div><label className="text-sm font-medium">Category</label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div><div><label className="text-sm font-medium">HSN Code</label><Input placeholder="e.g. 8471" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} /></div><div><label className="text-sm font-medium">GST Rate %</label><Input type="number" value={form.gstRate} onChange={e => setForm({ ...form, gstRate: e.target.value })} /></div></div>
            <div className="grid grid-cols-3 gap-4"><div><label className="text-sm font-medium">Quantity</label><Input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} /></div><div><label className="text-sm font-medium">Cost</label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div><div><label className="text-sm font-medium">Reorder Level</label><Input type="number" value={form.reorder} onChange={e => setForm({ ...form, reorder: Number(e.target.value) })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
