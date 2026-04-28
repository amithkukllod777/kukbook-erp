import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, ChevronRight, ChevronDown, FolderOpen, FileText, Sprout } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);
const typeColors: Record<string, string> = {
  Asset: "bg-blue-100 text-blue-800", Liability: "bg-rose-100 text-rose-800",
  Equity: "bg-violet-100 text-violet-800", Revenue: "bg-emerald-100 text-emerald-800",
  Expense: "bg-amber-100 text-amber-800", Income: "bg-emerald-100 text-emerald-800",
};

interface Account {
  id: number; code: string; name: string; type: string; subtype?: string;
  parentId?: number | null; isGroup?: boolean; nature?: string;
  openingBalance?: string; balance?: string; isSystemAccount?: boolean;
}

function buildTree(accounts: Account[]): (Account & { children: any[] })[] {
  const map = new Map<number, Account & { children: any[] }>();
  accounts.forEach(a => map.set(a.id, { ...a, children: [] }));
  const roots: (Account & { children: any[] })[] = [];
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort by code
  const sortFn = (a: Account, b: Account) => a.code.localeCompare(b.code);
  const sortTree = (nodes: (Account & { children: any[] })[]) => {
    nodes.sort(sortFn);
    nodes.forEach(n => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}

function AccountRow({ account, depth, expanded, onToggle, onEdit, onDelete }: {
  account: Account & { children: any[] }; depth: number;
  expanded: Set<number>; onToggle: (id: number) => void;
  onEdit: (a: Account) => void; onDelete: (id: number) => void;
}) {
  const isExpanded = expanded.has(account.id);
  const hasChildren = account.children.length > 0;
  const isGroup = account.isGroup;
  const balance = Number(account.balance || account.openingBalance || 0);

  return (
    <>
      <tr className={`border-b hover:bg-muted/30 transition-colors ${isGroup ? "bg-muted/10" : ""}`}>
        <td className="py-2.5 px-3 font-mono text-sm text-muted-foreground w-[100px]">{account.code}</td>
        <td className="py-2.5 px-3" style={{ paddingLeft: `${12 + depth * 24}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren || isGroup ? (
              <button onClick={() => onToggle(account.id)} className="p-0.5 rounded hover:bg-muted">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            {isGroup ? <FolderOpen className="h-4 w-4 text-amber-500" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
            <span className={`${isGroup ? "font-semibold" : "font-medium"}`}>{account.name}</span>
          </div>
        </td>
        <td className="py-2.5 px-3">
          <Badge className={typeColors[account.type] || "bg-gray-100 text-gray-800"} variant="secondary">{account.type}</Badge>
        </td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{account.nature || "—"}</td>
        <td className={`py-2.5 px-3 text-right font-medium tabular-nums ${balance < 0 ? "text-destructive" : ""}`}>
          {!isGroup ? fmt(balance) : "—"}
        </td>
        <td className="py-2.5 px-3 w-[90px]">
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(account)}><Pencil className="h-3.5 w-3.5" /></Button>
            {!account.isSystemAccount && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(`Delete "${account.name}"?`)) onDelete(account.id); }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && account.children.map((child: any) => (
        <AccountRow key={child.id} account={child} depth={depth + 1} expanded={expanded}
          onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

export default function Accounts() {
  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.accounts.list.useQuery();
  const createMut = trpc.accounts.create.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account created"); setOpen(false); } });
  const updateMut = trpc.accounts.update.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account updated"); setOpen(false); } });
  const deleteMut = trpc.accounts.delete.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account deleted"); } });
  const seedMut = trpc.accounts.seedCOA.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Default Chart of Accounts seeded!"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    code: "", name: "", type: "Asset", subtype: "", nature: "Debit",
    parentId: undefined as number | undefined, isGroup: false, balance: "0"
  });

  const tree = useMemo(() => buildTree(accounts as Account[]), [accounts]);

  const filteredTree = useMemo(() => {
    if (!search && filterType === "all") return tree;
    const matches = (accounts as Account[]).filter(a => {
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
      const matchType = filterType === "all" || a.type === filterType;
      return matchSearch && matchType;
    });
    return buildTree(matches);
  }, [accounts, search, filterType, tree]);

  const toggleExpand = useCallback((id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setExpanded(new Set((accounts as Account[]).filter(a => a.isGroup || a.parentId === null).map(a => a.id)));
  const collapseAll = () => setExpanded(new Set());

  const groupAccounts = (accounts as Account[]).filter(a => a.isGroup);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", type: "Asset", subtype: "", nature: "Debit", parentId: undefined, isGroup: false, balance: "0" });
    setOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setForm({
      code: a.code, name: a.name, type: a.type, subtype: a.subtype || "",
      nature: a.nature || "Debit", parentId: a.parentId || undefined,
      isGroup: a.isGroup || false, balance: String(a.openingBalance || a.balance || "0")
    });
    setOpen(true);
  };
  const handleSave = () => {
    if (!form.code || !form.name) { toast.error("Code and Name are required"); return; }
    if (editing) {
      updateMut.mutate({ id: editing.id, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Indian accounting hierarchy — Groups and Ledger accounts</p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
              <Sprout className="h-4 w-4 mr-2" />{seedMut.isPending ? "Seeding..." : "Seed Default COA"}
            </Button>
          )}
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Account</Button>
        </div>
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
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Code</th>
                  <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Account Name</th>
                  <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Nature</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">Balance</th>
                  <th className="py-2.5 px-3 font-medium text-muted-foreground w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : filteredTree.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">
                    {accounts.length === 0 ? "No accounts yet. Click \"Seed Default COA\" to get started with Indian accounting standards." : "No accounts match your search."}
                  </td></tr>
                ) : filteredTree.map(account => (
                  <AccountRow key={account.id} account={account} depth={0} expanded={expanded}
                    onToggle={toggleExpand} onEdit={openEdit} onDelete={(id) => deleteMut.mutate({ id })} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Account" : "New Account"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Code *</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="1010" /></div>
              <div><label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asset">Asset</SelectItem><SelectItem value="Liability">Liability</SelectItem>
                    <SelectItem value="Equity">Equity</SelectItem><SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="Income">Income</SelectItem><SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cash in Hand" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Nature</label>
                <Select value={form.nature} onValueChange={v => setForm({ ...form, nature: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Debit">Debit</SelectItem><SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Parent Group</label>
                <Select value={String(form.parentId || "none")} onValueChange={v => setForm({ ...form, parentId: v === "none" ? undefined : Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="None (root)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (root level)</SelectItem>
                    {groupAccounts.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.code} — {g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.isGroup} onCheckedChange={v => setForm({ ...form, isGroup: v })} />
                <label className="text-sm font-medium">Is Group (folder)</label>
              </div>
              {!form.isGroup && (
                <div><label className="text-sm font-medium">Opening Balance (₹)</label><Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
              )}
            </div>
            <div><label className="text-sm font-medium">Subtype / Description</label><Input value={form.subtype} onChange={e => setForm({ ...form, subtype: e.target.value })} placeholder="e.g., Current Asset, Direct Expense" /></div>
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
