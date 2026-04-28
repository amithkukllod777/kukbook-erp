import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Wallet, Building2, Smartphone, CreditCard } from "lucide-react";

const typeIcons: Record<string, any> = { Cash: Wallet, Bank: Building2, UPI: Smartphone, Wallet: CreditCard };
const typeColors: Record<string, string> = { Cash: "bg-green-100 text-green-700", Bank: "bg-blue-100 text-blue-700", UPI: "bg-purple-100 text-purple-700", Wallet: "bg-orange-100 text-orange-700" };

export default function CashBank() {
  const { data: accounts = [], refetch } = trpc.cashBank.list.useQuery();
  const createMut = trpc.cashBank.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Account created"); } });
  const updateMut = trpc.cashBank.update.useMutation({ onSuccess: () => { refetch(); toast.success("Account updated"); } });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", type: "Cash", bankName: "", accountNumber: "", balance: "0" });

  const filtered = useMemo(() => accounts.filter((a: any) => a.name?.toLowerCase().includes(search.toLowerCase())), [accounts, search]);
  const totalBalance = accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);

  const handleCreate = () => {
    if (!form.name) { toast.error("Account name is required"); return; }
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash & Bank Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your cash, bank, UPI, and wallet accounts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-sm text-muted-foreground">Total Balance</p><p className="text-xl font-bold text-primary">₹{totalBalance.toLocaleString("en-IN")}</p></div>
          <Button onClick={() => { setForm({ name: "", type: "Cash", bankName: "", accountNumber: "", balance: "0" }); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Account</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />No accounts yet
          </CardContent></Card>
        ) : filtered.map((a: any) => {
          const Icon = typeIcons[a.type] || Wallet;
          return (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeColors[a.type] || ""}`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-semibold">{a.name}</h3>
                      <Badge variant="outline" className="mt-1">{a.type}</Badge>
                    </div>
                  </div>
                </div>
                {a.bankName && <p className="text-sm text-muted-foreground">{a.bankName}</p>}
                {a.accountNumber && <p className="text-sm text-muted-foreground">A/C: {a.accountNumber}</p>}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-2xl font-bold">₹{Number(a.balance).toLocaleString("en-IN")}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Cash/Bank Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Account Name</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Cash, SBI Savings" /></div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "Bank" && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Bank Name</label><Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} /></div>
                <div><label className="text-sm font-medium">Account Number</label><Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} /></div>
              </div>
            )}
            <div><label className="text-sm font-medium">Opening Balance (₹)</label><Input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Creating..." : "Add Account"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
