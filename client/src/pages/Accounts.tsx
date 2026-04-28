import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
const typeColors: Record<string, string> = { Asset: "bg-blue-100 text-blue-800", Liability: "bg-rose-100 text-rose-800", Equity: "bg-violet-100 text-violet-800", Revenue: "bg-emerald-100 text-emerald-800", Expense: "bg-amber-100 text-amber-800" };

export default function Accounts() {
  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.accounts.list.useQuery();
  const createMut = trpc.accounts.create.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account created"); setOpen(false); } });
  const updateMut = trpc.accounts.update.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account updated"); setOpen(false); } });
  const deleteMut = trpc.accounts.delete.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ code: "", name: "", type: "Asset", subtype: "", balance: "0" });

  const filtered = useMemo(() => {
    return accounts.filter((a: any) => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
      const matchType = filterType === "all" || a.type === filterType;
      return matchSearch && matchType;
    });
  }, [accounts, search, filterType]);

  const openCreate = () => { setEditing(null); setForm({ code: "", name: "", type: "Asset", subtype: "", balance: "0" }); setOpen(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ code: a.code, name: a.name, type: a.type, subtype: a.subtype || "", balance: String(a.balance) }); setOpen(true); };
  const handleSave = () => {
    if (!form.code || !form.name) { toast.error("Code and Name are required"); return; }
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); }
    else { createMut.mutate(form); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your general ledger accounts</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Account</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Asset">Asset</SelectItem>
                <SelectItem value="Liability">Liability</SelectItem>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Revenue">Revenue</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subtype</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No accounts found</TableCell></TableRow>
              ) : filtered.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm">{a.code}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell><Badge className={typeColors[a.type] || ""} variant="secondary">{a.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.subtype || "—"}</TableCell>
                  <TableCell className={`text-right font-medium ${Number(a.balance) < 0 ? "text-destructive" : ""}`}>{fmt(Number(a.balance))}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this account?")) deleteMut.mutate({ id: a.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Account" : "New Account"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Code</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="1010" /></div>
              <div><label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asset">Asset</SelectItem><SelectItem value="Liability">Liability</SelectItem>
                    <SelectItem value="Equity">Equity</SelectItem><SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cash" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Subtype</label><Input value={form.subtype} onChange={e => setForm({ ...form, subtype: e.target.value })} placeholder="Current Asset" /></div>
              <div><label className="text-sm font-medium">Balance</label><Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
