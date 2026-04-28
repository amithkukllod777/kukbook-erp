import fs from 'fs';

let content = fs.readFileSync('server/db.ts', 'utf8');

// 1. Update createInvoice to accept and persist TCS fields
const oldInvoiceSig = `export async function createInvoice(companyId: number, data: {
  invoiceId: string; customerId: number; customerName: string; date: string; dueDate: string; status: string;
  subtotal: string; cgst: string; sgst: string; igst: string; total: string;
  lines: { description: string; hsnCode?: string; qty: number; rate: string; discount?: string; gstRate?: string; amount: string }[]
}) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(invoices).values({
    invoiceId: data.invoiceId, customerId: data.customerId, customerName: data.customerName,
    date: data.date, dueDate: data.dueDate, status: data.status as any,
    subtotal: data.subtotal, cgst: data.cgst || '0', sgst: data.sgst || '0', igst: data.igst || '0',
    total: data.total, companyId
  } as any).$returningId();`;

const newInvoiceSig = `export async function createInvoice(companyId: number, data: {
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
  } as any).$returningId();`;

if (content.includes(oldInvoiceSig)) {
  content = content.replace(oldInvoiceSig, newInvoiceSig);
  console.log('✅ Updated createInvoice to persist TCS fields');
} else {
  console.log('⚠️ Could not find createInvoice signature to patch');
}

// Also update the AR debit to use tcsTotal if present (total with TCS)
const oldArDebit = `jeLines.push({ accountId: arAcct.id, accountName: arAcct.name, debit: data.total, credit: '0' });`;
const newArDebit = `const totalWithTcs = data.tcsTotal || data.total;
      jeLines.push({ accountId: arAcct.id, accountName: arAcct.name, debit: totalWithTcs, credit: '0' });`;
if (content.includes(oldArDebit)) {
  content = content.replace(oldArDebit, newArDebit);
  console.log('✅ Updated AR debit to use totalWithTcs');
}

// Add TCS journal line after IGST in createInvoice
const oldIgstBlock = `      if (igst > 0) {
        const igstAcct = await getSystemAccount(companyId, 'IGST Payable');
        if (igstAcct) jeLines.push({ accountId: igstAcct.id, accountName: igstAcct.name, debit: '0', credit: String(igst) });
      }
      const jeId = await autoPostJournalEntry(companyId, {
        date: data.date, description: \`Sales Invoice \${data.invoiceId} - \${data.customerName}\`,`;
const newIgstBlock = `      if (igst > 0) {
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
        date: data.date, description: \`Sales Invoice \${data.invoiceId} - \${data.customerName}\`,`;
if (content.includes(oldIgstBlock)) {
  content = content.replace(oldIgstBlock, newIgstBlock);
  console.log('✅ Added TCS auto-posting to createInvoice');
}

// 2. Update createBill to accept and persist TDS fields
const oldBillSig = `export async function createBill(companyId: number, data: {
  billId: string; vendorId: number; vendorName: string; date: string; dueDate: string;
  subtotal?: string; cgst?: string; sgst?: string; igst?: string;
  amount: string; description?: string
}) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(bills).values({
    billId: data.billId, vendorId: data.vendorId, vendorName: data.vendorName,
    date: data.date, dueDate: data.dueDate,
    subtotal: data.subtotal || data.amount, cgst: data.cgst || '0', sgst: data.sgst || '0', igst: data.igst || '0',
    amount: data.amount, description: data.description, companyId
  } as any).$returningId();`;

const newBillSig = `export async function createBill(companyId: number, data: {
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
  } as any).$returningId();`;

if (content.includes(oldBillSig)) {
  content = content.replace(oldBillSig, newBillSig);
  console.log('✅ Updated createBill to persist TDS fields');
} else {
  console.log('⚠️ Could not find createBill signature to patch');
}

// Add TDS journal line in createBill after IGST
const oldBillIgst = `      if (igst > 0) {
        const igstAcct = await getSystemAccount(companyId, 'IGST Input');
        if (igstAcct) jeLines.push({ accountId: igstAcct.id, accountName: igstAcct.name, debit: String(igst), credit: '0' });
      }
      jeLines.push({ accountId: apAcct.id, accountName: apAcct.name, debit: '0', credit: data.amount });`;
const newBillIgst = `      if (igst > 0) {
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
      jeLines.push({ accountId: apAcct.id, accountName: apAcct.name, debit: '0', credit: apCredit });`;
if (content.includes(oldBillIgst)) {
  content = content.replace(oldBillIgst, newBillIgst);
  console.log('✅ Added TDS auto-posting to createBill');
}

// 3. Add TDS Payable and TCS Payable to seedDefaultCOA if not already there
if (!content.includes("'TDS Payable'") || !content.includes("'TCS Payable'")) {
  // Find the last system account in the seed and add TDS/TCS Payable
  const tdsPayableEntry = `    { code: '2120', name: 'TDS Payable', type: 'Liability', subtype: 'Current Liability', nature: 'credit', isSystemAccount: true },`;
  const tcsPayableEntry = `    { code: '2130', name: 'TCS Payable', type: 'Liability', subtype: 'Current Liability', nature: 'credit', isSystemAccount: true },`;
  
  // Add after ESI Payable or Professional Tax Payable
  if (content.includes("'Professional Tax Payable'") && !content.includes("'TDS Payable'")) {
    const ptLine = content.match(/.*'Professional Tax Payable'.*\n/);
    if (ptLine) {
      content = content.replace(ptLine[0], ptLine[0] + tdsPayableEntry + '\n' + tcsPayableEntry + '\n');
      console.log('✅ Added TDS Payable and TCS Payable to seedDefaultCOA');
    }
  }
}

fs.writeFileSync('server/db.ts', content, 'utf8');
console.log('\\n✅ All patches applied successfully');
