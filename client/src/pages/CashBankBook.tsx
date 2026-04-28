import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileSpreadsheet, Wallet, Building2 } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

function BookTable({ entries, accountName, openingBalance }: {
  entries: any[]; accountName: string; openingBalance: number;
}) {
  const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : openingBalance;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Date</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Entry ID</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Description</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Source</th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Receipt (Dr) ₹</th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Payment (Cr) ₹</th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Balance ₹</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b bg-blue-50/50">
            <td className="py-2.5 px-4 font-medium" colSpan={4}>Opening Balance</td>
            <td className="py-2.5 px-4 text-right" colSpan={2}></td>
            <td className="py-2.5 px-4 text-right font-bold tabular-nums">{fmt(openingBalance)}</td>
          </tr>
          {entries.length === 0 ? (
            <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No transactions found for {accountName}</td></tr>
          ) : entries.map((entry: any, i: number) => (
            <tr key={i} className="border-b hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-4">{entry.date}</td>
              <td className="py-2.5 px-4 font-mono text-xs">{entry.entryId}</td>
              <td className="py-2.5 px-4 font-medium">{entry.description}</td>
              <td className="py-2.5 px-4">
                <Badge variant="outline" className="text-xs">{entry.sourceType || "manual"}</Badge>
              </td>
              <td className="py-2.5 px-4 text-right tabular-nums text-emerald-600">
                {Number(entry.debit) > 0 ? fmt(Number(entry.debit)) : ""}
              </td>
              <td className="py-2.5 px-4 text-right tabular-nums text-red-600">
                {Number(entry.credit) > 0 ? fmt(Number(entry.credit)) : ""}
              </td>
              <td className={`py-2.5 px-4 text-right font-medium tabular-nums ${entry.balance < 0 ? "text-destructive" : ""}`}>
                {fmt(entry.balance)}
              </td>
            </tr>
          ))}
          {entries.length > 0 && (
            <tr className="border-t-2 bg-muted/50 font-bold">
              <td className="py-3 px-4" colSpan={4}>Closing Balance</td>
              <td className="py-3 px-4 text-right tabular-nums">{fmt(totalDebit)}</td>
              <td className="py-3 px-4 text-right tabular-nums">{fmt(totalCredit)}</td>
              <td className="py-3 px-4 text-right font-bold tabular-nums">{fmt(closingBalance)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CashBankBook() {
  const { data: accountsList = [] } = trpc.accounts.list.useQuery();
  
  // Find Cash and Bank accounts
  const cashAccount = useMemo(() => accountsList.find((a: any) => a.name === "Cash" && !a.isGroup), [accountsList]);
  const bankAccount = useMemo(() => accountsList.find((a: any) => a.name === "Bank Accounts" && !a.isGroup), [accountsList]);

  const { data: cashLedger, isLoading: cashLoading } = trpc.accounts.generalLedger.useQuery(
    { accountId: cashAccount?.id || 0 },
    { enabled: !!cashAccount?.id }
  );
  const { data: bankLedger, isLoading: bankLoading } = trpc.accounts.generalLedger.useQuery(
    { accountId: bankAccount?.id || 0 },
    { enabled: !!bankAccount?.id }
  );

  const cashEntries = (cashLedger as any)?.entries || [];
  const bankEntries = (bankLedger as any)?.entries || [];
  const cashOpening = Number((cashLedger as any)?.account?.openingBalance) || 0;
  const bankOpening = Number((bankLedger as any)?.account?.openingBalance) || 0;
  const cashClosing = cashEntries.length > 0 ? cashEntries[cashEntries.length - 1]?.balance || 0 : cashOpening;
  const bankClosing = bankEntries.length > 0 ? bankEntries[bankEntries.length - 1]?.balance || 0 : bankOpening;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cash & Bank Book</h1>
        <p className="text-sm text-muted-foreground mt-1">Journal-driven cash and bank transaction register</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cash Balance</p>
                <p className={`text-xl font-bold tabular-nums ${cashClosing < 0 ? "text-destructive" : ""}`}>
                  {fmt(cashClosing)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bank Balance</p>
                <p className={`text-xl font-bold tabular-nums ${bankClosing < 0 ? "text-destructive" : ""}`}>
                  {fmt(bankClosing)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!cashAccount && !bankAccount && (
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No Cash or Bank accounts found. Please seed the default Chart of Accounts first from the Accounts page.</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="cash" className="relative">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="cash">Cash Book</TabsTrigger>
          <TabsTrigger value="bank">Bank Book</TabsTrigger>
        </TabsList>

        <TabsContent value="cash" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Cash Book
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cashLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading cash book...</div>
              ) : (
                <BookTable entries={cashEntries} accountName="Cash" openingBalance={cashOpening} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Bank Book
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bankLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading bank book...</div>
              ) : (
                <BookTable entries={bankEntries} accountName="Bank" openingBalance={bankOpening} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
