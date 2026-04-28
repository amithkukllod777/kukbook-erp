import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => {
  const mockAccounts = [
    { id: 1, code: "1000", name: "Cash", type: "Asset", subtype: "Current", balance: "50000" },
    { id: 2, code: "4000", name: "Sales Revenue", type: "Revenue", subtype: "", balance: "168700" },
    { id: 3, code: "5000", name: "COGS", type: "Expense", subtype: "", balance: "120000" },
  ];
  const mockDashboardData = {
    totalRevenue: 168700, totalExpenses: 120000, netIncome: 48700,
    totalAssets: 212700, arOutstanding: 30200, apOutstanding: 5000,
    inventoryValue: 30434.66, lowStockItems: [], upcomingBills: [], recentJEs: []
  };
  const mockCustomers = [
    { id: 1, name: "Acme Corp", email: "acme@test.com", phone: "555-0001", city: "NYC", address: "123 Main", balance: "15000" },
  ];
  const mockVendors = [
    { id: 1, name: "Supplier A", email: "a@test.com", phone: "555-0002", category: "Raw Materials", address: "456 Oak", balance: "5000" },
  ];
  const mockInvoices = [
    { id: 1, invoiceId: "INV-001", customerId: 1, customerName: "Acme Corp", date: "2026-04-01", dueDate: "2026-05-01", status: "Draft", total: "15000" },
  ];
  const mockBills = [
    { id: 1, billId: "BILL-001", vendorId: 1, vendorName: "Supplier A", date: "2026-04-01", dueDate: "2026-05-01", status: "Pending", amount: "5000", description: "Materials" },
  ];
  const mockInventory = [
    { id: 1, sku: "WDG-001", name: "Widget A", category: "Widgets", qty: 5, cost: "12.50", reorder: 10, warehouseId: 1 },
  ];
  const mockEmployees = [
    { id: 1, empId: "EMP-001", name: "John Doe", title: "Engineer", dept: "Engineering", type: "Salaried", salary: "85000", rate: "0", email: "john@test.com", startDate: "2025-01-15", active: true },
  ];
  const mockPayroll: any[] = [];
  const mockWarehouses = [
    { id: 1, name: "Main Warehouse", location: "NYC", capacity: 10000, manager: "Bob" },
  ];
  const mockJournals = [
    { id: 1, entryId: "JE-001", date: "2026-04-01", description: "Opening", posted: true, lines: JSON.stringify([{ account: "Cash", debit: "1000", credit: "0" }, { account: "Equity", debit: "0", credit: "1000" }]) },
  ];
  const mockSettings = [
    { id: 1, key: "company_name", value: "KukBook Inc." },
  ];
  const mockDeliveryStaff = [
    { id: 1, staffId: "DS-001", name: "Mike", phone: "555-0010", email: "mike@test.com", vehicleType: "Van", vehicleNumber: "ABC-123", active: true },
  ];
  const mockPOs = [
    { id: 1, poId: "PO-001", vendorId: 1, vendorName: "Supplier A", date: "2026-04-01", expectedDate: "2026-04-15", status: "Draft", total: "5000", description: "Widgets" },
  ];

  return {
    getDashboardData: vi.fn().mockResolvedValue(mockDashboardData),
    getAllAccounts: vi.fn().mockResolvedValue(mockAccounts),
    createAccount: vi.fn().mockResolvedValue(undefined),
    updateAccount: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    getAllJournalEntries: vi.fn().mockResolvedValue(mockJournals),
    getNextId: vi.fn().mockResolvedValue("NEXT-001"),
    createJournalEntry: vi.fn().mockResolvedValue(undefined),
    updateJournalEntry: vi.fn().mockResolvedValue(undefined),
    deleteJournalEntry: vi.fn().mockResolvedValue(undefined),
    getAllCustomers: vi.fn().mockResolvedValue(mockCustomers),
    createCustomer: vi.fn().mockResolvedValue(undefined),
    updateCustomer: vi.fn().mockResolvedValue(undefined),
    deleteCustomer: vi.fn().mockResolvedValue(undefined),
    getAllInvoices: vi.fn().mockResolvedValue(mockInvoices),
    createInvoice: vi.fn().mockResolvedValue(undefined),
    updateInvoiceStatus: vi.fn().mockResolvedValue(undefined),
    deleteInvoice: vi.fn().mockResolvedValue(undefined),
    getAllVendors: vi.fn().mockResolvedValue(mockVendors),
    createVendor: vi.fn().mockResolvedValue(undefined),
    updateVendor: vi.fn().mockResolvedValue(undefined),
    deleteVendor: vi.fn().mockResolvedValue(undefined),
    getAllBills: vi.fn().mockResolvedValue(mockBills),
    createBill: vi.fn().mockResolvedValue(undefined),
    updateBillStatus: vi.fn().mockResolvedValue(undefined),
    deleteBill: vi.fn().mockResolvedValue(undefined),
    getAllInventory: vi.fn().mockResolvedValue(mockInventory),
    createInventoryItem: vi.fn().mockResolvedValue(undefined),
    updateInventoryItem: vi.fn().mockResolvedValue(undefined),
    deleteInventoryItem: vi.fn().mockResolvedValue(undefined),
    getAllPurchaseOrders: vi.fn().mockResolvedValue(mockPOs),
    createPurchaseOrder: vi.fn().mockResolvedValue(undefined),
    updatePOStatus: vi.fn().mockResolvedValue(undefined),
    deletePurchaseOrder: vi.fn().mockResolvedValue(undefined),
    getAllEmployees: vi.fn().mockResolvedValue(mockEmployees),
    createEmployee: vi.fn().mockResolvedValue(undefined),
    updateEmployee: vi.fn().mockResolvedValue(undefined),
    deleteEmployee: vi.fn().mockResolvedValue(undefined),
    getAllPayrollRuns: vi.fn().mockResolvedValue(mockPayroll),
    createPayrollRun: vi.fn().mockResolvedValue(undefined),
    getAllWarehouses: vi.fn().mockResolvedValue(mockWarehouses),
    createWarehouse: vi.fn().mockResolvedValue(undefined),
    updateWarehouse: vi.fn().mockResolvedValue(undefined),
    deleteWarehouse: vi.fn().mockResolvedValue(undefined),
    getAllSCOrders: vi.fn().mockResolvedValue([]),
    createSCOrder: vi.fn().mockResolvedValue(undefined),
    updateSCOrderStatus: vi.fn().mockResolvedValue(undefined),
    deleteSCOrder: vi.fn().mockResolvedValue(undefined),
    getAllDeliveryStaff: vi.fn().mockResolvedValue(mockDeliveryStaff),
    createDeliveryStaff: vi.fn().mockResolvedValue(undefined),
    updateDeliveryStaff: vi.fn().mockResolvedValue(undefined),
    deleteDeliveryStaff: vi.fn().mockResolvedValue(undefined),
    getAllDeliveries: vi.fn().mockResolvedValue([]),
    createDelivery: vi.fn().mockResolvedValue(undefined),
    updateDeliveryStatus: vi.fn().mockResolvedValue(undefined),
    assignDelivery: vi.fn().mockResolvedValue(undefined),
    getAllSettings: vi.fn().mockResolvedValue(mockSettings),
    upsertSetting: vi.fn().mockResolvedValue(undefined),
    getAllUsers: vi.fn().mockResolvedValue([{ id: 1, openId: "test", name: "Test", email: "test@test.com", role: "admin", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }]),
    updateUserRole: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Dashboard", () => {
  it("returns dashboard data", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.dashboard.getData();
    expect(data).toBeDefined();
    expect(data?.totalRevenue).toBe(168700);
    expect(data?.netIncome).toBe(48700);
    expect(data?.totalAssets).toBe(212700);
  });
});

