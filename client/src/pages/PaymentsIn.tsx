import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, ArrowDownLeft } from "lucide-react";

const paymentModes = ["Cash", "Bank Transfer", "UPI", "Cheque", "Card", "Wallet"];

export default function PaymentsIn() {
  const { data: payments = [], refetch } = trpc.paymentsIn.list.useQuery();
  const { data: nextId } = trpc.paymentsIn.nextId.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const createMut = trpc.paymentsIn.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Payment recorded"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customerId: 0, customerName: "", date: new Date().toISOString().slice(0, 10), amount: "", mode: "Cash", invoiceRef: "", notes: "" });

  const filtered = useMemo(() => payments.filter((p: any) => p.paymentId?.toLowerCase().includes(search.toLowerCase()) || p.customerName?.toLowerCase().includes(search.toLowerCase())), [payments, search]);
  const totalReceived = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  const handleCreate = () => {
    if (!form.customerName || !form.amount) { toast.error("Fill required fields"); return; }
    createMut.mutate({ paymentId: nextId || "REC-001", ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments In (Receipts)</h1>
          <p className="text-muted-foreground text-sm mt-1">Track payments received from customers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-sm text-muted-foreground">Total Received</p><p className="text-xl font-bold text-green-600">₹{totalReceived.toLocaleString("en-IN")}</p></div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Receipt #</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Mode</th>
                <th className="text-left p-3 font-medium">Invoice Ref</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ArrowDownLeft className="h-8 w-8 mx-auto mb-2 opacity-30" />No payments received yet
                  </td></tr>
                ) : filtered.map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{p.paymentId}</td>
                    <td className="p-3">{p.customerName}</td>
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{p.mode}</td>
                    <td className="p-3">{p.invoiceRef || "—"}</td>
                    <td className="p-3 text-right font-medium text-green-600">+₹{Number(p.amount).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment In</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <Select onValueChange={v => { const c = customers.find((c: any) => c.id === Number(v)); setForm(f => ({ ...f, customerId: Number(v), customerName: c?.name || "" })); }}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="text-sm font-medium">Amount (₹)</label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Payment Mode</label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Invoice Ref</label><Input value={form.invoiceRef} onChange={e => setForm(f => ({ ...f, invoiceRef: e.target.value }))} placeholder="INV-001" /></div>
            </div>
            <div><label className="text-sm font-medium">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment notes..." /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Recording..." : "Record Payment"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
