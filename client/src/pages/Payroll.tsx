import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, FileDown, FileSpreadsheet, IndianRupee, Users, TrendingDown, Wallet } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

// Indian Payroll Constants (FY 2025-26)
const PF_RATE_EMPLOYEE = 0.12;  // 12% of Basic
const PF_RATE_EMPLOYER = 0.12;  // 12% of Basic (3.67% EPF + 8.33% EPS)
const PF_WAGE_CEILING = 15000;  // PF applicable on Basic up to ₹15,000/month
const ESI_RATE_EMPLOYEE = 0.0075; // 0.75% of Gross
const ESI_RATE_EMPLOYER = 0.0325; // 3.25% of Gross
const ESI_WAGE_CEILING = 21000;   // ESI applicable if Gross ≤ ₹21,000/month

// Professional Tax (Maharashtra rates as default)
function getProfessionalTax(monthlyGross: number): number {
  if (monthlyGross <= 7500) return 0;
  if (monthlyGross <= 10000) return 175;
  return 200; // For Feb: ₹300
}

// Simplified TDS calculation (New Tax Regime FY 2025-26)
function getMonthlyTDS(annualIncome: number): number {
  // Standard deduction ₹75,000
  const taxable = Math.max(0, annualIncome - 75000);
  let tax = 0;
  if (taxable <= 400000) tax = 0;
  else if (taxable <= 800000) tax = (taxable - 400000) * 0.05;
  else if (taxable <= 1200000) tax = 20000 + (taxable - 800000) * 0.10;
  else if (taxable <= 1600000) tax = 60000 + (taxable - 1200000) * 0.15;
  else if (taxable <= 2000000) tax = 120000 + (taxable - 1600000) * 0.20;
  else if (taxable <= 2400000) tax = 200000 + (taxable - 2000000) * 0.25;
  else tax = 300000 + (taxable - 2400000) * 0.30;
  // Rebate u/s 87A: If taxable income ≤ ₹12L, tax = 0
  if (taxable <= 1200000) tax = 0;
  // Health & Education Cess 4%
  tax = tax * 1.04;
  return Math.round(tax / 12);
}

