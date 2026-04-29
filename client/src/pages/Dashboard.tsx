import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Landmark, Receipt, ShoppingCart, Package, AlertTriangle, Crown, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

const COLORS = ["oklch(0.588 0.200 260)", "oklch(0.600 0.200 145)", "oklch(0.650 0.180 50)", "oklch(0.550 0.200 310)", "oklch(0.600 0.200 25)", "oklch(0.500 0.150 200)"];

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = trpc.dashboard.getData.useQuery();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: t("dashboard.revenue"), value: fmt(data.totalRevenue), icon: IndianRupee, color: "text-emerald-600" },
    { label: t("dashboard.netIncome"), value: fmt(data.netIncome), icon: TrendingUp, color: "text-blue-600" },
    { label: t("dashboard.totalAssets"), value: fmt(data.totalAssets), icon: Landmark, color: "text-violet-600" },
    { label: t("dashboard.arOutstanding"), value: fmt(data.arOutstanding), icon: Receipt, color: "text-amber-600" },
    { label: t("dashboard.apOutstanding"), value: fmt(data.apOutstanding), icon: ShoppingCart, color: "text-rose-600" },
    { label: t("dashboard.inventoryValue"), value: fmt(data.inventoryValue), icon: Package, color: "text-cyan-600" },
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
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
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
            <CardTitle className="text-base font-semibold">{t("dashboard.revenueVsExpenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueExpenseData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
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
            <CardTitle className="text-base font-semibold">{t("dashboard.expenseBreakdown")}</CardTitle>
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
              {t("dashboard.lowStockAlert")}
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
            <CardTitle className="text-base font-semibold">{t("dashboard.upcomingBills")}</CardTitle>
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

      {/* Top Customers & Products Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopCustomersWidget />
        <TopProductsWidget />
      </div>

      {/* Overdue Invoices Alert */}
      <OverdueInvoicesWidget />
    </div>
  );
}

function TopCustomersWidget() {
  const { t } = useTranslation();
  const { data: customers = [] } = trpc.topRanking.customers.useQuery({ limit: 5 });
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          {t("dashboard.topCustomers")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No customer data yet.</p>
        ) : (
          <div className="space-y-3">
            {customers.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{c.customerName}</p>
                    <p className="text-xs text-muted-foreground">{c.invoiceCount} invoices</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{fmt(Number(c.totalRevenue || 0))}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopProductsWidget() {
  const { t } = useTranslation();
  const { data: products = [] } = trpc.topRanking.products.useQuery({ limit: 5 });
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-indigo-500" />
          {t("dashboard.topProducts")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No product data yet.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-indigo-100 text-indigo-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.totalQty} units sold</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{fmt(Number(p.totalRevenue || 0))}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverdueInvoicesWidget() {
  const { t } = useTranslation();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const overdue = invoices.filter((inv: any) => inv.status === 'Overdue' || (inv.status !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < new Date()));
  if (overdue.length === 0) return null;
  return (
    <Card className="shadow-sm border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          {t("dashboard.overdueInvoices")} ({overdue.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {overdue.slice(0, 5).map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between py-2 border-b border-amber-200 dark:border-amber-800 last:border-0">
              <div>
                <p className="text-sm font-medium">{inv.customerName}</p>
                <p className="text-xs text-muted-foreground">{inv.invoiceId} — Due: {inv.dueDate}</p>
              </div>
              <Badge variant="destructive">{fmt(Number(inv.total || 0))}</Badge>
            </div>
          ))}
          {overdue.length > 5 && <p className="text-xs text-muted-foreground text-center">+{overdue.length - 5} more overdue invoices</p>}
        </div>
      </CardContent>
    </Card>
  );
}
