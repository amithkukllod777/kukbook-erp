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
    // New modules
    getAllSaleReturns: vi.fn().mockResolvedValue([{ id: 1, returnId: "CR-001", customerId: 1, customerName: "Acme Corp", date: "2026-04-01", invoiceRef: "INV-001", amount: "2000", reason: "Defective" }]),
    createSaleReturn: vi.fn().mockResolvedValue(undefined),
    deleteSaleReturn: vi.fn().mockResolvedValue(undefined),
    getAllPurchaseReturns: vi.fn().mockResolvedValue([{ id: 1, returnId: "DN-001", vendorId: 1, vendorName: "Supplier A", date: "2026-04-01", billRef: "BILL-001", amount: "1000", reason: "Wrong item" }]),
    createPurchaseReturn: vi.fn().mockResolvedValue(undefined),
    deletePurchaseReturn: vi.fn().mockResolvedValue(undefined),
    getAllEstimates: vi.fn().mockResolvedValue([{ id: 1, estimateId: "EST-001", customerId: 1, customerName: "Acme Corp", date: "2026-04-01", validUntil: "2026-05-01", total: "10000", status: "Draft", notes: "", lines: JSON.stringify([]) }]),
    createEstimate: vi.fn().mockResolvedValue(undefined),
    updateEstimateStatus: vi.fn().mockResolvedValue(undefined),
    deleteEstimate: vi.fn().mockResolvedValue(undefined),
    getAllPaymentsIn: vi.fn().mockResolvedValue([{ id: 1, paymentId: "REC-001", customerId: 1, customerName: "Acme Corp", date: "2026-04-01", amount: "5000", mode: "Cash", invoiceRef: "INV-001", notes: "" }]),
    createPaymentIn: vi.fn().mockResolvedValue(undefined),
    deletePaymentIn: vi.fn().mockResolvedValue(undefined),
    getAllPaymentsOut: vi.fn().mockResolvedValue([{ id: 1, paymentId: "PAY-001", vendorId: 1, vendorName: "Supplier A", date: "2026-04-01", amount: "3000", mode: "Bank Transfer", billRef: "BILL-001", notes: "" }]),
    createPaymentOut: vi.fn().mockResolvedValue(undefined),
    deletePaymentOut: vi.fn().mockResolvedValue(undefined),
    getAllCashBankAccounts: vi.fn().mockResolvedValue([{ id: 1, name: "Main Cash", type: "Cash", bankName: "", accountNumber: "", balance: "50000" }]),
    createCashBankAccount: vi.fn().mockResolvedValue(undefined),
    updateCashBankAccount: vi.fn().mockResolvedValue(undefined),
    deleteCashBankAccount: vi.fn().mockResolvedValue(undefined),
    getAllExpenses: vi.fn().mockResolvedValue([{ id: 1, expenseId: "EXP-001", date: "2026-04-01", category: "Office Supplies", amount: "500", paymentMode: "Cash", description: "Pens", gstIncluded: false, gstAmount: "0" }]),
    createExpense: vi.fn().mockResolvedValue(undefined),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
    getAllOtherIncome: vi.fn().mockResolvedValue([{ id: 1, incomeId: "INC-001", date: "2026-04-01", category: "Interest Income", amount: "1000", paymentMode: "Bank Transfer", description: "Savings interest" }]),
    createOtherIncome: vi.fn().mockResolvedValue(undefined),
    deleteOtherIncome: vi.fn().mockResolvedValue(undefined),
    // Delivery Challans
    getAllDeliveryChallans: vi.fn().mockResolvedValue([{ id: 1, challanId: "DC-001", customerId: 1, customerName: "Acme Corp", date: "2026-04-01", status: "Draft" }]),
    createDeliveryChallan: vi.fn().mockResolvedValue(undefined),
    updateDeliveryChallanStatus: vi.fn().mockResolvedValue(undefined),
    deleteDeliveryChallan: vi.fn().mockResolvedValue(undefined),
    // Party Groups
    getAllPartyGroups: vi.fn().mockResolvedValue([{ id: 1, name: "Premium", type: "Customer", description: "Top customers" }]),
    createPartyGroup: vi.fn().mockResolvedValue(undefined),
    deletePartyGroup: vi.fn().mockResolvedValue(undefined),
    // Advanced Reports
    getDayBook: vi.fn().mockResolvedValue({ invoices: [], bills: [], paymentsIn: [], paymentsOut: [], expenses: [], otherIncome: [] }),
    getCashflowReport: vi.fn().mockResolvedValue({ inflows: 50000, outflows: 30000, net: 20000 }),
    getAgingReport: vi.fn().mockResolvedValue([{ id: 1, invoiceId: "INV-001", customerName: "Acme", dueDate: "2026-03-01", total: "5000", daysOverdue: 58, bucket: "31-60" }]),
    getStockSummary: vi.fn().mockResolvedValue([{ id: 1, sku: "WDG-001", name: "Widget A", category: "Widgets", qty: 5, cost: "12.50", reorder: 10 }]),
    getPartyStatement: vi.fn().mockResolvedValue({ party: { id: 1, name: "Acme Corp" }, transactions: [{ date: "2026-01-15", type: "Invoice", ref: "INV-001", debit: 1000, credit: 0 }] }),
    getGSTSummary: vi.fn().mockResolvedValue({ salesGST: 5000, purchaseGST: 3000, expenseGST: 500, netGST: 1500, invoices: [], bills: [], expenses: [] }),
    // Company & Subscription
    createCompany: vi.fn().mockResolvedValue({ id: 1 }),
    getCompanies: vi.fn().mockResolvedValue([{ id: 1, name: "Test Corp", slug: "test-corp", ownerId: 1 }]),
    getCompanyBySlug: vi.fn().mockResolvedValue({ id: 1, name: "Test Corp", slug: "test-corp", ownerId: 1 }),
    getCompanyById: vi.fn().mockResolvedValue({ id: 1, name: "Test Corp", slug: "test-corp", ownerId: 1 }),
    getUserCompanies: vi.fn().mockResolvedValue([{ id: 1, name: "Test Corp", slug: "test-corp", memberRole: "owner" }]),
    updateCompany: vi.fn().mockResolvedValue(undefined),
    getCompanyMembers: vi.fn().mockResolvedValue([{ id: 1, companyId: 1, userId: 1, role: "owner", userName: "Test", userEmail: "test@test.com" }]),
    addCompanyMember: vi.fn().mockResolvedValue(undefined),
    removeCompanyMember: vi.fn().mockResolvedValue(undefined),
    getSubscription: vi.fn().mockResolvedValue({ id: 1, companyId: 1, plan: "professional", status: "trial", trialStartDate: new Date(), trialEndDate: new Date(Date.now() + 30*24*60*60*1000), autoRenew: true }),
    updateSubscription: vi.fn().mockResolvedValue(undefined),
    getTrialStatus: vi.fn().mockResolvedValue({ isTrialActive: true, daysLeft: 28, plan: "professional", status: "trial" }),
  };
});

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "admin" | "user" = "user", companyId: number | null = 1): TrpcContext {
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
    companyId,
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

  it("rejects upsert without company context", async () => {
    const caller = appRouter.createCaller(createUserContext("user", null));
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

describe("Sale Returns", () => {
  it("lists sale returns", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const returns = await caller.saleReturns.list();
    expect(returns.length).toBe(1);
    expect(returns[0].returnId).toBe("CR-001");
  });

  it("creates a sale return", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.saleReturns.create({
      returnId: "CR-002", customerId: 1, customerName: "Acme Corp",
      date: "2026-04-28", amount: "3000", reason: "Wrong size"
    });
    expect(result.success).toBe(true);
  });
});

describe("Purchase Returns", () => {
  it("lists purchase returns", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const returns = await caller.purchaseReturns.list();
    expect(returns.length).toBe(1);
    expect(returns[0].returnId).toBe("DN-001");
  });

  it("creates a purchase return", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.purchaseReturns.create({
      returnId: "DN-002", vendorId: 1, vendorName: "Supplier A",
      date: "2026-04-28", amount: "1500", reason: "Damaged"
    });
    expect(result.success).toBe(true);
  });
});

