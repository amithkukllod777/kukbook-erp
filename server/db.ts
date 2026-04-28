import { eq, sql, desc, asc, and, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, accounts, journalEntries, journalLines,
  customers, invoices, invoiceLines, vendors, bills,
  inventory, purchaseOrders, employees, payrollRuns,
  warehouses, supplyChainOrders, deliveryStaff, deliveries, settings,
  saleReturns, purchaseReturns, estimates, estimateLines,
  paymentsIn, paymentsOut, cashBankAccounts, expenses, otherIncome,
  deliveryChallans, partyGroups,
  companies, companyMembers, subscriptions
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) {
      console.warn("[Database] Failed to connect:", error); _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field]; if (value === undefined) return;
      const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Accounts ────────────────────────────────────────────────────────────────
export async function getAllAccounts(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(accounts).where(eq(accounts.companyId, companyId)).orderBy(asc(accounts.code));
}

export async function createAccount(companyId: number, data: { code: string; name: string; type: string; subtype?: string; balance?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(accounts).values({ ...data, companyId } as any);
}

export async function updateAccount(id: number, companyId: number, data: Partial<{ code: string; name: string; type: string; subtype: string; balance: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(accounts).set(data as any).where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)));
}

export async function deleteAccount(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)));
}

// ─── Journal Entries ─────────────────────────────────────────────────────────
export async function getAllJournalEntries(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const entries = await db.select().from(journalEntries).where(eq(journalEntries.companyId, companyId)).orderBy(desc(journalEntries.date));
  const lines = await db.select().from(journalLines);
  return entries.map(e => ({ ...e, lines: lines.filter(l => l.journalEntryId === e.id) }));
}

export async function createJournalEntry(companyId: number, data: { entryId: string; date: string; description: string; posted: boolean; lines: { account: string; debit: string; credit: string }[] }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(journalEntries).values({ entryId: data.entryId, date: data.date, description: data.description, posted: data.posted, companyId }).$returningId();
  if (data.lines.length > 0) {
    await db.insert(journalLines).values(data.lines.map(l => ({ journalEntryId: result.id, account: l.account, debit: l.debit, credit: l.credit })));
  }
}

export async function updateJournalEntry(id: number, companyId: number, data: { date: string; description: string; posted: boolean; lines: { account: string; debit: string; credit: string }[] }) {
  const db = await getDb(); if (!db) return;
  await db.update(journalEntries).set({ date: data.date, description: data.description, posted: data.posted }).where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, companyId)));
  await db.delete(journalLines).where(eq(journalLines.journalEntryId, id));
  if (data.lines.length > 0) {
    await db.insert(journalLines).values(data.lines.map(l => ({ journalEntryId: id, account: l.account, debit: l.debit, credit: l.credit })));
  }
}

export async function deleteJournalEntry(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(journalLines).where(eq(journalLines.journalEntryId, id));
  await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, companyId)));
}

// ─── Customers ───────────────────────────────────────────────────────────────
export async function getAllCustomers(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customers).where(eq(customers.companyId, companyId)).orderBy(asc(customers.name));
}

export async function createCustomer(companyId: number, data: { name: string; email?: string; phone?: string; city?: string; address?: string; balance?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(customers).values({ ...data, companyId } as any);
}

export async function updateCustomer(id: number, companyId: number, data: Partial<{ name: string; email: string; phone: string; city: string; address: string; balance: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(customers).set(data as any).where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
}

export async function deleteCustomer(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(customers).where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
}

// ─── Invoices ────────────────────────────────────────────────────────────────
export async function getAllInvoices(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const invs = await db.select().from(invoices).where(eq(invoices.companyId, companyId)).orderBy(desc(invoices.date));
  const lines = await db.select().from(invoiceLines);
  return invs.map(i => ({ ...i, lines: lines.filter(l => l.invoiceId === i.id) }));
}

export async function createInvoice(companyId: number, data: { invoiceId: string; customerId: number; customerName: string; date: string; dueDate: string; status: string; total: string; lines: { description: string; qty: number; rate: string; discount?: string; amount: string }[] }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(invoices).values({ invoiceId: data.invoiceId, customerId: data.customerId, customerName: data.customerName, date: data.date, dueDate: data.dueDate, status: data.status as any, total: data.total, companyId }).$returningId();
  if (data.lines.length > 0) {
    await db.insert(invoiceLines).values(data.lines.map(l => ({ invoiceId: result.id, description: l.description, qty: l.qty, rate: l.rate, discount: l.discount || '0', amount: l.amount })));
  }
}

export async function updateInvoiceStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(invoices).set({ status: status as any }).where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
}

export async function deleteInvoice(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
}

// ─── Vendors ─────────────────────────────────────────────────────────────────
export async function getAllVendors(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendors).where(eq(vendors.companyId, companyId)).orderBy(asc(vendors.name));
}

