import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean as mysqlBoolean, json } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Chart of Accounts ──────────────────────────────────────────────────────
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["Asset", "Liability", "Equity", "Revenue", "Expense"]).notNull(),
  subtype: varchar("subtype", { length: 100 }),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// ─── Journal Entries ────────────────────────────────────────────────────────
export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  entryId: varchar("entryId", { length: 20 }).notNull().unique(),
  date: varchar("date", { length: 10 }).notNull(),
  description: text("description"),
  posted: mysqlBoolean("posted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;

export const journalLines = mysqlTable("journal_lines", {
  id: int("id").autoincrement().primaryKey(),
  journalEntryId: int("journalEntryId").notNull(),
  account: varchar("account", { length: 200 }).notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0").notNull(),
});

export type JournalLine = typeof journalLines.$inferSelect;

// ─── Customers ──────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  city: varchar("city", { length: 100 }),
  address: text("address"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;

// ─── Invoices ───────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 20 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["Draft", "Sent", "Paid", "Overdue"]).default("Draft").notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;

export const invoiceLines = mysqlTable("invoice_lines", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  qty: int("qty").default(1).notNull(),
  rate: decimal("rate", { precision: 15, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 15, scale: 2 }).default("0").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0").notNull(),
});

export type InvoiceLine = typeof invoiceLines.$inferSelect;

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  category: varchar("category", { length: 100 }),
  address: text("address"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;

// ─── Bills ──────────────────────────────────────────────────────────────────
export const bills = mysqlTable("bills", {
  id: int("id").autoincrement().primaryKey(),
  billId: varchar("billId", { length: 20 }).notNull().unique(),
  vendorId: int("vendorId").notNull(),
  vendorName: varchar("vendorName", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("bill_status", ["Pending", "Paid"]).default("Pending").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bill = typeof bills.$inferSelect;

// ─── Inventory ──────────────────────────────────────────────────────────────
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }),
  qty: int("qty").default(0).notNull(),
  cost: decimal("cost", { precision: 15, scale: 2 }).default("0").notNull(),
  reorder: int("reorder").default(10).notNull(),
  warehouseId: int("warehouseId"),
  hsnCode: varchar("hsnCode", { length: 20 }),
  gstRate: decimal("gstRate", { precision: 5, scale: 2 }).default("18.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;

// ─── Purchase Orders ────────────────────────────────────────────────────────
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  poId: varchar("poId", { length: 20 }).notNull().unique(),
  vendorId: int("vendorId").notNull(),
  vendorName: varchar("vendorName", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  expectedDate: varchar("expectedDate", { length: 10 }),
  total: decimal("total", { precision: 15, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("po_status", ["Draft", "Sent", "Received"]).default("Draft").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// ─── Employees ──────────────────────────────────────────────────────────────
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  empId: varchar("empId", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }),
  dept: varchar("dept", { length: 100 }),
  type: mysqlEnum("emp_type", ["Salaried", "Hourly"]).default("Salaried").notNull(),
  salary: decimal("salary", { precision: 15, scale: 2 }).default("0").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).default("0").notNull(),
  email: varchar("emp_email", { length: 320 }),
  startDate: varchar("startDate", { length: 10 }),
  active: mysqlBoolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;

// ─── Payroll Runs ───────────────────────────────────────────────────────────
export const payrollRuns = mysqlTable("payroll_runs", {
  id: int("id").autoincrement().primaryKey(),
  payrollId: varchar("payrollId", { length: 20 }).notNull().unique(),
  period: varchar("period", { length: 50 }).notNull(),
  runDate: varchar("runDate", { length: 10 }).notNull(),
  gross: decimal("gross", { precision: 15, scale: 2 }).default("0").notNull(),
  fedTax: decimal("fedTax", { precision: 15, scale: 2 }).default("0").notNull(),
  stateTax: decimal("stateTax", { precision: 15, scale: 2 }).default("0").notNull(),
  ssMed: decimal("ssMed", { precision: 15, scale: 2 }).default("0").notNull(),
  net: decimal("net", { precision: 15, scale: 2 }).default("0").notNull(),
  status: varchar("payroll_status", { length: 20 }).default("Processed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PayrollRun = typeof payrollRuns.$inferSelect;

// ─── Warehouses ─────────────────────────────────────────────────────────────
export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  location: varchar("location", { length: 300 }),
  capacity: int("capacity").default(0),
  manager: varchar("manager", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Warehouse = typeof warehouses.$inferSelect;

// ─── Supply Chain Orders ────────────────────────────────────────────────────
export const supplyChainOrders = mysqlTable("supply_chain_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 20 }).notNull().unique(),
  supplierName: varchar("supplierName", { length: 200 }).notNull(),
  itemName: varchar("itemName", { length: 200 }).notNull(),
  qty: int("qty").default(0).notNull(),
  status: mysqlEnum("sc_status", ["Ordered", "In Transit", "Delivered", "Cancelled"]).default("Ordered").notNull(),
  orderDate: varchar("orderDate", { length: 10 }).notNull(),
  expectedDate: varchar("expectedDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplyChainOrder = typeof supplyChainOrders.$inferSelect;

// ─── Delivery Staff ─────────────────────────────────────────────────────────
export const deliveryStaff = mysqlTable("delivery_staff", {
  id: int("id").autoincrement().primaryKey(),
  staffId: varchar("staffId", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("ds_email", { length: 320 }),
  vehicleType: varchar("vehicleType", { length: 50 }),
  vehicleNumber: varchar("vehicleNumber", { length: 50 }),
  active: mysqlBoolean("ds_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliveryStaffMember = typeof deliveryStaff.$inferSelect;

// ─── Deliveries ─────────────────────────────────────────────────────────────
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: varchar("deliveryId", { length: 20 }).notNull().unique(),
  staffId: int("staffId"),
  staffName: varchar("staffName", { length: 200 }),
  customerName: varchar("del_customerName", { length: 200 }).notNull(),
  address: text("del_address"),
  status: mysqlEnum("del_status", ["Pending", "Assigned", "In Transit", "Delivered", "Failed"]).default("Pending").notNull(),
  invoiceId: varchar("del_invoiceId", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;

// ─── Settings ───────────────────────────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("setting_key", { length: 100 }).notNull().unique(),
  value: text("setting_value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;

// ─── Sale Returns (Credit Notes) ───────────────────────────────────────────
export const saleReturns = mysqlTable("sale_returns", {
  id: int("id").autoincrement().primaryKey(),
  returnId: varchar("returnId", { length: 20 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  customerName: varchar("sr_customerName", { length: 200 }).notNull(),
  date: varchar("sr_date", { length: 10 }).notNull(),
  invoiceRef: varchar("invoiceRef", { length: 20 }),
  amount: decimal("sr_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  reason: text("reason"),
  createdAt: timestamp("sr_createdAt").defaultNow().notNull(),
});

export type SaleReturn = typeof saleReturns.$inferSelect;

// ─── Purchase Returns (Debit Notes) ────────────────────────────────────────
export const purchaseReturns = mysqlTable("purchase_returns", {
  id: int("id").autoincrement().primaryKey(),
  returnId: varchar("pr_returnId", { length: 20 }).notNull().unique(),
  vendorId: int("pr_vendorId").notNull(),
  vendorName: varchar("pr_vendorName", { length: 200 }).notNull(),
  date: varchar("pr_date", { length: 10 }).notNull(),
  billRef: varchar("billRef", { length: 20 }),
  amount: decimal("pr_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  reason: text("pr_reason"),
  createdAt: timestamp("pr_createdAt").defaultNow().notNull(),
});

export type PurchaseReturn = typeof purchaseReturns.$inferSelect;

// ─── Estimates / Quotations ────────────────────────────────────────────────
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: varchar("estimateId", { length: 20 }).notNull().unique(),
  customerId: int("est_customerId").notNull(),
  customerName: varchar("est_customerName", { length: 200 }).notNull(),
  date: varchar("est_date", { length: 10 }).notNull(),
  validUntil: varchar("validUntil", { length: 10 }),
  total: decimal("est_total", { precision: 15, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("est_status", ["Draft", "Sent", "Accepted", "Rejected", "Expired"]).default("Draft").notNull(),
  notes: text("est_notes"),
  createdAt: timestamp("est_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("est_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Estimate = typeof estimates.$inferSelect;

export const estimateLines = mysqlTable("estimate_lines", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("el_estimateId").notNull(),
  description: varchar("el_description", { length: 500 }).notNull(),
  qty: int("el_qty").default(1).notNull(),
  rate: decimal("el_rate", { precision: 15, scale: 2 }).default("0").notNull(),
  amount: decimal("el_amount", { precision: 15, scale: 2 }).default("0").notNull(),
});

export type EstimateLine = typeof estimateLines.$inferSelect;

// ─── Payments In (Receipts from Customers) ─────────────────────────────────
export const paymentsIn = mysqlTable("payments_in", {
  id: int("id").autoincrement().primaryKey(),
  paymentId: varchar("pi_paymentId", { length: 20 }).notNull().unique(),
  customerId: int("pi_customerId").notNull(),
  customerName: varchar("pi_customerName", { length: 200 }).notNull(),
  date: varchar("pi_date", { length: 10 }).notNull(),
  amount: decimal("pi_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  mode: varchar("pi_mode", { length: 50 }).default("Cash").notNull(),
  invoiceRef: varchar("pi_invoiceRef", { length: 20 }),
  notes: text("pi_notes"),
  createdAt: timestamp("pi_createdAt").defaultNow().notNull(),
});

export type PaymentIn = typeof paymentsIn.$inferSelect;

// ─── Payments Out (Payments to Vendors) ────────────────────────────────────
export const paymentsOut = mysqlTable("payments_out", {
  id: int("id").autoincrement().primaryKey(),
  paymentId: varchar("po_paymentId", { length: 20 }).notNull().unique(),
  vendorId: int("po_vendorId").notNull(),
  vendorName: varchar("po_vendorName", { length: 200 }).notNull(),
  date: varchar("po_date", { length: 10 }).notNull(),
  amount: decimal("po_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  mode: varchar("po_mode", { length: 50 }).default("Cash").notNull(),
  billRef: varchar("po_billRef", { length: 20 }),
  notes: text("po_notes"),
  createdAt: timestamp("po_createdAt").defaultNow().notNull(),
});

export type PaymentOut = typeof paymentsOut.$inferSelect;

// ─── Cash & Bank Accounts ──────────────────────────────────────────────────
export const cashBankAccounts = mysqlTable("cash_bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("cb_name", { length: 200 }).notNull(),
  type: mysqlEnum("cb_type", ["Cash", "Bank", "UPI", "Wallet"]).default("Cash").notNull(),
  bankName: varchar("bankName", { length: 200 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  balance: decimal("cb_balance", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("cb_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("cb_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CashBankAccount = typeof cashBankAccounts.$inferSelect;

// ─── Expenses ──────────────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  expenseId: varchar("expenseId", { length: 20 }).notNull().unique(),
  date: varchar("exp_date", { length: 10 }).notNull(),
  category: varchar("exp_category", { length: 100 }).notNull(),
  amount: decimal("exp_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  paymentMode: varchar("exp_paymentMode", { length: 50 }).default("Cash").notNull(),
  description: text("exp_description"),
  gstIncluded: mysqlBoolean("gstIncluded").default(false).notNull(),
  gstAmount: decimal("gstAmount", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("exp_createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;

// ─── Other Income ──────────────────────────────────────────────────────────
export const otherIncome = mysqlTable("other_income", {
  id: int("id").autoincrement().primaryKey(),
  incomeId: varchar("incomeId", { length: 20 }).notNull().unique(),
  date: varchar("oi_date", { length: 10 }).notNull(),
  category: varchar("oi_category", { length: 100 }).notNull(),
  amount: decimal("oi_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  paymentMode: varchar("oi_paymentMode", { length: 50 }).default("Cash").notNull(),
  description: text("oi_description"),
  createdAt: timestamp("oi_createdAt").defaultNow().notNull(),
});

export type OtherIncomeEntry = typeof otherIncome.$inferSelect;

// ─── Delivery Challans ────────────────────────────────────────────────────
export const deliveryChallans = mysqlTable("delivery_challans", {
  id: int("id").autoincrement().primaryKey(),
  challanId: varchar("challanId", { length: 20 }).notNull().unique(),
  customerId: int("dc_customerId").notNull(),
  customerName: varchar("dc_customerName", { length: 200 }).notNull(),
  date: varchar("dc_date", { length: 10 }).notNull(),
  invoiceRef: varchar("dc_invoiceRef", { length: 20 }),
  items: json("dc_items"),
  transportMode: varchar("transportMode", { length: 100 }),
  vehicleNumber: varchar("dc_vehicleNumber", { length: 50 }),
  status: mysqlEnum("dc_status", ["Draft", "Sent", "Delivered"]).default("Draft").notNull(),
  notes: text("dc_notes"),
  createdAt: timestamp("dc_createdAt").defaultNow().notNull(),
});

export type DeliveryChallan = typeof deliveryChallans.$inferSelect;

// ─── Party Groups ─────────────────────────────────────────────────────────
export const partyGroups = mysqlTable("party_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("pg_name", { length: 200 }).notNull(),
  type: mysqlEnum("pg_type", ["Customer", "Vendor"]).notNull(),
  description: text("pg_description"),
  createdAt: timestamp("pg_createdAt").defaultNow().notNull(),
});

export type PartyGroup = typeof partyGroups.$inferSelect;
