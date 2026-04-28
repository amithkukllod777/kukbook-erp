import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

function ReportSection({ title, color, items, totalLabel }: {
  title: string; color: string; items: { code: string; name: string; balance: number }[]; totalLabel: string;
}) {
  const total = items.reduce((s, a) => s + a.balance, 0);
  const bgClass = color === "green" ? "bg-emerald-50/50" : color === "red" ? "bg-red-50/50" : color === "blue" ? "bg-blue-50/50" : color === "rose" ? "bg-rose-50/50" : "bg-violet-50/50";
  const textClass = color === "green" ? "text-emerald-800" : color === "red" ? "text-red-800" : color === "blue" ? "text-blue-800" : color === "rose" ? "text-rose-800" : "text-violet-800";
  const totalColor = color === "green" ? "text-emerald-600" : color === "red" ? "text-red-600" : color === "blue" ? "text-blue-600" : color === "rose" ? "text-rose-600" : "text-violet-600";

  return (
    <>
      <tr className={bgClass}><td colSpan={3} className={`py-2 px-4 font-semibold ${textClass}`}>{title}</td></tr>
      {items.map((a, i) => (
        <tr key={i} className="border-b hover:bg-muted/20">
          <td className="py-2 px-4 pl-8 font-mono text-xs text-muted-foreground">{a.code}</td>
          <td className="py-2 px-4">{a.name}</td>
          <td className="py-2 px-4 text-right tabular-nums">{fmt(Math.abs(a.balance))}</td>
        </tr>
      ))}
      <tr className="border-t">
        <td colSpan={2} className="py-2 px-4 font-semibold">{totalLabel}</td>
        <td className={`py-2 px-4 text-right font-bold tabular-nums ${totalColor}`}>{fmt(Math.abs(total))}</td>
      </tr>
    </>
  );
}

