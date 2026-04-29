import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module
vi.mock('./db', () => ({
  getAllProformaInvoices: vi.fn().mockResolvedValue([
    { id: 1, proformaId: 'PI-001', customerName: 'Test Corp', total: '50000', status: 'Draft' }
  ]),
  createProformaInvoice: vi.fn().mockResolvedValue(undefined),
  updateProformaStatus: vi.fn().mockResolvedValue(undefined),
  deleteProformaInvoice: vi.fn().mockResolvedValue(undefined),
  getItemBatches: vi.fn().mockResolvedValue([
    { id: 1, batchNumber: 'BATCH-001', inventoryItemId: 1, expiryDate: '2026-12-31', quantity: 100, status: 'active' }
  ]),
  createBatch: vi.fn().mockResolvedValue(undefined),
  updateBatchStatus: vi.fn().mockResolvedValue(undefined),
  deleteBatch: vi.fn().mockResolvedValue(undefined),
  listApprovals: vi.fn().mockResolvedValue([
    { id: 1, entityType: 'PO', entityId: 5, status: 'pending', requestedByName: 'John' }
  ]),
  createApprovalRequest: vi.fn().mockResolvedValue(undefined),
  resolveApproval: vi.fn().mockResolvedValue(undefined),
  listEwayBills: vi.fn().mockResolvedValue([
    { id: 1, ewayBillNo: 'EWB-001', invoiceRef: 'INV-001', vehicleNo: 'KA01AB1234', totalValue: '75000' }
  ]),
  createEwayBill: vi.fn().mockResolvedValue(undefined),
  updateEwayBillNIC: vi.fn().mockResolvedValue(undefined),
  deleteEwayBill: vi.fn().mockResolvedValue(undefined),
  getTopCustomers: vi.fn().mockResolvedValue([
    { customerName: 'Big Corp', totalRevenue: '500000', invoiceCount: 12 }
  ]),
  getTopProducts: vi.fn().mockResolvedValue([
    { productName: 'Widget A', totalRevenue: '200000', totalQty: 500 }
  ]),
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import * as db from './db';

describe('Medium Priority Features - DB Helpers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('Proforma Invoices', () => {
    it('should list proforma invoices', async () => {
      const result = await db.getAllProformaInvoices(1);
      expect(result).toHaveLength(1);
      expect(result[0].proformaId).toBe('PI-001');
    });

    it('should create a proforma invoice', async () => {
      await db.createProformaInvoice(1, { proformaId: 'PI-002', customerName: 'New Corp', total: '30000' });
      expect(db.createProformaInvoice).toHaveBeenCalledWith(1, expect.objectContaining({ proformaId: 'PI-002' }));
    });

    it('should update proforma status', async () => {
      await db.updateProformaStatus(1, 1, 'Sent');
      expect(db.updateProformaStatus).toHaveBeenCalledWith(1, 1, 'Sent');
    });

    it('should delete proforma invoice', async () => {
      await db.deleteProformaInvoice(1, 1);
      expect(db.deleteProformaInvoice).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Batch Tracking', () => {
    it('should list batches', async () => {
      const result = await db.getItemBatches(1);
      expect(result).toHaveLength(1);
      expect(result[0].batchNumber).toBe('BATCH-001');
    });

    it('should create a batch', async () => {
      await db.createBatch(1, { inventoryItemId: 1, batchNumber: 'BATCH-002', expiryDate: '2027-06-30', quantity: 50 });
      expect(db.createBatch).toHaveBeenCalledWith(1, expect.objectContaining({ batchNumber: 'BATCH-002' }));
    });

    it('should update batch status to expired', async () => {
      await db.updateBatchStatus(1, 1, 'expired');
      expect(db.updateBatchStatus).toHaveBeenCalledWith(1, 1, 'expired');
    });
  });

  describe('Approval Workflows', () => {
    it('should list approvals', async () => {
      const result = await db.listApprovals(1);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('should list approvals with status filter', async () => {
      await db.listApprovals(1, 'pending');
      expect(db.listApprovals).toHaveBeenCalledWith(1, 'pending');
    });

    it('should resolve an approval', async () => {
      await db.resolveApproval(1, 1, 'approved', 'Looks good');
      expect(db.resolveApproval).toHaveBeenCalledWith(1, 1, 'approved', 'Looks good');
    });
  });

  describe('E-Way Bills', () => {
    it('should list e-way bills', async () => {
      const result = await db.listEwayBills(1);
      expect(result).toHaveLength(1);
      expect(result[0].ewayBillNo).toBe('EWB-001');
    });

    it('should create an e-way bill', async () => {
      await db.createEwayBill(1, { ewayBillNo: 'EWB-002', vehicleNo: 'MH01CD5678', totalValue: '100000' });
      expect(db.createEwayBill).toHaveBeenCalledWith(1, expect.objectContaining({ ewayBillNo: 'EWB-002' }));
    });

    it('should update NIC data', async () => {
      await db.updateEwayBillNIC(1, 1, { nicEwbNo: '12345', nicStatus: 'generated' });
      expect(db.updateEwayBillNIC).toHaveBeenCalledWith(1, 1, expect.objectContaining({ nicStatus: 'generated' }));
    });
  });

  describe('Top Ranking', () => {
    it('should get top customers', async () => {
      const result = await db.getTopCustomers(1, 10);
      expect(result).toHaveLength(1);
      expect(result[0].customerName).toBe('Big Corp');
    });

    it('should get top products', async () => {
      const result = await db.getTopProducts(1, 10);
      expect(result).toHaveLength(1);
      expect(result[0].productName).toBe('Widget A');
    });
  });
});
