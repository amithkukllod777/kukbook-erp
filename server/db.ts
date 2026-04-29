import crypto from "crypto";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, accounts, journalEntries, journalLines,
  customers, invoices, invoiceLines, vendors, bills,
  inventory, purchaseOrders, employees, payrollRuns,
  warehouses, supplyChainOrders, deliveryStaff, deliveries, settings,
  saleReturns, purchaseReturns, estimates, estimateLines,
  paymentsIn, paymentsOut, cashBankAccounts, expenses, otherIncome,
  deliveryChallans, partyGroups,
  companies, companyMembers, subscriptions, companyInvites, verificationCodes,
  recurringInvoices, activityLogs, bankReconciliations, bankReconciliationItems,
  proformaInvoices, inventoryBatches, approvalWorkflows, ewayBills
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
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0] || null;
}

export async function getAllUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTING ENGINE — Journal-Driven Double-Entry Bookkeeping
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Chart of Accounts ──────────────────────────────────────────────────────
export async function getAllAccounts(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(accounts).where(eq(accounts.companyId, companyId)).orderBy(asc(accounts.code));
}

export async function getAccountById(companyId: number, accountId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.companyId, companyId))).limit(1);
  return rows[0] || null;
}

export async function findAccountByName(companyId: number, name: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(accounts).where(and(eq(accounts.name, name), eq(accounts.companyId, companyId))).limit(1);
  return rows[0] || null;
}

export async function createAccount(companyId: number, data: {
  code: string; name: string; type: string; subtype?: string;
  parentId?: number; isGroup?: boolean; nature?: string;
  openingBalance?: string; description?: string; isSystemAccount?: boolean;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(accounts).values({
    code: data.code, name: data.name, type: data.type as any,
    subtype: data.subtype, parentId: data.parentId,
    isGroup: data.isGroup || false,
    nature: (data.nature || (data.type === 'Asset' || data.type === 'Expense' ? 'Debit' : 'Credit')) as any,
    openingBalance: data.openingBalance || '0',
    description: data.description,
    isSystemAccount: data.isSystemAccount || false,
    companyId
  } as any);
}

export async function updateAccount(id: number, companyId: number, data: Partial<{
  code: string; name: string; type: string; subtype: string;
  parentId: number; isGroup: boolean; nature: string;
  openingBalance: string; description: string;
}>) {
  const db = await getDb(); if (!db) return;
  await db.update(accounts).set(data as any).where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)));
}

export async function deleteAccount(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  // Check if account has journal lines
  const lines = await (await getDb())!.select({ c: sql<number>`COUNT(*)` }).from(journalLines).where(eq(journalLines.accountId, id));
  if (lines[0]?.c > 0) throw new Error("Cannot delete account with journal entries");
  // Check if account has children
  const children = await (await getDb())!.select({ c: sql<number>`COUNT(*)` }).from(accounts).where(and(eq(accounts.parentId, id), eq(accounts.companyId, companyId)));
  if (children[0]?.c > 0) throw new Error("Cannot delete group account with children");
  await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)));
}

