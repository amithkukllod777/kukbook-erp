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

// ─── Chart of Accounts (with hierarchy) ─────────────────────────────────────
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["Asset", "Liability", "Equity", "Revenue", "Expense"]).notNull(),
  subtype: varchar("subtype", { length: 100 }),
  parentId: int("parentId"),
  isGroup: mysqlBoolean("isGroup").default(false).notNull(),
  nature: mysqlEnum("nature", ["Debit", "Credit"]).default("Debit").notNull(),
  openingBalance: decimal("openingBalance", { precision: 15, scale: 2 }).default("0").notNull(),
  description: text("acct_description"),
  isSystemAccount: mysqlBoolean("isSystemAccount").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// ─── Journal Entries (with source tracking) ─────────────────────────────────
export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("je_companyId"),
  entryId: varchar("entryId", { length: 20 }).notNull().unique(),
  date: varchar("date", { length: 10 }).notNull(),
  description: text("description"),
  posted: mysqlBoolean("posted").default(false).notNull(),
  sourceType: varchar("sourceType", { length: 30 }),
  sourceId: int("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;

export const journalLines = mysqlTable("journal_lines", {
  id: int("id").autoincrement().primaryKey(),
  journalEntryId: int("journalEntryId").notNull(),
  accountId: int("jl_accountId").notNull(),
  accountName: varchar("jl_accountName", { length: 200 }).notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0").notNull(),
  narration: varchar("jl_narration", { length: 500 }),
});

export type JournalLine = typeof journalLines.$inferSelect;

// ─── Customers ──────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("cust_companyId"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  gstin: varchar("cust_gstin", { length: 20 }),
  pan: varchar("cust_pan", { length: 15 }),
  state: varchar("cust_state", { length: 100 }),
  // Billing Address
  billingAddress1: varchar("cust_billing_addr1", { length: 500 }),
  billingAddress2: varchar("cust_billing_addr2", { length: 500 }),
  billingCity: varchar("cust_billing_city", { length: 100 }),
  billingState: varchar("cust_billing_state", { length: 100 }),
  billingPincode: varchar("cust_billing_pincode", { length: 10 }),
  // Shipping Address
  shippingAddress1: varchar("cust_shipping_addr1", { length: 500 }),
  shippingAddress2: varchar("cust_shipping_addr2", { length: 500 }),
  shippingCity: varchar("cust_shipping_city", { length: 100 }),
  shippingState: varchar("cust_shipping_state", { length: 100 }),
  shippingPincode: varchar("cust_shipping_pincode", { length: 10 }),
  // Legacy fields (kept for backward compat)
  city: varchar("city", { length: 100 }),
  address: text("address"),
  accountId: int("cust_accountId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;

// ─── Invoices ───────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("inv_companyId"),
  invoiceId: varchar("invoiceId", { length: 20 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["Draft", "Sent", "Paid", "Overdue"]).default("Draft").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
  cgst: decimal("inv_cgst", { precision: 15, scale: 2 }).default("0").notNull(),
  sgst: decimal("inv_sgst", { precision: 15, scale: 2 }).default("0").notNull(),
  igst: decimal("inv_igst", { precision: 15, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).default("0").notNull(),
  tcsSection: varchar("tcs_section", { length: 20 }),
  tcsRate: decimal("tcs_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  tcsAmount: decimal("tcs_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  tcsTotal: decimal("tcs_total", { precision: 15, scale: 2 }).default("0").notNull(),
  journalEntryId: int("inv_journalEntryId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;

export const invoiceLines = mysqlTable("invoice_lines", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  hsnCode: varchar("il_hsnCode", { length: 20 }),
  qty: int("qty").default(1).notNull(),
  rate: decimal("rate", { precision: 15, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 15, scale: 2 }).default("0").notNull(),
  gstRate: decimal("il_gstRate", { precision: 5, scale: 2 }).default("0").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0").notNull(),
});

export type InvoiceLine = typeof invoiceLines.$inferSelect;

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("vend_companyId"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  gstin: varchar("vend_gstin", { length: 20 }),
  pan: varchar("vend_pan", { length: 15 }),
  state: varchar("vend_state", { length: 100 }),
  category: varchar("category", { length: 100 }),
  // Billing Address
  billingAddress1: varchar("vend_billing_addr1", { length: 500 }),
  billingAddress2: varchar("vend_billing_addr2", { length: 500 }),
  billingCity: varchar("vend_billing_city", { length: 100 }),
  billingState: varchar("vend_billing_state", { length: 100 }),
  billingPincode: varchar("vend_billing_pincode", { length: 10 }),
  // Shipping Address
  shippingAddress1: varchar("vend_shipping_addr1", { length: 500 }),
  shippingAddress2: varchar("vend_shipping_addr2", { length: 500 }),
  shippingCity: varchar("vend_shipping_city", { length: 100 }),
  shippingState: varchar("vend_shipping_state", { length: 100 }),
  shippingPincode: varchar("vend_shipping_pincode", { length: 10 }),
  // Legacy fields (kept for backward compat)
  address: text("address"),
  accountId: int("vend_accountId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;

// ─── Bills ──────────────────────────────────────────────────────────────────
export const bills = mysqlTable("bills", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("bill_companyId"),
  billId: varchar("billId", { length: 20 }).notNull().unique(),
  vendorId: int("vendorId").notNull(),
  vendorName: varchar("vendorName", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  subtotal: decimal("bill_subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
  cgst: decimal("bill_cgst", { precision: 15, scale: 2 }).default("0").notNull(),
  sgst: decimal("bill_sgst", { precision: 15, scale: 2 }).default("0").notNull(),
  igst: decimal("bill_igst", { precision: 15, scale: 2 }).default("0").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("bill_status", ["Pending", "Paid"]).default("Pending").notNull(),
   description: text("description"),
  tdsSection: varchar("tds_section", { length: 20 }),
  tdsRate: decimal("tds_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  tdsAmount: decimal("tds_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  tdsNetPayable: decimal("tds_net_payable", { precision: 15, scale: 2 }).default("0").notNull(),
  journalEntryId: int("bill_journalEntryId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Bill = typeof bills.$inferSelect;

// ─── Inventory ──────────────────────────────────────────────────────────────
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("inv_item_companyId"),
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
  companyId: int("po_companyId"),
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
  companyId: int("emp_companyId"),
  empId: varchar("empId", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }),
  dept: varchar("dept", { length: 100 }),
  type: mysqlEnum("emp_type", ["Salaried", "Hourly"]).default("Salaried").notNull(),
  salary: decimal("salary", { precision: 15, scale: 2 }).default("0").notNull(),
  // Indian salary structure
  basicSalary: decimal("basicSalary", { precision: 15, scale: 2 }).default("0").notNull(),
  hra: decimal("hra", { precision: 15, scale: 2 }).default("0").notNull(),
  da: decimal("da", { precision: 15, scale: 2 }).default("0").notNull(),
  specialAllowance: decimal("specialAllowance", { precision: 15, scale: 2 }).default("0").notNull(),
  panNumber: varchar("panNumber", { length: 10 }),
  uanNumber: varchar("uanNumber", { length: 20 }),
  esiNumber: varchar("esiNumber", { length: 20 }),
  pfOptOut: mysqlBoolean("pfOptOut").default(false).notNull(),
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
  companyId: int("pr_companyId"),
  payrollId: varchar("payrollId", { length: 20 }).notNull().unique(),
  period: varchar("period", { length: 50 }).notNull(),
  runDate: varchar("runDate", { length: 10 }).notNull(),
  gross: decimal("gross", { precision: 15, scale: 2 }).default("0").notNull(),
  // Indian deductions
  basicPay: decimal("basicPay", { precision: 15, scale: 2 }).default("0").notNull(),
  hra_amt: decimal("hra_amt", { precision: 15, scale: 2 }).default("0").notNull(),
  da_amt: decimal("da_amt", { precision: 15, scale: 2 }).default("0").notNull(),
  specialAllow: decimal("specialAllow", { precision: 15, scale: 2 }).default("0").notNull(),
  pfEmployee: decimal("pfEmployee", { precision: 15, scale: 2 }).default("0").notNull(),
  pfEmployer: decimal("pfEmployer", { precision: 15, scale: 2 }).default("0").notNull(),
  esiEmployee: decimal("esiEmployee", { precision: 15, scale: 2 }).default("0").notNull(),
  esiEmployer: decimal("esiEmployer", { precision: 15, scale: 2 }).default("0").notNull(),
  professionalTax: decimal("professionalTax", { precision: 15, scale: 2 }).default("0").notNull(),
  tds: decimal("tds", { precision: 15, scale: 2 }).default("0").notNull(),
  // Legacy US fields (kept for backward compat)
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
  companyId: int("wh_companyId"),
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
  companyId: int("sc_companyId"),
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
  companyId: int("ds_companyId"),
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
  companyId: int("del_companyId"),
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
  companyId: int("set_companyId"),
  key: varchar("setting_key", { length: 100 }).notNull().unique(),
  value: text("setting_value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;

// ─── Sale Returns (Credit Notes) ───────────────────────────────────────────
export const saleReturns = mysqlTable("sale_returns", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("sr_companyId"),
  returnId: varchar("returnId", { length: 20 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  customerName: varchar("sr_customerName", { length: 200 }).notNull(),
  date: varchar("sr_date", { length: 10 }).notNull(),
  invoiceRef: varchar("invoiceRef", { length: 20 }),
  amount: decimal("sr_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  reason: text("reason"),
  journalEntryId: int("sr_journalEntryId"),
  createdAt: timestamp("sr_createdAt").defaultNow().notNull(),
});

export type SaleReturn = typeof saleReturns.$inferSelect;

// ─── Purchase Returns (Debit Notes) ────────────────────────────────────────
export const purchaseReturns = mysqlTable("purchase_returns", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("pret_companyId"),
  returnId: varchar("pr_returnId", { length: 20 }).notNull().unique(),
  vendorId: int("pr_vendorId").notNull(),
  vendorName: varchar("pr_vendorName", { length: 200 }).notNull(),
  date: varchar("pr_date", { length: 10 }).notNull(),
  billRef: varchar("billRef", { length: 20 }),
  amount: decimal("pr_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  reason: text("pr_reason"),
  journalEntryId: int("pr_journalEntryId"),
  createdAt: timestamp("pr_createdAt").defaultNow().notNull(),
});

export type PurchaseReturn = typeof purchaseReturns.$inferSelect;

// ─── Estimates / Quotations ────────────────────────────────────────────────
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("est_companyId"),
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
  companyId: int("pi_companyId"),
  paymentId: varchar("pi_paymentId", { length: 20 }).notNull().unique(),
  customerId: int("pi_customerId").notNull(),
  customerName: varchar("pi_customerName", { length: 200 }).notNull(),
  date: varchar("pi_date", { length: 10 }).notNull(),
  amount: decimal("pi_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  mode: varchar("pi_mode", { length: 50 }).default("Cash").notNull(),
  invoiceRef: varchar("pi_invoiceRef", { length: 20 }),
  notes: text("pi_notes"),
  journalEntryId: int("pi_journalEntryId"),
  createdAt: timestamp("pi_createdAt").defaultNow().notNull(),
});

export type PaymentIn = typeof paymentsIn.$inferSelect;

// ─── Payments Out (Payments to Vendors) ────────────────────────────────────
export const paymentsOut = mysqlTable("payments_out", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("pout_companyId"),
  paymentId: varchar("po_paymentId", { length: 20 }).notNull().unique(),
  vendorId: int("po_vendorId").notNull(),
  vendorName: varchar("po_vendorName", { length: 200 }).notNull(),
  date: varchar("po_date", { length: 10 }).notNull(),
  amount: decimal("po_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  mode: varchar("po_mode", { length: 50 }).default("Cash").notNull(),
  billRef: varchar("po_billRef", { length: 20 }),
  notes: text("po_notes"),
  journalEntryId: int("po_journalEntryId"),
  createdAt: timestamp("po_createdAt").defaultNow().notNull(),
});

export type PaymentOut = typeof paymentsOut.$inferSelect;

// ─── Cash & Bank Accounts ──────────────────────────────────────────────────
export const cashBankAccounts = mysqlTable("cash_bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("cb_companyId"),
  name: varchar("cb_name", { length: 200 }).notNull(),
  type: mysqlEnum("cb_type", ["Cash", "Bank", "UPI", "Wallet"]).default("Cash").notNull(),
  bankName: varchar("bankName", { length: 200 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  linkedAccountId: int("cb_linkedAccountId"),
  createdAt: timestamp("cb_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("cb_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CashBankAccount = typeof cashBankAccounts.$inferSelect;

// ─── Expenses ──────────────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("exp_companyId"),
  expenseId: varchar("expenseId", { length: 20 }).notNull().unique(),
  date: varchar("exp_date", { length: 10 }).notNull(),
  category: varchar("exp_category", { length: 100 }).notNull(),
  amount: decimal("exp_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  paymentMode: varchar("exp_paymentMode", { length: 50 }).default("Cash").notNull(),
  description: text("exp_description"),
  gstIncluded: mysqlBoolean("gstIncluded").default(false).notNull(),
  gstAmount: decimal("gstAmount", { precision: 15, scale: 2 }).default("0"),
  accountId: int("exp_accountId"),
  journalEntryId: int("exp_journalEntryId"),
  createdAt: timestamp("exp_createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;

// ─── Other Income ──────────────────────────────────────────────────────────
export const otherIncome = mysqlTable("other_income", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("oi_companyId"),
  incomeId: varchar("incomeId", { length: 20 }).notNull().unique(),
  date: varchar("oi_date", { length: 10 }).notNull(),
  category: varchar("oi_category", { length: 100 }).notNull(),
  amount: decimal("oi_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  paymentMode: varchar("oi_paymentMode", { length: 50 }).default("Cash").notNull(),
  description: text("oi_description"),
  accountId: int("oi_accountId"),
  journalEntryId: int("oi_journalEntryId"),
  createdAt: timestamp("oi_createdAt").defaultNow().notNull(),
});

export type OtherIncomeEntry = typeof otherIncome.$inferSelect;

// ─── Delivery Challans ────────────────────────────────────────────────────
export const deliveryChallans = mysqlTable("delivery_challans", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("dc_companyId"),
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
  companyId: int("pg_companyId"),
  name: varchar("pg_name", { length: 200 }).notNull(),
  type: mysqlEnum("pg_type", ["Customer", "Vendor"]).notNull(),
  description: text("pg_description"),
  createdAt: timestamp("pg_createdAt").defaultNow().notNull(),
});

export type PartyGroup = typeof partyGroups.$inferSelect;

// ─── Companies (Multi-Tenant) ─────────────────────────────────────────────
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("company_name", { length: 200 }).notNull(),
  slug: varchar("company_slug", { length: 100 }).notNull().unique(),
  gstin: varchar("company_gstin", { length: 20 }),
  pan: varchar("company_pan", { length: 15 }),
  address: text("company_address"),
  city: varchar("company_city", { length: 100 }),
  state: varchar("company_state", { length: 100 }),
  country: varchar("company_country", { length: 100 }).default("India"),
  phone: varchar("company_phone", { length: 20 }),
  email: varchar("company_email", { length: 320 }),
  logo: text("company_logo"),
  industry: varchar("company_industry", { length: 100 }),
  financialYearStart: varchar("fy_start", { length: 10 }).default("04-01"),
  ownerId: int("company_ownerId").notNull(),
  createdAt: timestamp("company_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("company_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ─── Company Members ──────────────────────────────────────────────────────
export const companyMembers = mysqlTable("company_members", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("cm_companyId").notNull(),
  userId: int("cm_userId").notNull(),
  role: mysqlEnum("cm_role", ["owner", "admin", "staff", "viewer"]).default("staff").notNull(),
  joinedAt: timestamp("cm_joinedAt").defaultNow().notNull(),
});
export type CompanyMember = typeof companyMembers.$inferSelect;

// ─── Subscriptions ────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("sub_companyId").notNull(),
  plan: mysqlEnum("sub_plan", ["starter", "professional", "enterprise"]).default("professional").notNull(),
  status: mysqlEnum("sub_status", ["trial", "active", "expired", "cancelled"]).default("trial").notNull(),
  trialStartDate: timestamp("sub_trialStartDate").defaultNow().notNull(),
  trialEndDate: timestamp("sub_trialEndDate").notNull(),
  subscriptionStartDate: timestamp("sub_subscriptionStartDate"),
  subscriptionEndDate: timestamp("sub_subscriptionEndDate"),
  paymentGateway: varchar("sub_paymentGateway", { length: 50 }),
  paymentId: varchar("sub_paymentId", { length: 200 }),
  amount: decimal("sub_amount", { precision: 10, scale: 2 }),
  currency: varchar("sub_currency", { length: 10 }).default("INR"),
  autoRenew: mysqlBoolean("sub_autoRenew").default(true),
  createdAt: timestamp("sub_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sub_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Company Invites ─────────────────────────────────────────────────────────
export const companyInvites = mysqlTable("company_invites", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("ci_companyId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: varchar("ci_role", { length: 20 }).default("staff").notNull(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  invitedBy: int("invitedBy").notNull(),
  createdAt: timestamp("ci_createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});
export type CompanyInvite = typeof companyInvites.$inferSelect;

// ─── Verification Codes ──────────────────────────────────────────────────────
export const verificationCodes = mysqlTable("verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("vc_userId").notNull(),
  type: varchar("vc_type", { length: 10 }).notNull(),
  target: varchar("vc_target", { length: 320 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  verified: mysqlBoolean("verified").default(false).notNull(),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("vc_createdAt").defaultNow().notNull(),
  expiresAt: timestamp("vc_expiresAt").notNull(),
});
export type VerificationCode = typeof verificationCodes.$inferSelect;