describe("Estimates", () => {
  it("lists estimates", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const estimates = await caller.estimates.list();
    expect(estimates.length).toBe(1);
    expect(estimates[0].estimateId).toBe("EST-001");
  });

  it("creates an estimate", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.estimates.create({
      estimateId: "EST-002", customerId: 1, customerName: "Acme Corp",
      date: "2026-04-28", total: "8000",
      lines: [{ description: "Service", qty: 1, rate: "8000", amount: "8000" }]
    });
    expect(result.success).toBe(true);
  });

  it("updates estimate status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.estimates.updateStatus({ id: 1, status: "Sent" });
    expect(result.success).toBe(true);
  });
});

describe("Payments In", () => {
  it("lists payments in", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const payments = await caller.paymentsIn.list();
    expect(payments.length).toBe(1);
    expect(payments[0].paymentId).toBe("REC-001");
  });

  it("creates a payment in", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.paymentsIn.create({
      paymentId: "REC-002", customerId: 1, customerName: "Acme Corp",
      date: "2026-04-28", amount: "5000", mode: "UPI"
    });
    expect(result.success).toBe(true);
  });
});

describe("Payments Out", () => {
  it("lists payments out", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const payments = await caller.paymentsOut.list();
    expect(payments.length).toBe(1);
    expect(payments[0].paymentId).toBe("PAY-001");
  });

  it("creates a payment out", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.paymentsOut.create({
      paymentId: "PAY-002", vendorId: 1, vendorName: "Supplier A",
      date: "2026-04-28", amount: "2000", mode: "Cheque"
    });
    expect(result.success).toBe(true);
  });
});

