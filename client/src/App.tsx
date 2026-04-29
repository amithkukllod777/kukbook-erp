import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CompanyProvider, useCompany } from "./contexts/CompanyContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Accounts = lazy(() => import("./pages/Accounts"));
const JournalEntries = lazy(() => import("./pages/JournalEntries"));
const GeneralLedger = lazy(() => import("./pages/GeneralLedger"));
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
const SaleReturns = lazy(() => import("./pages/SaleReturns"));
const PurchaseReturns = lazy(() => import("./pages/PurchaseReturns"));
const Estimates = lazy(() => import("./pages/Estimates"));
const PaymentsIn = lazy(() => import("./pages/PaymentsIn"));
const PaymentsOut = lazy(() => import("./pages/PaymentsOut"));
const CashBank = lazy(() => import("./pages/CashBank"));
const CashBankBook = lazy(() => import("./pages/CashBankBook"));
const Expenses = lazy(() => import("./pages/Expenses"));
const OtherIncome = lazy(() => import("./pages/OtherIncome"));
const DeliveryChallans = lazy(() => import("./pages/DeliveryChallans"));
const GSTReports = lazy(() => import("./pages/GSTReports"));
const PartyGroups = lazy(() => import("./pages/PartyGroups"));
const AdvancedReports = lazy(() => import("./pages/AdvancedReports"));
const ImportExport = lazy(() => import("./pages/ImportExport"));
const EWayBill = lazy(() => import("./pages/EWayBill"));
const InvoiceThemes = lazy(() => import("./pages/InvoiceThemes"));
const Barcode = lazy(() => import("./pages/Barcode"));
const RecurringInvoices = lazy(() => import("./pages/RecurringInvoices"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const BankReconciliation = lazy(() => import("./pages/BankReconciliation"));
const PaymentReminders = lazy(() => import("./pages/PaymentReminders"));
const Messaging = lazy(() => import("./pages/Messaging"));
const MultiFirm = lazy(() => import("./pages/MultiFirm"));
const Subscription = lazy(() => import("./pages/Subscription"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const InviteMembers = lazy(() => import("./pages/InviteMembers"));
const Verification = lazy(() => import("./pages/Verification"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/** Routes rendered inside DashboardLayout — all paths are relative to /app/:slug base */
function CompanyRoutes() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/journal" component={JournalEntries} />
          <Route path="/general-ledger" component={GeneralLedger} />
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
          <Route path="/advanced-reports" component={AdvancedReports} />
          <Route path="/gst-reports" component={GSTReports} />
          <Route path="/delivery-challans" component={DeliveryChallans} />
          <Route path="/party-groups" component={PartyGroups} />
          <Route path="/import-export" component={ImportExport} />
          <Route path="/cash-bank" component={CashBank} />
          <Route path="/cash-bank-book" component={CashBankBook} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/other-income" component={OtherIncome} />
          <Route path="/eway-bill" component={EWayBill} />
          <Route path="/invoice-themes" component={InvoiceThemes} />
          <Route path="/barcode" component={Barcode} />
          <Route path="/recurring-invoices" component={RecurringInvoices} />
          <Route path="/activity-log" component={ActivityLog} />
          <Route path="/bank-reconciliation" component={BankReconciliation} />
          <Route path="/payment-reminders" component={PaymentReminders} />
          <Route path="/messaging" component={Messaging} />
          <Route path="/multi-firm" component={MultiFirm} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/company-profile" component={CompanyProfile} />
          <Route path="/invite-members" component={InviteMembers} />
          <Route path="/verification" component={Verification} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

/**
 * Slug-based company router.
 * When the URL is /app/:slug/..., we resolve the slug to a company,
 * set it as active, and GATE rendering until the active company matches
 * the slug to prevent cross-company data leaks.
 */
function SlugRouter({ slug }: { slug: string }) {
  const { companies, activeCompany, setActiveCompanyId, isLoading } = useCompany();
  const [synced, setSynced] = useState(false);

  // Find company by slug
  const targetCompany = companies.find(c => c.slug === slug);

  // Sync active company to the slug in the URL and gate rendering
  useEffect(() => {
    if (!targetCompany) {
      setSynced(true); // No target — will show error
      return;
    }
    if (activeCompany?.id === targetCompany.id) {
      setSynced(true); // Already synced
      return;
    }
    // Set active and wait for next render cycle
    setActiveCompanyId(targetCompany.id);
    setSynced(false);
  }, [targetCompany, activeCompany?.id, setActiveCompanyId]);

  // After setActiveCompanyId, wait for activeCompany to match
  useEffect(() => {
    if (targetCompany && activeCompany?.id === targetCompany.id) {
      setSynced(true);
    }
  }, [targetCompany, activeCompany?.id]);

  if (isLoading || (!synced && targetCompany)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If slug doesn't match any company the user has access to
  if (!targetCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The company "{slug}" was not found or you don't have access to it.
          </p>
          <a href="/" className="text-primary hover:underline">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <Router base={`/app/${slug}`}>
      <CompanyRoutes />
    </Router>
  );
}

function CompanyGate() {
  const { companies, activeCompany, isLoading } = useCompany();
  const [onboarded, setOnboarded] = useState(false);
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No companies yet — show onboarding
  if (companies.length === 0 && !onboarded) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding onComplete={() => setOnboarded(true)} />
      </Suspense>
    );
  }

  // If user is at root "/" and has companies, redirect to the active company's slug URL
  if (location === "/" && activeCompany) {
    return <Redirect to={`/app/${activeCompany.slug}`} />;
  }

  return (
    <Switch>
      {/* Accept invite route (authenticated) */}
      <Route path="/invite/:token" component={AcceptInvite} />

      {/* Slug-based company routes: /app/:slug/... */}
      <Route path="/app/:slug" nest>
        {(params: { slug: string }) => <SlugRouter slug={params.slug} />}
      </Route>

      {/* Fallback: redirect to active company if available */}
      <Route>
        {() => {
          if (activeCompany) {
            return <Redirect to={`/app/${activeCompany.slug}`} />;
          }
          return <NotFound />;
        }}
      </Route>
    </Switch>
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

  // If not authenticated, show landing page or accept invite page
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/invite/:token" component={AcceptInvite} />
          <Route><Landing /></Route>
        </Switch>
      </Suspense>
    );
  }

  // Authenticated — wrap with CompanyProvider and check for company
  return (
    <CompanyProvider>
      <CompanyGate />
    </CompanyProvider>
  );
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
