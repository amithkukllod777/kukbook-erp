import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default function JournalEntries() {
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.journal.list.useQuery();
  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  const { data: nextId } = trpc.journal.nextId.useQuery();
  const createMut = trpc.journal.create.useMutation({ onSuccess: () => { utils.journal.list.invalidate(); utils.journal.nextId.invalidate(); toast.success("Entry created"); setOpen(false); } });
  const deleteMut = trpc.journal.delete.useMutation({ onSuccess: () => { utils.journal.list.invalidate(); toast.success("Entry deleted"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], description: "", posted: false, lines: [{ account: "", debit: "0", credit: "0" }, { account: "", debit: "0", credit: "0" }] });

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const openCreate = () => {
    setForm({ date: new Date().toISOString().split("T")[0], description: "", posted: false, lines: [{ account: "", debit: "0", credit: "0" }, { account: "", debit: "0", credit: "0" }] });
    setOpen(true);
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { account: "", debit: "0", credit: "0" }] });
  const removeLine = (i: number) => { if (form.lines.length <= 2) return; setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }); };
  const updateLine = (i: number, field: string, value: string) => {
    const lines = [...form.lines];
    (lines[i] as any)[field] = value;
    setForm({ ...form, lines });
  };

  const handleSave = () => {
    if (!form.description) { toast.error("Description is required"); return; }
    if (!balanced) { toast.error("Debits must equal Credits"); return; }
    if (form.lines.some(l => !l.account)) { toast.error("All lines need an account"); return; }
    createMut.mutate({ entryId: nextId || "JE-001", ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-sm text-muted-foreground mt-1">Double-entry bookkeeping records</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Entry</Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Entry ID</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No entries found</TableCell></TableRow>
              ) : entries.map((e: any) => {
                const total = e.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">{e.entryId}</TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell>
                      <Badge variant={e.posted ? "default" : "secondary"}>{e.posted ? "Posted" : "Draft"}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this entry?")) deleteMut.mutate({ id: e.id }); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="flex items-end gap-2">
                <label className="text-sm font-medium">Posted</label>
                <Switch checked={form.posted} onCheckedChange={v => setForm({ ...form, posted: v })} />
              </div>
            </div>
            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="January sales recognition" /></div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Lines</label>
                <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add Line</Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="w-[130px]">Debit</TableHead>
                      <TableHead className="w-[130px]">Credit</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.lines.map((line, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={line.account} onChange={e => updateLine(i, "account", e.target.value)}>
                            <option value="">Select account</option>
                            {accounts.map((a: any) => <option key={a.id} value={a.name}>{a.code} — {a.name}</option>)}
                          </select>
                        </TableCell>
                        <TableCell><Input type="number" value={line.debit} onChange={e => updateLine(i, "debit", e.target.value)} className="text-right" /></TableCell>
                        <TableCell><Input type="number" value={line.credit} onChange={e => updateLine(i, "credit", e.target.value)} className="text-right" /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={form.lines.length <= 2}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Totals</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(totalDebit)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(totalCredit)}</TableCell>
                      <TableCell>
                        {balanced ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="text-xs text-destructive">Unbalanced</span>}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || !balanced}>Create Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
