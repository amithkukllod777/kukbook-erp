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
