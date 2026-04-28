import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { FileDown, FileSpreadsheet, BookOpen } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

export default function GeneralLedger() {
  const { data: accounts = [], isLoading: loadingAccounts } = trpc.accounts.list.useQuery();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Only fetch ledger when an account is selected
  const { data: ledgerData, isLoading: loadingLedger } = trpc.accounts.generalLedger.useQuery(
    { accountId: selectedAccountId! },
    { enabled: !!selectedAccountId }
  );

  const ledgerAccounts = useMemo(() => (accounts as any[]).filter(a => !a.isGroup), [accounts]);

  const selectedAccount = useMemo(() => accounts.find((a: any) => a.id === selectedAccountId), [accounts, selectedAccountId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">General Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Account-wise transaction history with running balance</p>
        </div>
        {ledgerData?.entries && ledgerData.entries.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToCSV({
              title: `General Ledger - ${(selectedAccount as any)?.name}`,
              filename: `ledger-${(selectedAccount as any)?.code}`,
              columns: [
                { header: "Date", key: "date" },
                { header: "Entry ID", key: "entryId" },
                { header: "Description", key: "description" },
                { header: "Debit", key: "debit", format: "currency" },
                { header: "Credit", key: "credit", format: "currency" },
                { header: "Balance", key: "runningBalance", format: "currency" },
              ],
              data: ledgerData.entries,
            })}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToPDF({
              title: `General Ledger`,
              subtitle: `Account: ${(selectedAccount as any)?.code} — ${(selectedAccount as any)?.name}`,
              filename: `ledger-${(selectedAccount as any)?.code}`,
              columns: [
                { header: "Date", key: "date" },
                { header: "Entry ID", key: "entryId" },
                { header: "Description", key: "description" },
                { header: "Debit (₹)", key: "debit", format: "currency" },
                { header: "Credit (₹)", key: "credit", format: "currency" },
                { header: "Balance (₹)", key: "runningBalance", format: "currency" },
              ],
              data: ledgerData.entries,
            })}>
              <FileDown className="h-4 w-4 mr-1" />PDF
            </Button>
          </div>
        )}
      </div>

      {/* Account Selector */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Select value={selectedAccountId ? String(selectedAccountId) : ""} onValueChange={v => setSelectedAccountId(Number(v))}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select an account to view ledger..." />
                </SelectTrigger>
                <SelectContent>
                  {ledgerAccounts.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.code} — {a.name} ({a.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ledger Table */}
      {selectedAccountId && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">
                {(selectedAccount as any)?.code} — {(selectedAccount as any)?.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Type: {(selectedAccount as any)?.type} | Nature: {(selectedAccount as any)?.nature || "Debit"}
              </p>
            </div>
            {ledgerData && ledgerData.entries && ledgerData.entries.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Closing Balance</p>
                <p className={`text-xl font-bold tabular-nums ${(ledgerData.entries[ledgerData.entries.length - 1]?.balance ?? 0) < 0 ? "text-destructive" : "text-primary"}`}>
                  {fmt(ledgerData.entries[ledgerData.entries.length - 1]?.balance ?? 0)}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loadingLedger ? (
              <div className="text-center py-8 text-muted-foreground">Loading ledger...</div>
            ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions found for this account.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Entry ID</th>
                      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Description</th>
                      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Source</th>
                      <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Debit (₹)</th>
                      <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Credit (₹)</th>
                      <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Row */}
                    <tr className="border-b bg-blue-50/50">
                      <td className="py-2.5 px-4 font-medium" colSpan={4}>Opening Balance</td>
                      <td className="py-2.5 px-4 text-right" colSpan={2}></td>
                      <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                        {fmt(Number((ledgerData as any).account?.openingBalance) || 0)}
                      </td>
                    </tr>
                    {ledgerData.entries.map((entry: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4">{entry.date}</td>
                        <td className="py-2.5 px-4 font-mono text-xs">{entry.entryId}</td>
                        <td className="py-2.5 px-4">{entry.description}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={entry.sourceType === 'manual' ? 'secondary' : 'outline'} className="text-xs">
                            {entry.sourceType || 'manual'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {Number(entry.debit) > 0 ? fmt(Number(entry.debit)) : ""}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {Number(entry.credit) > 0 ? fmt(Number(entry.credit)) : ""}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-medium tabular-nums ${(entry.balance ?? entry.runningBalance ?? 0) < 0 ? "text-destructive" : ""}`}>
                          {fmt(entry.balance ?? entry.runningBalance ?? 0)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="border-t-2 bg-muted/50 font-bold">
                      <td className="py-3 px-4" colSpan={4}>Closing Balance</td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {fmt(ledgerData.entries.reduce((s: number, e: any) => s + Number(e.debit), 0))}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {fmt(ledgerData.entries.reduce((s: number, e: any) => s + Number(e.credit), 0))}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold tabular-nums ${(ledgerData.entries[ledgerData.entries.length - 1]?.balance ?? 0) < 0 ? "text-destructive" : ""}`}>
                        {fmt(ledgerData.entries[ledgerData.entries.length - 1]?.balance ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAccountId && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select an Account</h3>
            <p className="text-muted-foreground">Choose a ledger account from the dropdown above to view its transaction history and running balance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
