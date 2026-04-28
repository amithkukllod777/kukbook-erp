import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, Clock, Package, Download, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { exportToPDF, exportToCSV } from "@/lib/export";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function DayBookTab() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { data, isLoading } = trpc.advancedReports.dayBook.useQuery({ date });

  const entries = useMemo(() => {
    if (!data) return [];
    const all: { type: string; ref: string; party: string; amount: number; direction: string }[] = [];
    data.invoices?.forEach((i: any) => all.push({ type: "Invoice", ref: i.invoiceId, party: i.customerName, amount: Number(i.total), direction: "in" }));
    data.bills?.forEach((b: any) => all.push({ type: "Bill", ref: b.billId, party: b.vendorName, amount: Number(b.amount), direction: "out" }));
    data.paymentsIn?.forEach((p: any) => all.push({ type: "Payment In", ref: p.paymentId, party: p.customerName, amount: Number(p.amount), direction: "in" }));
    data.paymentsOut?.forEach((p: any) => all.push({ type: "Payment Out", ref: p.paymentId, party: p.vendorName, amount: Number(p.amount), direction: "out" }));
    data.expenses?.forEach((e: any) => all.push({ type: "Expense", ref: e.expenseId, party: e.category, amount: Number(e.amount), direction: "out" }));
    data.otherIncome?.forEach((o: any) => all.push({ type: "Other Income", ref: o.incomeId, party: o.category, amount: Number(o.amount), direction: "in" }));
    return all;
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Day Book</CardTitle>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" />
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions on {date}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Reference</th><th className="pb-3 font-medium">Party</th><th className="pb-3 font-medium text-right">Debit</th><th className="pb-3 font-medium text-right">Credit</th></tr></thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3"><Badge variant={e.direction === "in" ? "default" : "secondary"}>{e.type}</Badge></td>
                    <td className="py-3 font-medium">{e.ref}</td>
                    <td className="py-3">{e.party}</td>
                    <td className="py-3 text-right">{e.direction === "out" ? fmt(e.amount) : ""}</td>
                    <td className="py-3 text-right">{e.direction === "in" ? fmt(e.amount) : ""}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-muted/50">
                  <td className="py-3" colSpan={3}>Total</td>
                  <td className="py-3 text-right">{fmt(entries.filter(e => e.direction === "out").reduce((s, e) => s + e.amount, 0))}</td>
                  <td className="py-3 text-right">{fmt(entries.filter(e => e.direction === "in").reduce((s, e) => s + e.amount, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CashflowTab() {
  const { data, isLoading } = trpc.advancedReports.cashflow.useQuery();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Cash Flow Statement</CardTitle>
        {data && <Button size="sm" variant="outline" onClick={() => exportToPDF({ title: "Cash Flow Statement", columns: [{header:"Category",key:"cat"},{header:"Amount",key:"amt",format:"currency"}], data: [{cat:"Total Inflows",amt:data.inflows},{cat:"Total Outflows",amt:data.outflows},{cat:"Net Cash Flow",amt:data.net}], filename: "cashflow" })}><Download className="h-4 w-4 mr-1" />PDF</Button>}
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : !data ? <p>No data</p> : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200"><p className="text-sm text-green-600">Total Inflows</p><p className="text-2xl font-bold text-green-700">{fmt(data.inflows)}</p></div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-600">Total Outflows</p><p className="text-2xl font-bold text-red-700">{fmt(data.outflows)}</p></div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200"><p className="text-sm text-blue-600">Net Cash Flow</p><p className="text-2xl font-bold text-blue-700">{fmt(data.net)}</p></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgingTab() {
  const { data = [], isLoading } = trpc.advancedReports.aging.useQuery();
  const buckets = useMemo(() => {
    const b: Record<string, { count: number; total: number }> = { "0-30": { count: 0, total: 0 }, "31-60": { count: 0, total: 0 }, "61-90": { count: 0, total: 0 }, "90+": { count: 0, total: 0 } };
    data.forEach((inv: any) => { if (b[inv.bucket]) { b[inv.bucket].count++; b[inv.bucket].total += Number(inv.total); } });
    return b;
  }, [data]);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Accounts Receivable Aging</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(buckets).map(([bucket, val]) => (
                <div key={bucket} className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{bucket} Days</p>
                  <p className="text-xl font-bold">{fmt(val.total)}</p>
                  <p className="text-xs text-muted-foreground">{val.count} invoices</p>
                </div>
              ))}
            </div>
            {data.length > 0 && (
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Invoice</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Due Date</th><th className="pb-3 font-medium">Days Overdue</th><th className="pb-3 font-medium">Bucket</th><th className="pb-3 font-medium text-right">Amount</th></tr></thead>
                <tbody>{data.map((inv: any) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-3 font-medium">{inv.invoiceId}</td>
                    <td className="py-3">{inv.customerName}</td>
                    <td className="py-3">{inv.dueDate}</td>
                    <td className="py-3"><Badge variant="destructive">{inv.daysOverdue}d</Badge></td>
                    <td className="py-3">{inv.bucket}</td>
                    <td className="py-3 text-right font-medium">{fmt(Number(inv.total))}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StockSummaryTab() {
  const { data = [], isLoading } = trpc.advancedReports.stockSummary.useQuery();
  const totalValue = useMemo(() => data.reduce((s: number, i: any) => s + Number(i.qty) * Number(i.cost), 0), [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Stock Summary</CardTitle>
        {data.length > 0 && <Button size="sm" variant="outline" onClick={() => exportToCSV({ title: "Stock Summary", columns: [{header:"SKU",key:"sku"},{header:"Item",key:"name"},{header:"Category",key:"cat"},{header:"Qty",key:"qty",format:"number"},{header:"Cost",key:"cost",format:"currency"},{header:"Value",key:"val",format:"currency"}], data: data.map((i: any) => ({sku:i.sku,name:i.name,cat:i.category||"-",qty:i.qty,cost:Number(i.cost),val:Number(i.qty)*Number(i.cost)})), filename: "stock-summary" })}><Download className="h-4 w-4 mr-1" />Excel</Button>}
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted"><p className="text-sm text-muted-foreground">Total Stock Value</p><p className="text-2xl font-bold">{fmt(totalValue)}</p><p className="text-sm text-muted-foreground">{data.length} items in stock</p></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">SKU</th><th className="pb-3 font-medium">Item</th><th className="pb-3 font-medium">Category</th><th className="pb-3 font-medium text-right">Qty</th><th className="pb-3 font-medium text-right">Cost</th><th className="pb-3 font-medium text-right">Value</th><th className="pb-3 font-medium">Status</th></tr></thead>
              <tbody>{data.map((i: any) => (
                <tr key={i.id} className="border-b">
                  <td className="py-3 font-mono text-xs">{i.sku}</td>
                  <td className="py-3 font-medium">{i.name}</td>
                  <td className="py-3">{i.category || "-"}</td>
                  <td className="py-3 text-right">{i.qty}</td>
                  <td className="py-3 text-right">{fmt(Number(i.cost))}</td>
                  <td className="py-3 text-right font-medium">{fmt(Number(i.qty) * Number(i.cost))}</td>
                  <td className="py-3">{i.qty <= i.reorder ? <Badge variant="destructive">Low Stock</Badge> : <Badge className="bg-green-100 text-green-800">OK</Badge>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PartyStatementTab() {
  const [partyType, setPartyType] = useState<'customer' | 'vendor'>('customer');
  const [partyId, setPartyId] = useState<number | null>(null);
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const { data, isLoading } = trpc.advancedReports.partyStatement.useQuery(
    { partyType, partyId: partyId! },
    { enabled: partyId !== null }
  );
  const parties = partyType === 'customer' ? customers : vendors;
  let runningBalance = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Party Statement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Select value={partyType} onValueChange={(v: 'customer' | 'vendor') => { setPartyType(v); setPartyId(null); }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={partyId?.toString() || ''} onValueChange={v => setPartyId(Number(v))}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select party..." /></SelectTrigger>
            <SelectContent>
              {parties.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {data && data.transactions.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => exportToPDF({
              title: `Party Statement - ${data.party?.name || ''}`,
              columns: [{header:'Date',key:'date'},{header:'Type',key:'type'},{header:'Ref',key:'ref'},{header:'Debit',key:'debit',format:'currency'},{header:'Credit',key:'credit',format:'currency'},{header:'Balance',key:'balance',format:'currency'}],
              data: (() => { let bal = 0; return data.transactions.map(t => { bal += t.debit - t.credit; return { ...t, balance: bal }; }); })(),
              filename: `party-statement-${data.party?.name || 'unknown'}`
            })}><Download className="h-4 w-4 mr-1" />PDF</Button>
          )}
        </div>
        {!partyId ? <p className="text-muted-foreground text-center py-8">Select a party to view their statement</p>
        : isLoading ? <p className="text-muted-foreground">Loading...</p>
        : !data || data.transactions.length === 0 ? <p className="text-muted-foreground text-center py-8">No transactions found</p>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Reference</th><th className="pb-3 font-medium text-right">Debit</th><th className="pb-3 font-medium text-right">Credit</th><th className="pb-3 font-medium text-right">Balance</th></tr></thead>
              <tbody>
                {data.transactions.map((t: any, i: number) => {
                  runningBalance += t.debit - t.credit;
                  return (
                    <tr key={i} className="border-b">
                      <td className="py-3">{t.date}</td>
                      <td className="py-3"><Badge variant="outline">{t.type}</Badge></td>
                      <td className="py-3 font-medium">{t.ref}</td>
                      <td className="py-3 text-right">{t.debit ? fmt(t.debit) : ''}</td>
                      <td className="py-3 text-right">{t.credit ? fmt(t.credit) : ''}</td>
                      <td className="py-3 text-right font-medium">{fmt(runningBalance)}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-muted/50">
                  <td className="py-3" colSpan={3}>Closing Balance</td>
                  <td className="py-3 text-right">{fmt(data.transactions.reduce((s: number, t: any) => s + t.debit, 0))}</td>
                  <td className="py-3 text-right">{fmt(data.transactions.reduce((s: number, t: any) => s + t.credit, 0))}</td>
                  <td className="py-3 text-right">{fmt(runningBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdvancedReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Advanced Reports</h1>
        <p className="text-muted-foreground">Day Book, Cash Flow, Aging, Stock Summary, and Party Statement reports</p>
      </div>
      <Tabs defaultValue="daybook">
        <TabsList>
          <TabsTrigger value="daybook">Day Book</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="aging">AR Aging</TabsTrigger>
          <TabsTrigger value="stock">Stock Summary</TabsTrigger>
          <TabsTrigger value="party">Party Statement</TabsTrigger>
        </TabsList>
        <TabsContent value="daybook"><DayBookTab /></TabsContent>
        <TabsContent value="cashflow"><CashflowTab /></TabsContent>
        <TabsContent value="aging"><AgingTab /></TabsContent>
        <TabsContent value="stock"><StockSummaryTab /></TabsContent>
        <TabsContent value="party"><PartyStatementTab /></TabsContent>
      </Tabs>
    </div>
  );
}
