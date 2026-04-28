import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, companyProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ───────────────────────────────────────────────────────
  dashboard: router({
    getData: companyProcedure.query(async ({ ctx }) => db.getDashboardData(ctx.companyId)),
  }),

  // ─── Accounts (COA) ─────────────────────────────────────────────────
  accounts: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllAccounts(ctx.companyId)),
    create: companyProcedure.input(z.object({
      code: z.string(), name: z.string(), type: z.string(), subtype: z.string().optional(),
      parentId: z.number().optional(), isGroup: z.boolean().optional(), nature: z.string().optional(),
      balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createAccount(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), code: z.string().optional(), name: z.string().optional(), type: z.string().optional(), subtype: z.string().optional(),
      parentId: z.number().optional(), isGroup: z.boolean().optional(), nature: z.string().optional(),
      balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateAccount(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteAccount(input.id, ctx.companyId); return { success: true }; }),
    seedCOA: companyProcedure.mutation(async ({ ctx }) => { await db.seedDefaultCOA(ctx.companyId); return { success: true }; }),
    balances: companyProcedure.query(async ({ ctx }) => db.getAllAccountBalances(ctx.companyId)),
    generalLedger: companyProcedure.input(z.object({ accountId: z.number() })).query(async ({ ctx, input }) => db.getGeneralLedger(ctx.companyId, input.accountId)),
  }),

  // ─── Financial Reports ──────────────────────────────────────────────
  reports: router({
    trialBalance: companyProcedure.query(async ({ ctx }) => db.getTrialBalance(ctx.companyId)),
    profitAndLoss: companyProcedure.query(async ({ ctx }) => db.getProfitAndLoss(ctx.companyId)),
    balanceSheet: companyProcedure.query(async ({ ctx }) => db.getBalanceSheet(ctx.companyId)),
  }),

  // ─── Journal Entries ─────────────────────────────────────────────────
  journal: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllJournalEntries(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('journal_entries', 'JE')),
    create: companyProcedure.input(z.object({
      entryId: z.string(), date: z.string(), description: z.string(), posted: z.boolean(),
      lines: z.array(z.object({ accountId: z.number(), accountName: z.string(), debit: z.string(), credit: z.string(), narration: z.string().optional() }))
    })).mutation(async ({ ctx, input }) => { await db.createJournalEntry(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), date: z.string(), description: z.string(), posted: z.boolean(),
      lines: z.array(z.object({ accountId: z.number(), accountName: z.string(), debit: z.string(), credit: z.string(), narration: z.string().optional() }))
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateJournalEntry(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteJournalEntry(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Customers ───────────────────────────────────────────────────────
  customers: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllCustomers(ctx.companyId)),
    create: companyProcedure.input(z.object({
      name: z.string(), email: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createCustomer(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateCustomer(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteCustomer(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Invoices ────────────────────────────────────────────────────────
  invoices: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllInvoices(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('invoices', 'INV')),
    create: companyProcedure.input(z.object({
      invoiceId: z.string(), customerId: z.number(), customerName: z.string(), date: z.string(), dueDate: z.string(), status: z.string(),
      subtotal: z.string(), cgst: z.string().default('0'), sgst: z.string().default('0'), igst: z.string().default('0'), total: z.string(),
      lines: z.array(z.object({ description: z.string(), hsnCode: z.string().optional(), qty: z.number(), rate: z.string(), discount: z.string().optional(), gstRate: z.string().optional(), amount: z.string() }))
    })).mutation(async ({ ctx, input }) => { await db.createInvoice(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => {
      await db.updateInvoiceStatus(input.id, ctx.companyId, input.status);
      if (input.status === 'Sent') {
        const invoices = await db.getAllInvoices(ctx.companyId);
        const inv = invoices.find((i: any) => i.id === input.id);
        if (inv) notifyOwner({ title: `Invoice ${inv.invoiceId} Sent`, content: `Invoice ${inv.invoiceId} for ${inv.customerName} (${inv.total}) has been marked as Sent.` }).catch(() => {});
      }
      if (input.status === 'Overdue') {
        const invoices = await db.getAllInvoices(ctx.companyId);
        const inv = invoices.find((i: any) => i.id === input.id);
        if (inv) notifyOwner({ title: `Invoice ${inv.invoiceId} OVERDUE`, content: `Invoice ${inv.invoiceId} for ${inv.customerName} (${inv.total}) is now overdue. Due date: ${inv.dueDate}` }).catch(() => {});
      }
      return { success: true };
    }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteInvoice(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Sale Returns ───────────────────────────────────────────────────
  saleReturns: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllSaleReturns(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('sale_returns', 'CR')),
    create: companyProcedure.input(z.object({
      returnId: z.string(), customerId: z.number(), customerName: z.string(), date: z.string(), invoiceRef: z.string().optional(), amount: z.string(), reason: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createSaleReturn(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteSaleReturn(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Estimates ──────────────────────────────────────────────────────
  estimates: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllEstimates(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('estimates', 'EST')),
    create: companyProcedure.input(z.object({
      estimateId: z.string(), customerId: z.number(), customerName: z.string(), date: z.string(), validUntil: z.string().optional(), total: z.string(), notes: z.string().optional(),
      lines: z.array(z.object({ description: z.string(), qty: z.number(), rate: z.string(), amount: z.string() }))
    })).mutation(async ({ ctx, input }) => { await db.createEstimate(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => { await db.updateEstimateStatus(input.id, ctx.companyId, input.status); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteEstimate(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Payments In ────────────────────────────────────────────────────
  paymentsIn: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllPaymentsIn(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('payments_in', 'REC')),
    create: companyProcedure.input(z.object({
      paymentId: z.string(), customerId: z.number(), customerName: z.string(), date: z.string(), amount: z.string(), mode: z.string(), invoiceRef: z.string().optional(), notes: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createPaymentIn(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deletePaymentIn(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Vendors ─────────────────────────────────────────────────────────
  vendors: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllVendors(ctx.companyId)),
    create: companyProcedure.input(z.object({
      name: z.string(), email: z.string().optional(), phone: z.string().optional(), category: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createVendor(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), category: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateVendor(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteVendor(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Bills ───────────────────────────────────────────────────────────
  bills: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllBills(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('bills', 'BILL')),
    create: companyProcedure.input(z.object({
      billId: z.string(), vendorId: z.number(), vendorName: z.string(), date: z.string(), dueDate: z.string(),
      subtotal: z.string().optional(), cgst: z.string().optional(), sgst: z.string().optional(), igst: z.string().optional(),
      amount: z.string(), description: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createBill(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => { await db.updateBillStatus(input.id, ctx.companyId, input.status); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteBill(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Purchase Returns ───────────────────────────────────────────────
  purchaseReturns: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllPurchaseReturns(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('purchase_returns', 'DN')),
    create: companyProcedure.input(z.object({
      returnId: z.string(), vendorId: z.number(), vendorName: z.string(), date: z.string(), billRef: z.string().optional(), amount: z.string(), reason: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createPurchaseReturn(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deletePurchaseReturn(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Payments Out ──────────────────────────────────────────────────
  paymentsOut: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllPaymentsOut(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('payments_out', 'PAY')),
    create: companyProcedure.input(z.object({
      paymentId: z.string(), vendorId: z.number(), vendorName: z.string(), date: z.string(), amount: z.string(), mode: z.string(), billRef: z.string().optional(), notes: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createPaymentOut(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deletePaymentOut(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Inventory ───────────────────────────────────────────────────────
  inventory: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllInventory(ctx.companyId)),
    create: companyProcedure.input(z.object({
      sku: z.string(), name: z.string(), category: z.string().optional(), qty: z.number(), cost: z.string(), reorder: z.number(), warehouseId: z.number().optional(), hsnCode: z.string().optional(), gstRate: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createInventoryItem(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), sku: z.string().optional(), name: z.string().optional(), category: z.string().optional(), qty: z.number().optional(), cost: z.string().optional(), reorder: z.number().optional(), warehouseId: z.number().optional(), hsnCode: z.string().optional(), gstRate: z.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateInventoryItem(id, ctx.companyId, data);
      if (data.qty !== undefined) {
        const items = await db.getAllInventory(ctx.companyId);
        const item = items.find((i: any) => i.id === id);
        if (item && Number(item.qty) <= Number(item.reorder)) {
          notifyOwner({ title: `Low Stock Alert: ${item.name}`, content: `${item.name} (SKU: ${item.sku}) is at ${item.qty} units, below reorder level of ${item.reorder}.` }).catch(() => {});
        }
      }
      return { success: true };
    }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteInventoryItem(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Purchase Orders ─────────────────────────────────────────────────
  purchaseOrders: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllPurchaseOrders(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('purchase_orders', 'PO')),
    create: companyProcedure.input(z.object({
      poId: z.string(), vendorId: z.number(), vendorName: z.string(), date: z.string(), expectedDate: z.string().optional(), total: z.string(), description: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createPurchaseOrder(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => { await db.updatePOStatus(input.id, ctx.companyId, input.status); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deletePurchaseOrder(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Employees ───────────────────────────────────────────────────────
  employees: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllEmployees(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('employees', 'EMP')),
    create: companyProcedure.input(z.object({
      empId: z.string(), name: z.string(), title: z.string().optional(), dept: z.string().optional(), type: z.string(), salary: z.string(), rate: z.string(), email: z.string().optional(), startDate: z.string().optional(), active: z.boolean(),
      basicSalary: z.string().optional(), hra: z.string().optional(), da: z.string().optional(), specialAllowance: z.string().optional(),
      panNumber: z.string().optional(), uanNumber: z.string().optional(), esiNumber: z.string().optional(), pfOptOut: z.boolean().optional()
    })).mutation(async ({ ctx, input }) => { await db.createEmployee(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), title: z.string().optional(), dept: z.string().optional(), type: z.string().optional(), salary: z.string().optional(), rate: z.string().optional(), email: z.string().optional(), startDate: z.string().optional(), active: z.boolean().optional(),
      basicSalary: z.string().optional(), hra: z.string().optional(), da: z.string().optional(), specialAllowance: z.string().optional(),
      panNumber: z.string().optional(), uanNumber: z.string().optional(), esiNumber: z.string().optional(), pfOptOut: z.boolean().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateEmployee(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteEmployee(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Payroll ─────────────────────────────────────────────────────────
  payroll: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllPayrollRuns(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('payroll_runs', 'PR')),
    run: companyProcedure.input(z.object({
      payrollId: z.string(), period: z.string(), runDate: z.string(), gross: z.string(),
      basicPay: z.string().optional(), hra_amt: z.string().optional(), da_amt: z.string().optional(), specialAllow: z.string().optional(),
      pfEmployee: z.string().optional(), pfEmployer: z.string().optional(),
      esiEmployee: z.string().optional(), esiEmployer: z.string().optional(),
      professionalTax: z.string().optional(), tds: z.string().optional(),
      fedTax: z.string().optional(), stateTax: z.string().optional(), ssMed: z.string().optional(),
      net: z.string()
    })).mutation(async ({ ctx, input }) => { await db.createPayrollRun(ctx.companyId, input); return { success: true }; }),
  }),

  // ─── Warehouses ──────────────────────────────────────────────────────
  warehouses: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllWarehouses(ctx.companyId)),
    create: companyProcedure.input(z.object({
      name: z.string(), location: z.string().optional(), capacity: z.number().optional(), manager: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createWarehouse(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), location: z.string().optional(), capacity: z.number().optional(), manager: z.string().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateWarehouse(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteWarehouse(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Supply Chain ────────────────────────────────────────────────────
  supplyChain: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllSupplyChainOrders(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('supply_chain_orders', 'SC')),
    create: companyProcedure.input(z.object({
      orderId: z.string(), supplierName: z.string(), itemName: z.string(), qty: z.number(), orderDate: z.string(), expectedDate: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createSupplyChainOrder(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => { await db.updateSCOrderStatus(input.id, ctx.companyId, input.status); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteSCOrder(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Delivery Staff ──────────────────────────────────────────────────
  deliveryStaff: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllDeliveryStaff(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('delivery_staff', 'DS')),
    create: companyProcedure.input(z.object({
      staffId: z.string(), name: z.string(), phone: z.string().optional(), email: z.string().optional(), vehicleType: z.string().optional(), vehicleNumber: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createDeliveryStaffMember(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), phone: z.string().optional(), email: z.string().optional(), vehicleType: z.string().optional(), vehicleNumber: z.string().optional(), active: z.boolean().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateDeliveryStaffMember(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteDeliveryStaffMember(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Deliveries ──────────────────────────────────────────────────────
  deliveries: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllDeliveries(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('deliveries', 'DEL')),
    create: companyProcedure.input(z.object({
      deliveryId: z.string(), staffId: z.number().optional(), staffName: z.string().optional(), customerName: z.string(), address: z.string().optional(), invoiceId: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createDelivery(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => { await db.updateDeliveryStatus(input.id, ctx.companyId, input.status); return { success: true }; }),
    assign: companyProcedure.input(z.object({ id: z.number(), staffId: z.number(), staffName: z.string() })).mutation(async ({ ctx, input }) => { await db.assignDelivery(input.id, ctx.companyId, input.staffId, input.staffName); return { success: true }; }),
  }),

  // ─── Cash & Bank ────────────────────────────────────────────────────
  cashBank: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllCashBankAccounts(ctx.companyId)),
    create: companyProcedure.input(z.object({
      name: z.string(), type: z.string(), bankName: z.string().optional(), accountNumber: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createCashBankAccount(ctx.companyId, input); return { success: true }; }),
    update: companyProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), type: z.string().optional(), bankName: z.string().optional(), accountNumber: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ ctx, input }) => { const { id, ...data } = input; await db.updateCashBankAccount(id, ctx.companyId, data); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteCashBankAccount(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Expenses ───────────────────────────────────────────────────────
  expenses: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllExpenses(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('expenses', 'EXP')),
    create: companyProcedure.input(z.object({
      expenseId: z.string(), date: z.string(), category: z.string(), amount: z.string(), paymentMode: z.string(), description: z.string().optional(), gstIncluded: z.boolean().optional(), gstAmount: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createExpense(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteExpense(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Other Income ───────────────────────────────────────────────────
  otherIncome: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllOtherIncome(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('other_income', 'INC')),
    create: companyProcedure.input(z.object({
      incomeId: z.string(), date: z.string(), category: z.string(), amount: z.string(), paymentMode: z.string(), description: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createOtherIncome(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteOtherIncome(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Delivery Challans ──────────────────────────────────────────────
  deliveryChallans: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllDeliveryChallans(ctx.companyId)),
    nextId: companyProcedure.query(async () => db.getNextId('delivery_challans', 'DC')),
    create: companyProcedure.input(z.object({
      challanId: z.string(), customerId: z.number(), customerName: z.string(), date: z.string(),
      invoiceRef: z.string().optional(), items: z.any().optional(), transportMode: z.string().optional(),
      vehicleNumber: z.string().optional(), notes: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createDeliveryChallan(ctx.companyId, input); return { success: true }; }),
    updateStatus: companyProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ ctx, input }) => { await db.updateDeliveryChallanStatus(input.id, ctx.companyId, input.status); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deleteDeliveryChallan(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── Party Groups ──────────────────────────────────────────────────
  partyGroups: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllPartyGroups(ctx.companyId)),
    create: companyProcedure.input(z.object({
      name: z.string(), type: z.string(), description: z.string().optional()
    })).mutation(async ({ ctx, input }) => { await db.createPartyGroup(ctx.companyId, input); return { success: true }; }),
    delete: companyProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.deletePartyGroup(input.id, ctx.companyId); return { success: true }; }),
  }),

  // ─── GST Reports ──────────────────────────────────────────────────
  gst: router({
    summary: companyProcedure.query(async ({ ctx }) => db.getGSTSummary(ctx.companyId)),
  }),

  // ─── Advanced Reports ─────────────────────────────────────────────
  advancedReports: router({
    dayBook: companyProcedure.input(z.object({ date: z.string() })).query(async ({ ctx, input }) => db.getDayBook(ctx.companyId, input.date)),
    cashflow: companyProcedure.query(async ({ ctx }) => db.getCashflowReport(ctx.companyId)),
    aging: companyProcedure.query(async ({ ctx }) => db.getAgingReport(ctx.companyId)),
    stockSummary: companyProcedure.query(async ({ ctx }) => db.getStockSummary(ctx.companyId)),
    partyStatement: companyProcedure.input(z.object({ partyType: z.enum(['customer', 'vendor']), partyId: z.number() })).query(async ({ ctx, input }) => db.getPartyStatement(ctx.companyId, input.partyType, input.partyId)),
  }),

  // ─── Bulk Import ─────────────────────────────────────────────────────
  bulkImport: router({
    customers: companyProcedure.input(z.object({ rows: z.array(z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), address: z.string().optional() })) })).mutation(async ({ ctx, input }) => {
      let imported = 0;
      for (const row of input.rows) { await db.createCustomer(ctx.companyId, row); imported++; }
      return { success: true, imported };
    }),
    vendors: companyProcedure.input(z.object({ rows: z.array(z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional(), category: z.string().optional(), address: z.string().optional() })) })).mutation(async ({ ctx, input }) => {
      let imported = 0;
      for (const row of input.rows) { await db.createVendor(ctx.companyId, row); imported++; }
      return { success: true, imported };
    }),
    inventory: companyProcedure.input(z.object({ rows: z.array(z.object({ sku: z.string(), name: z.string(), category: z.string().optional(), qty: z.number(), cost: z.string(), reorder: z.number().optional() })) })).mutation(async ({ ctx, input }) => {
      let imported = 0;
      for (const row of input.rows) { await db.createInventoryItem(ctx.companyId, { ...row, reorder: row.reorder || 10 }); imported++; }
      return { success: true, imported };
    }),
  }),

  // ─── Settings ────────────────────────────────────────────────────────
  settings: router({
    list: companyProcedure.query(async ({ ctx }) => db.getAllSettings(ctx.companyId)),
    upsert: companyProcedure.input(z.object({ key: z.string(), value: z.string() })).mutation(async ({ ctx, input }) => { await db.upsertSetting(ctx.companyId, input.key, input.value); return { success: true }; }),
  }),

  // ─── Admin: User Management ──────────────────────────────────────────
  admin: router({
    users: adminProcedure.query(async () => db.getAllUsers()),
    updateRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(async ({ input }) => { await db.updateUserRole(input.userId, input.role); return { success: true }; }),
  }),

  // ─── Company (Multi-Tenant) ───────────────────────────────────────────
  company: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getUserCompanies(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string(), slug: z.string(), gstin: z.string().optional(), pan: z.string().optional(),
      address: z.string().optional(), city: z.string().optional(), state: z.string().optional(),
      phone: z.string().optional(), email: z.string().optional(), industry: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createCompany({ ...input, ownerId: ctx.user.id });
      return { success: true, company: result };
    }),
    getBySlug: protectedProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => db.getCompanyBySlug(input.slug)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getCompanyById(input.id)),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), gstin: z.string().optional(), pan: z.string().optional(),
      address: z.string().optional(), city: z.string().optional(), state: z.string().optional(),
      phone: z.string().optional(), email: z.string().optional(), industry: z.string().optional(),
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateCompany(id, data); return { success: true }; }),
    members: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => db.getCompanyMembers(input.companyId)),
    addMember: adminProcedure.input(z.object({ companyId: z.number(), userId: z.number(), role: z.string() })).mutation(async ({ input }) => { await db.addCompanyMember(input.companyId, input.userId, input.role); return { success: true }; }),
    removeMember: adminProcedure.input(z.object({ companyId: z.number(), userId: z.number() })).mutation(async ({ input }) => { await db.removeCompanyMember(input.companyId, input.userId); return { success: true }; }),
  }),

  // ─── Subscription & Trial ────────────────────────────────────────────
  subscription: router({
    get: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => db.getSubscription(input.companyId)),
    trialStatus: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => db.getTrialStatus(input.companyId)),
    update: adminProcedure.input(z.object({
      id: z.number(), plan: z.string().optional(), status: z.string().optional(),
      paymentGateway: z.string().optional(), paymentId: z.string().optional(), amount: z.string().optional(),
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateSubscription(id, data); return { success: true }; }),
    createCheckout: protectedProcedure.input(z.object({
      companyId: z.number(),
      plan: z.string(),
      interval: z.enum(["monthly", "yearly"]),
      origin: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const { createCheckoutSession } = await import("./stripe-webhook");
      return createCheckoutSession({
        companyId: input.companyId,
        plan: input.plan,
        interval: input.interval,
        userId: ctx.user!.id,
        userEmail: ctx.user!.email || "",
        userName: ctx.user!.name || "",
        origin: input.origin,
      });
    }),
    plans: publicProcedure.query(async () => {
      const { PLANS } = await import("./stripe-products");
      return PLANS;
    }),
  }),
});
export type AppRouter = typeof appRouter;
