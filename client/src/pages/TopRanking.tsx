import { trpc } from "@/lib/trpc";
import { TrendingUp, Users, Package } from "lucide-react";

export default function TopRanking() {
  const { data: topCustomers = [], isLoading: loadingC } = trpc.topRanking.customers.useQuery();
  const { data: topProducts = [], isLoading: loadingP } = trpc.topRanking.products.useQuery();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Top Rankings</h1>
        <p className="text-muted-foreground text-sm">Top customers and products by revenue</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <h2 className="font-semibold">Top 10 Customers</h2>
          </div>
          {loadingC ? <p className="p-4 text-muted-foreground">Loading...</p> : topCustomers.length === 0 ? <p className="p-4 text-muted-foreground">No data yet. Create invoices to see rankings.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/20"><tr><th className="p-3 text-left">#</th><th className="p-3 text-left">Customer</th><th className="p-3 text-right">Revenue (₹)</th><th className="p-3 text-right">Invoices</th></tr></thead>
              <tbody>
                {topCustomers.map((c: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-medium">{c.customerName}</td>
                    <td className="p-3 text-right font-mono">₹{Number(c.totalRevenue).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right">{c.invoiceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Products */}
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
            <Package className="w-4 h-4" />
            <h2 className="font-semibold">Top 10 Products</h2>
          </div>
          {loadingP ? <p className="p-4 text-muted-foreground">Loading...</p> : topProducts.length === 0 ? <p className="p-4 text-muted-foreground">No data yet. Create invoices with line items to see rankings.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/20"><tr><th className="p-3 text-left">#</th><th className="p-3 text-left">Product</th><th className="p-3 text-right">Revenue (₹)</th><th className="p-3 text-right">Qty Sold</th></tr></thead>
              <tbody>
                {topProducts.map((p: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-medium">{p.productName}</td>
                    <td className="p-3 text-right font-mono">₹{Number(p.totalRevenue).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right">{p.totalQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
