import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, IndianRupee } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/export";

export default function GSTReports() {
  const { data, isLoading } = trpc.gst.summary.useQuery();

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GST Reports</h1>
        <p className="text-muted-foreground">GST summary, GSTR-1, and GSTR-3B reports</p>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : !data ? <p>No data</p> : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Output GST (Sales)</p><p className="text-2xl font-bold text-green-600">{fmt(data.salesGST)}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Input GST (Purchases)</p><p className="text-2xl font-bold text-blue-600">{fmt(data.purchaseGST)}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Expense GST</p><p className="text-2xl font-bold text-orange-600">{fmt(data.expenseGST)}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Net GST Payable</p><p className="text-2xl font-bold">{fmt(data.netGST)}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="gstr1">
            <TabsList>
              <TabsTrigger value="gstr1">GSTR-1 (Sales)</TabsTrigger>
              <TabsTrigger value="gstr3b">GSTR-3B (Summary)</TabsTrigger>
              <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="gstr1" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />GSTR-1 — Outward Supplies</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => exportToPDF({ title: "GSTR-1 Report", columns: [{header:"Invoice",key:"inv"},{header:"Customer",key:"cust"},{header:"Date",key:"date"},{header:"Taxable Value",key:"tax",format:"currency"},{header:"GST @18%",key:"gst",format:"currency"},{header:"Total",key:"total",format:"currency"}], data: data.invoices.map((inv: any) => ({inv:inv.invoiceId,cust:inv.customerName,date:inv.date,tax:Number(inv.total),gst:Number(inv.total)*0.18,total:Number(inv.total)*1.18})), filename: "gstr1" })}><Download className="h-4 w-4 mr-1" />PDF</Button>
                    <Button size="sm" variant="outline" onClick={() => exportToCSV({ title: "GSTR-1", columns: [{header:"Invoice",key:"inv"},{header:"Customer",key:"cust"},{header:"Date",key:"date"},{header:"Taxable Value",key:"tax"},{header:"GST @18%",key:"gst"},{header:"Total",key:"total"}], data: data.invoices.map((inv: any) => ({inv:inv.invoiceId,cust:inv.customerName,date:inv.date,tax:Number(inv.total).toFixed(2),gst:(Number(inv.total)*0.18).toFixed(2),total:(Number(inv.total)*1.18).toFixed(2)})), filename: "gstr1" })}><Download className="h-4 w-4 mr-1" />Excel</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Invoice</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium text-right">Taxable Value</th><th className="pb-3 font-medium text-right">GST @18%</th><th className="pb-3 font-medium text-right">Total</th></tr></thead>
                      <tbody>{data.invoices.map((inv: any) => (
                        <tr key={inv.id} className="border-b">
                          <td className="py-3 font-medium">{inv.invoiceId}</td>
                          <td className="py-3">{inv.customerName}</td>
                          <td className="py-3">{inv.date}</td>
                          <td className="py-3 text-right">{fmt(Number(inv.total))}</td>
                          <td className="py-3 text-right">{fmt(Number(inv.total) * 0.18)}</td>
                          <td className="py-3 text-right font-medium">{fmt(Number(inv.total) * 1.18)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gstr3b" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>GSTR-3B — Monthly Summary Return</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">3.1 — Details of Outward Supplies</h3>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Nature of Supplies</th><th className="p-2 text-right">Taxable Value</th><th className="p-2 text-right">IGST</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="p-2">(a) Outward taxable supplies</td><td className="p-2 text-right">{fmt(data.invoices.reduce((s: number, i: any) => s + Number(i.total), 0))}</td><td className="p-2 text-right">{fmt(data.salesGST)}</td><td className="p-2 text-right">{fmt(data.salesGST / 2)}</td><td className="p-2 text-right">{fmt(data.salesGST / 2)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">4 — Eligible ITC</h3>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Details</th><th className="p-2 text-right">IGST</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="p-2">ITC Available (Imports + Inward)</td><td className="p-2 text-right">{fmt(data.purchaseGST)}</td><td className="p-2 text-right">{fmt(data.purchaseGST / 2)}</td><td className="p-2 text-right">{fmt(data.purchaseGST / 2)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">6.1 — Payment of Tax</h3>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Description</th><th className="p-2 text-right">Amount</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="p-2 font-medium">Net GST Payable</td><td className="p-2 text-right font-bold">{fmt(data.netGST)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hsn" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>HSN Summary</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">HSN/SAC code-wise summary of supplies. Configure HSN codes in inventory items to see detailed breakdown.</p>
                  <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Add HSN codes to inventory items</p>
                    <p className="text-sm">HSN summary will auto-populate from invoice line items</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