export async function createVendor(companyId: number, data: { name: string; email?: string; phone?: string; category?: string; address?: string; balance?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(vendors).values({ ...data, companyId } as any);
}

export async function updateVendor(id: number, companyId: number, data: Partial<{ name: string; email: string; phone: string; category: string; address: string; balance: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(vendors).set(data as any).where(and(eq(vendors.id, id), eq(vendors.companyId, companyId)));
}

export async function deleteVendor(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(vendors).where(and(eq(vendors.id, id), eq(vendors.companyId, companyId)));
}

// ─── Bills ───────────────────────────────────────────────────────────────────
export async function getAllBills(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bills).where(eq(bills.companyId, companyId)).orderBy(desc(bills.date));
}

export async function createBill(companyId: number, data: { billId: string; vendorId: number; vendorName: string; date: string; dueDate: string; amount: string; description?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(bills).values({ ...data, companyId } as any);
}

export async function updateBillStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(bills).set({ status: status as any }).where(and(eq(bills.id, id), eq(bills.companyId, companyId)));
}

export async function deleteBill(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(bills).where(and(eq(bills.id, id), eq(bills.companyId, companyId)));
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export async function getAllInventory(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(inventory).where(eq(inventory.companyId, companyId)).orderBy(asc(inventory.name));
}

export async function createInventoryItem(companyId: number, data: { sku: string; name: string; category?: string; qty: number; cost: string; reorder: number; warehouseId?: number; hsnCode?: string; gstRate?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(inventory).values({ ...data, companyId } as any);
}

export async function updateInventoryItem(id: number, companyId: number, data: Partial<{ sku: string; name: string; category: string; qty: number; cost: string; reorder: number; warehouseId: number; hsnCode: string; gstRate: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(inventory).set(data as any).where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
}

export async function deleteInventoryItem(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(inventory).where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────
export async function getAllPurchaseOrders(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(purchaseOrders).where(eq(purchaseOrders.companyId, companyId)).orderBy(desc(purchaseOrders.date));
}

export async function createPurchaseOrder(companyId: number, data: { poId: string; vendorId: number; vendorName: string; date: string; expectedDate?: string; total: string; description?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(purchaseOrders).values({ ...data, companyId } as any);
}

export async function updatePOStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(purchaseOrders).set({ status: status as any }).where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, companyId)));
}

export async function deletePurchaseOrder(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(purchaseOrders).where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, companyId)));
}

// ─── Employees ───────────────────────────────────────────────────────────────
export async function getAllEmployees(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(employees).where(eq(employees.companyId, companyId)).orderBy(asc(employees.name));
}

export async function createEmployee(companyId: number, data: { empId: string; name: string; title?: string; dept?: string; type: string; salary: string; rate: string; email?: string; startDate?: string; active: boolean }) {
  const db = await getDb(); if (!db) return;
  await db.insert(employees).values({ ...data, companyId } as any);
}

export async function updateEmployee(id: number, companyId: number, data: Partial<{ name: string; title: string; dept: string; type: string; salary: string; rate: string; email: string; startDate: string; active: boolean }>) {
  const db = await getDb(); if (!db) return;
  await db.update(employees).set(data as any).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
}

export async function deleteEmployee(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(employees).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
}

// ─── Payroll ─────────────────────────────────────────────────────────────────
export async function getAllPayrollRuns(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(payrollRuns).where(eq(payrollRuns.companyId, companyId)).orderBy(desc(payrollRuns.runDate));
}

