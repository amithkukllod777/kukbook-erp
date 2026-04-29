import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Send, FileCheck, X } from "lucide-react";

export default function ProformaInvoices() {
  const { data: proformas = [], isLoading } = trpc.proforma.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.proforma.create.useMutation({ onSuccess: () => { utils.proforma.list.invalidate(); setOpen(false); toast.success("Proforma created"); } });
  const updateStatusMut = trpc.proforma.updateStatus.useMutation({ onSuccess: () => { utils.proforma.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.proforma.delete.useMutation({ onSuccess: () => { utils.proforma.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ proformaId: "", customerId: 0, customerName: "", date: new Date().toISOString().slice(0, 10), validUntil: "", notes: "", lineItems: [{ description: "", qty: 1, rate: "0", gstRate: "18", amount: "0" }] });

  const addLine = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: "", qty: 1, rate: "0", gstRate: "18", amount: "0" }] }));
  const removeLine = (i: number) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));
  const updateLine = (i: number, field: string, value: any) => {
    setForm(f => {
      const lines = [...f.lineItems];
      (lines[i] as any)[field] = value;
      const qty = Number(lines[i].qty) || 0;
      const rate = Number(lines[i].rate) || 0;
      lines[i].amount = (qty * rate).toFixed(2);
      return { ...f, lineItems: lines };
    });
  };

  const calcTotals = () => {
    const subtotal = form.lineItems.reduce((s, l) => s + Number(l.amount), 0);
    const avgGst = form.lineItems.length ? form.lineItems.reduce((s, l) => s + Number(l.gstRate || 0), 0) / form.lineItems.length : 18;
    const gstAmt = subtotal * avgGst / 100;
    return { subtotal: subtotal.toFixed(2), cgst: (gstAmt / 2).toFixed(2), sgst: (gstAmt / 2).toFixed(2), igst: "0", total: (subtotal + gstAmt).toFixed(2) };
  };

  const handleCreate = () => {
    const totals = calcTotals();
    createMut.mutate({ ...form, ...totals, customerId: form.customerId || undefined, lineItems: form.lineItems });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Proforma Invoices</h1>
          <p className="text-muted-foreground text-sm">Create formal proforma invoices before converting to tax invoices</p>
        </div>
        <Button onClick={() => { setForm({ proformaId: `PI-${String(proformas.length + 1).padStart(3, '0')}`, customerId: 0, customerName: "", date: new Date().toISOString().slice(0, 10), validUntil: "", notes: "", lineItems: [{ description: "", qty: 1, rate: "0", gstRate: "18", amount: "0" }] }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Proforma
        </Button>
      </div>

      {isLoading ? <p>Loading...</p> : proformas.length === 0 ? <p className="text-muted-foreground">No proforma invoices yet.</p> : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>
              <th className="p-3 text-left">ID</th><th className="p-3 text-left">Customer</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Valid Until</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {proformas.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-mono">{p.proformaId}</td>
                  <td className="p-3">{p.customerName}</td>
                  <td className="p-3">{p.date}</td>
                  <td className="p-3">{p.validUntil || '-'}</td>
                  <td className="p-3 text-right font-mono">₹{Number(p.total).toLocaleString('en-IN')}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${p.status === 'Accepted' ? 'bg-green-100 text-green-700' : p.status === 'Sent' ? 'bg-blue-100 text-blue-700' : p.status === 'Converted' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span></td>
                  <td className="p-3 flex gap-1">
                    {p.status === 'Draft' && <Button size="sm" variant="outline" onClick={() => updateStatusMut.mutate({ id: p.id, status: 'Sent' })}><Send className="w-3 h-3" /></Button>}
                    {p.status === 'Sent' && <Button size="sm" variant="outline" onClick={() => updateStatusMut.mutate({ id: p.id, status: 'Accepted' })}><FileCheck className="w-3 h-3" /></Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: p.id })}><Trash2 className="w-3 h-3" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Proforma Invoice</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs font-medium">Proforma ID</label><Input value={form.proformaId} onChange={e => setForm(f => ({ ...f, proformaId: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Customer</label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.customerId} onChange={e => { const c = customers.find((c: any) => c.id === Number(e.target.value)); setForm(f => ({ ...f, customerId: Number(e.target.value), customerName: c?.name || '' })); }}>
                <option value={0}>Select customer</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Valid Until</label><Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} /></div>
          </div>

          <h3 className="font-semibold text-sm mb-2">Line Items</h3>
          {form.lineItems.map((line, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-end">
              <div className="col-span-2"><Input placeholder="Description" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} /></div>
              <Input type="number" placeholder="Qty" value={line.qty} onChange={e => updateLine(i, 'qty', e.target.value)} />
              <Input type="number" placeholder="Rate" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)} />
              <Input type="number" placeholder="GST%" value={line.gstRate} onChange={e => updateLine(i, 'gstRate', e.target.value)} />
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono">₹{line.amount}</span>
                <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeLine(i)}><X className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-3 h-3 mr-1" /> Add Line</Button>

          <div className="mt-4 text-right space-y-1">
            <p className="text-sm">Subtotal: ₹{calcTotals().subtotal}</p>
            <p className="text-sm">CGST: ₹{calcTotals().cgst} | SGST: ₹{calcTotals().sgst}</p>
            <p className="text-lg font-bold">Total: ₹{calcTotals().total}</p>
          </div>

          <div className="mt-4"><label className="text-xs font-medium">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." /></div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
