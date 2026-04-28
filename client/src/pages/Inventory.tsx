import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Package, IndianRupee, Barcode } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

const emptyForm = {
  sku: "", name: "", category: "", qty: 0, cost: "0", reorder: 10,
  hsnCode: "", gstRate: "18.00",
  mrp: "", sellingPrice: "", purchasePrice: "", upcBarcode: "",
};

export default function Inventory() {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.inventory.list.useQuery();
  const createMut = trpc.inventory.create.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Item created"); setOpen(false); },
    onError: (err) => { toast.error(err.message || "Failed to create item"); },
  });
  const updateMut = trpc.inventory.update.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Item updated"); setOpen(false); },
    onError: (err) => { toast.error(err.message || "Failed to update item"); },
  });
  const deleteMut = trpc.inventory.delete.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Item deleted"); },
    onError: (err) => { toast.error(err.message || "Failed to delete item"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = useMemo(() => items.filter((i: any) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    (i.upcBarcode || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.category || "").toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (i: any) => {
    setEditing(i);
    setForm({
      sku: i.sku, name: i.name, category: i.category || "",
      qty: i.qty, cost: String(i.cost || "0"), reorder: i.reorder,
      hsnCode: i.hsnCode || "", gstRate: String(i.gstRate || "18.00"),
      mrp: String(i.mrp || ""), sellingPrice: String(i.sellingPrice || ""),
      purchasePrice: String(i.purchasePrice || ""), upcBarcode: i.upcBarcode || "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.sku || !form.name) {
      toast.error("SKU and Name are required");
      return;
    }
    // Build payload — only send non-empty optional strings
    const payload: any = {
      sku: form.sku,
      name: form.name,
      qty: form.qty,
      cost: form.cost || "0",
      reorder: form.reorder,
    };
    if (form.category) payload.category = form.category;
    if (form.hsnCode) payload.hsnCode = form.hsnCode;
    if (form.gstRate) payload.gstRate = form.gstRate;
    if (form.mrp) payload.mrp = form.mrp;
    if (form.sellingPrice) payload.sellingPrice = form.sellingPrice;
    if (form.purchasePrice) payload.purchasePrice = form.purchasePrice;
    if (form.upcBarcode) payload.upcBarcode = form.upcBarcode;

    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track stock levels and manage items</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>HSN</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Opening Stock</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
              ) : filtered.map((i: any) => {
                const lowStock = i.qty <= i.reorder;
                const sp = Number(i.sellingPrice || i.cost || 0);
                return (
                  <TableRow key={i.id} className={lowStock ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                    <TableCell className="font-mono text-sm">{i.sku}</TableCell>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="text-muted-foreground">{i.category || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{i.hsnCode || "—"}</TableCell>
                    <TableCell className="text-right">{i.mrp ? fmt(Number(i.mrp)) : "—"}</TableCell>
                    <TableCell className="text-right">{i.sellingPrice ? fmt(Number(i.sellingPrice)) : "—"}</TableCell>
                    <TableCell className="text-right">{i.purchasePrice ? fmt(Number(i.purchasePrice)) : fmt(Number(i.cost))}</TableCell>
                    <TableCell className="text-right">{i.qty}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(i.qty * sp)}</TableCell>
                    <TableCell>
                      {lowStock
                        ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Low Stock</Badge>
                        : <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">In Stock</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this item?")) deleteMut.mutate({ id: i.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Package className="h-4 w-4" /> Basic Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">SKU *</label>
                  <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. NUT-001" />
                </div>
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Nuts, Spices" />
                </div>
                <div>
                  <label className="text-sm font-medium">HSN Code</label>
                  <Input value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} placeholder="e.g. 20081920" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium">GST Rate %</label>
                  <Input type="number" value={form.gstRate} onChange={e => setForm({ ...form, gstRate: e.target.value })} placeholder="18.00" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <IndianRupee className="h-4 w-4" /> Pricing
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">MRP</label>
                  <Input type="number" step="0.01" value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Selling Price</label>
                  <Input type="number" step="0.01" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Purchase Price</label>
                  <Input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Stock & Barcode */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Barcode className="h-4 w-4" /> Stock & Barcode
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Opening Stock</label>
                  <Input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Reorder Level</label>
                  <Input type="number" value={form.reorder} onChange={e => setForm({ ...form, reorder: Number(e.target.value) })} placeholder="10" />
                </div>
                <div>
                  <label className="text-sm font-medium">UPC / Barcode</label>
                  <Input value={form.upcBarcode} onChange={e => setForm({ ...form, upcBarcode: e.target.value })} placeholder="e.g. 8901234567890" className="font-mono" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
