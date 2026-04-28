import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Accounts = lazy(() => import("./pages/Accounts"));
const JournalEntries = lazy(() => import("./pages/JournalEntries"));
const Customers = lazy(() => import("./pages/Customers"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Vendors = lazy(() => import("./pages/Vendors"));
const Bills = lazy(() => import("./pages/Bills"));
const Inventory = lazy(() => import("./pages/Inventory"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const Warehouses = lazy(() => import("./pages/Warehouses"));
const SupplyChain = lazy(() => import("./pages/SupplyChain"));
const Employees = lazy(() => import("./pages/Employees"));
const Payroll = lazy(() => import("./pages/Payroll"));
const DeliveryStaff = lazy(() => import("./pages/DeliveryStaff"));
const Deliveries = lazy(() => import("./pages/Deliveries"));
const Reports = lazy(() => import("./pages/Reports"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
// New modules
const SaleReturns = lazy(() => import("./pages/SaleReturns"));
const PurchaseReturns = lazy(() => import("./pages/PurchaseReturns"));
const Estimates = lazy(() => import("./pages/Estimates"));
const PaymentsIn = lazy(() => import("./pages/PaymentsIn"));
const PaymentsOut = lazy(() => import("./pages/PaymentsOut"));
const CashBank = lazy(() => import("./pages/CashBank"));
const Expenses = lazy(() => import("./pages/Expenses"));
const OtherIncome = lazy(() => import("./pages/OtherIncome"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AuthenticatedRouter() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/journal" component={JournalEntries} />
          <Route path="/customers" component={Customers} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/sale-returns" component={SaleReturns} />
          <Route path="/estimates" component={Estimates} />
          <Route path="/payments-in" component={PaymentsIn} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/bills" component={Bills} />
          <Route path="/purchase-returns" component={PurchaseReturns} />
          <Route path="/purchase-orders" component={PurchaseOrders} />
          <Route path="/payments-out" component={PaymentsOut} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/supply-chain" component={SupplyChain} />
          <Route path="/employees" component={Employees} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/delivery-staff" component={DeliveryStaff} />
          <Route path="/deliveries" component={Deliveries} />
          <Route path="/reports" component={Reports} />
          <Route path="/cash-bank" component={CashBank} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/other-income" component={OtherIncome} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    );
  }

  // Authenticated — show ERP dashboard
  return <AuthenticatedRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
