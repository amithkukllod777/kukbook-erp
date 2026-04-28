import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default function Reports() {
  const { data: accounts = [], isLoading } = trpc.accounts.list.useQuery();

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = { Asset: [], Liability: [], Equity: [], Revenue: [], Expense: [] };
    accounts.forEach((a: any) => { if (g[a.type]) g[a.type].push(a); });
    return g;
  }, [accounts]);

  const sum = (type: string) => grouped[type]?.reduce((s: number, a: any) => s + Number(a.balance), 0) || 0;
  const totalRevenue = sum("Revenue");
  const totalExpenses = sum("Expense");
  const netIncome = totalRevenue - totalExpenses;
  const totalAssets = sum("Asset");
  const totalLiabilities = sum("Liability");
  const totalEquity = sum("Equity");

  const trialBalanceData = useMemo(() => {
    return accounts.map((a: any) => {
      const bal = Number(a.balance);
      const isDebitNormal = a.type === "Asset" || a.type === "Expense";
      return { ...a, debit: isDebitNormal ? Math.abs(bal) : (bal < 0 ? Math.abs(bal) : 0), credit: !isDebitNormal ? Math.abs(bal) : (bal < 0 ? Math.abs(bal) : 0) };
    });
  }, [accounts]);

  const totalDebits = trialBalanceData.reduce((s, a) => s + a.debit, 0);
  const totalCredits = trialBalanceData.reduce((s, a) => s + a.credit, 0);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1><p className="text-sm text-muted-foreground mt-1">View Profit & Loss, Balance Sheet, and Trial Balance</p></div>

      <Tabs defaultValue="pnl" className="relative">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="tb">Trial Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Profit & Loss Statement</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => exportToCSV({ title: "P&L", filename: "profit-loss", columns: [{ header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Balance", key: "balance", format: "currency" }], data: [...grouped.Revenue, ...grouped.Expense] })}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button><Button variant="outline" size="sm" onClick={() => exportToPDF({ title: "Profit & Loss Statement", subtitle: `Net Income: ${fmt(netIncome)}`, filename: "profit-loss", columns: [{ header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Balance", key: "balance", format: "currency" }], data: [...grouped.Revenue, ...grouped.Expense] })}><FileDown className="h-3 w-3 mr-1" />PDF</Button></div></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow className="bg-emerald-50/50"><TableCell colSpan={2} className="font-semibold text-emerald-800">Revenue</TableCell></TableRow>
                  {grouped.Revenue.map((a: any) => <TableRow key={a.id}><TableCell className="pl-8">{a.name}</TableCell><TableCell className="text-right">{fmt(Number(a.balance))}</TableCell></TableRow>)}
                  <TableRow className="border-t"><TableCell className="font-semibold">Total Revenue</TableCell><TableCell className="text-right font-bold text-emerald-600">{fmt(totalRevenue)}</TableCell></TableRow>

                  <TableRow className="bg-red-50/50"><TableCell colSpan={2} className="font-semibold text-red-800">Expenses</TableCell></TableRow>
                  {grouped.Expense.map((a: any) => <TableRow key={a.id}><TableCell className="pl-8">{a.name}</TableCell><TableCell className="text-right">{fmt(Number(a.balance))}</TableCell></TableRow>)}
                  <TableRow className="border-t"><TableCell className="font-semibold">Total Expenses</TableCell><TableCell className="text-right font-bold text-red-600">{fmt(totalExpenses)}</TableCell></TableRow>

                  <TableRow className="border-t-2 bg-muted/50"><TableCell className="font-bold text-lg">Net Income</TableCell><TableCell className={`text-right font-bold text-lg ${netIncome >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(netIncome)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Balance Sheet</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => exportToCSV({ title: "Balance Sheet", filename: "balance-sheet", columns: [{ header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Balance", key: "balance", format: "currency" }], data: [...grouped.Asset, ...grouped.Liability, ...grouped.Equity] })}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button><Button variant="outline" size="sm" onClick={() => exportToPDF({ title: "Balance Sheet", subtitle: `Total Assets: ${fmt(totalAssets)}`, filename: "balance-sheet", columns: [{ header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Balance", key: "balance", format: "currency" }], data: [...grouped.Asset, ...grouped.Liability, ...grouped.Equity] })}><FileDown className="h-3 w-3 mr-1" />PDF</Button></div></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow className="bg-blue-50/50"><TableCell colSpan={2} className="font-semibold text-blue-800">Assets</TableCell></TableRow>
                  {grouped.Asset.map((a: any) => <TableRow key={a.id}><TableCell className="pl-8">{a.name}</TableCell><TableCell className="text-right">{fmt(Number(a.balance))}</TableCell></TableRow>)}
                  <TableRow className="border-t"><TableCell className="font-semibold">Total Assets</TableCell><TableCell className="text-right font-bold">{fmt(totalAssets)}</TableCell></TableRow>

                  <TableRow className="bg-rose-50/50"><TableCell colSpan={2} className="font-semibold text-rose-800">Liabilities</TableCell></TableRow>
                  {grouped.Liability.map((a: any) => <TableRow key={a.id}><TableCell className="pl-8">{a.name}</TableCell><TableCell className="text-right">{fmt(Number(a.balance))}</TableCell></TableRow>)}
                  <TableRow className="border-t"><TableCell className="font-semibold">Total Liabilities</TableCell><TableCell className="text-right font-bold">{fmt(totalLiabilities)}</TableCell></TableRow>

                  <TableRow className="bg-violet-50/50"><TableCell colSpan={2} className="font-semibold text-violet-800">Equity</TableCell></TableRow>
                  {grouped.Equity.map((a: any) => <TableRow key={a.id}><TableCell className="pl-8">{a.name}</TableCell><TableCell className="text-right">{fmt(Number(a.balance))}</TableCell></TableRow>)}
                  <TableRow className="border-t"><TableCell className="font-semibold">Total Equity</TableCell><TableCell className="text-right font-bold">{fmt(totalEquity)}</TableCell></TableRow>

                  <TableRow className="border-t-2 bg-muted/50"><TableCell className="font-bold">Liabilities + Equity</TableCell><TableCell className="text-right font-bold">{fmt(totalLiabilities + totalEquity)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tb" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Trial Balance</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => exportToCSV({ title: "Trial Balance", filename: "trial-balance", columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Debit", key: "debit", format: "currency" }, { header: "Credit", key: "credit", format: "currency" }], data: trialBalanceData })}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button><Button variant="outline" size="sm" onClick={() => exportToPDF({ title: "Trial Balance", subtitle: `Debits: ${fmt(totalDebits)} | Credits: ${fmt(totalCredits)}`, filename: "trial-balance", columns: [{ header: "Code", key: "code" }, { header: "Account", key: "name" }, { header: "Type", key: "type" }, { header: "Debit", key: "debit", format: "currency" }, { header: "Credit", key: "credit", format: "currency" }], data: trialBalanceData })}><FileDown className="h-3 w-3 mr-1" />PDF</Button></div></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {trialBalanceData.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.code}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.type}</TableCell>
                      <TableCell className="text-right">{a.debit > 0 ? fmt(a.debit) : "—"}</TableCell>
                      <TableCell className="text-right">{a.credit > 0 ? fmt(a.credit) : "—"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="font-bold">Totals</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totalDebits)}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totalCredits)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
