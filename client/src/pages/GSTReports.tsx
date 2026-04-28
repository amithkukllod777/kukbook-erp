import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, IndianRupee, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";
import { useState, useMemo } from "react";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function GSTReports() {
  const { data, isLoading } = trpc.gst.summary.useQuery();
  const { data: inventoryData = [] } = trpc.inventory.list.useQuery();
  const hsnItems = inventoryData.filter((i: any) => i.hsnCode);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth()));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  // Filter invoices/bills by selected month
  const filteredInvoices = useMemo(() => {
    if (!data?.invoices) return [];
    return data.invoices.filter((inv: any) => {
      const d = new Date(inv.date);
      return d.getMonth() === Number(filterMonth) && d.getFullYear() === Number(filterYear);
    });
  }, [data?.invoices, filterMonth, filterYear]);

  const filteredBills = useMemo(() => {
    if (!data?.bills) return [];
    return data.bills.filter((b: any) => {
      const d = new Date(b.date);
      return d.getMonth() === Number(filterMonth) && d.getFullYear() === Number(filterYear);
    });
  }, [data?.bills, filterMonth, filterYear]);

  // Compute GST from actual CGST/SGST/IGST fields
  const salesCGST = filteredInvoices.reduce((s: number, inv: any) => s + Number(inv.cgst || 0), 0);
  const salesSGST = filteredInvoices.reduce((s: number, inv: any) => s + Number(inv.sgst || 0), 0);
  const salesIGST = filteredInvoices.reduce((s: number, inv: any) => s + Number(inv.igst || 0), 0);
  const salesTaxable = filteredInvoices.reduce((s: number, inv: any) => s + Number(inv.subtotal || 0), 0);
  const totalOutputGST = salesCGST + salesSGST + salesIGST;

  const purchaseCGST = filteredBills.reduce((s: number, b: any) => s + Number(b.cgst || 0), 0);
  const purchaseSGST = filteredBills.reduce((s: number, b: any) => s + Number(b.sgst || 0), 0);
  const purchaseIGST = filteredBills.reduce((s: number, b: any) => s + Number(b.igst || 0), 0);
  const purchaseTaxable = filteredBills.reduce((s: number, b: any) => s + Number(b.subtotal || 0), 0);
  const totalInputGST = purchaseCGST + purchaseSGST + purchaseIGST;

  const netCGST = salesCGST - purchaseCGST;
  const netSGST = salesSGST - purchaseSGST;
  const netIGST = salesIGST - purchaseIGST;
  const netGST = netCGST + netSGST + netIGST;

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">GST Reports</h1>
          <p className="text-muted-foreground">GSTR-1, GSTR-3B, and HSN Summary with CGST/SGST/IGST breakdown</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-green-600" /><p className="text-sm text-green-700 font-medium">Output GST (Sales)</p></div>
                <p className="text-2xl font-bold text-green-700">{fmt(totalOutputGST)}</p>
                <div className="text-xs text-green-600 mt-1 space-y-0.5">
                  <p>CGST: {fmt(salesCGST)} | SGST: {fmt(salesSGST)}</p>
                  <p>IGST: {fmt(salesIGST)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-blue-600" /><p className="text-sm text-blue-700 font-medium">Input GST (ITC)</p></div>
                <p className="text-2xl font-bold text-blue-700">{fmt(totalInputGST)}</p>
                <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                  <p>CGST: {fmt(purchaseCGST)} | SGST: {fmt(purchaseSGST)}</p>
                  <p>IGST: {fmt(purchaseIGST)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1"><ArrowRight className="h-4 w-4 text-orange-600" /><p className="text-sm text-orange-700 font-medium">Net GST Payable</p></div>
                <p className="text-2xl font-bold text-orange-700">{fmt(Math.max(0, netGST))}</p>
                {netGST < 0 && <p className="text-xs text-orange-600 mt-1">ITC Carry Forward: {fmt(Math.abs(netGST))}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground font-medium mb-1">Period</p>
                <p className="text-lg font-bold">{MONTHS[Number(filterMonth)]} {filterYear}</p>
                <p className="text-xs text-muted-foreground mt-1">{filteredInvoices.length} invoices, {filteredBills.length} bills</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="gstr1">
            <TabsList>
              <TabsTrigger value="gstr1">GSTR-1 (Sales)</TabsTrigger>
              <TabsTrigger value="gstr3b">GSTR-3B (Summary)</TabsTrigger>
              <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
            </TabsList>

            {/* GSTR-1: Outward Supplies */}
            <TabsContent value="gstr1" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />GSTR-1 — Outward Supplies</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => exportToPDF({ title: `GSTR-1 — ${MONTHS[Number(filterMonth)]} ${filterYear}`, columns: [{header:"Invoice",key:"inv"},{header:"Customer",key:"cust"},{header:"Date",key:"date"},{header:"Taxable Value",key:"taxable",format:"currency"},{header:"CGST",key:"cgst",format:"currency"},{header:"SGST",key:"sgst",format:"currency"},{header:"IGST",key:"igst",format:"currency"},{header:"Total",key:"total",format:"currency"}], data: filteredInvoices.map((inv: any) => ({inv:inv.invoiceId,cust:inv.customerName,date:inv.date,taxable:Number(inv.subtotal).toFixed(2),cgst:Number(inv.cgst).toFixed(2),sgst:Number(inv.sgst).toFixed(2),igst:Number(inv.igst).toFixed(2),total:Number(inv.total).toFixed(2)})), filename: "gstr1" })}><Download className="h-4 w-4 mr-1" />PDF</Button>
                    <Button size="sm" variant="outline" onClick={() => exportToCSV({ title: "GSTR-1", columns: [{header:"Invoice",key:"inv"},{header:"Customer",key:"cust"},{header:"Date",key:"date"},{header:"Taxable Value",key:"taxable"},{header:"CGST",key:"cgst"},{header:"SGST",key:"sgst"},{header:"IGST",key:"igst"},{header:"Total",key:"total"}], data: filteredInvoices.map((inv: any) => ({inv:inv.invoiceId,cust:inv.customerName,date:inv.date,taxable:Number(inv.subtotal).toFixed(2),cgst:Number(inv.cgst).toFixed(2),sgst:Number(inv.sgst).toFixed(2),igst:Number(inv.igst).toFixed(2),total:Number(inv.total).toFixed(2)})), filename: "gstr1" })}><Download className="h-4 w-4 mr-1" />Excel</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No invoices for this period</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Invoice</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium text-right">Taxable Value</th><th className="pb-3 font-medium text-right">CGST</th><th className="pb-3 font-medium text-right">SGST</th><th className="pb-3 font-medium text-right">IGST</th><th className="pb-3 font-medium text-right">Total</th></tr></thead>
                        <tbody>
                          {filteredInvoices.map((inv: any) => (
                            <tr key={inv.id} className="border-b">
                              <td className="py-3 font-mono text-sm">{inv.invoiceId}</td>
                              <td className="py-3">{inv.customerName}</td>
                              <td className="py-3">{inv.date}</td>
                              <td className="py-3 text-right tabular-nums">{fmt(Number(inv.subtotal))}</td>
                              <td className="py-3 text-right tabular-nums">{fmt(Number(inv.cgst))}</td>
                              <td className="py-3 text-right tabular-nums">{fmt(Number(inv.sgst))}</td>
                              <td className="py-3 text-right tabular-nums">{fmt(Number(inv.igst))}</td>
                              <td className="py-3 text-right font-medium tabular-nums">{fmt(Number(inv.total))}</td>
                            </tr>
                          ))}
                          <tr className="bg-muted/50 font-semibold">
                            <td className="py-3" colSpan={3}>Total</td>
                            <td className="py-3 text-right tabular-nums">{fmt(salesTaxable)}</td>
                            <td className="py-3 text-right tabular-nums">{fmt(salesCGST)}</td>
                            <td className="py-3 text-right tabular-nums">{fmt(salesSGST)}</td>
                            <td className="py-3 text-right tabular-nums">{fmt(salesIGST)}</td>
                            <td className="py-3 text-right tabular-nums">{fmt(filteredInvoices.reduce((s: number, i: any) => s + Number(i.total), 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* GSTR-3B: Monthly Summary */}
            <TabsContent value="gstr3b" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>GSTR-3B — Monthly Summary Return ({MONTHS[Number(filterMonth)]} {filterYear})</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">3.1 — Details of Outward Supplies and Inward Supplies liable to reverse charge</h3>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Nature of Supplies</th><th className="p-2 text-right">Taxable Value</th><th className="p-2 text-right">IGST</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST/UTGST</th><th className="p-2 text-right">Cess</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="p-2">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td><td className="p-2 text-right tabular-nums">{fmt(salesTaxable)}</td><td className="p-2 text-right tabular-nums">{fmt(salesIGST)}</td><td className="p-2 text-right tabular-nums">{fmt(salesCGST)}</td><td className="p-2 text-right tabular-nums">{fmt(salesSGST)}</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2">(b) Outward taxable supplies (zero rated)</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2">(c) Other outward supplies (nil rated, exempted)</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2">(d) Inward supplies (liable to reverse charge)</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2">(e) Non-GST outward supplies</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">4 — Eligible ITC</h3>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Details</th><th className="p-2 text-right">IGST</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST/UTGST</th><th className="p-2 text-right">Cess</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="p-2">(A) ITC Available (whether in full or part)</td><td className="p-2" colSpan={4}></td></tr>
                        <tr className="border-t"><td className="p-2 pl-6">(1) Import of goods</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2 pl-6">(2) Import of services</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2 pl-6">(3) Inward supplies liable to reverse charge</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2 pl-6">(4) Inward supplies from ISD</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t font-medium"><td className="p-2 pl-6">(5) All other ITC</td><td className="p-2 text-right tabular-nums">{fmt(purchaseIGST)}</td><td className="p-2 text-right tabular-nums">{fmt(purchaseCGST)}</td><td className="p-2 text-right tabular-nums">{fmt(purchaseSGST)}</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t bg-muted/50 font-semibold"><td className="p-2">(C) Net ITC Available</td><td className="p-2 text-right tabular-nums">{fmt(purchaseIGST)}</td><td className="p-2 text-right tabular-nums">{fmt(purchaseCGST)}</td><td className="p-2 text-right tabular-nums">{fmt(purchaseSGST)}</td><td className="p-2 text-right">—</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">6.1 — Payment of Tax</h3>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Description</th><th className="p-2 text-right">IGST</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST/UTGST</th><th className="p-2 text-right">Cess</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="p-2">Tax payable</td><td className="p-2 text-right tabular-nums">{fmt(salesIGST)}</td><td className="p-2 text-right tabular-nums">{fmt(salesCGST)}</td><td className="p-2 text-right tabular-nums">{fmt(salesSGST)}</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t"><td className="p-2">Paid through ITC</td><td className="p-2 text-right tabular-nums">{fmt(Math.min(salesIGST, purchaseIGST))}</td><td className="p-2 text-right tabular-nums">{fmt(Math.min(salesCGST, purchaseCGST))}</td><td className="p-2 text-right tabular-nums">{fmt(Math.min(salesSGST, purchaseSGST))}</td><td className="p-2 text-right">—</td></tr>
                        <tr className="border-t bg-orange-50 font-bold"><td className="p-2">Tax payable in cash</td><td className="p-2 text-right tabular-nums">{fmt(Math.max(0, netIGST))}</td><td className="p-2 text-right tabular-nums">{fmt(Math.max(0, netCGST))}</td><td className="p-2 text-right tabular-nums">{fmt(Math.max(0, netSGST))}</td><td className="p-2 text-right">—</td></tr>
                      </tbody>
                    </table>
                    <div className="mt-4 p-4 bg-orange-50/50 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-orange-800">Total Net GST Payable in Cash: <span className="text-lg">{fmt(Math.max(0, netGST))}</span></p>
                      {netGST < 0 && <p className="text-sm text-blue-600 mt-1">ITC Carry Forward to next period: {fmt(Math.abs(netGST))}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HSN Summary */}
            <TabsContent value="hsn" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>HSN Summary</CardTitle>
                  {hsnItems.length > 0 && <Button size="sm" variant="outline" onClick={() => exportToCSV({ title: "HSN Summary", columns: [{header:"HSN Code",key:"hsn"},{header:"Item",key:"name"},{header:"GST Rate",key:"gst"},{header:"Qty",key:"qty"},{header:"Taxable Value",key:"val"},{header:"GST Amount",key:"gstAmt"}], data: hsnItems.map((i: any) => {const val = Number(i.qty)*Number(i.cost); const gstR = Number(i.gstRate||18); return {hsn:i.hsnCode,name:i.name,gst:`${gstR}%`,qty:i.qty,val:val.toFixed(2),gstAmt:(val*gstR/100).toFixed(2)};}), filename: "hsn-summary" })}><Download className="h-4 w-4 mr-1" />Excel</Button>}
                </CardHeader>
                <CardContent>
                  {hsnItems.length === 0 ? (
                    <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                      <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Add HSN codes to inventory items</p>
                      <p className="text-sm">Go to Inventory and add HSN codes to see the summary here</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">HSN Code</th><th className="pb-3 font-medium">Item</th><th className="pb-3 font-medium text-right">GST Rate</th><th className="pb-3 font-medium text-right">Qty</th><th className="pb-3 font-medium text-right">Taxable Value</th><th className="pb-3 font-medium text-right">GST Amount</th></tr></thead>
                      <tbody>
                        {hsnItems.map((i: any) => {
                          const val = Number(i.qty) * Number(i.cost);
                          const gstR = Number(i.gstRate || 18);
                          return (
                            <tr key={i.id} className="border-b">
                              <td className="py-3 font-mono">{i.hsnCode}</td>
                              <td className="py-3">{i.name}</td>
                              <td className="py-3 text-right">{gstR}%</td>
                              <td className="py-3 text-right">{i.qty}</td>
                              <td className="py-3 text-right tabular-nums">{fmt(val)}</td>
                              <td className="py-3 text-right font-medium tabular-nums">{fmt(val * gstR / 100)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
