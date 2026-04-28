import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, FileText, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-700", Sent: "bg-blue-100 text-blue-700", Accepted: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700", Expired: "bg-yellow-100 text-yellow-700" };

export default function Estimates() {
  const { data: estimates = [], refetch } = trpc.estimates.list.useQuery();
  const { data: nextId } = trpc.estimates.nextId.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const createMut = trpc.estimates.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Estimate created"); } });
  const statusMut = trpc.estimates.updateStatus.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customerId: 0, customerName: "", date: new Date().toISOString().slice(0, 10), validUntil: "", notes: "" });
  const [lines, setLines] = useState([{ description: "", qty: 1, rate: "", amount: "0" }]);

  const filtered = useMemo(() => estimates.filter((e: any) => e.estimateId?.toLowerCase().includes(search.toLowerCase()) || e.customerName?.toLowerCase().includes(search.toLowerCase())), [estimates, search]);

  const addLine = () => setLines(l => [...l, { description: "", qty: 1, rate: "", amount: "0" }]);
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, val: any) => {
    setLines(l => l.map((line, idx) => {
      if (idx !== i) return line;
      const updated = { ...line, [field]: val };
      if (field === "qty" || field === "rate") updated.amount = String(Number(updated.qty) * Number(updated.rate || 0));
      return updated;
    }));
  };
  const total = lines.reduce((s, l) => s + Number(l.amount), 0);

  const handleCreate = () => {
    if (!form.customerName || lines.length === 0) { toast.error("Fill required fields"); return; }
    createMut.mutate({ estimateId: nextId || "EST-001", ...form, total: String(total), lines: lines.map(l => ({ ...l, rate: l.rate || "0", amount: l.amount })) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estimates / Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage quotations for customers</p>
        </div>
        <Button onClick={() => { setForm({ customerId: 0, customerName: "", date: new Date().toISOString().slice(0, 10), validUntil: "", notes: "" }); setLines([{ description: "", qty: 1, rate: "", amount: "0" }]); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Estimate</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search estimates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Estimate #</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Valid Until</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />No estimates yet
                  </td></tr>
                ) : filtered.map((e: any) => (
                  <tr key={e.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{e.estimateId}</td>
                    <td className="p-3">{e.customerName}</td>
                    <td className="p-3">{e.date}</td>
                    <td className="p-3">{e.validUntil || "—"}</td>
                    <td className="p-3 text-right font-medium">₹{Number(e.total).toLocaleString("en-IN")}</td>
                    <td className="p-3"><Badge className={statusColors[e.status] || ""}>{e.status}</Badge></td>
                    <td className="p-3">
                      <Select onValueChange={v => statusMut.mutate({ id: e.id, status: v })}>
                        <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Change" /></SelectTrigger>
                        <SelectContent>
                          {["Draft", "Sent", "Accepted", "Rejected", "Expired"].filter(s => s !== e.status).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Estimate</DialogTitle></DialogHeader>
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
              <div><label className="text-sm font-medium">Valid Until</label><Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Line Items</label><Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <Input className="col-span-5" placeholder="Description" value={l.description} onChange={e => updateLine(i, "description", e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Qty" value={l.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} />
                  <Input className="col-span-2" type="number" placeholder="Rate" value={l.rate} onChange={e => updateLine(i, "rate", e.target.value)} />
                  <div className="col-span-2 flex items-center text-sm font-medium">₹{Number(l.amount).toLocaleString("en-IN")}</div>
                  <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="text-right font-bold text-lg mt-2">Total: ₹{total.toLocaleString("en-IN")}</div>
            </div>
            <div><label className="text-sm font-medium">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Creating..." : "Create Estimate"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
