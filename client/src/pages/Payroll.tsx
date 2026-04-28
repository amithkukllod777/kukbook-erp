import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calculator, FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";
import { useState } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default function Payroll() {
  const utils = trpc.useUtils();
  const { data: runs = [], isLoading } = trpc.payroll.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: nextId } = trpc.payroll.nextId.useQuery();
  const runMut = trpc.payroll.run.useMutation({ onSuccess: () => { utils.payroll.list.invalidate(); utils.payroll.nextId.invalidate(); toast.success("Payroll run completed"); setOpen(false); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ period: "", runDate: new Date().toISOString().split("T")[0] });

  const activeEmps = employees.filter((e: any) => e.active);
  const totalGross = activeEmps.reduce((s: number, e: any) => s + Number(e.salary) / 12, 0);
  const fedTax = totalGross * 0.22;
  const stateTax = totalGross * 0.05;
  const ssMed = totalGross * 0.0765;
  const totalNet = totalGross - fedTax - stateTax - ssMed;

  const openCreate = () => {
    const now = new Date();
    setForm({ period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, runDate: now.toISOString().split("T")[0] });
    setOpen(true);
  };

  const handleRun = () => {
    if (!form.period) { toast.error("Period is required"); return; }
    runMut.mutate({
      payrollId: nextId || "PR-001", period: form.period, runDate: form.runDate,
      gross: totalGross.toFixed(2), fedTax: fedTax.toFixed(2), stateTax: stateTax.toFixed(2), ssMed: ssMed.toFixed(2), net: totalNet.toFixed(2)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Payroll</h1><p className="text-sm text-muted-foreground mt-1">Run payroll and view history</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Payroll", filename: "payroll", columns: [{ header: "Run ID", key: "payrollId" }, { header: "Period", key: "period" }, { header: "Run Date", key: "runDate" }, { header: "Gross", key: "gross", format: "currency" }, { header: "Fed Tax", key: "fedTax", format: "currency" }, { header: "State Tax", key: "stateTax", format: "currency" }, { header: "SS/Med", key: "ssMed", format: "currency" }, { header: "Net", key: "net", format: "currency" }], data: runs })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Payroll Report", subtitle: `Generated on ${new Date().toLocaleDateString()}`, filename: "payroll", columns: [{ header: "Run ID", key: "payrollId" }, { header: "Period", key: "period" }, { header: "Run Date", key: "runDate" }, { header: "Gross", key: "gross", format: "currency" }, { header: "Fed Tax", key: "fedTax", format: "currency" }, { header: "State Tax", key: "stateTax", format: "currency" }, { header: "SS/Med", key: "ssMed", format: "currency" }, { header: "Net", key: "net", format: "currency" }], data: runs })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
          <Button onClick={openCreate}><Calculator className="h-4 w-4 mr-2" />Run Payroll</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Active Employees</p><p className="text-2xl font-bold mt-1">{activeEmps.length}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Monthly Gross</p><p className="text-2xl font-bold mt-1">{fmt(totalGross)}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Total Taxes</p><p className="text-2xl font-bold mt-1 text-amber-600">{fmt(fedTax + stateTax + ssMed)}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Monthly Net</p><p className="text-2xl font-bold mt-1 text-emerald-600">{fmt(totalNet)}</p></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Payroll History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Run ID</TableHead><TableHead>Period</TableHead><TableHead>Run Date</TableHead><TableHead className="text-right">Gross</TableHead><TableHead className="text-right">Fed Tax</TableHead><TableHead className="text-right">State Tax</TableHead><TableHead className="text-right">SS/Med</TableHead><TableHead className="text-right">Net Pay</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : runs.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payroll runs yet</TableCell></TableRow>
              : runs.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.payrollId}</TableCell>
                  <TableCell><Badge variant="secondary">{r.period}</Badge></TableCell>
                  <TableCell>{r.runDate}</TableCell>
                  <TableCell className="text-right">{fmt(Number(r.gross))}</TableCell>
                  <TableCell className="text-right text-amber-600">{fmt(Number(r.fedTax))}</TableCell>
                  <TableCell className="text-right text-amber-600">{fmt(Number(r.stateTax))}</TableCell>
                  <TableCell className="text-right text-amber-600">{fmt(Number(r.ssMed))}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">{fmt(Number(r.net))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Run Payroll</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Period (YYYY-MM)</label><Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="2026-04" /></div>
              <div><label className="text-sm font-medium">Run Date</label><Input type="date" value={form.runDate} onChange={e => setForm({ ...form, runDate: e.target.value })} /></div>
            </div>
            <Card className="bg-muted/50"><CardContent className="p-4 space-y-2">
              <h4 className="font-medium text-sm mb-3">Payroll Summary ({activeEmps.length} employees)</h4>
              <div className="flex justify-between text-sm"><span>Gross Pay</span><span className="font-medium">{fmt(totalGross)}</span></div>
              <div className="flex justify-between text-sm text-amber-600"><span>Federal Tax (22%)</span><span>{fmt(fedTax)}</span></div>
              <div className="flex justify-between text-sm text-amber-600"><span>State Tax (5%)</span><span>{fmt(stateTax)}</span></div>
              <div className="flex justify-between text-sm text-amber-600"><span>SS/Medicare (7.65%)</span><span>{fmt(ssMed)}</span></div>
              <div className="border-t pt-2 flex justify-between text-sm font-bold"><span>Net Pay</span><span className="text-emerald-600">{fmt(totalNet)}</span></div>
            </CardContent></Card>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleRun} disabled={runMut.isPending}><DollarSign className="h-4 w-4 mr-2" />Process Payroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