export async function createPayrollRun(companyId: number, data: { payrollId: string; period: string; runDate: string; gross: string; fedTax: string; stateTax: string; ssMed: string; net: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(payrollRuns).values({ ...data, companyId } as any);
}

// ─── Warehouses ──────────────────────────────────────────────────────────────
export async function getAllWarehouses(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(warehouses).where(eq(warehouses.companyId, companyId)).orderBy(asc(warehouses.name));
}

export async function createWarehouse(companyId: number, data: { name: string; location?: string; capacity?: number; manager?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(warehouses).values({ ...data, companyId } as any);
}

export async function updateWarehouse(id: number, companyId: number, data: Partial<{ name: string; location: string; capacity: number; manager: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(warehouses).set(data as any).where(and(eq(warehouses.id, id), eq(warehouses.companyId, companyId)));
}

export async function deleteWarehouse(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(warehouses).where(and(eq(warehouses.id, id), eq(warehouses.companyId, companyId)));
}

// ─── Supply Chain ────────────────────────────────────────────────────────────
export async function getAllSupplyChainOrders(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(supplyChainOrders).where(eq(supplyChainOrders.companyId, companyId)).orderBy(desc(supplyChainOrders.orderDate));
}

export async function createSupplyChainOrder(companyId: number, data: { orderId: string; supplierName: string; itemName: string; qty: number; orderDate: string; expectedDate?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(supplyChainOrders).values({ ...data, companyId } as any);
}

export async function updateSCOrderStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(supplyChainOrders).set({ status: status as any }).where(and(eq(supplyChainOrders.id, id), eq(supplyChainOrders.companyId, companyId)));
}

export async function deleteSCOrder(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(supplyChainOrders).where(and(eq(supplyChainOrders.id, id), eq(supplyChainOrders.companyId, companyId)));
}

// ─── Delivery Staff ──────────────────────────────────────────────────────────
export async function getAllDeliveryStaff(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deliveryStaff).where(eq(deliveryStaff.companyId, companyId)).orderBy(asc(deliveryStaff.name));
}

export async function createDeliveryStaffMember(companyId: number, data: { staffId: string; name: string; phone?: string; email?: string; vehicleType?: string; vehicleNumber?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(deliveryStaff).values({ ...data, companyId } as any);
}

export async function updateDeliveryStaffMember(id: number, companyId: number, data: Partial<{ name: string; phone: string; email: string; vehicleType: string; vehicleNumber: string; active: boolean }>) {
  const db = await getDb(); if (!db) return;
  await db.update(deliveryStaff).set(data as any).where(and(eq(deliveryStaff.id, id), eq(deliveryStaff.companyId, companyId)));
}

export async function deleteDeliveryStaffMember(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(deliveryStaff).where(and(eq(deliveryStaff.id, id), eq(deliveryStaff.companyId, companyId)));
}

// ─── Deliveries ──────────────────────────────────────────────────────────────
export async function getAllDeliveries(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deliveries).where(eq(deliveries.companyId, companyId)).orderBy(desc(deliveries.createdAt));
}

export async function createDelivery(companyId: number, data: { deliveryId: string; staffId?: number; staffName?: string; customerName: string; address?: string; invoiceId?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(deliveries).values({ ...data, companyId } as any);
}

export async function updateDeliveryStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(deliveries).set({ status: status as any }).where(and(eq(deliveries.id, id), eq(deliveries.companyId, companyId)));
}

export async function assignDelivery(id: number, companyId: number, staffId: number, staffName: string) {
  const db = await getDb(); if (!db) return;
  await db.update(deliveries).set({ staffId, staffName, status: "Assigned" as any }).where(and(eq(deliveries.id, id), eq(deliveries.companyId, companyId)));
}

// ─── Settings ────────────────────────────────────────────────────────────────
export async function getAllSettings(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(settings).where(eq(settings.companyId, companyId));
}

export async function upsertSetting(companyId: number, key: string, value: string) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(settings).where(and(eq(settings.key, key), eq(settings.companyId, companyId))).limit(1);
  if (existing.length > 0) {
    await db.update(settings).set({ value }).where(and(eq(settings.key, key), eq(settings.companyId, companyId)));
  } else {
    await db.insert(settings).values({ key, value, companyId } as any);
  }
}

// ─── Dashboard Aggregates ────────────────────────────────────────────────────
export async function getDashboardData(companyId: number) {
  const db = await getDb(); if (!db) return null;
  const accts = await db.select().from(accounts).where(eq(accounts.companyId, companyId));
  const invs = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
  const bls = await db.select().from(bills).where(eq(bills.companyId, companyId));
  const inv = await db.select().from(inventory).where(eq(inventory.companyId, companyId));
  const jes = await db.select().from(journalEntries).where(eq(journalEntries.companyId, companyId));
  const sortedJes = jes.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const jeLines = await db.select().from(journalLines);
  const recentJEs = sortedJes.map(e => ({ ...e, lines: jeLines.filter(l => l.journalEntryId === e.id) }));

  const totalRevenue = accts.filter(a => a.type === 'Revenue').reduce((s, a) => s + Number(a.balance), 0);
  const totalExpenses = accts.filter(a => a.type === 'Expense').reduce((s, a) => s + Number(a.balance), 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalAssets = accts.filter(a => a.type === 'Asset').reduce((s, a) => s + Number(a.balance), 0);
  const arOutstanding = invs.filter(i => i.status !== 'Paid').reduce((s, i) => s + Number(i.total), 0);
  const apOutstanding = bls.filter(b => b.status === 'Pending').reduce((s, b) => s + Number(b.amount), 0);
  const inventoryValue = inv.reduce((s, i) => s + i.qty * Number(i.cost), 0);
  const lowStockItems = inv.filter(i => i.qty <= i.reorder);
  const upcomingBills = bls.filter(b => b.status === 'Pending').slice(0, 4);

  return {
    totalRevenue, totalExpenses, netIncome, totalAssets, arOutstanding, apOutstanding,
    inventoryValue, lowStockItems, upcomingBills, recentJEs
  };
}

// ─── Next ID helpers ─────────────────────────────────────────────────────────
export async function getNextId(table: string, prefix: string) {
  const db = await getDb(); if (!db) return `${prefix}-001`;
  let count = 0;
  if (table === 'invoices') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(invoices); count = r[0]?.c || 0; }
  else if (table === 'bills') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(bills); count = r[0]?.c || 0; }
  else if (table === 'journal_entries') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(journalEntries); count = r[0]?.c || 0; }
  else if (table === 'purchase_orders') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(purchaseOrders); count = r[0]?.c || 0; }
  else if (table === 'employees') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(employees); count = r[0]?.c || 0; }
  else if (table === 'payroll_runs') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(payrollRuns); count = r[0]?.c || 0; }
  else if (table === 'supply_chain_orders') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(supplyChainOrders); count = r[0]?.c || 0; }
  else if (table === 'delivery_staff') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(deliveryStaff); count = r[0]?.c || 0; }
  else if (table === 'deliveries') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(deliveries); count = r[0]?.c || 0; }
  else if (table === 'sale_returns') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(saleReturns); count = r[0]?.c || 0; }
  else if (table === 'purchase_returns') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(purchaseReturns); count = r[0]?.c || 0; }
  else if (table === 'estimates') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(estimates); count = r[0]?.c || 0; }
  else if (table === 'payments_in') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(paymentsIn); count = r[0]?.c || 0; }
  else if (table === 'payments_out') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(paymentsOut); count = r[0]?.c || 0; }
  else if (table === 'expenses') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(expenses); count = r[0]?.c || 0; }
  else if (table === 'other_income') { const r = await db.select({ c: sql<number>`COUNT(*)` }).from(otherIncome); count = r[0]?.c || 0; }
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// ─── Sale Returns ───────────────────────────────────────────────────────────
export async function getAllSaleReturns(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(saleReturns).where(eq(saleReturns.companyId, companyId)).orderBy(desc(saleReturns.createdAt));
}
export async function createSaleReturn(companyId: number, data: { returnId: string; customerId: number; customerName: string; date: string; invoiceRef?: string; amount: string; reason?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(saleReturns).values({ ...data, companyId } as any);
}
export async function deleteSaleReturn(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(saleReturns).where(and(eq(saleReturns.id, id), eq(saleReturns.companyId, companyId)));
}

// ─── Purchase Returns ───────────────────────────────────────────────────────
export async function getAllPurchaseReturns(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(purchaseReturns).where(eq(purchaseReturns.companyId, companyId)).orderBy(desc(purchaseReturns.createdAt));
}
export async function createPurchaseReturn(companyId: number, data: { returnId: string; vendorId: number; vendorName: string; date: string; billRef?: string; amount: string; reason?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(purchaseReturns).values({ ...data, companyId } as any);
}
export async function deletePurchaseReturn(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(purchaseReturns).where(and(eq(purchaseReturns.id, id), eq(purchaseReturns.companyId, companyId)));
}

// ─── Estimates ──────────────────────────────────────────────────────────────
export async function getAllEstimates(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const ests = await db.select().from(estimates).where(eq(estimates.companyId, companyId)).orderBy(desc(estimates.date));
  const lines = await db.select().from(estimateLines);
  return ests.map(e => ({ ...e, lines: lines.filter(l => l.estimateId === e.id) }));
}
export async function createEstimate(companyId: number, data: { estimateId: string; customerId: number; customerName: string; date: string; validUntil?: string; total: string; notes?: string; lines: { description: string; qty: number; rate: string; amount: string }[] }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(estimates).values({ estimateId: data.estimateId, customerId: data.customerId, customerName: data.customerName, date: data.date, validUntil: data.validUntil, total: data.total, notes: data.notes, companyId } as any).$returningId();
  if (data.lines.length > 0) {
    await db.insert(estimateLines).values(data.lines.map(l => ({ estimateId: result.id, description: l.description, qty: l.qty, rate: l.rate, amount: l.amount })));
  }
}
export async function updateEstimateStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(estimates).set({ status: status as any }).where(and(eq(estimates.id, id), eq(estimates.companyId, companyId)));
}
export async function deleteEstimate(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(estimateLines).where(eq(estimateLines.estimateId, id));
  await db.delete(estimates).where(and(eq(estimates.id, id), eq(estimates.companyId, companyId)));
}

// ─── Payments In ────────────────────────────────────────────────────────────
export async function getAllPaymentsIn(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(paymentsIn).where(eq(paymentsIn.companyId, companyId)).orderBy(desc(paymentsIn.date));
}
export async function createPaymentIn(companyId: number, data: { paymentId: string; customerId: number; customerName: string; date: string; amount: string; mode: string; invoiceRef?: string; notes?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(paymentsIn).values({ ...data, companyId } as any);
}
export async function deletePaymentIn(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(paymentsIn).where(and(eq(paymentsIn.id, id), eq(paymentsIn.companyId, companyId)));
}

// ─── Payments Out ───────────────────────────────────────────────────────────
export async function getAllPaymentsOut(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(paymentsOut).where(eq(paymentsOut.companyId, companyId)).orderBy(desc(paymentsOut.date));
}
export async function createPaymentOut(companyId: number, data: { paymentId: string; vendorId: number; vendorName: string; date: string; amount: string; mode: string; billRef?: string; notes?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(paymentsOut).values({ ...data, companyId } as any);
}
export async function deletePaymentOut(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(paymentsOut).where(and(eq(paymentsOut.id, id), eq(paymentsOut.companyId, companyId)));
}

// ─── Cash & Bank ────────────────────────────────────────────────────────────
export async function getAllCashBankAccounts(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(cashBankAccounts).where(eq(cashBankAccounts.companyId, companyId)).orderBy(asc(cashBankAccounts.name));
}
export async function createCashBankAccount(companyId: number, data: { name: string; type: string; bankName?: string; accountNumber?: string; balance?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(cashBankAccounts).values({ ...data, companyId } as any);
}
export async function updateCashBankAccount(id: number, companyId: number, data: Partial<{ name: string; type: string; bankName: string; accountNumber: string; balance: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(cashBankAccounts).set(data as any).where(and(eq(cashBankAccounts.id, id), eq(cashBankAccounts.companyId, companyId)));
}
export async function deleteCashBankAccount(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(cashBankAccounts).where(and(eq(cashBankAccounts.id, id), eq(cashBankAccounts.companyId, companyId)));
}

// ─── Expenses ───────────────────────────────────────────────────────────────
export async function getAllExpenses(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(expenses).where(eq(expenses.companyId, companyId)).orderBy(desc(expenses.date));
}
export async function createExpense(companyId: number, data: { expenseId: string; date: string; category: string; amount: string; paymentMode: string; description?: string; gstIncluded?: boolean; gstAmount?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(expenses).values({ ...data, companyId } as any);
}
export async function deleteExpense(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));
}

// ─── Other Income ───────────────────────────────────────────────────────────
export async function getAllOtherIncome(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(otherIncome).where(eq(otherIncome.companyId, companyId)).orderBy(desc(otherIncome.date));
}
export async function createOtherIncome(companyId: number, data: { incomeId: string; date: string; category: string; amount: string; paymentMode: string; description?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(otherIncome).values({ ...data, companyId } as any);
}
export async function deleteOtherIncome(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(otherIncome).where(and(eq(otherIncome.id, id), eq(otherIncome.companyId, companyId)));
}

// ─── Delivery Challans ──────────────────────────────────────────────────────
export async function getAllDeliveryChallans(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deliveryChallans).where(eq(deliveryChallans.companyId, companyId)).orderBy(desc(deliveryChallans.date));
}
export async function createDeliveryChallan(companyId: number, data: { challanId: string; customerId: number; customerName: string; date: string; invoiceRef?: string; items?: any; transportMode?: string; vehicleNumber?: string; notes?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(deliveryChallans).values({ ...data, companyId } as any);
}
export async function updateDeliveryChallanStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(deliveryChallans).set({ status: status as any }).where(and(eq(deliveryChallans.id, id), eq(deliveryChallans.companyId, companyId)));
}
export async function deleteDeliveryChallan(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(deliveryChallans).where(and(eq(deliveryChallans.id, id), eq(deliveryChallans.companyId, companyId)));
}

// ─── Party Groups ───────────────────────────────────────────────────────────
export async function getAllPartyGroups(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(partyGroups).where(eq(partyGroups.companyId, companyId)).orderBy(asc(partyGroups.name));
}
export async function createPartyGroup(companyId: number, data: { name: string; type: string; description?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(partyGroups).values({ ...data, companyId } as any);
}
export async function deletePartyGroup(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(partyGroups).where(and(eq(partyGroups.id, id), eq(partyGroups.companyId, companyId)));
}

// ─── GST Summary Report ────────────────────────────────────────────────────
export async function getGSTSummary(companyId: number) {
  const db = await getDb(); if (!db) return { salesGST: 0, purchaseGST: 0, expenseGST: 0, netGST: 0, invoices: [], bills: [], expenses: [] };
  const allInvoices = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
  const allBills = await db.select().from(bills).where(eq(bills.companyId, companyId));
  const allExpenses = await db.select().from(expenses).where(eq(expenses.companyId, companyId));
  const salesGST = allInvoices.reduce((sum, inv) => sum + Number(inv.total) * 0.18, 0);
  const purchaseGST = allBills.reduce((sum, b) => sum + Number(b.amount) * 0.18, 0);
  const expenseGST = allExpenses.filter(e => e.gstIncluded).reduce((sum, e) => sum + Number(e.gstAmount || 0), 0);
  return { salesGST: Math.round(salesGST * 100) / 100, purchaseGST: Math.round(purchaseGST * 100) / 100, expenseGST: Math.round(expenseGST * 100) / 100, netGST: Math.round((salesGST - purchaseGST - expenseGST) * 100) / 100, invoices: allInvoices, bills: allBills, expenses: allExpenses };
}

// ─── Day Book ───────────────────────────────────────────────────────────────
export async function getDayBook(companyId: number, date: string) {
  const db = await getDb(); if (!db) return { invoices: [], bills: [], paymentsIn: [], paymentsOut: [], expenses: [], otherIncome: [], journalEntries: [] };
  const dayInvoices = await db.select().from(invoices).where(and(eq(invoices.date, date), eq(invoices.companyId, companyId)));
  const dayBills = await db.select().from(bills).where(and(eq(bills.date, date), eq(bills.companyId, companyId)));
  const dayPI = await db.select().from(paymentsIn).where(and(eq(paymentsIn.date, date), eq(paymentsIn.companyId, companyId)));
  const dayPO = await db.select().from(paymentsOut).where(and(eq(paymentsOut.date, date), eq(paymentsOut.companyId, companyId)));
  const dayExp = await db.select().from(expenses).where(and(eq(expenses.date, date), eq(expenses.companyId, companyId)));
  const dayOI = await db.select().from(otherIncome).where(and(eq(otherIncome.date, date), eq(otherIncome.companyId, companyId)));
  const dayJE = await db.select().from(journalEntries).where(and(eq(journalEntries.date, date), eq(journalEntries.companyId, companyId)));
  return { invoices: dayInvoices, bills: dayBills, paymentsIn: dayPI, paymentsOut: dayPO, expenses: dayExp, otherIncome: dayOI, journalEntries: dayJE };
}

// ─── Cashflow Report ────────────────────────────────────────────────────────
export async function getCashflowReport(companyId: number) {
  const db = await getDb(); if (!db) return { inflows: 0, outflows: 0, net: 0, details: [] };
  const allPI = await db.select().from(paymentsIn).where(eq(paymentsIn.companyId, companyId));
  const allPO = await db.select().from(paymentsOut).where(eq(paymentsOut.companyId, companyId));
  const allOI = await db.select().from(otherIncome).where(eq(otherIncome.companyId, companyId));
  const allExp = await db.select().from(expenses).where(eq(expenses.companyId, companyId));
  const inflows = allPI.reduce((s, p) => s + Number(p.amount), 0) + allOI.reduce((s, o) => s + Number(o.amount), 0);
  const outflows = allPO.reduce((s, p) => s + Number(p.amount), 0) + allExp.reduce((s, e) => s + Number(e.amount), 0);
  return { inflows: Math.round(inflows * 100) / 100, outflows: Math.round(outflows * 100) / 100, net: Math.round((inflows - outflows) * 100) / 100, paymentsIn: allPI, paymentsOut: allPO, otherIncome: allOI, expenses: allExp };
}

// ─── Aging Report (Overdue Invoices) ────────────────────────────────────────
export async function getAgingReport(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const allInvoices = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
  const today = new Date().toISOString().split('T')[0];
  return allInvoices.filter(inv => inv.status !== 'Paid' && inv.dueDate < today).map(inv => {
    const daysOverdue = Math.floor((new Date(today).getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    let bucket = '0-30';
    if (daysOverdue > 90) bucket = '90+';
    else if (daysOverdue > 60) bucket = '61-90';
    else if (daysOverdue > 30) bucket = '31-60';
    return { ...inv, daysOverdue, bucket };
  });
}

// ─── Stock Summary Report ───────────────────────────────────────────────────
export async function getStockSummary(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(inventory).where(eq(inventory.companyId, companyId)).orderBy(asc(inventory.category), asc(inventory.name));
}

// ─── Party Statement ────────────────────────────────────────────────────────
export async function getPartyStatement(companyId: number, partyType: string, partyId: number) {
  const db = await getDb(); if (!db) return { party: null, transactions: [] };
  const txns: { date: string; type: string; ref: string; debit: number; credit: number }[] = [];
  if (partyType === 'customer') {
    const cust = await db.select().from(customers).where(and(eq(customers.id, partyId), eq(customers.companyId, companyId))).limit(1);
    const custInvoices = await db.select().from(invoices).where(and(eq(invoices.customerId, partyId), eq(invoices.companyId, companyId)));
    const custPayments = await db.select().from(paymentsIn).where(and(eq(paymentsIn.customerId, partyId), eq(paymentsIn.companyId, companyId)));
    const custReturns = await db.select().from(saleReturns).where(and(eq(saleReturns.customerId, partyId), eq(saleReturns.companyId, companyId)));
    custInvoices.forEach(inv => txns.push({ date: inv.date, type: 'Invoice', ref: inv.invoiceId, debit: Number(inv.total), credit: 0 }));
    custPayments.forEach(p => txns.push({ date: p.date, type: 'Payment In', ref: p.paymentId, debit: 0, credit: Number(p.amount) }));
    custReturns.forEach(r => txns.push({ date: r.date, type: 'Sale Return', ref: r.returnId, debit: 0, credit: Number(r.amount) }));
    txns.sort((a, b) => a.date.localeCompare(b.date));
    return { party: cust[0] || null, transactions: txns };
  } else {
    const vend = await db.select().from(vendors).where(and(eq(vendors.id, partyId), eq(vendors.companyId, companyId))).limit(1);
    const vendBills = await db.select().from(bills).where(and(eq(bills.vendorId, partyId), eq(bills.companyId, companyId)));
    const vendPayments = await db.select().from(paymentsOut).where(and(eq(paymentsOut.vendorId, partyId), eq(paymentsOut.companyId, companyId)));
    const vendReturns = await db.select().from(purchaseReturns).where(and(eq(purchaseReturns.vendorId, partyId), eq(purchaseReturns.companyId, companyId)));
    vendBills.forEach(b => txns.push({ date: b.date, type: 'Bill', ref: b.billId, debit: 0, credit: Number(b.amount) }));
    vendPayments.forEach(p => txns.push({ date: p.date, type: 'Payment Out', ref: p.paymentId, debit: Number(p.amount), credit: 0 }));
    vendReturns.forEach(r => txns.push({ date: r.date, type: 'Purchase Return', ref: r.returnId, debit: Number(r.amount), credit: 0 }));
    txns.sort((a, b) => a.date.localeCompare(b.date));
    return { party: vend[0] || null, transactions: txns };
  }
}

// ─── Company (Multi-Tenant) ─────────────────────────────────────────────
export async function createCompany(data: { name: string; slug: string; gstin?: string; pan?: string; address?: string; city?: string; state?: string; phone?: string; email?: string; industry?: string; ownerId: number }) {
  const db = await getDb(); if (!db) return null;
  const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 30);
  const [result] = await db.insert(companies).values(data as any).$returningId();
  await db.insert(subscriptions).values({ companyId: result.id, plan: "professional", status: "trial", trialStartDate: new Date(), trialEndDate: trialEnd } as any);
  await db.insert(companyMembers).values({ companyId: result.id, userId: data.ownerId, role: "owner" } as any);
  return result;
}

export async function getCompanies() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(companies).orderBy(desc(companies.createdAt));
}

export async function getCompanyBySlug(slug: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function getCompanyById(id: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return rows[0] || null;
}

export async function getUserCompanies(userId: number) {
  const db = await getDb(); if (!db) return [];
  const memberships = await db.select().from(companyMembers).where(eq(companyMembers.userId, userId));
  if (memberships.length === 0) return [];
  const companyIds = memberships.map(m => m.companyId);
  const allCompanies = await db.select().from(companies);
  return allCompanies.filter(c => companyIds.includes(c.id)).map(c => {
    const membership = memberships.find(m => m.companyId === c.id);
    return { ...c, memberRole: membership?.role };
  });
}

export async function updateCompany(id: number, data: Partial<{ name: string; gstin: string; pan: string; address: string; city: string; state: string; phone: string; email: string; logo: string; industry: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(companies).set(data as any).where(eq(companies.id, id));
}

// ─── Company Members ──────────────────────────────────────────────────────
export async function getCompanyMembers(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const members = await db.select().from(companyMembers).where(eq(companyMembers.companyId, companyId));
  const allUsers = await db.select().from(users);
  return members.map(m => {
    const user = allUsers.find(u => u.id === m.userId);
    return { ...m, userName: user?.name, userEmail: user?.email };
  });
}

export async function addCompanyMember(companyId: number, userId: number, role: string) {
  const db = await getDb(); if (!db) return;
  await db.insert(companyMembers).values({ companyId, userId, role } as any);
}

export async function removeCompanyMember(companyId: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(companyMembers).where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)));
}

// ─── Subscriptions ────────────────────────────────────────────────────────
export async function getSubscription(companyId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.companyId, companyId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  return rows[0] || null;
}

export async function updateSubscription(id: number, data: Partial<{ plan: string; status: string; paymentGateway: string; paymentId: string; amount: string; subscriptionStartDate: Date; subscriptionEndDate: Date; autoRenew: boolean }>) {
  const db = await getDb(); if (!db) return;
  await db.update(subscriptions).set(data as any).where(eq(subscriptions.id, id));
}

export async function getTrialStatus(companyId: number) {
  const sub = await getSubscription(companyId);
  if (!sub) return { isTrialActive: false, daysLeft: 0, plan: 'none', status: 'expired' };
  const now = new Date();
  const trialEnd = new Date(sub.trialEndDate);
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isTrialActive = sub.status === 'trial' && daysLeft > 0;
  return { isTrialActive, daysLeft, plan: sub.plan, status: sub.status, trialEndDate: sub.trialEndDate, subscriptionEndDate: sub.subscriptionEndDate };
}
