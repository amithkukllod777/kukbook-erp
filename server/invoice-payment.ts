import { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "./db";

// Generate a unique payment link token for an invoice
export async function generateInvoicePaymentToken(invoiceId: number, companyId: number): Promise<string> {
  const token = crypto.randomBytes(24).toString("hex");
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  // Store token in invoice_payment_links table
  await database.execute({
    sql: `INSERT INTO invoice_payment_links (invoiceId, companyId, token, createdAt) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE token = VALUES(token)`,
    args: [invoiceId, companyId, token],
  } as any);
  return token;
}

// Register public routes for invoice payment
export function registerInvoicePayment(app: Express) {
  // Public endpoint: Get invoice details by payment token
  app.get("/api/invoice-pay/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const database = await db.getDb();
      if (!database) return res.status(500).json({ error: "Database not available" });

      const [link]: any = await database.execute({
        sql: `SELECT * FROM invoice_payment_links WHERE token = ?`,
        args: [token],
      } as any);

      if (!link || !link[0]) return res.status(404).json({ error: "Invalid payment link" });
      const { invoiceId, companyId } = link[0];

      // Get invoice details
      const [invoiceRows]: any = await database.execute({
        sql: `SELECT id, invoiceId, customerName, date, dueDate, total, paidAmount, dueAmount, status FROM invoices WHERE id = ? AND inv_companyId = ?`,
        args: [invoiceId, companyId],
      } as any);

      if (!invoiceRows || !invoiceRows[0]) return res.status(404).json({ error: "Invoice not found" });
      const invoice = invoiceRows[0];

      // Get company name
      const [companyRows]: any = await database.execute({
        sql: `SELECT name FROM companies WHERE id = ?`,
        args: [companyId],
      } as any);
      const companyName = companyRows?.[0]?.name || "Business";

      // Get Razorpay key ID (public key for frontend)
      const keyId = await db.getSetting(companyId, "razorpay_key_id");

      res.json({
        invoice: {
          id: invoice.id,
          invoiceId: invoice.invoiceId,
          customerName: invoice.customerName,
          date: invoice.date,
          dueDate: invoice.dueDate,
          total: invoice.total,
          paidAmount: invoice.paidAmount,
          dueAmount: invoice.dueAmount,
          status: invoice.status,
        },
        companyName,
        razorpayKeyId: keyId,
        paymentEnabled: !!keyId,
      });
    } catch (err: any) {
      console.error("[Invoice Payment] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public endpoint: Create Razorpay order for invoice payment
  app.post("/api/invoice-pay/:token/create-order", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const database = await db.getDb();
      if (!database) return res.status(500).json({ error: "Database not available" });

      const [link]: any = await database.execute({
        sql: `SELECT * FROM invoice_payment_links WHERE token = ?`,
        args: [token],
      } as any);

      if (!link || !link[0]) return res.status(404).json({ error: "Invalid payment link" });
      const { invoiceId, companyId } = link[0];

      // Get invoice
      const [invoiceRows]: any = await database.execute({
        sql: `SELECT id, invoiceId, customerName, dueAmount, total, status FROM invoices WHERE id = ? AND inv_companyId = ?`,
        args: [invoiceId, companyId],
      } as any);

      if (!invoiceRows || !invoiceRows[0]) return res.status(404).json({ error: "Invoice not found" });
      const invoice = invoiceRows[0];

      if (invoice.status === "Paid") return res.status(400).json({ error: "Invoice already paid" });

      const amountToPay = Number(invoice.dueAmount) > 0 ? Number(invoice.dueAmount) : Number(invoice.total);
      const amountInPaise = Math.round(amountToPay * 100);

      // Get Razorpay credentials
      const keyId = await db.getSetting(companyId, "razorpay_key_id");
      const keySecret = await db.getSetting(companyId, "razorpay_key_secret");
      if (!keyId || !keySecret) {
        return res.status(400).json({ error: "Payment gateway not configured" });
      }

      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `inv_${invoice.invoiceId}_${Date.now()}`,
        notes: {
          invoice_id: invoiceId.toString(),
          company_id: companyId.toString(),
          invoice_number: invoice.invoiceId,
          customer_name: invoice.customerName,
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        invoiceId: invoice.invoiceId,
        customerName: invoice.customerName,
      });
    } catch (err: any) {
      console.error("[Invoice Payment] Create order error:", err.message);
      res.status(500).json({ error: err.message || "Failed to create payment order" });
    }
  });

  // Public endpoint: Verify payment and mark invoice as paid
  app.post("/api/invoice-pay/:token/verify", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      const database = await db.getDb();
      if (!database) return res.status(500).json({ error: "Database not available" });

      const [link]: any = await database.execute({
        sql: `SELECT * FROM invoice_payment_links WHERE token = ?`,
        args: [token],
      } as any);

      if (!link || !link[0]) return res.status(404).json({ error: "Invalid payment link" });
      const { invoiceId, companyId } = link[0];

      // Verify signature
      const keySecret = await db.getSetting(companyId, "razorpay_key_secret");
      if (!keySecret) return res.status(400).json({ error: "Payment gateway not configured" });

      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Payment verified — mark invoice as paid
      const [invoiceRows]: any = await database.execute({
        sql: `SELECT id, total, dueAmount FROM invoices WHERE id = ? AND inv_companyId = ?`,
        args: [invoiceId, companyId],
      } as any);

      if (invoiceRows && invoiceRows[0]) {
        const invoice = invoiceRows[0];
        const dueAmount = Number(invoice.dueAmount) > 0 ? Number(invoice.dueAmount) : Number(invoice.total);
        await db.recordPartialPayment(invoiceId, String(dueAmount));
      }

      res.json({ success: true, message: "Payment successful! Invoice marked as paid." });
    } catch (err: any) {
      console.error("[Invoice Payment] Verify error:", err.message);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });
}