describe("Chart of Accounts", () => {
  it("lists all accounts", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const accounts = await caller.accounts.list();
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBe(3);
    expect(accounts[0].code).toBe("1000");
  });

  it("creates an account", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.accounts.create({ code: "1100", name: "Bank", type: "Asset", subtype: "Current", balance: "0" });
    expect(result.success).toBe(true);
  });

  it("deletes an account", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.accounts.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("Customers", () => {
  it("lists all customers", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const customers = await caller.customers.list();
    expect(customers.length).toBe(1);
    expect(customers[0].name).toBe("Acme Corp");
  });

  it("creates a customer", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.customers.create({ name: "New Customer", email: "new@test.com" });
    expect(result.success).toBe(true);
  });
});

describe("Invoices", () => {
  it("lists all invoices", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const invoices = await caller.invoices.list();
    expect(invoices.length).toBe(1);
    expect(invoices[0].invoiceId).toBe("INV-001");
  });

  it("creates an invoice", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.invoices.create({
      invoiceId: "INV-002", customerId: 1, customerName: "Acme Corp",
      date: "2026-04-28", dueDate: "2026-05-28", status: "Draft", total: "5000",
      lines: [{ description: "Widget", qty: 10, rate: "500", amount: "5000" }]
    });
    expect(result.success).toBe(true);
  });

  it("updates invoice status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.invoices.updateStatus({ id: 1, status: "Sent" });
    expect(result.success).toBe(true);
  });
});

