import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
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
    getData: protectedProcedure.query(async () => {
      return db.getDashboardData();
    }),
  }),

  // ─── Accounts (COA) ─────────────────────────────────────────────────
  accounts: router({
    list: protectedProcedure.query(async () => db.getAllAccounts()),
    create: protectedProcedure.input(z.object({
      code: z.string(), name: z.string(), type: z.string(), subtype: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ input }) => { await db.createAccount(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), code: z.string().optional(), name: z.string().optional(), type: z.string().optional(), subtype: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateAccount(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteAccount(input.id); return { success: true }; }),
  }),

  // ─── Journal Entries ─────────────────────────────────────────────────
  journal: router({
    list: protectedProcedure.query(async () => db.getAllJournalEntries()),
    nextId: protectedProcedure.query(async () => db.getNextId('journal_entries', 'JE')),
    create: protectedProcedure.input(z.object({
      entryId: z.string(), date: z.string(), description: z.string(), posted: z.boolean(),
      lines: z.array(z.object({ account: z.string(), debit: z.string(), credit: z.string() }))
    })).mutation(async ({ input }) => { await db.createJournalEntry(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), date: z.string(), description: z.string(), posted: z.boolean(),
      lines: z.array(z.object({ account: z.string(), debit: z.string(), credit: z.string() }))
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateJournalEntry(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteJournalEntry(input.id); return { success: true }; }),
  }),

  // ─── Customers ───────────────────────────────────────────────────────
  customers: router({
    list: protectedProcedure.query(async () => db.getAllCustomers()),
    create: protectedProcedure.input(z.object({
      name: z.string(), email: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ input }) => { await db.createCustomer(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateCustomer(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteCustomer(input.id); return { success: true }; }),
  }),

  // ─── Invoices ────────────────────────────────────────────────────────
  invoices: router({
    list: protectedProcedure.query(async () => db.getAllInvoices()),
    nextId: protectedProcedure.query(async () => db.getNextId('invoices', 'INV')),
    create: protectedProcedure.input(z.object({
      invoiceId: z.string(), customerId: z.number(), customerName: z.string(), date: z.string(), dueDate: z.string(), status: z.string(), total: z.string(),
      lines: z.array(z.object({ description: z.string(), qty: z.number(), rate: z.string(), amount: z.string() }))
    })).mutation(async ({ input }) => { await db.createInvoice(input); return { success: true }; }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => {
      await db.updateInvoiceStatus(input.id, input.status);
      // Send notification when invoice is marked as Sent
      if (input.status === 'Sent') {
        const invoices = await db.getAllInvoices();
        const inv = invoices.find((i: any) => i.id === input.id);
        if (inv) {
          notifyOwner({ title: `Invoice ${inv.invoiceId} Sent`, content: `Invoice ${inv.invoiceId} for ${inv.customerName} (${inv.total}) has been marked as Sent.` }).catch(() => {});
        }
      }
      // Alert owner when invoice becomes overdue
      if (input.status === 'Overdue') {
        const invoices = await db.getAllInvoices();
        const inv = invoices.find((i: any) => i.id === input.id);
        if (inv) {
          notifyOwner({ title: `Invoice ${inv.invoiceId} OVERDUE`, content: `Invoice ${inv.invoiceId} for ${inv.customerName} (${inv.total}) is now overdue. Due date: ${inv.dueDate}` }).catch(() => {});
        }
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteInvoice(input.id); return { success: true }; }),
  }),

  // ─── Vendors ─────────────────────────────────────────────────────────
  vendors: router({
    list: protectedProcedure.query(async () => db.getAllVendors()),
    create: protectedProcedure.input(z.object({
      name: z.string(), email: z.string().optional(), phone: z.string().optional(), category: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ input }) => { await db.createVendor(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), category: z.string().optional(), address: z.string().optional(), balance: z.string().optional()
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateVendor(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteVendor(input.id); return { success: true }; }),
  }),

  // ─── Bills ───────────────────────────────────────────────────────────
  bills: router({
    list: protectedProcedure.query(async () => db.getAllBills()),
    nextId: protectedProcedure.query(async () => db.getNextId('bills', 'BILL')),
    create: protectedProcedure.input(z.object({
      billId: z.string(), vendorId: z.number(), vendorName: z.string(), date: z.string(), dueDate: z.string(), amount: z.string(), description: z.string().optional()
    })).mutation(async ({ input }) => { await db.createBill(input); return { success: true }; }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => { await db.updateBillStatus(input.id, input.status); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteBill(input.id); return { success: true }; }),
  }),

  // ─── Inventory ───────────────────────────────────────────────────────
  inventory: router({
    list: protectedProcedure.query(async () => db.getAllInventory()),
    create: protectedProcedure.input(z.object({
      sku: z.string(), name: z.string(), category: z.string().optional(), qty: z.number(), cost: z.string(), reorder: z.number(), warehouseId: z.number().optional()
    })).mutation(async ({ input }) => { await db.createInventoryItem(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), sku: z.string().optional(), name: z.string().optional(), category: z.string().optional(), qty: z.number().optional(), cost: z.string().optional(), reorder: z.number().optional(), warehouseId: z.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateInventoryItem(id, data);
      // Low stock alert
      if (data.qty !== undefined) {
        const items = await db.getAllInventory();
        const item = items.find((i: any) => i.id === id);
        if (item && Number(item.qty) <= Number(item.reorder)) {
          notifyOwner({ title: `Low Stock Alert: ${item.name}`, content: `${item.name} (SKU: ${item.sku}) is at ${item.qty} units, below reorder level of ${item.reorder}.` }).catch(() => {});
        }
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteInventoryItem(input.id); return { success: true }; }),
  }),

  // ─── Purchase Orders ─────────────────────────────────────────────────
  purchaseOrders: router({
    list: protectedProcedure.query(async () => db.getAllPurchaseOrders()),
    nextId: protectedProcedure.query(async () => db.getNextId('purchase_orders', 'PO')),
    create: protectedProcedure.input(z.object({
      poId: z.string(), vendorId: z.number(), vendorName: z.string(), date: z.string(), expectedDate: z.string().optional(), total: z.string(), description: z.string().optional()
    })).mutation(async ({ input }) => { await db.createPurchaseOrder(input); return { success: true }; }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => { await db.updatePOStatus(input.id, input.status); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deletePurchaseOrder(input.id); return { success: true }; }),
  }),

  // ─── Employees ───────────────────────────────────────────────────────
  employees: router({
    list: protectedProcedure.query(async () => db.getAllEmployees()),
    nextId: protectedProcedure.query(async () => db.getNextId('employees', 'EMP')),
    create: protectedProcedure.input(z.object({
      empId: z.string(), name: z.string(), title: z.string().optional(), dept: z.string().optional(), type: z.string(), salary: z.string(), rate: z.string(), email: z.string().optional(), startDate: z.string().optional(), active: z.boolean()
    })).mutation(async ({ input }) => { await db.createEmployee(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), title: z.string().optional(), dept: z.string().optional(), type: z.string().optional(), salary: z.string().optional(), rate: z.string().optional(), email: z.string().optional(), startDate: z.string().optional(), active: z.boolean().optional()
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateEmployee(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteEmployee(input.id); return { success: true }; }),
  }),

  // ─── Payroll ─────────────────────────────────────────────────────────
  payroll: router({
    list: protectedProcedure.query(async () => db.getAllPayrollRuns()),
    nextId: protectedProcedure.query(async () => db.getNextId('payroll_runs', 'PR')),
    run: protectedProcedure.input(z.object({
      payrollId: z.string(), period: z.string(), runDate: z.string(), gross: z.string(), fedTax: z.string(), stateTax: z.string(), ssMed: z.string(), net: z.string()
    })).mutation(async ({ input }) => { await db.createPayrollRun(input); return { success: true }; }),
  }),

  // ─── Warehouses ──────────────────────────────────────────────────────
  warehouses: router({
    list: protectedProcedure.query(async () => db.getAllWarehouses()),
    create: protectedProcedure.input(z.object({
      name: z.string(), location: z.string().optional(), capacity: z.number().optional(), manager: z.string().optional()
    })).mutation(async ({ input }) => { await db.createWarehouse(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), location: z.string().optional(), capacity: z.number().optional(), manager: z.string().optional()
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateWarehouse(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteWarehouse(input.id); return { success: true }; }),
  }),

  // ─── Supply Chain ────────────────────────────────────────────────────
  supplyChain: router({
    list: protectedProcedure.query(async () => db.getAllSupplyChainOrders()),
    nextId: protectedProcedure.query(async () => db.getNextId('supply_chain_orders', 'SC')),
    create: protectedProcedure.input(z.object({
      orderId: z.string(), supplierName: z.string(), itemName: z.string(), qty: z.number(), orderDate: z.string(), expectedDate: z.string().optional()
    })).mutation(async ({ input }) => { await db.createSupplyChainOrder(input); return { success: true }; }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => { await db.updateSCOrderStatus(input.id, input.status); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteSCOrder(input.id); return { success: true }; }),
  }),

  // ─── Delivery Staff ──────────────────────────────────────────────────
  deliveryStaff: router({
    list: protectedProcedure.query(async () => db.getAllDeliveryStaff()),
    nextId: protectedProcedure.query(async () => db.getNextId('delivery_staff', 'DS')),
    create: protectedProcedure.input(z.object({
      staffId: z.string(), name: z.string(), phone: z.string().optional(), email: z.string().optional(), vehicleType: z.string().optional(), vehicleNumber: z.string().optional()
    })).mutation(async ({ input }) => { await db.createDeliveryStaffMember(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), phone: z.string().optional(), email: z.string().optional(), vehicleType: z.string().optional(), vehicleNumber: z.string().optional(), active: z.boolean().optional()
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateDeliveryStaffMember(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteDeliveryStaffMember(input.id); return { success: true }; }),
  }),

  // ─── Deliveries ──────────────────────────────────────────────────────
  deliveries: router({
    list: protectedProcedure.query(async () => db.getAllDeliveries()),
    nextId: protectedProcedure.query(async () => db.getNextId('deliveries', 'DEL')),
    create: protectedProcedure.input(z.object({
      deliveryId: z.string(), staffId: z.number().optional(), staffName: z.string().optional(), customerName: z.string(), address: z.string().optional(), invoiceId: z.string().optional()
    })).mutation(async ({ input }) => { await db.createDelivery(input); return { success: true }; }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => { await db.updateDeliveryStatus(input.id, input.status); return { success: true }; }),
    assign: protectedProcedure.input(z.object({ id: z.number(), staffId: z.number(), staffName: z.string() })).mutation(async ({ input }) => { await db.assignDelivery(input.id, input.staffId, input.staffName); return { success: true }; }),
  }),

  // ─── Settings ────────────────────────────────────────────────────────
  settings: router({
    list: protectedProcedure.query(async () => db.getAllSettings()),
    upsert: adminProcedure.input(z.object({ key: z.string(), value: z.string() })).mutation(async ({ input }) => { await db.upsertSetting(input.key, input.value); return { success: true }; }),
  }),

  // ─── Admin: User Management ──────────────────────────────────────────
  admin: router({
    users: adminProcedure.query(async () => db.getAllUsers()),
    updateRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(async ({ input }) => { await db.updateUserRole(input.userId, input.role); return { success: true }; }),
  }),
});

export type AppRouter = typeof appRouter;
