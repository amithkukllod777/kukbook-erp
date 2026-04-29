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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle2, Scale } from "lucide-react";
import { toast } from "sonner";

export default function BankReconciliation() {
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id || 0;

  const { data: reconciliations = [], refetch } = trpc.bankReconciliation.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const { data: bankAccounts = [] } = trpc.cashBank.list.useQuery();

  const createMut = trpc.bankReconciliation.create.useMutation({
    onSuccess: () => { refetch(); setCreateOpen(false); toast.success("Reconciliation created"); },
  });
  const addItemMut = trpc.bankReconciliation.addItem.useMutation({
    onSuccess: () => { refetch(); toast.success("Item added"); setItemForm({ transactionDate: new Date().toISOString().slice(0, 10), description: "", referenceNo: "", debit: "", credit: "" }); },
  });
  const matchItemMut = trpc.bankReconciliation.matchItem.useMutation({
    onSuccess: () => { refetch(); toast.success("Item matched"); },
  });
  const finalizeMut = trpc.bankReconciliation.finalize.useMutation({
    onSuccess: () => { refetch(); toast.success("Reconciliation finalized"); },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({ transactionDate: new Date().toISOString().slice(0, 10), description: "", referenceNo: "", debit: "", credit: "" });
  const [form, setForm] = useState({
    accountId: 0, accountName: "", statementDate: new Date().toISOString().slice(0, 10),
    statementBalance: "", bookBalance: "",
  });

  const { data: detail } = trpc.bankReconciliation.get.useQuery(
    { id: detailId! },
    { enabled: !!detailId }
  );

  const handleCreate = () => {
    if (!form.accountId || !form.statementBalance || !form.bookBalance) {
      toast.error("Please fill all required fields");
      return;
    }
    const diff = String(Number(form.statementBalance) - Number(form.bookBalance));
    createMut.mutate({
      companyId, accountId: form.accountId, accountName: form.accountName,
      statementDate: form.statementDate, statementBalance: form.statementBalance,
      bookBalance: form.bookBalance, difference: diff,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
          <p className="text-muted-foreground">Match bank statements with book entries</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Reconciliation
        </Button>
      </div>

      {reconciliations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No reconciliations yet. Start by creating a new one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reconciliations.map((rec: any) => (
            <Card key={rec.id} className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setDetailId(rec.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{rec.accountName}</div>
                  <div className="text-sm text-muted-foreground">
                    Statement Date: {rec.statementDate} • Statement: ₹{Number(rec.statementBalance).toLocaleString("en-IN")}
                    • Book: ₹{Number(rec.bookBalance).toLocaleString("en-IN")}
                  </div>
                  {Number(rec.difference) !== 0 && (
                    <div className="text-sm text-orange-500">
                      Difference: ₹{Number(rec.difference).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={rec.status === "reconciled" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}>
                    {rec.status}
                  </Badge>
                  {rec.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); finalizeMut.mutate({ id: rec.id }); }}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Finalize
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail View */}
      {detail && detailId && (
        <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reconciliation: {detail.accountName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">Statement Balance:</span> <span className="font-medium">₹{Number(detail.statementBalance).toLocaleString("en-IN")}</span></div>
                <div><span className="text-muted-foreground">Book Balance:</span> <span className="font-medium">₹{Number(detail.bookBalance).toLocaleString("en-IN")}</span></div>
                <div><span className="text-muted-foreground">Difference:</span> <span className="font-medium text-orange-500">₹{Number(detail.difference).toLocaleString("en-IN")}</span></div>
              </div>
              {detail.items && detail.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Matched</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.transactionDate}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.referenceNo}</TableCell>
                        <TableCell className="text-right">₹{Number(item.debit).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">₹{Number(item.credit).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          {item.isMatched ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No items added yet. Add statement entries below.</p>
              )}
              {/* Add Statement Item Form */}
              {detail.status === "draft" && (
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <h4 className="text-sm font-medium">Add Statement Entry</h4>
                  <div className="grid grid-cols-5 gap-2">
                    <Input type="date" value={itemForm.transactionDate} onChange={e => setItemForm({ ...itemForm, transactionDate: e.target.value })} placeholder="Date" />
                    <Input value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Description" />
                    <Input value={itemForm.referenceNo} onChange={e => setItemForm({ ...itemForm, referenceNo: e.target.value })} placeholder="Ref No" />
                    <Input type="number" value={itemForm.debit} onChange={e => setItemForm({ ...itemForm, debit: e.target.value })} placeholder="Debit ₹" />
                    <Input type="number" value={itemForm.credit} onChange={e => setItemForm({ ...itemForm, credit: e.target.value })} placeholder="Credit ₹" />
                  </div>
                  <Button size="sm" onClick={() => { if (!itemForm.transactionDate) { toast.error("Date required"); return; } addItemMut.mutate({ reconciliationId: detailId!, ...itemForm }); }} disabled={addItemMut.isPending}>
                    <Plus className="h-3 w-3 mr-1" /> Add Entry
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Bank Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bank Account *</Label>
              <Select onValueChange={(v) => {
                const acc = bankAccounts.find((a: any) => a.id === Number(v));
                setForm({ ...form, accountId: Number(v), accountName: acc?.name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statement Date *</Label>
              <Input type="date" value={form.statementDate} onChange={(e) => setForm({ ...form, statementDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Statement Balance (₹) *</Label>
                <Input type="number" value={form.statementBalance} onChange={(e) => setForm({ ...form, statementBalance: e.target.value })} />
              </div>
              <div>
                <Label>Book Balance (₹) *</Label>
                <Input type="number" value={form.bookBalance} onChange={(e) => setForm({ ...form, bookBalance: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMut.isPending}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