describe("Vendors", () => {
  it("lists all vendors", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const vendors = await caller.vendors.list();
    expect(vendors.length).toBe(1);
    expect(vendors[0].name).toBe("Supplier A");
  });
});

describe("Bills", () => {
  it("lists all bills", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const bills = await caller.bills.list();
    expect(bills.length).toBe(1);
    expect(bills[0].billId).toBe("BILL-001");
  });

  it("creates a bill", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bills.create({
      billId: "BILL-002", vendorId: 1, vendorName: "Supplier A",
      date: "2026-04-28", dueDate: "2026-05-28", amount: "3000"
    });
    expect(result.success).toBe(true);
  });

  it("updates bill status to Paid", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bills.updateStatus({ id: 1, status: "Paid" });
    expect(result.success).toBe(true);
  });
});

describe("Inventory", () => {
  it("lists all inventory items", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const items = await caller.inventory.list();
    expect(items.length).toBe(1);
    expect(items[0].sku).toBe("WDG-001");
  });

  it("creates an inventory item", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inventory.create({
      sku: "WDG-002", name: "Widget B", category: "Widgets", qty: 100, cost: "15.00", reorder: 20
    });
    expect(result.success).toBe(true);
  });
});

describe("Employees", () => {
  it("lists all employees", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const employees = await caller.employees.list();
    expect(employees.length).toBe(1);
    expect(employees[0].name).toBe("John Doe");
  });
});

describe("Payroll", () => {
  it("lists payroll runs", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const runs = await caller.payroll.list();
    expect(Array.isArray(runs)).toBe(true);
  });

  it("runs payroll", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.payroll.run({
      payrollId: "PR-001", period: "2026-04", runDate: "2026-04-28",
      gross: "7083.33", fedTax: "1558.33", stateTax: "354.17", ssMed: "541.87", net: "4628.96"
    });
    expect(result.success).toBe(true);
  });
});

describe("Warehouses", () => {
  it("lists all warehouses", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const warehouses = await caller.warehouses.list();
    expect(warehouses.length).toBe(1);
    expect(warehouses[0].name).toBe("Main Warehouse");
  });
});

describe("Purchase Orders", () => {
  it("lists purchase orders", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const pos = await caller.purchaseOrders.list();
    expect(pos.length).toBe(1);
    expect(pos[0].poId).toBe("PO-001");
  });
});

describe("Settings", () => {
  it("lists settings", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const settings = await caller.settings.list();
    expect(settings.length).toBe(1);
    expect(settings[0].key).toBe("company_name");
  });

  it("upserts a setting (admin only)", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.settings.upsert({ key: "currency", value: "USD" });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin setting upsert", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.settings.upsert({ key: "currency", value: "USD" })).rejects.toThrow();
  });
});

describe("Admin - User Management", () => {
  it("lists users for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const users = await caller.admin.users();
    expect(users.length).toBe(1);
  });

  it("rejects non-admin user list", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("updates user role", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.updateRole({ userId: 1, role: "admin" });
    expect(result.success).toBe(true);
  });
});

describe("Auth", () => {
  it("returns current user from auth.me", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const me = await caller.auth.me();
    expect(me).toBeDefined();
    expect(me?.name).toBe("Test User");
    expect(me?.role).toBe("user");
  });
});
