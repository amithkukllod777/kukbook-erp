import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pause, Play, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function RecurringInvoices() {
  const { activeCompany } = useCompany();

  const companyId = activeCompany?.id || 0;

  const { data: items = [], refetch } = trpc.recurringInvoices.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const { data: customers = [] } = trpc.customers.list.useQuery();

  const createMut = trpc.recurringInvoices.create.useMutation({
    onSuccess: () => { refetch(); setOpen(false); toast.success("Recurring invoice created"); },
  });
  const updateMut = trpc.recurringInvoices.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Updated"); },
  });
  const deleteMut = trpc.recurringInvoices.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: 0, customerName: "", frequency: "monthly" as any,
    startDate: new Date().toISOString().slice(0, 10),
    nextDueDate: "", total: "", notes: "",
  });

  const handleCreate = () => {
    if (!form.customerId || !form.nextDueDate) {
      toast.error("Please fill required fields");
      return;
    }
    createMut.mutate({
      companyId, customerId: form.customerId, customerName: form.customerName,
      frequency: form.frequency, startDate: form.startDate,
      nextDueDate: form.nextDueDate, total: form.total || "0", notes: form.notes,
    });
  };

  const toggleStatus = (item: any) => {
    const newStatus = item.status === "active" ? "paused" : "active";
    updateMut.mutate({ id: item.id, status: newStatus });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-green-500/10 text-green-500";
      case "paused": return "bg-yellow-500/10 text-yellow-500";
      case "completed": return "bg-blue-500/10 text-blue-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Invoices</h1>
          <p className="text-muted-foreground">Auto-generate invoices on schedule</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Recurring
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No recurring invoices yet. Create one to auto-generate invoices.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{item.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.frequency} • Next: {item.nextDueDate} • ₹{Number(item.total).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Generated {item.generatedCount} invoices since {item.startDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(item.status)}>{item.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => toggleStatus(item)}
                    title={item.status === "active" ? "Pause" : "Resume"}>
                    {item.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: item.id })}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Recurring Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer *</Label>
              <Select onValueChange={(v) => {
                const c = customers.find((c: any) => c.id === Number(v));
                setForm({ ...form, customerId: Number(v), customerName: c?.name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequency *</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Amount (₹)</Label>
                <Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Next Due Date *</Label>
                <Input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMut.isPending}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