export default function Payroll() {
  const utils = trpc.useUtils();
  const { data: runs = [], isLoading } = trpc.payroll.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: nextId } = trpc.payroll.nextId.useQuery();
  const runMut = trpc.payroll.run.useMutation({ onSuccess: () => { utils.payroll.list.invalidate(); utils.payroll.nextId.invalidate(); toast.success("Payroll processed successfully"); setOpen(false); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ period: "", runDate: new Date().toISOString().split("T")[0] });

  const activeEmps = employees.filter((e: any) => e.active);

  // Calculate Indian payroll for all active employees
  const payrollCalc = useMemo(() => {
    let totalBasic = 0, totalHRA = 0, totalDA = 0, totalSpecial = 0, totalGross = 0;
    let totalPFEmp = 0, totalPFEr = 0, totalESIEmp = 0, totalESIEr = 0, totalPT = 0, totalTDS = 0;
    let totalNet = 0;

    const empDetails = activeEmps.map((emp: any) => {
      const monthlySalary = Number(emp.salary) / 12;
      const basic = Number(emp.basicSalary) > 0 ? Number(emp.basicSalary) / 12 : monthlySalary * 0.50;
      const hra = Number(emp.hra) > 0 ? Number(emp.hra) / 12 : monthlySalary * 0.20;
      const da = Number(emp.da) > 0 ? Number(emp.da) / 12 : monthlySalary * 0.10;
      const special = Number(emp.specialAllowance) > 0 ? Number(emp.specialAllowance) / 12 : monthlySalary * 0.20;
      const gross = basic + hra + da + special;

      // PF: 12% of Basic (capped at ₹15,000 basic for statutory)
      const pfBasic = Math.min(basic, PF_WAGE_CEILING);
      const pfEmp = emp.pfOptOut ? 0 : Math.round(pfBasic * PF_RATE_EMPLOYEE);
      const pfEr = emp.pfOptOut ? 0 : Math.round(pfBasic * PF_RATE_EMPLOYER);

      // ESI: applicable only if gross ≤ ₹21,000/month
      const esiEmp = gross <= ESI_WAGE_CEILING ? Math.round(gross * ESI_RATE_EMPLOYEE) : 0;
      const esiEr = gross <= ESI_WAGE_CEILING ? Math.round(gross * ESI_RATE_EMPLOYER) : 0;

      // Professional Tax
      const pt = getProfessionalTax(gross);

      // TDS
      const annualIncome = Number(emp.salary);
      const tds = getMonthlyTDS(annualIncome);

      const totalDeductions = pfEmp + esiEmp + pt + tds;
      const net = Math.round(gross - totalDeductions);

      totalBasic += basic; totalHRA += hra; totalDA += da; totalSpecial += special; totalGross += gross;
      totalPFEmp += pfEmp; totalPFEr += pfEr; totalESIEmp += esiEmp; totalESIEr += esiEr;
      totalPT += pt; totalTDS += tds; totalNet += net;

      return { emp, basic, hra, da, special, gross, pfEmp, pfEr, esiEmp, esiEr, pt, tds, totalDeductions, net };
    });

    return {
      empDetails, totalBasic, totalHRA, totalDA, totalSpecial, totalGross,
      totalPFEmp, totalPFEr, totalESIEmp, totalESIEr, totalPT, totalTDS, totalNet,
      totalDeductions: totalPFEmp + totalESIEmp + totalPT + totalTDS,
      totalEmployerCost: totalGross + totalPFEr + totalESIEr
    };
  }, [activeEmps]);

  const openCreate = () => {
    const now = new Date();
    setForm({ period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, runDate: now.toISOString().split("T")[0] });
    setOpen(true);
  };

  const handleRun = () => {
    if (!form.period) { toast.error("Period is required"); return; }
    if (activeEmps.length === 0) { toast.error("No active employees"); return; }
    runMut.mutate({
      payrollId: nextId || "PR-001", period: form.period, runDate: form.runDate,
      gross: payrollCalc.totalGross.toFixed(2),
      basicPay: payrollCalc.totalBasic.toFixed(2),
      hra_amt: payrollCalc.totalHRA.toFixed(2),
      da_amt: payrollCalc.totalDA.toFixed(2),
      specialAllow: payrollCalc.totalSpecial.toFixed(2),
      pfEmployee: payrollCalc.totalPFEmp.toFixed(2),
      pfEmployer: payrollCalc.totalPFEr.toFixed(2),
      esiEmployee: payrollCalc.totalESIEmp.toFixed(2),
      esiEmployer: payrollCalc.totalESIEr.toFixed(2),
      professionalTax: payrollCalc.totalPT.toFixed(2),
      tds: payrollCalc.totalTDS.toFixed(2),
      net: payrollCalc.totalNet.toFixed(2)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Payroll</h1><p className="text-sm text-muted-foreground mt-1">Indian payroll with PF, ESI, PT & TDS</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Payroll", filename: "payroll", columns: [{ header: "Run ID", key: "payrollId" }, { header: "Period", key: "period" }, { header: "Run Date", key: "runDate" }, { header: "Gross", key: "gross" }, { header: "PF (Emp)", key: "pfEmployee" }, { header: "ESI (Emp)", key: "esiEmployee" }, { header: "PT", key: "professionalTax" }, { header: "TDS", key: "tds" }, { header: "Net", key: "net" }], data: runs })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Payroll Report", subtitle: `Generated on ${new Date().toLocaleDateString("en-IN")}`, filename: "payroll", columns: [{ header: "Run ID", key: "payrollId" }, { header: "Period", key: "period" }, { header: "Gross", key: "gross", format: "currency" }, { header: "PF", key: "pfEmployee", format: "currency" }, { header: "ESI", key: "esiEmployee", format: "currency" }, { header: "PT", key: "professionalTax", format: "currency" }, { header: "TDS", key: "tds", format: "currency" }, { header: "Net", key: "net", format: "currency" }], data: runs })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
          <Button onClick={openCreate}><Calculator className="h-4 w-4 mr-2" />Run Payroll</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="shadow-sm border-blue-200 bg-blue-50/30"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-600" /><p className="text-xs text-blue-700 uppercase font-medium">Active Employees</p></div><p className="text-2xl font-bold text-blue-700">{activeEmps.length}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><IndianRupee className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground uppercase">Monthly Gross</p></div><p className="text-2xl font-bold">{fmt(payrollCalc.totalGross)}</p></CardContent></Card>
        <Card className="shadow-sm border-amber-200 bg-amber-50/30"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-amber-600" /><p className="text-xs text-amber-700 uppercase font-medium">Deductions</p></div><p className="text-2xl font-bold text-amber-700">{fmt(payrollCalc.totalDeductions)}</p></CardContent></Card>
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-emerald-600" /><p className="text-xs text-emerald-700 uppercase font-medium">Net Payable</p></div><p className="text-2xl font-bold text-emerald-700">{fmt(payrollCalc.totalNet)}</p></CardContent></Card>
        <Card className="shadow-sm border-purple-200 bg-purple-50/30"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><IndianRupee className="h-4 w-4 text-purple-600" /><p className="text-xs text-purple-700 uppercase font-medium">CTC (Employer)</p></div><p className="text-2xl font-bold text-purple-700">{fmt(payrollCalc.totalEmployerCost)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Payroll History</TabsTrigger>
          <TabsTrigger value="breakdown">Employee Breakdown</TabsTrigger>
          <TabsTrigger value="statutory">Statutory Summary</TabsTrigger>
        </TabsList>

        {/* Payroll History */}
        <TabsContent value="history">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Run ID</TableHead><TableHead>Period</TableHead><TableHead>Run Date</TableHead><TableHead className="text-right">Gross</TableHead><TableHead className="text-right">PF</TableHead><TableHead className="text-right">ESI</TableHead><TableHead className="text-right">PT</TableHead><TableHead className="text-right">TDS</TableHead><TableHead className="text-right">Net Pay</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  : runs.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No payroll runs yet. Click "Run Payroll" to process.</TableCell></TableRow>
                  : runs.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.payrollId}</TableCell>
                      <TableCell><Badge variant="secondary">{r.period}</Badge></TableCell>
                      <TableCell>{r.runDate}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(r.gross))}</TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600">{fmt(Number(r.pfEmployee))}</TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600">{fmt(Number(r.esiEmployee))}</TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600">{fmt(Number(r.professionalTax))}</TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600">{fmt(Number(r.tds))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-emerald-600">{fmt(Number(r.net))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee-wise Breakdown */}
        <TabsContent value="breakdown">
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Employee-wise Payroll Breakdown (Monthly)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">HRA</TableHead><TableHead className="text-right">DA</TableHead><TableHead className="text-right">Special</TableHead><TableHead className="text-right">Gross</TableHead><TableHead className="text-right">PF</TableHead><TableHead className="text-right">ESI</TableHead><TableHead className="text-right">PT</TableHead><TableHead className="text-right">TDS</TableHead><TableHead className="text-right">Net</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payrollCalc.empDetails.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No active employees</TableCell></TableRow>
                    ) : payrollCalc.empDetails.map((d: any) => (
                      <TableRow key={d.emp.id}>
                        <TableCell className="font-medium">{d.emp.name}<br/><span className="text-xs text-muted-foreground">{d.emp.empId}</span></TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.basic)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.hra)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.da)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.special)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(d.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(d.pfEmp)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(d.esiEmp)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(d.pt)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(d.tds)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-emerald-600">{fmt(d.net)}</TableCell>
                      </TableRow>
                    ))}
                    {payrollCalc.empDetails.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total ({activeEmps.length} employees)</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(payrollCalc.totalBasic)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(payrollCalc.totalHRA)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(payrollCalc.totalDA)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(payrollCalc.totalSpecial)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(payrollCalc.totalGross)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(payrollCalc.totalPFEmp)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(payrollCalc.totalESIEmp)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(payrollCalc.totalPT)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">{fmt(payrollCalc.totalTDS)}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600">{fmt(payrollCalc.totalNet)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statutory Summary */}
        <TabsContent value="statutory">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">PF Summary (Monthly)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Employee Contribution (12%)</span><span className="font-medium tabular-nums">{fmt(payrollCalc.totalPFEmp)}</span></div>
                <div className="flex justify-between text-sm"><span>Employer Contribution (12%)</span><span className="font-medium tabular-nums">{fmt(payrollCalc.totalPFEr)}</span></div>
                <div className="flex justify-between text-sm border-t pt-2 font-bold"><span>Total PF Deposit</span><span className="tabular-nums">{fmt(payrollCalc.totalPFEmp + payrollCalc.totalPFEr)}</span></div>
                <p className="text-xs text-muted-foreground">PF calculated on Basic up to {fmt(PF_WAGE_CEILING)}/month</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">ESI Summary (Monthly)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Employee Contribution (0.75%)</span><span className="font-medium tabular-nums">{fmt(payrollCalc.totalESIEmp)}</span></div>
                <div className="flex justify-between text-sm"><span>Employer Contribution (3.25%)</span><span className="font-medium tabular-nums">{fmt(payrollCalc.totalESIEr)}</span></div>
                <div className="flex justify-between text-sm border-t pt-2 font-bold"><span>Total ESI Deposit</span><span className="tabular-nums">{fmt(payrollCalc.totalESIEmp + payrollCalc.totalESIEr)}</span></div>
                <p className="text-xs text-muted-foreground">ESI applicable if Gross ≤ {fmt(ESI_WAGE_CEILING)}/month</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Professional Tax (Monthly)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Total PT Deduction</span><span className="font-medium tabular-nums">{fmt(payrollCalc.totalPT)}</span></div>
                <p className="text-xs text-muted-foreground">Maharashtra PT rates applied (max ₹200/month, ₹300 for Feb)</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">TDS Summary (Monthly)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Total TDS Deduction</span><span className="font-medium tabular-nums">{fmt(payrollCalc.totalTDS)}</span></div>
                <p className="text-xs text-muted-foreground">New Tax Regime FY 2025-26 with ₹75,000 standard deduction. Rebate u/s 87A for income up to ₹12L.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Run Payroll Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Run Payroll — Indian Compliance</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Period (YYYY-MM)</label><Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="2026-04" /></div>
              <div><label className="text-sm font-medium">Run Date</label><Input type="date" value={form.runDate} onChange={e => setForm({ ...form, runDate: e.target.value })} /></div>
            </div>
            <Card className="bg-muted/50"><CardContent className="p-4 space-y-2">
              <h4 className="font-medium text-sm mb-3">Payroll Summary ({activeEmps.length} employees)</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div className="flex justify-between"><span>Basic Pay</span><span className="tabular-nums">{fmt(payrollCalc.totalBasic)}</span></div>
                <div className="flex justify-between"><span>HRA</span><span className="tabular-nums">{fmt(payrollCalc.totalHRA)}</span></div>
                <div className="flex justify-between"><span>DA</span><span className="tabular-nums">{fmt(payrollCalc.totalDA)}</span></div>
                <div className="flex justify-between"><span>Special Allowance</span><span className="tabular-nums">{fmt(payrollCalc.totalSpecial)}</span></div>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-semibold"><span>Gross Pay</span><span className="tabular-nums">{fmt(payrollCalc.totalGross)}</span></div>
              <div className="border-t pt-2 space-y-1">
                <p className="text-xs font-medium text-amber-700 uppercase">Deductions</p>
                <div className="flex justify-between text-sm text-amber-700"><span>PF (Employee 12%)</span><span className="tabular-nums">{fmt(payrollCalc.totalPFEmp)}</span></div>
                <div className="flex justify-between text-sm text-amber-700"><span>ESI (Employee 0.75%)</span><span className="tabular-nums">{fmt(payrollCalc.totalESIEmp)}</span></div>
                <div className="flex justify-between text-sm text-amber-700"><span>Professional Tax</span><span className="tabular-nums">{fmt(payrollCalc.totalPT)}</span></div>
                <div className="flex justify-between text-sm text-amber-700"><span>TDS (Income Tax)</span><span className="tabular-nums">{fmt(payrollCalc.totalTDS)}</span></div>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-bold"><span>Net Pay</span><span className="text-emerald-600 tabular-nums">{fmt(payrollCalc.totalNet)}</span></div>
              <div className="border-t pt-2 space-y-1">
                <p className="text-xs font-medium text-purple-700 uppercase">Employer Contributions</p>
                <div className="flex justify-between text-sm text-purple-700"><span>PF (Employer 12%)</span><span className="tabular-nums">{fmt(payrollCalc.totalPFEr)}</span></div>
                <div className="flex justify-between text-sm text-purple-700"><span>ESI (Employer 3.25%)</span><span className="tabular-nums">{fmt(payrollCalc.totalESIEr)}</span></div>
                <div className="flex justify-between text-sm font-semibold text-purple-700 border-t pt-1"><span>Total CTC</span><span className="tabular-nums">{fmt(payrollCalc.totalEmployerCost)}</span></div>
              </div>
            </CardContent></Card>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleRun} disabled={runMut.isPending}><IndianRupee className="h-4 w-4 mr-2" />Process Payroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
