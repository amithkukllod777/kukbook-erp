import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Search, Receipt } from "lucide-react";

const categories = ["Office Supplies", "Rent", "Utilities", "Travel", "Food & Beverages", "Marketing", "Salary", "Insurance", "Maintenance", "Miscellaneous"];
const paymentModes = ["Cash", "Bank Transfer", "UPI", "Cheque", "Card"];

export default function Expenses() {
  const { data: expenses = [], refetch } = trpc.expenses.list.useQuery();
  const { data: nextId } = trpc.expenses.nextId.useQuery();
  const createMut = trpc.expenses.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Expense recorded"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: "Office Supplies", amount: "", paymentMode: "Cash", description: "", gstIncluded: false, gstAmount: "" });

  const filtered = useMemo(() => expenses.filter((e: any) => e.expenseId?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase())), [expenses, search]);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  const handleCreate = () => {
    if (!form.amount) { toast.error("Amount is required"); return; }
    createMut.mutate({ expenseId: nextId || "EXP-001", ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and categorize all business expenses</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-xl font-bold text-red-600">₹{totalExpenses.toLocaleString("en-IN")}</p></div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Expense #</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Mode</th>
                <th className="text-left p-3 font-medium">GST</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />No expenses recorded yet
                  </td></tr>
                ) : filtered.map((e: any) => (
                  <tr key={e.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{e.expenseId}</td>
                    <td className="p-3">{e.date}</td>
                    <td className="p-3">{e.category}</td>
                    <td className="p-3 text-muted-foreground">{e.description || "—"}</td>
                    <td className="p-3">{e.paymentMode}</td>
                    <td className="p-3">{e.gstIncluded ? `₹${Number(e.gstAmount).toLocaleString("en-IN")}` : "—"}</td>
                    <td className="p-3 text-right font-medium">₹{Number(e.amount).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Amount (₹)</label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div>
                <label className="text-sm font-medium">Payment Mode</label>
                <Select value={form.paymentMode} onValueChange={v => setForm(f => ({ ...f, paymentMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.gstIncluded} onCheckedChange={(v) => setForm(f => ({ ...f, gstIncluded: !!v }))} />
              <label className="text-sm font-medium">GST Included</label>
            </div>
            {form.gstIncluded && (
              <div><label className="text-sm font-medium">GST Amount (₹)</label><Input type="number" value={form.gstAmount} onChange={e => setForm(f => ({ ...f, gstAmount: e.target.value }))} /></div>
            )}
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Recording..." : "Add Expense"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
