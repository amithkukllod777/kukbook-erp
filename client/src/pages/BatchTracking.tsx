import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle, Package } from "lucide-react";

export default function BatchTracking() {
  const { data: batches = [], isLoading } = trpc.batches.list.useQuery();
  const { data: inventory = [] } = trpc.inventory.list.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.batches.create.useMutation({ onSuccess: () => { utils.batches.list.invalidate(); setOpen(false); toast.success("Batch created"); } });
  const updateStatusMut = trpc.batches.updateStatus.useMutation({ onSuccess: () => { utils.batches.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.batches.delete.useMutation({ onSuccess: () => { utils.batches.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ inventoryItemId: 0, batchNumber: "", manufacturingDate: "", expiryDate: "", quantity: 0, purchasePrice: "", sellingPrice: "", notes: "" });

  const isExpired = (d: string) => d && new Date(d) < new Date();
  const isExpiringSoon = (d: string) => { if (!d) return false; const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24); return diff > 0 && diff <= 30; };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Batch / Expiry Tracking</h1>
          <p className="text-muted-foreground text-sm">Track batch numbers, manufacturing dates, and expiry dates for inventory items</p>
        </div>
        <Button onClick={() => { setForm({ inventoryItemId: 0, batchNumber: "", manufacturingDate: "", expiryDate: "", quantity: 0, purchasePrice: "", sellingPrice: "", notes: "" }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Batch
        </Button>
      </div>

      {/* Expiry Alerts */}
      {batches.filter((b: any) => isExpired(b.expiryDate) || isExpiringSoon(b.expiryDate)).length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1"><AlertTriangle className="w-4 h-4" /> Expiry Alerts</div>
          <div className="text-sm text-yellow-600 space-y-1">
            {batches.filter((b: any) => isExpired(b.expiryDate)).map((b: any) => <p key={b.id}>🔴 Batch <strong>{b.batchNumber}</strong> has EXPIRED ({b.expiryDate})</p>)}
            {batches.filter((b: any) => isExpiringSoon(b.expiryDate)).map((b: any) => <p key={b.id}>🟡 Batch <strong>{b.batchNumber}</strong> expiring soon ({b.expiryDate})</p>)}
          </div>
        </div>
      )}

      {isLoading ? <p>Loading...</p> : batches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No batches tracked yet.</p></div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>
              <th className="p-3 text-left">Batch #</th><th className="p-3 text-left">Item</th><th className="p-3 text-left">Mfg Date</th><th className="p-3 text-left">Expiry</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Purchase ₹</th><th className="p-3 text-right">Sell ₹</th><th className="p-3 text-left">Status</th><th className="p-3">Actions</th>
            </tr></thead>
            <tbody>
              {batches.map((b: any) => {
                const item = inventory.find((i: any) => i.id === b.inventoryItemId);
                return (
                  <tr key={b.id} className={`border-t ${isExpired(b.expiryDate) ? 'bg-red-50' : isExpiringSoon(b.expiryDate) ? 'bg-yellow-50' : ''}`}>
                    <td className="p-3 font-mono font-medium">{b.batchNumber}</td>
                    <td className="p-3">{item?.name || `Item #${b.inventoryItemId}`}</td>
                    <td className="p-3">{b.manufacturingDate || '-'}</td>
                    <td className="p-3">{b.expiryDate || '-'}{isExpired(b.expiryDate) && <span className="ml-1 text-red-600 text-xs font-bold">EXPIRED</span>}</td>
                    <td className="p-3 text-right">{b.quantity || 0}</td>
                    <td className="p-3 text-right font-mono">{b.purchasePrice ? `₹${b.purchasePrice}` : '-'}</td>
                    <td className="p-3 text-right font-mono">{b.sellingPrice ? `₹${b.sellingPrice}` : '-'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${b.status === 'active' ? 'bg-green-100 text-green-700' : b.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                    <td className="p-3 flex gap-1">
                      {b.status === 'active' && isExpired(b.expiryDate) && <Button size="sm" variant="outline" onClick={() => updateStatusMut.mutate({ id: b.id, status: 'expired' })}>Mark Expired</Button>}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: b.id })}><Trash2 className="w-3 h-3" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Batch</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium">Inventory Item *</label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.inventoryItemId} onChange={e => setForm(f => ({ ...f, inventoryItemId: Number(e.target.value) }))}>
                <option value={0}>Select item</option>
                {inventory.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Batch Number *</label><Input value={form.batchNumber} onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))} placeholder="e.g. BATCH-001" /></div>
              <div><label className="text-xs font-medium">Quantity</label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Manufacturing Date</label><Input type="date" value={form.manufacturingDate} onChange={e => setForm(f => ({ ...f, manufacturingDate: e.target.value }))} /></div>
              <div><label className="text-xs font-medium">Expiry Date</label><Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Purchase Price (₹)</label><Input value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} /></div>
              <div><label className="text-xs font-medium">Selling Price (₹)</label><Input value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs font-medium">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.inventoryItemId || !form.batchNumber}>{createMut.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
