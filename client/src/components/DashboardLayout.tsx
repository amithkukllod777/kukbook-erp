import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, BookOpen, FileText,
  Users, Receipt, Building2, ShoppingCart, Package, ClipboardList,
  UserCheck, DollarSign, Warehouse, Link2, Truck, Settings,
  Shield, BarChart3, ChevronDown, RotateCcw, FileCheck,
  ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, TrendingUp,
  FileSpreadsheet, IndianRupee, UsersRound, ScrollText, ArrowLeftRight,
  FileBarChart, Palette, Barcode, Bell, MessageSquare, Building, Crown,
  ChevronsUpDown, Check
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useCompany } from "@/contexts/CompanyContext";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { icon: BookOpen, label: "Chart of Accounts", path: "/accounts" },
      { icon: FileText, label: "Journal Entries", path: "/journal" },
      { icon: Wallet, label: "Cash & Bank", path: "/cash-bank" },
      { icon: BarChart3, label: "Financial Reports", path: "/reports" },
      { icon: FileSpreadsheet, label: "Advanced Reports", path: "/advanced-reports" },
      { icon: IndianRupee, label: "GST Reports", path: "/gst-reports" },
      { icon: FileBarChart, label: "E-Way Bills", path: "/eway-bill" },
    ],
  },
  {
    label: "Sales",
    items: [
      { icon: Users, label: "Customers", path: "/customers" },
      { icon: Receipt, label: "Invoices", path: "/invoices" },
      { icon: FileCheck, label: "Estimates", path: "/estimates" },
      { icon: RotateCcw, label: "Sale Returns", path: "/sale-returns" },
      { icon: ArrowDownLeft, label: "Payments In", path: "/payments-in" },
    ],
  },
  {
    label: "Purchases",
    items: [
      { icon: Building2, label: "Vendors", path: "/vendors" },
      { icon: ShoppingCart, label: "Bills", path: "/bills" },
      { icon: ClipboardList, label: "Purchase Orders", path: "/purchase-orders" },
      { icon: RotateCcw, label: "Purchase Returns", path: "/purchase-returns" },
      { icon: ArrowUpRight, label: "Payments Out", path: "/payments-out" },
    ],
  },
  {
    label: "Inventory & Warehouse",
    items: [
      { icon: Package, label: "Inventory", path: "/inventory" },
      { icon: Barcode, label: "Barcode Generator", path: "/barcode" },
      { icon: Warehouse, label: "Warehouses", path: "/warehouses" },
      { icon: Link2, label: "Supply Chain", path: "/supply-chain" },
    ],
  },
  {
    label: "HR & Payroll",
    items: [
      { icon: UserCheck, label: "Employees", path: "/employees" },
      { icon: DollarSign, label: "Payroll", path: "/payroll" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { icon: Truck, label: "Delivery Staff", path: "/delivery-staff" },
      { icon: Truck, label: "Deliveries", path: "/deliveries" },
      { icon: ScrollText, label: "Delivery Challans", path: "/delivery-challans" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: MessageSquare, label: "Messaging", path: "/messaging" },
      { icon: Bell, label: "Payment Reminders", path: "/payment-reminders" },
    ],
  },
  {
    label: "Income & Expenses",
    items: [
      { icon: CreditCard, label: "Expenses", path: "/expenses" },
      { icon: TrendingUp, label: "Other Income", path: "/other-income" },
    ],
  },
  {
    label: "Parties",
    items: [
      { icon: UsersRound, label: "Party Groups", path: "/party-groups" },
    ],
  },
  {
    label: "Administration",
    items: [
      { icon: Shield, label: "User Management", path: "/admin/users" },
      { icon: Settings, label: "Settings", path: "/admin/settings" },
      { icon: ArrowLeftRight, label: "Import / Export", path: "/import-export" },
      { icon: Palette, label: "Invoice Themes", path: "/invoice-themes" },
      { icon: Building, label: "Multi-Firm", path: "/multi-firm" },
      { icon: Crown, label: "Subscription", path: "/subscription" },
    ],
  },
];

const allMenuItems = menuGroups.flatMap(g => g.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

function CompanySwitcher({ isCollapsed }: { isCollapsed: boolean }) {
  const { companies, activeCompany, switchToCompany } = useCompany();
  const [open, setOpen] = useState(false);

  if (companies.length === 0 || !activeCompany) return null;

  if (isCollapsed) {
    return (
      <div className="flex justify-center px-2 py-1">
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
          {activeCompany.name.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pb-1">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-left hover:bg-sidebar-accent/50 transition-colors focus:outline-none">
            <div className="h-7 w-7 rounded-md bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground shrink-0">
              {activeCompany.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-sidebar-accent-foreground">{activeCompany.name}</p>
              {activeCompany.gstin && (
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{activeCompany.gstin}</p>
              )}
            </div>
            <ChevronsUpDown className="h-3 w-3 text-sidebar-foreground/50 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {companies.map(c => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => {
                if (c.id !== activeCompany.id) {
                  switchToCompany(c);
                }
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate flex-1 text-sm">{c.name}</span>
                {c.id === activeCompany.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center">
              KukBook ERP
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sign in to access your accounting and business management dashboard.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = allMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground" />
              </button>
              {!isCollapsed && (
                <span className="font-bold text-base tracking-tight text-sidebar-primary-foreground truncate">
                  KukBook
                </span>
              )}
            </div>
            <CompanySwitcher isCollapsed={isCollapsed} />
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {menuGroups.map((group) => {
              const groupActive = group.items.some(i => i.path === location);
              return (
                <Collapsible key={group.label} defaultOpen={groupActive || group.label === "Overview"} className="group/collapsible">
                  <SidebarGroup className="py-0">
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 cursor-pointer flex items-center justify-between px-3 py-2">
                        <span>{group.label}</span>
                        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="px-2 pb-1">
                        {group.items.map(item => {
                          const isActive = location === item.path;
                          return (
                            <SidebarMenuItem key={item.path}>
                              <SidebarMenuButton
                                isActive={isActive}
                                onClick={() => setLocation(item.path)}
                                tooltip={item.label}
                                className="h-9 transition-all font-normal text-[13px]"
                              >
                                <item.icon className={`h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                                <span>{item.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-sidebar-primary text-sidebar-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-accent-foreground">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1">
                      {user?.role === "admin" ? "Administrator" : "Staff"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-sidebar-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (isCollapsed) return; setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground font-medium">
                {activeMenuItem?.label ?? "KukBook ERP"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
