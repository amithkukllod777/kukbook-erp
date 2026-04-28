import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/journal" component={JournalEntries} />
          <Route path="/customers" component={Customers} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/bills" component={Bills} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/purchase-orders" component={PurchaseOrders} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/supply-chain" component={SupplyChain} />
          <Route path="/employees" component={Employees} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/delivery-staff" component={DeliveryStaff} />
          <Route path="/deliveries" component={Deliveries} />
          <Route path="/reports" component={Reports} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
