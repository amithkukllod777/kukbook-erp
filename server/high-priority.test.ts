import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("High Priority Features — DB Helpers", () => {
  // 1. Partial Payments
  describe("Partial Payments", () => {
    it("recordPartialPayment should be a function", () => {
      expect(typeof db.recordPartialPayment).toBe("function");
    });
    it("getInvoicePayments should be a function", () => {
      expect(typeof db.getInvoicePayments).toBe("function");
    });
    it("getOverdueInvoices should be a function", () => {
      expect(typeof db.getOverdueInvoices).toBe("function");
    });
  });

  // 2. Recurring Invoices
  describe("Recurring Invoices", () => {
    it("createRecurringInvoice should be a function", () => {
      expect(typeof db.createRecurringInvoice).toBe("function");
    });
    it("listRecurringInvoices should be a function", () => {
      expect(typeof db.listRecurringInvoices).toBe("function");
    });
    it("updateRecurringInvoice should be a function", () => {
      expect(typeof db.updateRecurringInvoice).toBe("function");
    });
    it("deleteRecurringInvoice should be a function", () => {
      expect(typeof db.deleteRecurringInvoice).toBe("function");
    });
  });

  // 3. Activity / Audit Log
  describe("Activity Log", () => {
    it("logActivity should be a function", () => {
      expect(typeof db.logActivity).toBe("function");
    });
    it("listActivityLogs should be a function", () => {
      expect(typeof db.listActivityLogs).toBe("function");
    });
  });

  // 4. Bank Reconciliation
  describe("Bank Reconciliation", () => {
    it("createBankReconciliation should be a function", () => {
      expect(typeof db.createBankReconciliation).toBe("function");
    });
    it("listBankReconciliations should be a function", () => {
      expect(typeof db.listBankReconciliations).toBe("function");
    });
    it("getBankReconciliation should be a function", () => {
      expect(typeof db.getBankReconciliation).toBe("function");
    });
    it("addReconciliationItem should be a function", () => {
      expect(typeof db.addReconciliationItem).toBe("function");
    });
    it("matchReconciliationItem should be a function", () => {
      expect(typeof db.matchReconciliationItem).toBe("function");
    });
    it("finalizeBankReconciliation should be a function", () => {
      expect(typeof db.finalizeBankReconciliation).toBe("function");
    });
  });

  // 5. Credit Limit
  describe("Credit Limit", () => {
    it("setCreditLimit should be a function", () => {
      expect(typeof db.setCreditLimit).toBe("function");
    });
    it("getCustomerCreditStatus should be a function", () => {
      expect(typeof db.getCustomerCreditStatus).toBe("function");
    });
    it("updateCustomerBalance should be a function", () => {
      expect(typeof db.updateCustomerBalance).toBe("function");
    });
  });
});