// ─── Default Indian COA Seeding ─────────────────────────────────────────────
export async function seedDefaultCOA(companyId: number) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select({ c: sql<number>`COUNT(*)` }).from(accounts).where(eq(accounts.companyId, companyId));
  if (existing[0]?.c > 0) return; // Already seeded

  const coa: { code: string; name: string; type: string; nature: string; isGroup: boolean; parentCode?: string; isSystem?: boolean }[] = [
    // Asset Groups
    { code: '1000', name: 'Assets', type: 'Asset', nature: 'Debit', isGroup: true, isSystem: true },
    { code: '1100', name: 'Current Assets', type: 'Asset', nature: 'Debit', isGroup: true, parentCode: '1000' },
    { code: '1101', name: 'Cash', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100', isSystem: true },
    { code: '1102', name: 'Bank Accounts', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100', isSystem: true },
    { code: '1103', name: 'Accounts Receivable', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100', isSystem: true },
    { code: '1104', name: 'Inventory', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100' },
    { code: '1105', name: 'Advance Tax', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100' },
    { code: '1106', name: 'CGST Input', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100', isSystem: true },
    { code: '1107', name: 'SGST Input', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100', isSystem: true },
    { code: '1108', name: 'IGST Input', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1100', isSystem: true },
    { code: '1200', name: 'Fixed Assets', type: 'Asset', nature: 'Debit', isGroup: true, parentCode: '1000' },
    { code: '1201', name: 'Furniture & Fixtures', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1200' },
    { code: '1202', name: 'Plant & Machinery', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1200' },
    { code: '1203', name: 'Vehicles', type: 'Asset', nature: 'Debit', isGroup: false, parentCode: '1200' },
    // Liability Groups
    { code: '2000', name: 'Liabilities', type: 'Liability', nature: 'Credit', isGroup: true, isSystem: true },
    { code: '2100', name: 'Current Liabilities', type: 'Liability', nature: 'Credit', isGroup: true, parentCode: '2000' },
    { code: '2101', name: 'Accounts Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100', isSystem: true },
    { code: '2102', name: 'CGST Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100', isSystem: true },
    { code: '2103', name: 'SGST Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100', isSystem: true },
    { code: '2104', name: 'IGST Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100', isSystem: true },
    { code: '2105', name: 'TDS Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100' },
    { code: '2106', name: 'TCS Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100' },
    { code: '2106', name: 'Salary Payable', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2100' },
    { code: '2200', name: 'Long-term Liabilities', type: 'Liability', nature: 'Credit', isGroup: true, parentCode: '2000' },
    { code: '2201', name: 'Loans', type: 'Liability', nature: 'Credit', isGroup: false, parentCode: '2200' },
    // Equity
    { code: '3000', name: 'Equity', type: 'Equity', nature: 'Credit', isGroup: true, isSystem: true },
    { code: '3001', name: 'Capital Account', type: 'Equity', nature: 'Credit', isGroup: false, parentCode: '3000' },
    { code: '3002', name: 'Reserves & Surplus', type: 'Equity', nature: 'Credit', isGroup: false, parentCode: '3000' },
    { code: '3003', name: 'Retained Earnings', type: 'Equity', nature: 'Credit', isGroup: false, parentCode: '3000', isSystem: true },
    // Revenue
    { code: '4000', name: 'Revenue', type: 'Revenue', nature: 'Credit', isGroup: true, isSystem: true },
    { code: '4001', name: 'Sales', type: 'Revenue', nature: 'Credit', isGroup: false, parentCode: '4000', isSystem: true },
    { code: '4002', name: 'Other Income', type: 'Revenue', nature: 'Credit', isGroup: false, parentCode: '4000', isSystem: true },
    { code: '4003', name: 'Interest Income', type: 'Revenue', nature: 'Credit', isGroup: false, parentCode: '4000' },
    // Expenses
    { code: '5000', name: 'Expenses', type: 'Expense', nature: 'Debit', isGroup: true, isSystem: true },
    { code: '5001', name: 'Cost of Goods Sold', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
    { code: '5002', name: 'Salaries & Wages', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
    { code: '5003', name: 'Rent', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
    { code: '5004', name: 'Utilities', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
    { code: '5005', name: 'Office Supplies', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
    { code: '5006', name: 'Depreciation', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
    { code: '5007', name: 'Purchases', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000', isSystem: true },
    { code: '5008', name: 'General Expenses', type: 'Expense', nature: 'Debit', isGroup: false, parentCode: '5000' },
  ];

  // Insert in order, build parentId map
  const codeToId: Record<string, number> = {};
  for (const acct of coa) {
    const parentId = acct.parentCode ? codeToId[acct.parentCode] : undefined;
    const [result] = await db.insert(accounts).values({
      code: acct.code, name: acct.name, type: acct.type as any,
      nature: acct.nature as any, isGroup: acct.isGroup,
      parentId: parentId || null,
      isSystemAccount: acct.isSystem || false,
      openingBalance: '0', companyId
    } as any).$returningId();
    codeToId[acct.code] = result.id;
  }
}

// ─── Journal Entry Engine ───────────────────────────────────────────────────
export async function getAllJournalEntries(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const entries = await db.select().from(journalEntries).where(eq(journalEntries.companyId, companyId)).orderBy(desc(journalEntries.date));
  if (entries.length === 0) return [];
  const entryIds = entries.map(e => e.id);
  const lines = await db.select().from(journalLines).where(inArray(journalLines.journalEntryId, entryIds));
  return entries.map(e => ({ ...e, lines: lines.filter(l => l.journalEntryId === e.id) }));
}

export async function createJournalEntry(companyId: number, data: {
  entryId: string; date: string; description: string; posted: boolean;
  sourceType?: string; sourceId?: number;
  lines: { accountId: number; accountName: string; debit: string; credit: string; narration?: string }[]
}) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(journalEntries).values({
    entryId: data.entryId, date: data.date, description: data.description,
    posted: data.posted, sourceType: data.sourceType || 'manual',
    sourceId: data.sourceId, companyId
  } as any).$returningId();
  if (data.lines.length > 0) {
    await db.insert(journalLines).values(data.lines.map(l => ({
      journalEntryId: result.id,
      accountId: l.accountId,
      accountName: l.accountName,
      debit: l.debit, credit: l.credit,
      narration: l.narration
    })));
  }
  return result.id;
}

export async function updateJournalEntry(id: number, companyId: number, data: {
  date: string; description: string; posted: boolean;
  lines: { accountId: number; accountName: string; debit: string; credit: string; narration?: string }[]
}) {
  const db = await getDb(); if (!db) return;
  await db.update(journalEntries).set({ date: data.date, description: data.description, posted: data.posted })
    .where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, companyId)));
  await db.delete(journalLines).where(eq(journalLines.journalEntryId, id));
  if (data.lines.length > 0) {
    await db.insert(journalLines).values(data.lines.map(l => ({
      journalEntryId: id, accountId: l.accountId, accountName: l.accountName,
      debit: l.debit, credit: l.credit, narration: l.narration
    })));
  }
}

export async function deleteJournalEntry(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  // Check if it's a system-generated entry
  const entry = await db.select().from(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, companyId))).limit(1);
  if (entry[0]?.sourceType && entry[0].sourceType !== 'manual') {
    throw new Error("Cannot delete auto-generated journal entries. Delete the source document instead.");
  }
  await db.delete(journalLines).where(eq(journalLines.journalEntryId, id));
  await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, companyId)));
}

// ─── Auto-Post Journal Entry Helper ─────────────────────────────────────────
async function autoPostJournalEntry(companyId: number, data: {
  date: string; description: string; sourceType: string; sourceId: number;
  lines: { accountId: number; accountName: string; debit: string; credit: string }[]
}): Promise<number | null> {
  const db = await getDb(); if (!db) return null;
  const nextId = await getNextId('journal_entries', 'JE');
  return createJournalEntry(companyId, {
    entryId: nextId, date: data.date, description: data.description,
    posted: true, sourceType: data.sourceType, sourceId: data.sourceId,
    lines: data.lines
  });
}

// Helper to find or create a system account by name
async function getSystemAccount(companyId: number, name: string): Promise<{ id: number; name: string } | null> {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(accounts).where(and(eq(accounts.name, name), eq(accounts.companyId, companyId))).limit(1);
  return rows[0] ? { id: rows[0].id, name: rows[0].name } : null;
}

// ─── Computed Account Balance from Journal Lines ────────────────────────────
export async function getAccountBalance(companyId: number, accountId: number): Promise<number> {
  const db = await getDb(); if (!db) return 0;
  // Get the account to know its nature
  const acct = await db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.companyId, companyId))).limit(1);
  if (!acct[0]) return 0;
  // Get opening balance
  const opening = Number(acct[0].openingBalance) || 0;
  // Sum journal lines for this account (only from posted entries)
  const postedEntries = await db.select({ id: journalEntries.id }).from(journalEntries)
    .where(and(eq(journalEntries.companyId, companyId), eq(journalEntries.posted, true)));
  if (postedEntries.length === 0) return opening;
  const entryIds = postedEntries.map(e => e.id);
  const sums = await db.select({
    totalDebit: sql<string>`COALESCE(SUM(debit), 0)`,
    totalCredit: sql<string>`COALESCE(SUM(credit), 0)`
  }).from(journalLines).where(and(eq(journalLines.accountId, accountId), inArray(journalLines.journalEntryId, entryIds)));
  const totalDebit = Number(sums[0]?.totalDebit) || 0;
  const totalCredit = Number(sums[0]?.totalCredit) || 0;
  // Debit-nature accounts: balance = opening + debits - credits
  // Credit-nature accounts: balance = opening + credits - debits
  if (acct[0].nature === 'Debit') return opening + totalDebit - totalCredit;
  return opening + totalCredit - totalDebit;
}

// Get all account balances at once (efficient)
export async function getAllAccountBalances(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const allAccounts = await db.select().from(accounts).where(eq(accounts.companyId, companyId)).orderBy(asc(accounts.code));
  // Get all posted entry IDs
  const postedEntries = await db.select({ id: journalEntries.id }).from(journalEntries)
    .where(and(eq(journalEntries.companyId, companyId), eq(journalEntries.posted, true)));
  const entryIds = postedEntries.map(e => e.id);
  // Get all journal line sums grouped by account
  let lineSums: { accountId: number; totalDebit: string; totalCredit: string }[] = [];
  if (entryIds.length > 0) {
    lineSums = await db.select({
      accountId: journalLines.accountId,
      totalDebit: sql<string>`COALESCE(SUM(debit), 0)`,
      totalCredit: sql<string>`COALESCE(SUM(credit), 0)`
    }).from(journalLines).where(inArray(journalLines.journalEntryId, entryIds))
      .groupBy(journalLines.accountId) as any;
  }
  const sumsMap = new Map(lineSums.map(s => [s.accountId, s]));
  return allAccounts.map(acct => {
    const opening = Number(acct.openingBalance) || 0;
    const sums = sumsMap.get(acct.id);
    const totalDebit = Number(sums?.totalDebit) || 0;
    const totalCredit = Number(sums?.totalCredit) || 0;
    const balance = acct.nature === 'Debit'
      ? opening + totalDebit - totalCredit
      : opening + totalCredit - totalDebit;
    return { ...acct, balance: Math.round(balance * 100) / 100, totalDebit, totalCredit };
  });
}

// ─── General Ledger (account-wise transaction history) ──────────────────────
export async function getGeneralLedger(companyId: number, accountId: number) {
  const db = await getDb(); if (!db) return { account: null, entries: [] };
  const acct = await db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.companyId, companyId))).limit(1);
  if (!acct[0]) return { account: null, entries: [] };
  // Get all posted journal entries that have lines for this account
  const lines = await db.select({
    lineId: journalLines.id,
    journalEntryId: journalLines.journalEntryId,
    debit: journalLines.debit,
    credit: journalLines.credit,
    narration: journalLines.narration,
  }).from(journalLines).where(eq(journalLines.accountId, accountId));
  if (lines.length === 0) return { account: acct[0], entries: [] };
  const entryIds = Array.from(new Set(lines.map(l => l.journalEntryId)));
  const entries = await db.select().from(journalEntries)
    .where(and(inArray(journalEntries.id, entryIds), eq(journalEntries.companyId, companyId)))
    .orderBy(asc(journalEntries.date));
  // Build ledger with running balance
  let runningBalance = Number(acct[0].openingBalance) || 0;
  const ledgerEntries = entries.filter(e => e.posted).map(entry => {
    const entryLines = lines.filter(l => l.journalEntryId === entry.id);
    const debit = entryLines.reduce((s, l) => s + Number(l.debit), 0);
    const credit = entryLines.reduce((s, l) => s + Number(l.credit), 0);
    if (acct[0].nature === 'Debit') runningBalance += debit - credit;
    else runningBalance += credit - debit;
    return {
      date: entry.date, entryId: entry.entryId, description: entry.description,
      sourceType: entry.sourceType, debit, credit,
      balance: Math.round(runningBalance * 100) / 100
    };
  });
  return { account: acct[0], entries: ledgerEntries };
}

// ─── Trial Balance ──────────────────────────────────────────────────────────
export async function getTrialBalance(companyId: number) {
  const balances = await getAllAccountBalances(companyId);
  // Only include non-group (ledger) accounts with non-zero balance
  const ledgerAccounts = balances.filter(a => !a.isGroup);
  let totalDebit = 0, totalCredit = 0;
  const rows = ledgerAccounts.map(a => {
    const debitBal = a.balance > 0 && a.nature === 'Debit' ? a.balance : (a.balance < 0 && a.nature === 'Credit' ? Math.abs(a.balance) : 0);
    const creditBal = a.balance > 0 && a.nature === 'Credit' ? a.balance : (a.balance < 0 && a.nature === 'Debit' ? Math.abs(a.balance) : 0);
    // Simpler: for Debit-nature accounts, positive balance goes to debit column
    // For Credit-nature accounts, positive balance goes to credit column
    const dr = a.nature === 'Debit' ? (a.balance >= 0 ? a.balance : 0) : (a.balance < 0 ? Math.abs(a.balance) : 0);
    const cr = a.nature === 'Credit' ? (a.balance >= 0 ? a.balance : 0) : (a.balance < 0 ? Math.abs(a.balance) : 0);
    totalDebit += dr;
    totalCredit += cr;
    return { id: a.id, code: a.code, name: a.name, type: a.type, debit: Math.round(dr * 100) / 100, credit: Math.round(cr * 100) / 100 };
  }).filter(r => r.debit !== 0 || r.credit !== 0);
  return { rows, totalDebit: Math.round(totalDebit * 100) / 100, totalCredit: Math.round(totalCredit * 100) / 100 };
}

// ─── Profit & Loss ──────────────────────────────────────────────────────────
export async function getProfitAndLoss(companyId: number) {
  const balances = await getAllAccountBalances(companyId);
  const revenueAccounts = balances.filter(a => a.type === 'Revenue' && !a.isGroup);
  const expenseAccounts = balances.filter(a => a.type === 'Expense' && !a.isGroup);
  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  return {
    revenue: revenueAccounts.map(a => ({ id: a.id, code: a.code, name: a.name, amount: a.balance })),
    expenses: expenseAccounts.map(a => ({ id: a.id, code: a.code, name: a.name, amount: a.balance })),
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100
  };
}

// ─── Balance Sheet ──────────────────────────────────────────────────────────
export async function getBalanceSheet(companyId: number) {
  const balances = await getAllAccountBalances(companyId);
  const assetAccounts = balances.filter(a => a.type === 'Asset' && !a.isGroup);
  const liabilityAccounts = balances.filter(a => a.type === 'Liability' && !a.isGroup);
  const equityAccounts = balances.filter(a => a.type === 'Equity' && !a.isGroup);
  // Net income goes to retained earnings
  const revenueAccounts = balances.filter(a => a.type === 'Revenue' && !a.isGroup);
  const expenseAccounts = balances.filter(a => a.type === 'Expense' && !a.isGroup);
  const netIncome = revenueAccounts.reduce((s, a) => s + a.balance, 0) - expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equityAccounts.reduce((s, a) => s + a.balance, 0) + netIncome;
  return {
    assets: assetAccounts.map(a => ({ id: a.id, code: a.code, name: a.name, amount: a.balance })),
    liabilities: liabilityAccounts.map(a => ({ id: a.id, code: a.code, name: a.name, amount: a.balance })),
    equity: equityAccounts.map(a => ({ id: a.id, code: a.code, name: a.name, amount: a.balance })),
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
  };
}

// ─── Customers ──────────────────────────────────────────────────────────────
export async function getAllCustomers(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customers).where(eq(customers.companyId, companyId)).orderBy(asc(customers.name));
}

export async function createCustomer(companyId: number, data: { name: string; email?: string; phone?: string; gstin?: string; pan?: string; state?: string; city?: string; address?: string; billingAddress1?: string; billingAddress2?: string; billingCity?: string; billingState?: string; billingPincode?: string; shippingAddress1?: string; shippingAddress2?: string; shippingCity?: string; shippingState?: string; shippingPincode?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(customers).values({ ...data, companyId } as any);
}

export async function updateCustomer(id: number, companyId: number, data: Partial<{ name: string; email: string; phone: string; gstin: string; pan: string; state: string; city: string; address: string; billingAddress1: string; billingAddress2: string; billingCity: string; billingState: string; billingPincode: string; shippingAddress1: string; shippingAddress2: string; shippingCity: string; shippingState: string; shippingPincode: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(customers).set(data as any).where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
}

export async function deleteCustomer(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(customers).where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
}

// ─── Invoices (with auto journal entry) ─────────────────────────────────────
export async function getAllInvoices(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const invs = await db.select().from(invoices).where(eq(invoices.companyId, companyId)).orderBy(desc(invoices.date));
  if (invs.length === 0) return [];
  const invIds = invs.map(i => i.id);
  const lines = await db.select().from(invoiceLines).where(inArray(invoiceLines.invoiceId, invIds));
  return invs.map(i => ({ ...i, lines: lines.filter(l => l.invoiceId === i.id) }));
}

export async function createInvoice(companyId: number, data: {
  invoiceId: string; customerId: number; customerName: string; date: string; dueDate: string; status: string;
  subtotal: string; cgst: string; sgst: string; igst: string; total: string;
  tcsSection?: string; tcsRate?: string; tcsAmount?: string; tcsTotal?: string;
  lines: { description: string; hsnCode?: string; qty: number; rate: string; discount?: string; gstRate?: string; amount: string }[]
}) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(invoices).values({
    invoiceId: data.invoiceId, customerId: data.customerId, customerName: data.customerName,
    date: data.date, dueDate: data.dueDate, status: data.status as any,
    subtotal: data.subtotal, cgst: data.cgst || '0', sgst: data.sgst || '0', igst: data.igst || '0',
    total: data.tcsTotal || data.total,
    tcsSection: data.tcsSection || null, tcsRate: data.tcsRate || '0',
    tcsAmount: data.tcsAmount || '0', tcsTotal: data.tcsTotal || '0',
    companyId
  } as any).$returningId();
  if (data.lines.length > 0) {
    await db.insert(invoiceLines).values(data.lines.map(l => ({
      invoiceId: result.id, description: l.description, hsnCode: l.hsnCode,
      qty: l.qty, rate: l.rate, discount: l.discount || '0',
      gstRate: l.gstRate || '0', amount: l.amount
    })));
  }
  // Auto-post journal entry: Dr. Accounts Receivable, Cr. Sales + GST
  try {
    const arAcct = await getSystemAccount(companyId, 'Accounts Receivable');
    const salesAcct = await getSystemAccount(companyId, 'Sales');
    if (arAcct && salesAcct) {
      const jeLines: { accountId: number; accountName: string; debit: string; credit: string }[] = [];
      const totalWithTcs = data.tcsTotal || data.total;
      jeLines.push({ accountId: arAcct.id, accountName: arAcct.name, debit: totalWithTcs, credit: '0' });
      const subtotal = Number(data.subtotal) || Number(data.total);
      const cgst = Number(data.cgst) || 0;
      const sgst = Number(data.sgst) || 0;
      const igst = Number(data.igst) || 0;
      jeLines.push({ accountId: salesAcct.id, accountName: salesAcct.name, debit: '0', credit: String(subtotal) });
      if (cgst > 0) {
        const cgstAcct = await getSystemAccount(companyId, 'CGST Payable');
        if (cgstAcct) jeLines.push({ accountId: cgstAcct.id, accountName: cgstAcct.name, debit: '0', credit: String(cgst) });
      }
      if (sgst > 0) {
        const sgstAcct = await getSystemAccount(companyId, 'SGST Payable');
        if (sgstAcct) jeLines.push({ accountId: sgstAcct.id, accountName: sgstAcct.name, debit: '0', credit: String(sgst) });
      }
      if (igst > 0) {
        const igstAcct = await getSystemAccount(companyId, 'IGST Payable');
        if (igstAcct) jeLines.push({ accountId: igstAcct.id, accountName: igstAcct.name, debit: '0', credit: String(igst) });
      }
      // TCS auto-posting
      const tcsAmt = Number(data.tcsAmount) || 0;
      if (tcsAmt > 0) {
        const tcsAcct = await getSystemAccount(companyId, 'TCS Payable');
        if (tcsAcct) jeLines.push({ accountId: tcsAcct.id, accountName: tcsAcct.name, debit: '0', credit: String(tcsAmt) });
      }
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Sales Invoice ${data.invoiceId} - ${data.customerName}`,
        sourceType: 'invoice', sourceId: result.id, lines: jeLines
      });
      if (jeId) await db.update(invoices).set({ journalEntryId: jeId } as any).where(eq(invoices.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Invoice journal entry failed:", e); }
}

export async function updateInvoiceStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(invoices).set({ status: status as any }).where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
}

export async function deleteInvoice(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  // Delete associated journal entry
  const inv = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.companyId, companyId))).limit(1);
  if (inv[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, inv[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, inv[0].journalEntryId));
  }
  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
}

// ─── Vendors ────────────────────────────────────────────────────────────────
export async function getAllVendors(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendors).where(eq(vendors.companyId, companyId)).orderBy(asc(vendors.name));
}

export async function createVendor(companyId: number, data: { name: string; email?: string; phone?: string; gstin?: string; pan?: string; state?: string; category?: string; address?: string; billingAddress1?: string; billingAddress2?: string; billingCity?: string; billingState?: string; billingPincode?: string; shippingAddress1?: string; shippingAddress2?: string; shippingCity?: string; shippingState?: string; shippingPincode?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(vendors).values({ ...data, companyId } as any);
}

export async function updateVendor(id: number, companyId: number, data: Partial<{ name: string; email: string; phone: string; gstin: string; pan: string; state: string; category: string; address: string; billingAddress1: string; billingAddress2: string; billingCity: string; billingState: string; billingPincode: string; shippingAddress1: string; shippingAddress2: string; shippingCity: string; shippingState: string; shippingPincode: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(vendors).set(data as any).where(and(eq(vendors.id, id), eq(vendors.companyId, companyId)));
}

export async function deleteVendor(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(vendors).where(and(eq(vendors.id, id), eq(vendors.companyId, companyId)));
}

// ─── Bills (with auto journal entry) ────────────────────────────────────────
export async function getAllBills(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bills).where(eq(bills.companyId, companyId)).orderBy(desc(bills.date));
}

export async function createBill(companyId: number, data: {
  billId: string; vendorId: number; vendorName: string; date: string; dueDate: string;
  subtotal?: string; cgst?: string; sgst?: string; igst?: string;
  amount: string; description?: string;
  tdsSection?: string; tdsRate?: string; tdsAmount?: string; tdsNetPayable?: string;
}) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(bills).values({
    billId: data.billId, vendorId: data.vendorId, vendorName: data.vendorName,
    date: data.date, dueDate: data.dueDate,
    subtotal: data.subtotal || data.amount, cgst: data.cgst || '0', sgst: data.sgst || '0', igst: data.igst || '0',
    amount: data.amount, description: data.description,
    tdsSection: data.tdsSection || null, tdsRate: data.tdsRate || '0',
    tdsAmount: data.tdsAmount || '0', tdsNetPayable: data.tdsNetPayable || '0',
    companyId
  } as any).$returningId();
  // Auto-post: Dr. Purchases + GST Input, Cr. Accounts Payable
  try {
    const apAcct = await getSystemAccount(companyId, 'Accounts Payable');
    const purchaseAcct = await getSystemAccount(companyId, 'Purchases');
    if (apAcct && purchaseAcct) {
      const jeLines: { accountId: number; accountName: string; debit: string; credit: string }[] = [];
      const subtotal = Number(data.subtotal) || Number(data.amount);
      const cgst = Number(data.cgst) || 0;
      const sgst = Number(data.sgst) || 0;
      const igst = Number(data.igst) || 0;
      jeLines.push({ accountId: purchaseAcct.id, accountName: purchaseAcct.name, debit: String(subtotal), credit: '0' });
      if (cgst > 0) {
        const cgstAcct = await getSystemAccount(companyId, 'CGST Input');
        if (cgstAcct) jeLines.push({ accountId: cgstAcct.id, accountName: cgstAcct.name, debit: String(cgst), credit: '0' });
      }
      if (sgst > 0) {
        const sgstAcct = await getSystemAccount(companyId, 'SGST Input');
        if (sgstAcct) jeLines.push({ accountId: sgstAcct.id, accountName: sgstAcct.name, debit: String(sgst), credit: '0' });
      }
      if (igst > 0) {
        const igstAcct = await getSystemAccount(companyId, 'IGST Input');
        if (igstAcct) jeLines.push({ accountId: igstAcct.id, accountName: igstAcct.name, debit: String(igst), credit: '0' });
      }
      // TDS auto-posting: Dr. AP (reduce payable), Cr. TDS Payable
      const tdsAmt = Number(data.tdsAmount) || 0;
      if (tdsAmt > 0) {
        const tdsAcct = await getSystemAccount(companyId, 'TDS Payable');
        if (tdsAcct) jeLines.push({ accountId: tdsAcct.id, accountName: tdsAcct.name, debit: '0', credit: String(tdsAmt) });
      }
      // AP credit = net payable (amount - TDS)
      const apCredit = tdsAmt > 0 ? String(Number(data.amount) - tdsAmt) : data.amount;
      jeLines.push({ accountId: apAcct.id, accountName: apAcct.name, debit: '0', credit: apCredit });
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Purchase Bill ${data.billId} - ${data.vendorName}`,
        sourceType: 'bill', sourceId: result.id, lines: jeLines
      });
      if (jeId) await db.update(bills).set({ journalEntryId: jeId } as any).where(eq(bills.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Bill journal entry failed:", e); }
}

export async function updateBillStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(bills).set({ status: status as any }).where(and(eq(bills.id, id), eq(bills.companyId, companyId)));
}

export async function deleteBill(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const bill = await db.select().from(bills).where(and(eq(bills.id, id), eq(bills.companyId, companyId))).limit(1);
  if (bill[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, bill[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, bill[0].journalEntryId));
  }
  await db.delete(bills).where(and(eq(bills.id, id), eq(bills.companyId, companyId)));
}

// ─── Payments In (with auto journal entry) ──────────────────────────────────
export async function getAllPaymentsIn(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(paymentsIn).where(eq(paymentsIn.companyId, companyId)).orderBy(desc(paymentsIn.date));
}

export async function createPaymentIn(companyId: number, data: { paymentId: string; customerId: number; customerName: string; date: string; amount: string; mode: string; invoiceRef?: string; notes?: string }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(paymentsIn).values({ ...data, companyId } as any).$returningId();
  // Auto-post: Dr. Cash/Bank, Cr. Accounts Receivable
  try {
    const cashAcct = await getSystemAccount(companyId, data.mode === 'Bank' ? 'Bank Accounts' : 'Cash');
    const arAcct = await getSystemAccount(companyId, 'Accounts Receivable');
    if (cashAcct && arAcct) {
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Payment Received ${data.paymentId} - ${data.customerName}`,
        sourceType: 'payment_in', sourceId: result.id,
        lines: [
          { accountId: cashAcct.id, accountName: cashAcct.name, debit: data.amount, credit: '0' },
          { accountId: arAcct.id, accountName: arAcct.name, debit: '0', credit: data.amount },
        ]
      });
      if (jeId) await db.update(paymentsIn).set({ journalEntryId: jeId } as any).where(eq(paymentsIn.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Payment In journal entry failed:", e); }
}

export async function deletePaymentIn(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const pi = await db.select().from(paymentsIn).where(and(eq(paymentsIn.id, id), eq(paymentsIn.companyId, companyId))).limit(1);
  if (pi[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, pi[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, pi[0].journalEntryId));
  }
  await db.delete(paymentsIn).where(and(eq(paymentsIn.id, id), eq(paymentsIn.companyId, companyId)));
}

// ─── Payments Out (with auto journal entry) ─────────────────────────────────
export async function getAllPaymentsOut(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(paymentsOut).where(eq(paymentsOut.companyId, companyId)).orderBy(desc(paymentsOut.date));
}

export async function createPaymentOut(companyId: number, data: { paymentId: string; vendorId: number; vendorName: string; date: string; amount: string; mode: string; billRef?: string; notes?: string }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(paymentsOut).values({ ...data, companyId } as any).$returningId();
  // Auto-post: Dr. Accounts Payable, Cr. Cash/Bank
  try {
    const apAcct = await getSystemAccount(companyId, 'Accounts Payable');
    const cashAcct = await getSystemAccount(companyId, data.mode === 'Bank' ? 'Bank Accounts' : 'Cash');
    if (apAcct && cashAcct) {
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Payment Made ${data.paymentId} - ${data.vendorName}`,
        sourceType: 'payment_out', sourceId: result.id,
        lines: [
          { accountId: apAcct.id, accountName: apAcct.name, debit: data.amount, credit: '0' },
          { accountId: cashAcct.id, accountName: cashAcct.name, debit: '0', credit: data.amount },
        ]
      });
      if (jeId) await db.update(paymentsOut).set({ journalEntryId: jeId } as any).where(eq(paymentsOut.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Payment Out journal entry failed:", e); }
}

export async function deletePaymentOut(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const po = await db.select().from(paymentsOut).where(and(eq(paymentsOut.id, id), eq(paymentsOut.companyId, companyId))).limit(1);
  if (po[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, po[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, po[0].journalEntryId));
  }
  await db.delete(paymentsOut).where(and(eq(paymentsOut.id, id), eq(paymentsOut.companyId, companyId)));
}

// ─── Expenses (with auto journal entry) ─────────────────────────────────────
export async function getAllExpenses(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(expenses).where(eq(expenses.companyId, companyId)).orderBy(desc(expenses.date));
}

export async function createExpense(companyId: number, data: { expenseId: string; date: string; category: string; amount: string; paymentMode: string; description?: string; gstIncluded?: boolean; gstAmount?: string }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(expenses).values({ ...data, companyId } as any).$returningId();
  // Auto-post: Dr. Expense Account, Cr. Cash/Bank
  try {
    // Try to find an expense account matching the category, fallback to General Expenses
    let expAcct = await getSystemAccount(companyId, data.category);
    if (!expAcct) expAcct = await getSystemAccount(companyId, 'General Expenses');
    const cashAcct = await getSystemAccount(companyId, data.paymentMode === 'Bank' ? 'Bank Accounts' : 'Cash');
    if (expAcct && cashAcct) {
      const jeLines: { accountId: number; accountName: string; debit: string; credit: string }[] = [];
      const gstAmount = data.gstIncluded ? Number(data.gstAmount || 0) : 0;
      const netAmount = Number(data.amount) - gstAmount;
      jeLines.push({ accountId: expAcct.id, accountName: expAcct.name, debit: String(netAmount), credit: '0' });
      if (gstAmount > 0) {
        const cgstAcct = await getSystemAccount(companyId, 'CGST Input');
        if (cgstAcct) jeLines.push({ accountId: cgstAcct.id, accountName: cgstAcct.name, debit: String(Math.round(gstAmount / 2 * 100) / 100), credit: '0' });
        const sgstAcct = await getSystemAccount(companyId, 'SGST Input');
        if (sgstAcct) jeLines.push({ accountId: sgstAcct.id, accountName: sgstAcct.name, debit: String(Math.round(gstAmount / 2 * 100) / 100), credit: '0' });
      }
      jeLines.push({ accountId: cashAcct.id, accountName: cashAcct.name, debit: '0', credit: data.amount });
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Expense ${data.expenseId} - ${data.category}`,
        sourceType: 'expense', sourceId: result.id, lines: jeLines
      });
      if (jeId) await db.update(expenses).set({ journalEntryId: jeId } as any).where(eq(expenses.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Expense journal entry failed:", e); }
}

export async function deleteExpense(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const exp = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.companyId, companyId))).limit(1);
  if (exp[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, exp[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, exp[0].journalEntryId));
  }
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));
}

// ─── Other Income (with auto journal entry) ─────────────────────────────────
export async function getAllOtherIncome(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(otherIncome).where(eq(otherIncome.companyId, companyId)).orderBy(desc(otherIncome.date));
}

export async function createOtherIncome(companyId: number, data: { incomeId: string; date: string; category: string; amount: string; paymentMode: string; description?: string }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(otherIncome).values({ ...data, companyId } as any).$returningId();
  // Auto-post: Dr. Cash/Bank, Cr. Other Income
  try {
    const cashAcct = await getSystemAccount(companyId, data.paymentMode === 'Bank' ? 'Bank Accounts' : 'Cash');
    const incomeAcct = await getSystemAccount(companyId, 'Other Income');
    if (cashAcct && incomeAcct) {
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Other Income ${data.incomeId} - ${data.category}`,
        sourceType: 'other_income', sourceId: result.id,
        lines: [
          { accountId: cashAcct.id, accountName: cashAcct.name, debit: data.amount, credit: '0' },
          { accountId: incomeAcct.id, accountName: incomeAcct.name, debit: '0', credit: data.amount },
        ]
      });
      if (jeId) await db.update(otherIncome).set({ journalEntryId: jeId } as any).where(eq(otherIncome.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Other Income journal entry failed:", e); }
}

export async function deleteOtherIncome(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const oi = await db.select().from(otherIncome).where(and(eq(otherIncome.id, id), eq(otherIncome.companyId, companyId))).limit(1);
  if (oi[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, oi[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, oi[0].journalEntryId));
  }
  await db.delete(otherIncome).where(and(eq(otherIncome.id, id), eq(otherIncome.companyId, companyId)));
}

// ─── Sale Returns (with auto journal entry) ─────────────────────────────────
export async function getAllSaleReturns(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(saleReturns).where(eq(saleReturns.companyId, companyId)).orderBy(desc(saleReturns.createdAt));
}

export async function createSaleReturn(companyId: number, data: { returnId: string; customerId: number; customerName: string; date: string; invoiceRef?: string; amount: string; reason?: string }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(saleReturns).values({ ...data, companyId } as any).$returningId();
  // Auto-post: Dr. Sales (reverse), Cr. Accounts Receivable
  try {
    const salesAcct = await getSystemAccount(companyId, 'Sales');
    const arAcct = await getSystemAccount(companyId, 'Accounts Receivable');
    if (salesAcct && arAcct) {
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Sale Return ${data.returnId} - ${data.customerName}`,
        sourceType: 'sale_return', sourceId: result.id,
        lines: [
          { accountId: salesAcct.id, accountName: salesAcct.name, debit: data.amount, credit: '0' },
          { accountId: arAcct.id, accountName: arAcct.name, debit: '0', credit: data.amount },
        ]
      });
      if (jeId) await db.update(saleReturns).set({ journalEntryId: jeId } as any).where(eq(saleReturns.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Sale Return journal entry failed:", e); }
}

export async function deleteSaleReturn(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const sr = await db.select().from(saleReturns).where(and(eq(saleReturns.id, id), eq(saleReturns.companyId, companyId))).limit(1);
  if (sr[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, sr[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, sr[0].journalEntryId));
  }
  await db.delete(saleReturns).where(and(eq(saleReturns.id, id), eq(saleReturns.companyId, companyId)));
}

// ─── Purchase Returns (with auto journal entry) ─────────────────────────────
export async function getAllPurchaseReturns(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(purchaseReturns).where(eq(purchaseReturns.companyId, companyId)).orderBy(desc(purchaseReturns.createdAt));
}

export async function createPurchaseReturn(companyId: number, data: { returnId: string; vendorId: number; vendorName: string; date: string; billRef?: string; amount: string; reason?: string }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(purchaseReturns).values({ ...data, companyId } as any).$returningId();
  // Auto-post: Dr. Accounts Payable, Cr. Purchases
  try {
    const apAcct = await getSystemAccount(companyId, 'Accounts Payable');
    const purchaseAcct = await getSystemAccount(companyId, 'Purchases');
    if (apAcct && purchaseAcct) {
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: `Purchase Return ${data.returnId} - ${data.vendorName}`,
        sourceType: 'purchase_return', sourceId: result.id,
        lines: [
          { accountId: apAcct.id, accountName: apAcct.name, debit: data.amount, credit: '0' },
          { accountId: purchaseAcct.id, accountName: purchaseAcct.name, debit: '0', credit: data.amount },
        ]
      });
      if (jeId) await db.update(purchaseReturns).set({ journalEntryId: jeId } as any).where(eq(purchaseReturns.id, result.id));
    }
  } catch (e) { console.error("[AutoPost] Purchase Return journal entry failed:", e); }
}

export async function deletePurchaseReturn(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  const pr = await db.select().from(purchaseReturns).where(and(eq(purchaseReturns.id, id), eq(purchaseReturns.companyId, companyId))).limit(1);
  if (pr[0]?.journalEntryId) {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, pr[0].journalEntryId));
    await db.delete(journalEntries).where(eq(journalEntries.id, pr[0].journalEntryId));
  }
  await db.delete(purchaseReturns).where(and(eq(purchaseReturns.id, id), eq(purchaseReturns.companyId, companyId)));
}

// ─── Inventory ──────────────────────────────────────────────────────────────
export async function getAllInventory(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(inventory).where(eq(inventory.companyId, companyId)).orderBy(asc(inventory.name));
}

export async function createInventoryItem(companyId: number, data: { sku: string; name: string; category?: string; qty: number; cost: string; reorder: number; warehouseId?: number; hsnCode?: string; gstRate?: string; mrp?: string; sellingPrice?: string; purchasePrice?: string; upcBarcode?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(inventory).values({ ...data, companyId } as any);
}

export async function updateInventoryItem(id: number, companyId: number, data: Partial<{ sku: string; name: string; category: string; qty: number; cost: string; reorder: number; warehouseId: number; hsnCode: string; gstRate: string; mrp: string; sellingPrice: string; purchasePrice: string; upcBarcode: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(inventory).set(data as any).where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
}

export async function deleteInventoryItem(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(inventory).where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
}

// ─── Purchase Orders ────────────────────────────────────────────────────────
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

// ─── Employees ──────────────────────────────────────────────────────────────
export async function getAllEmployees(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(employees).where(eq(employees.companyId, companyId)).orderBy(asc(employees.name));
}

export async function createEmployee(companyId: number, data: {
  empId: string; name: string; title?: string; dept?: string; type: string; salary: string; rate: string;
  email?: string; startDate?: string; active: boolean;
  basicSalary?: string; hra?: string; da?: string; specialAllowance?: string;
  panNumber?: string; uanNumber?: string; esiNumber?: string; pfOptOut?: boolean;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(employees).values({
    empId: data.empId, name: data.name, title: data.title, dept: data.dept, type: data.type,
    salary: data.salary, rate: data.rate, email: data.email, startDate: data.startDate, active: data.active,
    basicSalary: data.basicSalary || '0', hra: data.hra || '0', da: data.da || '0', specialAllowance: data.specialAllowance || '0',
    panNumber: data.panNumber || null, uanNumber: data.uanNumber || null, esiNumber: data.esiNumber || null,
    pfOptOut: data.pfOptOut || false,
    companyId
  } as any);
}

export async function updateEmployee(id: number, companyId: number, data: Partial<{
  name: string; title: string; dept: string; type: string; salary: string; rate: string;
  email: string; startDate: string; active: boolean;
  basicSalary: string; hra: string; da: string; specialAllowance: string;
  panNumber: string; uanNumber: string; esiNumber: string; pfOptOut: boolean;
}>) {
  const db = await getDb(); if (!db) return;
  await db.update(employees).set(data as any).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
}

export async function deleteEmployee(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(employees).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
}

// ─── Payroll ────────────────────────────────────────────────────────────────
export async function getAllPayrollRuns(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(payrollRuns).where(eq(payrollRuns.companyId, companyId)).orderBy(desc(payrollRuns.runDate));
}

export async function createPayrollRun(companyId: number, data: {
  payrollId: string; period: string; runDate: string; gross: string; net: string;
  basicPay?: string; hra_amt?: string; da_amt?: string; specialAllow?: string;
  pfEmployee?: string; pfEmployer?: string; esiEmployee?: string; esiEmployer?: string;
  professionalTax?: string; tds?: string;
  fedTax?: string; stateTax?: string; ssMed?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(payrollRuns).values({
    payrollId: data.payrollId, period: data.period, runDate: data.runDate,
    gross: data.gross, net: data.net,
    basicPay: data.basicPay || '0', hra_amt: data.hra_amt || '0', da_amt: data.da_amt || '0', specialAllow: data.specialAllow || '0',
    pfEmployee: data.pfEmployee || '0', pfEmployer: data.pfEmployer || '0',
    esiEmployee: data.esiEmployee || '0', esiEmployer: data.esiEmployer || '0',
    professionalTax: data.professionalTax || '0', tds: data.tds || '0',
    fedTax: data.fedTax || '0', stateTax: data.stateTax || '0', ssMed: data.ssMed || '0',
    companyId
  } as any);
}

// ─── Warehouses ─────────────────────────────────────────────────────────────
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

// ─── Supply Chain ───────────────────────────────────────────────────────────
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

// ─── Delivery Staff ─────────────────────────────────────────────────────────
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

// ─── Deliveries ─────────────────────────────────────────────────────────────
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

// ─── Settings ───────────────────────────────────────────────────────────────
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

// ─── Dashboard Aggregates (journal-driven) ──────────────────────────────────
export async function getDashboardData(companyId: number) {
  const db = await getDb(); if (!db) return null;
  const balances = await getAllAccountBalances(companyId);
  const invs = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
  const bls = await db.select().from(bills).where(eq(bills.companyId, companyId));
  const inv = await db.select().from(inventory).where(eq(inventory.companyId, companyId));
  const jes = await db.select().from(journalEntries).where(eq(journalEntries.companyId, companyId));
  const sortedJes = jes.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const jeIds = sortedJes.map(e => e.id);
  const jeLines = jeIds.length > 0 ? await db.select().from(journalLines).where(inArray(journalLines.journalEntryId, jeIds)) : [];
  const recentJEs = sortedJes.map(e => ({ ...e, lines: jeLines.filter(l => l.journalEntryId === e.id) }));

  const totalRevenue = balances.filter(a => a.type === 'Revenue' && !a.isGroup).reduce((s, a) => s + a.balance, 0);
  const totalExpenses = balances.filter(a => a.type === 'Expense' && !a.isGroup).reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalAssets = balances.filter(a => a.type === 'Asset' && !a.isGroup).reduce((s, a) => s + a.balance, 0);
  const arOutstanding = invs.filter(i => i.status !== 'Paid').reduce((s, i) => s + Number(i.total), 0);
  const apOutstanding = bls.filter(b => b.status === 'Pending').reduce((s, b) => s + Number(b.amount), 0);
  const inventoryValue = inv.reduce((s, i) => s + i.qty * Number(i.cost), 0);
  const lowStockItems = inv.filter(i => i.qty <= i.reorder);
  const upcomingBills = bls.filter(b => b.status === 'Pending').slice(0, 4);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    arOutstanding, apOutstanding, inventoryValue, lowStockItems, upcomingBills, recentJEs
  };
}

// ─── Next ID helpers ────────────────────────────────────────────────────────
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

// ─── Estimates ──────────────────────────────────────────────────────────────
export async function getAllEstimates(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const ests = await db.select().from(estimates).where(eq(estimates.companyId, companyId)).orderBy(desc(estimates.date));
  if (ests.length === 0) return [];
  const estIds = ests.map(e => e.id);
  const lines = await db.select().from(estimateLines).where(inArray(estimateLines.estimateId, estIds));
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

// ─── Cash & Bank Accounts ───────────────────────────────────────────────────
export async function getAllCashBankAccounts(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(cashBankAccounts).where(eq(cashBankAccounts.companyId, companyId)).orderBy(asc(cashBankAccounts.name));
}

export async function createCashBankAccount(companyId: number, data: { name: string; type: string; bankName?: string; accountNumber?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(cashBankAccounts).values({ ...data, companyId } as any);
}

export async function updateCashBankAccount(id: number, companyId: number, data: Partial<{ name: string; type: string; bankName: string; accountNumber: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(cashBankAccounts).set(data as any).where(and(eq(cashBankAccounts.id, id), eq(cashBankAccounts.companyId, companyId)));
}

export async function deleteCashBankAccount(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(cashBankAccounts).where(and(eq(cashBankAccounts.id, id), eq(cashBankAccounts.companyId, companyId)));
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
  // Use actual GST fields now
  const salesGST = allInvoices.reduce((sum, inv) => sum + Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst), 0);
  const purchaseGST = allBills.reduce((sum, b) => sum + Number(b.cgst) + Number(b.sgst) + Number(b.igst), 0);
  const expenseGST = allExpenses.filter(e => e.gstIncluded).reduce((sum, e) => sum + Number(e.gstAmount || 0), 0);
  return {
    salesGST: Math.round(salesGST * 100) / 100,
    purchaseGST: Math.round(purchaseGST * 100) / 100,
    expenseGST: Math.round(expenseGST * 100) / 100,
    netGST: Math.round((salesGST - purchaseGST - expenseGST) * 100) / 100,
    invoices: allInvoices, bills: allBills, expenses: allExpenses
  };
}

// ─── Day Book ───────────────────────────────────────────────────────────────
export async function getDayBook(companyId: number, date: string) {
  const db = await getDb(); if (!db) return { journalEntries: [] };
  // Journal-driven day book: show all journal entries for the date
  const dayJEs = await db.select().from(journalEntries).where(and(eq(journalEntries.date, date), eq(journalEntries.companyId, companyId))).orderBy(asc(journalEntries.id));
  if (dayJEs.length === 0) return { journalEntries: [] };
  const jeIds = dayJEs.map(e => e.id);
  const lines = await db.select().from(journalLines).where(inArray(journalLines.journalEntryId, jeIds));
  return { journalEntries: dayJEs.map(e => ({ ...e, lines: lines.filter(l => l.journalEntryId === e.id) })) };
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

// ─── Aging Report ───────────────────────────────────────────────────────────
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
  // Seed default COA for the new company
  await seedDefaultCOA(result.id);
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

// ─── TDS on Vendor Payments ──────────────────────────────────────────────────
export const TDS_SECTIONS = [
  { code: '194C', name: 'Contractors', rateIndividual: 1, rateOthers: 2 },
  { code: '194J', name: 'Professional/Technical Fees', rateIndividual: 10, rateOthers: 10 },
  { code: '194JA', name: 'Technical Services (Reduced)', rateIndividual: 2, rateOthers: 2 },
  { code: '194H', name: 'Commission/Brokerage', rateIndividual: 5, rateOthers: 5 },
  { code: '194I(a)', name: 'Rent - Plant/Machinery', rateIndividual: 2, rateOthers: 2 },
  { code: '194I(b)', name: 'Rent - Land/Building', rateIndividual: 10, rateOthers: 10 },
  { code: '194Q', name: 'Purchase of Goods (>50L)', rateIndividual: 0.1, rateOthers: 0.1 },
  { code: '194A', name: 'Interest (other than securities)', rateIndividual: 10, rateOthers: 10 },
  { code: '194D', name: 'Insurance Commission', rateIndividual: 5, rateOthers: 10 },
];

// ─── TCS on Sales ────────────────────────────────────────────────────────────
export const TCS_SECTIONS = [
  { code: '206C(1H)', name: 'Sale of Goods (>50L)', rate: 0.1 },
  { code: '206C(1)', name: 'Scrap', rate: 1 },
  { code: '206C(1F)', name: 'Motor Vehicle (>10L)', rate: 1 },
  { code: '206C(1G)', name: 'Foreign Remittance (LRS)', rate: 5 },
  { code: '206C(1G)T', name: 'Tour Package', rate: 5 },
];


export async function createInvite(companyId: number, email: string, role: string, invitedBy: number) {
  const db = await getDb(); if (!db) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [result] = await db.insert(companyInvites).values({
    companyId, email, role, token, invitedBy, expiresAt
  } as any).$returningId();
  return { id: result.id, token, expiresAt };
}

export async function getCompanyInvites(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(companyInvites).where(eq(companyInvites.companyId, companyId)).orderBy(desc(companyInvites.createdAt));
}

export async function getInviteByToken(token: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(companyInvites).where(eq(companyInvites.token, token)).limit(1);
  return rows[0] || null;
}

export async function acceptInvite(token: string, userId: number) {
  const db = await getDb(); if (!db) return { success: false, error: 'DB unavailable' };
  const invite = await getInviteByToken(token);
  if (!invite) return { success: false, error: 'Invalid invite' };
  if (invite.status !== 'pending') return { success: false, error: 'Invite already ' + invite.status };
  if (new Date(invite.expiresAt) < new Date()) {
    await db.update(companyInvites).set({ status: 'expired' } as any).where(eq(companyInvites.id, invite.id));
    return { success: false, error: 'Invite expired' };
  }
  await db.insert(companyMembers).values({ companyId: invite.companyId, userId, role: invite.role } as any);
  await db.update(companyInvites).set({ status: 'accepted' } as any).where(eq(companyInvites.id, invite.id));
  return { success: true, companyId: invite.companyId };
}

export async function cancelInvite(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(companyInvites).set({ status: 'cancelled' } as any).where(and(eq(companyInvites.id, id), eq(companyInvites.companyId, companyId)));
}

// ─── Verification Codes ──────────────────────────────────────────────────────
export async function createVerificationCode(userId: number, type: string, target: string) {
  const db = await getDb(); if (!db) return null;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.delete(verificationCodes).where(
    and(eq(verificationCodes.userId, userId), eq(verificationCodes.target, target))
  );
  const [result] = await db.insert(verificationCodes).values({
    userId, type, target, code, expiresAt
  } as any).$returningId();
  return { id: result.id, code, expiresAt };
}

export async function verifyCode(userId: number, target: string, inputCode: string) {
  const db = await getDb(); if (!db) return { success: false, error: 'DB unavailable' };
  const rows = await db.select().from(verificationCodes).where(
    and(eq(verificationCodes.userId, userId), eq(verificationCodes.target, target))
  ).orderBy(desc(verificationCodes.createdAt)).limit(1);
  const record = rows[0];
  if (!record) return { success: false, error: 'No verification code found' };
  if (record.verified) return { success: false, error: 'Already verified' };
  if (new Date(record.expiresAt) < new Date()) return { success: false, error: 'Code expired' };
  if (record.attempts >= 5) return { success: false, error: 'Too many attempts' };
  await db.update(verificationCodes).set({ attempts: record.attempts + 1 } as any).where(eq(verificationCodes.id, record.id));
  if (record.code !== inputCode) return { success: false, error: 'Invalid code' };
  await db.update(verificationCodes).set({ verified: true } as any).where(eq(verificationCodes.id, record.id));
  return { success: true };
}

// ─── Verification Status (persisted) ─────────────────────────────────────────
export async function getVerificationStatus(userId: number) {
  const db = await getDb(); if (!db) return { emailVerified: false, phoneVerified: false, email: null, phone: null };
  const rows = await db.select().from(verificationCodes).where(
    and(eq(verificationCodes.userId, userId), eq(verificationCodes.verified, true))
  );
  let emailVerified = false, phoneVerified = false, email: string | null = null, phone: string | null = null;
  for (const r of rows) {
    if (r.type === 'email') { emailVerified = true; email = r.target; }
    if (r.type === 'phone') { phoneVerified = true; phone = r.target; }
  }
  return { emailVerified, phoneVerified, email, phone };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIGH PRIORITY FEATURES — DB HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Partial Payments / Due Tracking ─────────────────────────────────────
export async function recordPartialPayment(invoiceId: number, amount: string) {
  const db = await getDb(); if (!db) return null;
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) return null;
  const paid = Number(inv.paidAmount) + Number(amount);
  const due = Number(inv.total) - paid;
  const status = due <= 0 ? "Paid" : "Sent";
  await db.update(invoices).set({
    paidAmount: String(paid),
    dueAmount: String(Math.max(0, due)),
    status: status as any,
  } as any).where(eq(invoices.id, invoiceId));
  return { paid, due: Math.max(0, due), status };
}

export async function getInvoicePayments(invoiceId: number, companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(paymentsIn).where(
    and(eq(paymentsIn.invoiceId, invoiceId), eq(paymentsIn.companyId, companyId))
  );
}

export async function getOverdueInvoices(companyId: number) {
  const db = await getDb(); if (!db) return [];
  const today = new Date().toISOString().slice(0, 10);
  return db.select().from(invoices).where(
    and(
      eq(invoices.companyId, companyId),
      sql`${invoices.dueDate} < ${today}`,
      sql`${invoices.status} != 'Paid'`
    )
  );
}

// ─── 2. Recurring Invoices ──────────────────────────────────────────────────
export async function createRecurringInvoice(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(recurringInvoices).values(data);
  return { id: result.insertId };
}

export async function listRecurringInvoices(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(recurringInvoices).where(eq(recurringInvoices.companyId, companyId)).orderBy(desc(recurringInvoices.createdAt));
}

export async function updateRecurringInvoice(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(recurringInvoices).set(data).where(eq(recurringInvoices.id, id));
}

export async function deleteRecurringInvoice(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(recurringInvoices).where(eq(recurringInvoices.id, id));
}

// ─── 3. Activity / Audit Log ────────────────────────────────────────────────
export async function logActivity(data: { companyId: number; userId: number; userName: string; action: string; entityType: string; entityId?: number; entityName?: string; details?: any; ipAddress?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function listActivityLogs(companyId: number, limit = 100, offset = 0) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.companyId, companyId)).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);
}

// ─── 4. Bank Reconciliation ─────────────────────────────────────────────────
export async function createBankReconciliation(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(bankReconciliations).values(data);
  return { id: result.insertId };
}

export async function listBankReconciliations(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bankReconciliations).where(eq(bankReconciliations.companyId, companyId)).orderBy(desc(bankReconciliations.createdAt));
}

export async function getBankReconciliation(id: number) {
  const db = await getDb(); if (!db) return null;
  const [rec] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!rec) return null;
  const items = await db.select().from(bankReconciliationItems).where(eq(bankReconciliationItems.reconciliationId, id));
  return { ...rec, items };
}

export async function addReconciliationItem(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(bankReconciliationItems).values(data);
  return { id: result.insertId };
}

export async function matchReconciliationItem(itemId: number, journalEntryId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(bankReconciliationItems).set({ isMatched: true, matchedJournalEntryId: journalEntryId } as any).where(eq(bankReconciliationItems.id, itemId));
}

export async function finalizeBankReconciliation(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(bankReconciliations).set({ status: "reconciled" } as any).where(eq(bankReconciliations.id, id));
}

// ─── 5. Credit Limit on Customers ──────────────────────────────────────────
export async function setCreditLimit(customerId: number, limit: string | null) {
  const db = await getDb(); if (!db) return;
  await db.update(customers).set({ creditLimit: limit } as any).where(eq(customers.id, customerId));
}

export async function getCustomerCreditStatus(customerId: number) {
  const db = await getDb(); if (!db) return null;
  const [cust] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!cust) return null;
  const creditLimit = cust.creditLimit ? Number(cust.creditLimit) : null;
  const currentBalance = Number(cust.currentBalance || 0);
  return {
    creditLimit,
    currentBalance,
    available: creditLimit ? creditLimit - currentBalance : null,
    isOverLimit: creditLimit ? currentBalance > creditLimit : false,
  };
}

export async function updateCustomerBalance(customerId: number, amount: number) {
  const db = await getDb(); if (!db) return;
  await db.update(customers).set(
    { currentBalance: sql`cust_currentBalance + ${amount}` } as any
  ).where(eq(customers.id, customerId));
}


// ═══════════════════════════════════════════════════════════════════════════════
// MEDIUM PRIORITY FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Proforma Invoices ──────────────────────────────────────────────────────
export async function getAllProformaInvoices(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(proformaInvoices).where(eq(proformaInvoices.companyId, companyId)).orderBy(desc(proformaInvoices.createdAt));
}

export async function createProformaInvoice(companyId: number, data: {
  proformaId: string; customerId?: number; customerName?: string;
  date?: string; validUntil?: string; subtotal?: string; cgst?: string;
  sgst?: string; igst?: string; total?: string; notes?: string;
  lineItems?: any; placeOfSupply?: string; gstRate?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(proformaInvoices).values({ ...data, companyId } as any);
}

export async function updateProformaStatus(id: number, companyId: number, status: string, convertedInvoiceId?: number) {
  const db = await getDb(); if (!db) return;
  const set: any = { status };
  if (convertedInvoiceId) set.convertedInvoiceId = convertedInvoiceId;
  await db.update(proformaInvoices).set(set).where(and(eq(proformaInvoices.id, id), eq(proformaInvoices.companyId, companyId)));
}

export async function deleteProformaInvoice(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(proformaInvoices).where(and(eq(proformaInvoices.id, id), eq(proformaInvoices.companyId, companyId)));
}

// ─── Inventory Batches ──────────────────────────────────────────────────────
export async function getItemBatches(companyId: number, inventoryItemId?: number) {
  const db = await getDb(); if (!db) return [];
  if (inventoryItemId) {
    return db.select().from(inventoryBatches).where(and(eq(inventoryBatches.companyId, companyId), eq(inventoryBatches.inventoryItemId, inventoryItemId))).orderBy(desc(inventoryBatches.createdAt));
  }
  return db.select().from(inventoryBatches).where(eq(inventoryBatches.companyId, companyId)).orderBy(desc(inventoryBatches.createdAt));
}

export async function createBatch(companyId: number, data: {
  inventoryItemId: number; batchNumber: string; manufacturingDate?: string;
  expiryDate?: string; quantity?: number; purchasePrice?: string;
  sellingPrice?: string; notes?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(inventoryBatches).values({ ...data, companyId } as any);
}

export async function updateBatchStatus(id: number, companyId: number, status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(inventoryBatches).set({ status } as any).where(and(eq(inventoryBatches.id, id), eq(inventoryBatches.companyId, companyId)));
}

export async function deleteBatch(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(inventoryBatches).where(and(eq(inventoryBatches.id, id), eq(inventoryBatches.companyId, companyId)));
}

// ─── Approval Workflows ─────────────────────────────────────────────────────
export async function listApprovals(companyId: number, status?: string) {
  const db = await getDb(); if (!db) return [];
  if (status) {
    return db.select().from(approvalWorkflows).where(and(eq(approvalWorkflows.companyId, companyId), eq(approvalWorkflows.status, status))).orderBy(desc(approvalWorkflows.requestedAt));
  }
  return db.select().from(approvalWorkflows).where(eq(approvalWorkflows.companyId, companyId)).orderBy(desc(approvalWorkflows.requestedAt));
}

export async function createApprovalRequest(companyId: number, data: {
  entityType: string; entityId: number; entityRef?: string;
  requestedBy?: number; requestedByName?: string;
  approverUserId?: number; approverName?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(approvalWorkflows).values({ ...data, companyId } as any);
}

export async function resolveApproval(id: number, companyId: number, status: string, comments?: string) {
  const db = await getDb(); if (!db) return;
  await db.update(approvalWorkflows).set({ status, comments, resolvedAt: new Date() } as any).where(and(eq(approvalWorkflows.id, id), eq(approvalWorkflows.companyId, companyId)));
}

// ─── E-Way Bills ────────────────────────────────────────────────────────────
export async function listEwayBills(companyId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(ewayBills).where(eq(ewayBills.companyId, companyId)).orderBy(desc(ewayBills.createdAt));
}

export async function createEwayBill(companyId: number, data: {
  ewayBillNo?: string; invoiceId?: number; invoiceRef?: string;
  fromGstin?: string; toGstin?: string; fromAddress?: string; toAddress?: string;
  transporterId?: string; transporterName?: string; vehicleNo?: string;
  distance?: string; transMode?: string; docType?: string;
  docNo?: string; docDate?: string; totalValue?: string; hsnCode?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(ewayBills).values({ ...data, companyId } as any);
}

export async function updateEwayBillNIC(id: number, companyId: number, nicData: {
  nicEwbNo?: string; nicEwbDate?: string; nicValidUpto?: string;
  nicStatus?: string; nicErrorMessage?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.update(ewayBills).set(nicData as any).where(and(eq(ewayBills.id, id), eq(ewayBills.companyId, companyId)));
}

export async function deleteEwayBill(id: number, companyId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(ewayBills).where(and(eq(ewayBills.id, id), eq(ewayBills.companyId, companyId)));
}

// ─── Top Customers / Products Ranking ───────────────────────────────────────
export async function getTopCustomers(companyId: number, limit = 10) {
  const db = await getDb(); if (!db) return [];
  const result = await db.execute(sql`
    SELECT customerId, customerName, SUM(CAST(total AS DECIMAL(15,2))) as totalRevenue, COUNT(*) as invoiceCount
    FROM invoices WHERE inv_companyId = ${companyId}
    GROUP BY customerId, customerName
    ORDER BY totalRevenue DESC LIMIT ${limit}
  `);
  return (result as any)[0] || [];
}

export async function getTopProducts(companyId: number, limit = 10) {
  const db = await getDb(); if (!db) return [];
  const result = await db.execute(sql`
    SELECT il.description as productName, SUM(il.qty) as totalQty, SUM(CAST(il.amount AS DECIMAL(15,2))) as totalRevenue
    FROM invoice_lines il
    JOIN invoices i ON il.invoiceId = i.id
    WHERE i.inv_companyId = ${companyId}
    GROUP BY il.description
    ORDER BY totalRevenue DESC LIMIT ${limit}
  `);
  return (result as any)[0] || [];
}
