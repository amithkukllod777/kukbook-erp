import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Landmark, Receipt, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

const COLORS = ["oklch(0.588 0.200 260)", "oklch(0.600 0.200 145)", "oklch(0.650 0.180 50)", "oklch(0.550 0.200 310)", "oklch(0.600 0.200 25)", "oklch(0.500 0.150 200)"];

export default function Dashboard() {
  const { data, isLoading } = trpc.dashboard.getData.useQuery();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Revenue", value: fmt(data.totalRevenue), icon: DollarSign, color: "text-emerald-600" },
    { label: "Net Income", value: fmt(data.netIncome), icon: TrendingUp, color: "text-blue-600" },
    { label: "Total Assets", value: fmt(data.totalAssets), icon: Landmark, color: "text-violet-600" },
    { label: "AR Outstanding", value: fmt(data.arOutstanding), icon: Receipt, color: "text-amber-600" },
    { label: "AP Outstanding", value: fmt(data.apOutstanding), icon: ShoppingCart, color: "text-rose-600" },
    { label: "Inventory Value", value: fmt(data.inventoryValue), icon: Package, color: "text-cyan-600" },
  ];

  const revenueExpenseData = [
    { name: "Revenue", amount: data.totalRevenue },
    { name: "Expenses", amount: data.totalExpenses },
    { name: "Net Income", amount: data.netIncome },
  ];

  const expenseBreakdown = [
    { name: "COGS", value: 72000 },
    { name: "Salaries", value: 48000 },
    { name: "Rent", value: 18000 },
    { name: "Marketing", value: 8500 },
    { name: "Depreciation", value: 6000 },
    { name: "Other", value: 8000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Business overview and key performance indicators</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold mt-2">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueExpenseData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  <Cell fill="oklch(0.600 0.200 145)" />
                  <Cell fill="oklch(0.577 0.245 27)" />
                  <Cell fill="oklch(0.588 0.200 260)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">All items are well-stocked.</p>
            ) : (
              <div className="space-y-3">
                {data.lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.qty <= item.reorder / 2 ? "destructive" : "secondary"}>
                        {item.qty} in stock
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Reorder at {item.reorder}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Upcoming Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending bills.</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingBills.map((bill: any) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{bill.vendorName}</p>
                      <p className="text-xs text-muted-foreground">Due: {bill.dueDate}</p>
                    </div>
                    <p className="text-sm font-semibold">{fmt(Number(bill.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