describe("Cash & Bank", () => {
  it("lists cash/bank accounts", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const accounts = await caller.cashBank.list();
    expect(accounts.length).toBe(1);
    expect(accounts[0].name).toBe("Main Cash");
  });

  it("creates a cash/bank account", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.cashBank.create({
      name: "SBI Savings", type: "Bank", bankName: "SBI", accountNumber: "123456", balance: "100000"
    });
    expect(result.success).toBe(true);
  });
});

describe("Expenses", () => {
  it("lists expenses", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const expenses = await caller.expenses.list();
    expect(expenses.length).toBe(1);
    expect(expenses[0].expenseId).toBe("EXP-001");
  });

  it("creates an expense", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.expenses.create({
      expenseId: "EXP-002", date: "2026-04-28", category: "Travel",
      amount: "1200", paymentMode: "Card", description: "Client meeting"
    });
    expect(result.success).toBe(true);
  });
});

describe("Other Income", () => {
  it("lists other income", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const incomes = await caller.otherIncome.list();
    expect(incomes.length).toBe(1);
    expect(incomes[0].incomeId).toBe("INC-001");
  });

  it("creates other income", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.otherIncome.create({
      incomeId: "INC-002", date: "2026-04-28", category: "Commission",
      amount: "5000", paymentMode: "Bank Transfer", description: "Referral commission"
    });
    expect(result.success).toBe(true);
  });
});

describe("Delivery Challans", () => {
  it("lists delivery challans", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const challans = await caller.deliveryChallans.list();
    expect(Array.isArray(challans)).toBe(true);
  });

  it("creates a delivery challan", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.deliveryChallans.create({
      challanId: "DC-001", customerId: 1, customerName: "Acme Corp",
      date: "2026-04-28"
    });
    expect(result.success).toBe(true);
  });
});

describe("Party Groups", () => {
  it("lists party groups", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const groups = await caller.partyGroups.list();
    expect(Array.isArray(groups)).toBe(true);
  });

  it("creates a party group", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.partyGroups.create({
      name: "Premium Customers", type: "Customer"
    });
    expect(result.success).toBe(true);
  });
});

describe("Advanced Reports", () => {
  it("returns day book data", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.advancedReports.dayBook({ date: "2026-04-28" });
    expect(data).toBeDefined();
    expect(data).toHaveProperty("invoices");
    expect(data).toHaveProperty("bills");
  });

  it("returns cashflow report", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.advancedReports.cashflow();
    expect(data).toBeDefined();
    expect(data).toHaveProperty("inflows");
    expect(data).toHaveProperty("outflows");
    expect(data).toHaveProperty("net");
  });

  it("returns aging report", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.advancedReports.aging();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns stock summary", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.advancedReports.stockSummary();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns party statement for customer", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.advancedReports.partyStatement({ partyType: "customer", partyId: 1 });
    expect(data).toHaveProperty("party");
    expect(data).toHaveProperty("transactions");
    expect(Array.isArray(data.transactions)).toBe(true);
  });

  it("returns party statement for vendor", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.advancedReports.partyStatement({ partyType: "vendor", partyId: 1 });
    expect(data).toHaveProperty("party");
    expect(data).toHaveProperty("transactions");
  });
});

describe("bulkImport", () => {
  it("bulk imports customers", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bulkImport.customers({ rows: [{ name: "Test Customer" }, { name: "Another Customer", email: "a@b.com" }] });
    expect(result.success).toBe(true);
    expect(result.imported).toBe(2);
  });

  it("bulk imports vendors", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bulkImport.vendors({ rows: [{ name: "Test Vendor" }] });
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
  });

  it("bulk imports inventory items", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bulkImport.inventory({ rows: [{ sku: "SKU-001", name: "Widget", qty: 100, cost: "25.00" }] });
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
  });
});