export default function Reports() {
  const { data: trialBalance, isLoading: tbLoading } = trpc.reports.trialBalance.useQuery();
  const { data: pnl, isLoading: pnlLoading } = trpc.reports.profitAndLoss.useQuery();
  const { data: bs, isLoading: bsLoading } = trpc.reports.balanceSheet.useQuery();

  const isLoading = tbLoading || pnlLoading || bsLoading;

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading reports...</div>;

  const tbRaw = trialBalance as any || { rows: [], totalDebit: 0, totalCredit: 0 };
  const tb = { accounts: tbRaw.rows || [], totalDebits: tbRaw.totalDebit || 0, totalCredits: tbRaw.totalCredit || 0 };
  const plRaw = pnl as any || { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };
  const pl = {
    revenue: (plRaw.revenue || []).map((r: any) => ({ ...r, balance: r.amount ?? r.balance ?? 0 })),
    expenses: (plRaw.expenses || []).map((e: any) => ({ ...e, balance: e.amount ?? e.balance ?? 0 })),
    totalRevenue: plRaw.totalRevenue || 0, totalExpenses: plRaw.totalExpenses || 0, netIncome: plRaw.netIncome || 0,
  };
  const bsRaw = bs as any || { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
  const sheet = {
    assets: (bsRaw.assets || []).map((a: any) => ({ ...a, balance: a.amount ?? a.balance ?? 0 })),
    liabilities: (bsRaw.liabilities || []).map((l: any) => ({ ...l, balance: l.amount ?? l.balance ?? 0 })),
    equity: (bsRaw.equity || []).map((e: any) => ({ ...e, balance: e.amount ?? e.balance ?? 0 })),
    totalAssets: bsRaw.totalAssets || 0, totalLiabilities: bsRaw.totalLiabilities || 0, totalEquity: bsRaw.totalEquity || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Journal-driven Profit & Loss, Balance Sheet, and Trial Balance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-xl font-bold tabular-nums ${pl.netIncome >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {fmt(pl.netIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-xl font-bold tabular-nums">{fmt(sheet.totalAssets)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Trial Balance</p>
                <p className="text-xl font-bold tabular-nums">
                  {tb.totalDebits === tb.totalCredits ? (
                    <span className="text-emerald-600">Balanced ✓</span>
                  ) : (
                    <span className="text-destructive">Diff: {fmt(Math.abs(tb.totalDebits - tb.totalCredits))}</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pnl" className="relative">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="tb">Trial Balance</TabsTrigger>
        </TabsList>

        {/* Profit & Loss */}
        <TabsContent value="pnl" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Profit & Loss Statement</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV({
                  title: "Profit & Loss", filename: "profit-loss",
                  columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Amount", key: "balance", format: "currency" }],
                  data: [...pl.revenue.map((r: any) => ({ ...r, balance: Math.abs(r.balance) })), ...pl.expenses.map((e: any) => ({ ...e, balance: Math.abs(e.balance) }))],
                })}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF({
                  title: "Profit & Loss Statement", subtitle: `Net Income: ${fmt(pl.netIncome)}`,
                  filename: "profit-loss",
                  columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Amount (₹)", key: "balance", format: "currency" }],
                  data: [...pl.revenue.map((r: any) => ({ ...r, balance: Math.abs(r.balance) })), ...pl.expenses.map((e: any) => ({ ...e, balance: Math.abs(e.balance) }))],
                })}><FileDown className="h-3 w-3 mr-1" />PDF</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Code</th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Account</th>
                    <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <ReportSection title="Revenue / Income" color="green" items={pl.revenue} totalLabel="Total Revenue" />
                  <ReportSection title="Expenses" color="red" items={pl.expenses} totalLabel="Total Expenses" />
                  <tr className="border-t-2 bg-muted/50">
                    <td colSpan={2} className="py-3 px-4 font-bold text-lg">Net Income</td>
                    <td className={`py-3 px-4 text-right font-bold text-lg tabular-nums ${pl.netIncome >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {fmt(pl.netIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="bs" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Balance Sheet</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV({
                  title: "Balance Sheet", filename: "balance-sheet",
                  columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Amount", key: "balance", format: "currency" }],
                  data: [...sheet.assets, ...sheet.liabilities, ...sheet.equity],
                })}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF({
                  title: "Balance Sheet", subtitle: `Total Assets: ${fmt(sheet.totalAssets)}`,
                  filename: "balance-sheet",
                  columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Amount (₹)", key: "balance", format: "currency" }],
                  data: [...sheet.assets, ...sheet.liabilities, ...sheet.equity],
                })}><FileDown className="h-3 w-3 mr-1" />PDF</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Code</th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Account</th>
                    <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <ReportSection title="Assets" color="blue" items={sheet.assets} totalLabel="Total Assets" />
                  <ReportSection title="Liabilities" color="rose" items={sheet.liabilities} totalLabel="Total Liabilities" />
                  <ReportSection title="Equity" color="violet" items={sheet.equity} totalLabel="Total Equity" />
                  <tr className="border-t-2 bg-muted/50">
                    <td colSpan={2} className="py-3 px-4 font-bold">Liabilities + Equity</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">{fmt(sheet.totalLiabilities + sheet.totalEquity)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="tb" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Trial Balance</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV({
                  title: "Trial Balance", filename: "trial-balance",
                  columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Debit", key: "debit", format: "currency" }, { header: "Credit", key: "credit", format: "currency" }],
                  data: tb.accounts,
                })}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF({
                  title: "Trial Balance", subtitle: `Debits: ${fmt(tb.totalDebits)} | Credits: ${fmt(tb.totalCredits)}`,
                  filename: "trial-balance",
                  columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Debit (₹)", key: "debit", format: "currency" }, { header: "Credit (₹)", key: "credit", format: "currency" }],
                  data: tb.accounts,
                })}><FileDown className="h-3 w-3 mr-1" />PDF</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Code</th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Account</th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Type</th>
                    <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Debit (₹)</th>
                    <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {tb.accounts.map((a: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-4 font-mono text-xs text-muted-foreground">{a.code}</td>
                      <td className="py-2 px-4 font-medium">{a.name}</td>
                      <td className="py-2 px-4 text-muted-foreground">{a.type}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{a.debit > 0 ? fmt(a.debit) : "—"}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{a.credit > 0 ? fmt(a.credit) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/50 font-bold">
                    <td colSpan={3} className="py-3 px-4 font-bold">Totals</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">{fmt(tb.totalDebits)}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">{fmt(tb.totalCredits)}</td>
                  </tr>
                  {tb.totalDebits !== tb.totalCredits && (
                    <tr className="bg-destructive/10">
                      <td colSpan={3} className="py-2 px-4 text-destructive font-medium">Difference (out of balance)</td>
                      <td colSpan={2} className="py-2 px-4 text-right text-destructive font-bold tabular-nums">
                        {fmt(Math.abs(tb.totalDebits - tb.totalCredits))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