describe("gst", () => {
  it("returns GST summary", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.gst.summary();
    expect(data).toHaveProperty("salesGST");
    expect(data).toHaveProperty("purchaseGST");
    expect(data).toHaveProperty("netGST");
  });
});

describe("company", () => {
  it("lists user companies", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.company.list();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty("name");
    expect(data[0]).toHaveProperty("slug");
  });
  it("creates a company", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.company.create({ name: "New Corp", slug: "new-corp" });
    expect(result.success).toBe(true);
  });
  it("gets company by slug", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.company.getBySlug({ slug: "test-corp" });
    expect(data).toHaveProperty("name", "Test Corp");
  });
  it("updates a company", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.company.update({ id: 1, name: "Updated Corp" });
    expect(result.success).toBe(true);
  });
  it("lists company members", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.company.members({ companyId: 1 });
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty("role", "owner");
  });
});

describe("subscription", () => {
  it("gets subscription for a company", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.subscription.get({ companyId: 1 });
    expect(data).toHaveProperty("plan", "professional");
    expect(data).toHaveProperty("status", "trial");
  });
  it("gets trial status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.subscription.trialStatus({ companyId: 1 });
    expect(data).toHaveProperty("isTrialActive", true);
    expect(data).toHaveProperty("daysLeft");
    expect(data.daysLeft).toBeGreaterThan(0);
  });
});

describe("Cross-Company Data Isolation", () => {
  it("rejects business operations without company context", async () => {
    const callerNoCompany = appRouter.createCaller(createUserContext("user", null));
    // All business procedures should reject when no companyId is set
    await expect(callerNoCompany.accounts.list()).rejects.toThrow("No active company selected");
    await expect(callerNoCompany.customers.list()).rejects.toThrow("No active company selected");
    await expect(callerNoCompany.invoices.list()).rejects.toThrow("No active company selected");
    await expect(callerNoCompany.vendors.list()).rejects.toThrow("No active company selected");
    await expect(callerNoCompany.bills.list()).rejects.toThrow("No active company selected");
    await expect(callerNoCompany.inventory.list()).rejects.toThrow("No active company selected");
    await expect(callerNoCompany.employees.list()).rejects.toThrow("No active company selected");
  });

  it("passes companyId to db helpers for data isolation", async () => {
    const db = await import("./db");
    const callerCompany1 = appRouter.createCaller(createUserContext("user", 1));
    const callerCompany2 = appRouter.createCaller(createUserContext("user", 2));

    // Company 1 queries
    await callerCompany1.accounts.list();
    expect(db.getAllAccounts).toHaveBeenCalledWith(1);

    await callerCompany1.customers.list();
    expect(db.getAllCustomers).toHaveBeenCalledWith(1);

    // Company 2 queries — different companyId passed
    await callerCompany2.accounts.list();
    expect(db.getAllAccounts).toHaveBeenCalledWith(2);

    await callerCompany2.customers.list();
    expect(db.getAllCustomers).toHaveBeenCalledWith(2);
  });

  it("isolates create operations by companyId", async () => {
    const db = await import("./db");
    const callerCompany1 = appRouter.createCaller(createUserContext("user", 1));
    const callerCompany2 = appRouter.createCaller(createUserContext("user", 2));

    await callerCompany1.customers.create({ name: "Customer A", email: "a@test.com" });
    expect(db.createCustomer).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Customer A" }));

    await callerCompany2.customers.create({ name: "Customer B", email: "b@test.com" });
    expect(db.createCustomer).toHaveBeenCalledWith(2, expect.objectContaining({ name: "Customer B" }));
  });

  it("isolates delete operations by companyId", async () => {
    const db = await import("./db");
    const callerCompany1 = appRouter.createCaller(createUserContext("user", 1));
    const callerCompany2 = appRouter.createCaller(createUserContext("user", 2));

    await callerCompany1.customers.delete({ id: 1 });
    expect(db.deleteCustomer).toHaveBeenCalledWith(1, 1);

    await callerCompany2.customers.delete({ id: 2 });
    expect(db.deleteCustomer).toHaveBeenCalledWith(2, 2);
  });

  it("isolates dashboard data by companyId", async () => {
    const db = await import("./db");
    const callerCompany1 = appRouter.createCaller(createUserContext("user", 1));
    await callerCompany1.dashboard.getData();
    expect(db.getDashboardData).toHaveBeenCalledWith(1);
  });

  it("isolates reports by companyId", async () => {
    const db = await import("./db");
    const callerCompany1 = appRouter.createCaller(createUserContext("user", 1));
    await callerCompany1.gst.summary();
    expect(db.getGSTSummary).toHaveBeenCalledWith(1);
  });
});
