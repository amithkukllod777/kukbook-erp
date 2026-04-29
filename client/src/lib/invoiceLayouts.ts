/**
 * Invoice PDF Layout Templates with Color Customization
 * 5 Professional Designs: Professional, Modern, Corporate, Minimal, Creative
 */

export interface InvoiceLayoutConfig {
  name: string;
  description: string;
  defaultColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
}

export interface InvoiceColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export const INVOICE_LAYOUTS: Record<string, InvoiceLayoutConfig> = {
  professional: {
    name: "Professional (FoodOnDoor Style)",
    description: "Green & Dark Blue - Premium business look",
    defaultColors: {
      primary: "#1e7e34", // Dark Green
      secondary: "#0f172a", // Dark Blue
      accent: "#10b981", // Emerald Green
      background: "#f8fafc",
      text: "#1a1a2e",
      border: "#e2e8f0",
    },
  },
  modern: {
    name: "Modern Minimalist",
    description: "Blue & Gray - Clean and contemporary",
    defaultColors: {
      primary: "#2563eb", // Blue
      secondary: "#1e293b", // Slate
      accent: "#3b82f6", // Light Blue
      background: "#f1f5f9",
      text: "#0f172a",
      border: "#cbd5e1",
    },
  },
  corporate: {
    name: "Corporate Professional",
    description: "Navy & Gold - Elegant and formal",
    defaultColors: {
      primary: "#001f3f", // Navy
      secondary: "#d4af37", // Gold
      accent: "#fbbf24", // Amber
      background: "#fafaf9",
      text: "#1f2937",
      border: "#d1d5db",
    },
  },
  minimal: {
    name: "Minimal Clean",
    description: "Black & White - Simplicity at its best",
    defaultColors: {
      primary: "#000000", // Black
      secondary: "#6b7280", // Gray
      accent: "#374151", // Dark Gray
      background: "#ffffff",
      text: "#111827",
      border: "#e5e7eb",
    },
  },
  creative: {
    name: "Creative Vibrant",
    description: "Purple & Orange - Modern and bold",
    defaultColors: {
      primary: "#7c3aed", // Purple
      secondary: "#ea580c", // Orange
      accent: "#a78bfa", // Light Purple
      background: "#faf5ff",
      text: "#2d1b4e",
      border: "#e9d5ff",
    },
  },
};

export function generateInvoicePDF(invoice: any, layoutKey: string = "professional", colors?: InvoiceColors): string {
  const config = INVOICE_LAYOUTS[layoutKey] || INVOICE_LAYOUTS.professional;
  const finalColors = colors || config.defaultColors;
  const items = invoice.items || [];

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

  // Layout-specific HTML generators
  const layouts: Record<string, () => string> = {
    professional: () => layoutProfessional(invoice, items, finalColors, fmt),
    modern: () => layoutModern(invoice, items, finalColors, fmt),
    corporate: () => layoutCorporate(invoice, items, finalColors, fmt),
    minimal: () => layoutMinimal(invoice, items, finalColors, fmt),
    creative: () => layoutCreative(invoice, items, finalColors, fmt),
  };

  return layouts[layoutKey]?.() || layouts.professional();
}

function layoutProfessional(invoice: any, items: any[], colors: InvoiceColors, fmt: (n: number) => string): string {
  return `<!DOCTYPE html>
<html><head><title>Invoice ${invoice.invoiceId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: ${colors.background}; color: ${colors.text}; }
  .container { max-width: 900px; margin: 40px auto; background: white; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  
  /* Header with curved design */
  .header { position: relative; padding-bottom: 30px; margin-bottom: 30px; border-bottom: 3px solid ${colors.primary}; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .company-info { flex: 1; }
  .company-name { font-size: 28px; font-weight: 700; color: ${colors.primary}; margin-bottom: 5px; }
  .company-tag { font-size: 13px; color: ${colors.secondary}; }
  .invoice-badge { background: ${colors.primary}; color: white; padding: 15px 25px; border-radius: 8px; text-align: center; }
  .invoice-badge-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
  .invoice-badge-number { font-size: 24px; font-weight: 700; margin-top: 5px; }
  
  /* Bank details banner */
  .bank-banner { background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%); color: white; padding: 15px 20px; border-radius: 6px; font-size: 12px; margin-bottom: 20px; }
  .bank-banner-title { font-weight: 600; margin-bottom: 8px; }
  .bank-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 11px; }
  
  /* Bill To / Ship To */
  .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
  .address-box { padding: 15px; background: ${colors.background}; border-left: 4px solid ${colors.primary}; }
  .address-label { font-size: 11px; text-transform: uppercase; color: ${colors.secondary}; font-weight: 600; margin-bottom: 8px; }
  .address-content { font-size: 13px; line-height: 1.6; }
  
  /* Metadata */
  .metadata { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
  .metadata-item { padding: 12px; background: ${colors.background}; border-radius: 4px; }
  .metadata-label { font-size: 10px; text-transform: uppercase; color: ${colors.secondary}; font-weight: 600; }
  .metadata-value { font-size: 14px; font-weight: 500; margin-top: 4px; color: ${colors.text}; }
  
  /* Items Table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .items-table thead { background: ${colors.primary}; color: white; }
  .items-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .items-table td { padding: 12px; border-bottom: 1px solid ${colors.border}; font-size: 13px; }
  .items-table tbody tr:nth-child(even) { background: ${colors.background}; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  
  /* Totals */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
  .totals-box { width: 300px; }
  .total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid ${colors.border}; }
  .total-line.grand { font-size: 16px; font-weight: 700; border-top: 2px solid ${colors.primary}; border-bottom: 2px solid ${colors.primary}; padding: 12px 0; color: ${colors.primary}; }
  
  /* Footer */
  .footer { border-top: 1px solid ${colors.border}; padding-top: 20px; text-align: center; font-size: 11px; color: ${colors.secondary}; }
  .signature-block { margin-top: 30px; text-align: right; }
  .signature-line { border-top: 1px solid ${colors.text}; width: 200px; margin-left: auto; margin-top: 40px; padding-top: 5px; font-size: 12px; }
  
  @media print { body { background: white; } .container { box-shadow: none; } }
</style></head><body>
<div class="container">
  <div class="header">
    <div class="header-top">
      <div class="company-info">
        <div class="company-name">KukBook</div>
        <div class="company-tag">Accounting ERP</div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-badge-title">Invoice</div>
        <div class="invoice-badge-number">${invoice.invoiceId}</div>
      </div>
    </div>
  </div>
  
  ${invoice.bank_name ? `<div class="bank-banner">
    <div class="bank-banner-title">PAYMENT DETAILS</div>
    <div class="bank-details">
      <div><strong>Bank:</strong> ${invoice.bank_name}</div>
      <div><strong>Account:</strong> ${invoice.bank_account_number}</div>
      <div><strong>IFSC:</strong> ${invoice.bank_ifsc_code}</div>
      <div><strong>Holder:</strong> ${invoice.bank_account_holder}</div>
    </div>
  </div>` : ''}
  
  <div class="addresses">
    <div class="address-box">
      <div class="address-label">Bill To</div>
      <div class="address-content">
        <strong>${invoice.customerName}</strong><br>
        ${invoice.customerEmail || ''}<br>
        ${invoice.customerPhone || ''}
      </div>
    </div>
    <div class="address-box">
      <div class="address-label">Invoice Details</div>
      <div class="address-content">
        <strong>Date:</strong> ${invoice.date || '—'}<br>
        <strong>Due Date:</strong> ${invoice.dueDate || '—'}<br>
        ${invoice.poNumber ? `<strong>PO #:</strong> ${invoice.poNumber}<br>` : ''}
        ${invoice.ewayBillNumber ? `<strong>E-Way Bill:</strong> ${invoice.ewayBillNumber}` : ''}
      </div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        ${invoice.items?.[0]?.batchNumber ? '<th>Batch</th>' : ''}
        ${invoice.items?.[0]?.expiryDate ? '<th>Exp Date</th>' : ''}
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any) => `<tr>
        <td>${item.description || '—'}</td>
        ${item.batchNumber ? `<td>${item.batchNumber}</td>` : ''}
        ${item.expiryDate ? `<td>${item.expiryDate}</td>` : ''}
        <td class="text-right">${item.qty}</td>
        <td class="text-right">${fmt(Number(item.rate))}</td>
        <td class="text-right">${fmt(Number(item.qty) * Number(item.rate))}</td>
      </tr>`).join('') : `<tr><td colspan="6" class="text-center" style="color: #94a3b8;">No line items</td></tr>`}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-box">
      <div class="total-line">
        <span>Subtotal:</span>
        <span>${fmt(Number(invoice.subtotal || 0))}</span>
      </div>
      ${Number(invoice.cgst || 0) > 0 ? `<div class="total-line">
        <span>CGST:</span>
        <span>${fmt(Number(invoice.cgst))}</span>
      </div>` : ''}
      ${Number(invoice.sgst || 0) > 0 ? `<div class="total-line">
        <span>SGST:</span>
        <span>${fmt(Number(invoice.sgst))}</span>
      </div>` : ''}
      ${Number(invoice.igst || 0) > 0 ? `<div class="total-line">
        <span>IGST:</span>
        <span>${fmt(Number(invoice.igst))}</span>
      </div>` : ''}
      <div class="total-line grand">
        <span>TOTAL:</span>
        <span>${fmt(Number(invoice.total || 0))}</span>
      </div>
    </div>
  </div>
  
  <div class="signature-block">
    <div style="font-size: 12px; margin-bottom: 5px;">Authorized Signatory</div>
    <div class="signature-line"></div>
  </div>
  
  <div class="footer">
    <p>Generated by KukBook ERP — ${new Date().toLocaleDateString('en-IN')}</p>
    <p style="margin-top: 10px; font-size: 10px;">This is a computer-generated invoice and does not require a physical signature.</p>
  </div>
</div>
</body></html>`;
}

function layoutModern(invoice: any, items: any[], colors: InvoiceColors, fmt: (n: number) => string): string {
  return `<!DOCTYPE html>
<html><head><title>Invoice ${invoice.invoiceId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${colors.background}; color: ${colors.text}; }
  .container { max-width: 900px; margin: 40px auto; background: white; padding: 50px; }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; }
  .logo { font-size: 32px; font-weight: 700; color: ${colors.primary}; }
  .invoice-number { text-align: right; }
  .invoice-number-label { font-size: 12px; color: ${colors.secondary}; text-transform: uppercase; letter-spacing: 1px; }
  .invoice-number-value { font-size: 28px; font-weight: 700; color: ${colors.primary}; margin-top: 5px; }
  
  .content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .section-title { font-size: 11px; color: ${colors.secondary}; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-bottom: 12px; }
  .section-content { font-size: 13px; line-height: 1.8; }
  
  .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 40px; }
  .metadata-item { padding: 0; }
  .metadata-label { font-size: 10px; color: ${colors.secondary}; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
  .metadata-value { font-size: 14px; font-weight: 500; color: ${colors.text}; }
  
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  .items-table thead { border-top: 2px solid ${colors.primary}; border-bottom: 2px solid ${colors.primary}; }
  .items-table th { padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: ${colors.primary}; }
  .items-table td { padding: 14px 0; border-bottom: 1px solid ${colors.border}; font-size: 13px; }
  .text-right { text-align: right; }
  
  .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals-box { width: 280px; }
  .total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
  .total-line.grand { font-size: 16px; font-weight: 700; border-top: 2px solid ${colors.primary}; border-bottom: 2px solid ${colors.primary}; padding: 12px 0; color: ${colors.primary}; }
  
  .footer { border-top: 1px solid ${colors.border}; padding-top: 20px; text-align: center; font-size: 11px; color: ${colors.secondary}; }
  
  @media print { body { background: white; } .container { box-shadow: none; } }
</style></head><body>
<div class="container">
  <div class="header">
    <div class="logo">KukBook</div>
    <div class="invoice-number">
      <div class="invoice-number-label">Invoice #</div>
      <div class="invoice-number-value">${invoice.invoiceId}</div>
    </div>
  </div>
  
  <div class="content">
    <div>
      <div class="section-title">Bill To</div>
      <div class="section-content">
        <strong>${invoice.customerName}</strong><br>
        ${invoice.customerEmail || ''}<br>
        ${invoice.customerPhone || ''}
      </div>
    </div>
    <div>
      <div class="section-title">Invoice Details</div>
      <div class="section-content">
        <strong>Date:</strong> ${invoice.date || '—'}<br>
        <strong>Due Date:</strong> ${invoice.dueDate || '—'}<br>
        ${invoice.poNumber ? `<strong>PO #:</strong> ${invoice.poNumber}<br>` : ''}
      </div>
    </div>
  </div>
  
  <div class="metadata-grid">
    <div class="metadata-item">
      <div class="metadata-label">Subtotal</div>
      <div class="metadata-value">${fmt(Number(invoice.subtotal || 0))}</div>
    </div>
    <div class="metadata-item">
      <div class="metadata-label">Tax</div>
      <div class="metadata-value">${fmt(Number((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0)))}</div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any) => `<tr>
        <td>${item.description || '—'}</td>
        <td class="text-right">${item.qty}</td>
        <td class="text-right">${fmt(Number(item.rate))}</td>
        <td class="text-right">${fmt(Number(item.qty) * Number(item.rate))}</td>
      </tr>`).join('') : `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No line items</td></tr>`}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-box">
      <div class="total-line">
        <span>Subtotal</span>
        <span>${fmt(Number(invoice.subtotal || 0))}</span>
      </div>
      ${Number(invoice.cgst || 0) > 0 ? `<div class="total-line"><span>CGST</span><span>${fmt(Number(invoice.cgst))}</span></div>` : ''}
      ${Number(invoice.sgst || 0) > 0 ? `<div class="total-line"><span>SGST</span><span>${fmt(Number(invoice.sgst))}</span></div>` : ''}
      ${Number(invoice.igst || 0) > 0 ? `<div class="total-line"><span>IGST</span><span>${fmt(Number(invoice.igst))}</span></div>` : ''}
      <div class="total-line grand">
        <span>Total</span>
        <span>${fmt(Number(invoice.total || 0))}</span>
      </div>
    </div>
  </div>
  
  <div class="footer">
    Generated by KukBook ERP — ${new Date().toLocaleDateString('en-IN')}
  </div>
</div>
</body></html>`;
}

function layoutCorporate(invoice: any, items: any[], colors: InvoiceColors, fmt: (n: number) => string): string {
  return `<!DOCTYPE html>
<html><head><title>Invoice ${invoice.invoiceId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: ${colors.background}; color: ${colors.text}; }
  .container { max-width: 900px; margin: 40px auto; background: white; padding: 60px; border: 1px solid ${colors.border}; }
  
  .header-bar { background: ${colors.primary}; color: white; padding: 20px; margin: -60px -60px 40px; display: flex; justify-content: space-between; align-items: center; }
  .company-name { font-size: 28px; font-weight: 700; letter-spacing: 2px; }
  .invoice-title { font-size: 18px; font-weight: 600; }
  
  .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .detail-section { }
  .detail-label { font-size: 10px; color: ${colors.secondary}; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
  .detail-content { font-size: 13px; line-height: 1.8; }
  
  .dates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; padding: 20px; background: ${colors.background}; border: 1px solid ${colors.border}; }
  .date-item { }
  .date-label { font-size: 9px; color: ${colors.secondary}; text-transform: uppercase; font-weight: 700; }
  .date-value { font-size: 14px; font-weight: 600; margin-top: 4px; }
  
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  .items-table thead { background: ${colors.primary}; color: white; }
  .items-table th { padding: 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .items-table td { padding: 12px; border-bottom: 1px solid ${colors.border}; font-size: 13px; }
  .items-table tbody tr:nth-child(even) { background: ${colors.background}; }
  .text-right { text-align: right; }
  
  .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals-box { width: 320px; }
  .total-line { display: flex; justify-content: space-between; padding: 10px 0; font-size: 13px; border-bottom: 1px solid ${colors.border}; }
  .total-line.grand { font-size: 16px; font-weight: 700; border-top: 2px solid ${colors.primary}; border-bottom: 2px solid ${colors.primary}; padding: 12px 0; color: ${colors.primary}; }
  
  .footer { text-align: center; font-size: 11px; color: ${colors.secondary}; border-top: 1px solid ${colors.border}; padding-top: 20px; }
  
  @media print { body { background: white; } .container { border: none; } }
</style></head><body>
<div class="container">
  <div class="header-bar">
    <div class="company-name">KUKBOOK</div>
    <div class="invoice-title">INVOICE</div>
  </div>
  
  <div class="invoice-details">
    <div class="detail-section">
      <div class="detail-label">Bill To</div>
      <div class="detail-content">
        <strong>${invoice.customerName}</strong><br>
        ${invoice.customerEmail || ''}<br>
        ${invoice.customerPhone || ''}
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Invoice Number</div>
      <div class="detail-content" style="font-size: 24px; font-weight: 700; color: ${colors.primary};">
        ${invoice.invoiceId}
      </div>
    </div>
  </div>
  
  <div class="dates-grid">
    <div class="date-item">
      <div class="date-label">Invoice Date</div>
      <div class="date-value">${invoice.date || '—'}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Due Date</div>
      <div class="date-value">${invoice.dueDate || '—'}</div>
    </div>
    <div class="date-item">
      <div class="date-label">PO Number</div>
      <div class="date-value">${invoice.poNumber || '—'}</div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any) => `<tr>
        <td>${item.description || '—'}</td>
        <td class="text-right">${item.qty}</td>
        <td class="text-right">${fmt(Number(item.rate))}</td>
        <td class="text-right">${fmt(Number(item.qty) * Number(item.rate))}</td>
      </tr>`).join('') : `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No line items</td></tr>`}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-box">
      <div class="total-line">
        <span>Subtotal</span>
        <span>${fmt(Number(invoice.subtotal || 0))}</span>
      </div>
      ${Number(invoice.cgst || 0) > 0 ? `<div class="total-line"><span>CGST (${(Number(invoice.cgst) / Number(invoice.subtotal) * 100).toFixed(0)}%)</span><span>${fmt(Number(invoice.cgst))}</span></div>` : ''}
      ${Number(invoice.sgst || 0) > 0 ? `<div class="total-line"><span>SGST (${(Number(invoice.sgst) / Number(invoice.subtotal) * 100).toFixed(0)}%)</span><span>${fmt(Number(invoice.sgst))}</span></div>` : ''}
      ${Number(invoice.igst || 0) > 0 ? `<div class="total-line"><span>IGST (${(Number(invoice.igst) / Number(invoice.subtotal) * 100).toFixed(0)}%)</span><span>${fmt(Number(invoice.igst))}</span></div>` : ''}
      <div class="total-line grand">
        <span>TOTAL DUE</span>
        <span>${fmt(Number(invoice.total || 0))}</span>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>Thank you for your business.</p>
    <p style="margin-top: 10px;">Generated by KukBook ERP — ${new Date().toLocaleDateString('en-IN')}</p>
  </div>
</div>
</body></html>`;
}

function layoutMinimal(invoice: any, items: any[], colors: InvoiceColors, fmt: (n: number) => string): string {
  return `<!DOCTYPE html>
<html><head><title>Invoice ${invoice.invoiceId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #000; }
  .container { max-width: 900px; margin: 40px auto; padding: 40px; }
  
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .company { font-size: 24px; font-weight: 700; }
  .invoice-id { text-align: right; }
  .invoice-id-label { font-size: 11px; color: #666; }
  .invoice-id-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .info-section { }
  .info-label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
  .info-content { font-size: 13px; line-height: 1.8; }
  
  .dates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
  .date-item { }
  .date-label { font-size: 9px; color: #999; text-transform: uppercase; }
  .date-value { font-size: 13px; font-weight: 600; margin-top: 4px; }
  
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  .items-table thead { border-top: 1px solid #000; border-bottom: 1px solid #000; }
  .items-table th { padding: 10px 0; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .items-table td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }
  .text-right { text-align: right; }
  
  .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals-box { width: 250px; }
  .total-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .total-line.grand { font-size: 15px; font-weight: 700; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; }
  
  .footer { text-align: center; font-size: 10px; color: #999; }
  
  @media print { body { background: white; } }
</style></head><body>
<div class="container">
  <div class="header">
    <div class="company">KukBook</div>
    <div class="invoice-id">
      <div class="invoice-id-label">Invoice</div>
      <div class="invoice-id-value">${invoice.invoiceId}</div>
    </div>
  </div>
  
  <div class="info-grid">
    <div class="info-section">
      <div class="info-label">Bill To</div>
      <div class="info-content">
        <strong>${invoice.customerName}</strong><br>
        ${invoice.customerEmail || ''}<br>
        ${invoice.customerPhone || ''}
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Details</div>
      <div class="info-content">
        <strong>Date:</strong> ${invoice.date || '—'}<br>
        <strong>Due:</strong> ${invoice.dueDate || '—'}<br>
        ${invoice.poNumber ? `<strong>PO:</strong> ${invoice.poNumber}` : ''}
      </div>
    </div>
  </div>
  
  <div class="dates">
    <div class="date-item">
      <div class="date-label">Date</div>
      <div class="date-value">${invoice.date || '—'}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Due Date</div>
      <div class="date-value">${invoice.dueDate || '—'}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Amount Due</div>
      <div class="date-value">${fmt(Number(invoice.total || 0))}</div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any) => `<tr>
        <td>${item.description || '—'}</td>
        <td class="text-right">${item.qty}</td>
        <td class="text-right">${fmt(Number(item.rate))}</td>
        <td class="text-right">${fmt(Number(item.qty) * Number(item.rate))}</td>
      </tr>`).join('') : `<tr><td colspan="4" style="text-align: center; color: #ccc;">No line items</td></tr>`}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-box">
      <div class="total-line">
        <span>Subtotal</span>
        <span>${fmt(Number(invoice.subtotal || 0))}</span>
      </div>
      ${Number(invoice.cgst || 0) > 0 ? `<div class="total-line"><span>CGST</span><span>${fmt(Number(invoice.cgst))}</span></div>` : ''}
      ${Number(invoice.sgst || 0) > 0 ? `<div class="total-line"><span>SGST</span><span>${fmt(Number(invoice.sgst))}</span></div>` : ''}
      ${Number(invoice.igst || 0) > 0 ? `<div class="total-line"><span>IGST</span><span>${fmt(Number(invoice.igst))}</span></div>` : ''}
      <div class="total-line grand">
        <span>Total</span>
        <span>${fmt(Number(invoice.total || 0))}</span>
      </div>
    </div>
  </div>
  
  <div class="footer">
    Generated by KukBook ERP — ${new Date().toLocaleDateString('en-IN')}
  </div>
</div>
</body></html>`;
}

function layoutCreative(invoice: any, items: any[], colors: InvoiceColors, fmt: (n: number) => string): string {
  return `<!DOCTYPE html>
<html><head><title>Invoice ${invoice.invoiceId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: ${colors.background}; color: ${colors.text}; }
  .container { max-width: 900px; margin: 40px auto; background: white; padding: 0; overflow: hidden; }
  
  .header { background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: center; }
  .company-info { }
  .company-name { font-size: 32px; font-weight: 700; margin-bottom: 5px; }
  .company-tag { font-size: 13px; opacity: 0.9; }
  .invoice-badge { background: rgba(255,255,255,0.2); padding: 15px 25px; border-radius: 8px; text-align: center; backdrop-filter: blur(10px); }
  .invoice-badge-label { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
  .invoice-badge-value { font-size: 24px; font-weight: 700; margin-top: 5px; }
  
  .content { padding: 40px; }
  .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .section { }
  .section-title { font-size: 11px; color: ${colors.secondary}; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
  .section-content { font-size: 13px; line-height: 1.8; }
  
  .highlights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
  .highlight { padding: 15px; background: ${colors.background}; border-left: 4px solid ${colors.primary}; border-radius: 4px; }
  .highlight-label { font-size: 10px; color: ${colors.secondary}; text-transform: uppercase; font-weight: 600; }
  .highlight-value { font-size: 16px; font-weight: 700; margin-top: 6px; color: ${colors.primary}; }
  
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  .items-table thead { background: ${colors.primary}; color: white; }
  .items-table th { padding: 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .items-table td { padding: 12px; border-bottom: 1px solid ${colors.border}; font-size: 13px; }
  .items-table tbody tr:hover { background: ${colors.background}; }
  .text-right { text-align: right; }
  
  .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
  .totals-box { width: 300px; }
  .total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid ${colors.border}; }
  .total-line.grand { font-size: 16px; font-weight: 700; border-top: 2px solid ${colors.primary}; border-bottom: 2px solid ${colors.primary}; padding: 12px 0; color: ${colors.primary}; }
  
  .footer { background: ${colors.background}; padding: 20px 40px; text-align: center; font-size: 11px; color: ${colors.secondary}; }
  
  @media print { body { background: white; } .container { box-shadow: none; } }
</style></head><body>
<div class="container">
  <div class="header">
    <div class="company-info">
      <div class="company-name">KukBook</div>
      <div class="company-tag">Accounting ERP</div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-badge-label">Invoice #</div>
      <div class="invoice-badge-value">${invoice.invoiceId}</div>
    </div>
  </div>
  
  <div class="content">
    <div class="section-grid">
      <div class="section">
        <div class="section-title">Bill To</div>
        <div class="section-content">
          <strong>${invoice.customerName}</strong><br>
          ${invoice.customerEmail || ''}<br>
          ${invoice.customerPhone || ''}
        </div>
      </div>
      <div class="section">
        <div class="section-title">Invoice Details</div>
        <div class="section-content">
          <strong>Date:</strong> ${invoice.date || '—'}<br>
          <strong>Due Date:</strong> ${invoice.dueDate || '—'}<br>
          ${invoice.poNumber ? `<strong>PO #:</strong> ${invoice.poNumber}` : ''}
        </div>
      </div>
    </div>
    
    <div class="highlights">
      <div class="highlight">
        <div class="highlight-label">Subtotal</div>
        <div class="highlight-value">${fmt(Number(invoice.subtotal || 0))}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">Tax</div>
        <div class="highlight-value">${fmt(Number((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0)))}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">Total Due</div>
        <div class="highlight-value">${fmt(Number(invoice.total || 0))}</div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.length > 0 ? items.map((item: any) => `<tr>
          <td>${item.description || '—'}</td>
          <td class="text-right">${item.qty}</td>
          <td class="text-right">${fmt(Number(item.rate))}</td>
          <td class="text-right">${fmt(Number(item.qty) * Number(item.rate))}</td>
        </tr>`).join('') : `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No line items</td></tr>`}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-box">
        <div class="total-line">
          <span>Subtotal</span>
          <span>${fmt(Number(invoice.subtotal || 0))}</span>
        </div>
        ${Number(invoice.cgst || 0) > 0 ? `<div class="total-line"><span>CGST</span><span>${fmt(Number(invoice.cgst))}</span></div>` : ''}
        ${Number(invoice.sgst || 0) > 0 ? `<div class="total-line"><span>SGST</span><span>${fmt(Number(invoice.sgst))}</span></div>` : ''}
        ${Number(invoice.igst || 0) > 0 ? `<div class="total-line"><span>IGST</span><span>${fmt(Number(invoice.igst))}</span></div>` : ''}
        <div class="total-line grand">
          <span>Total</span>
          <span>${fmt(Number(invoice.total || 0))}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    Generated by KukBook ERP — ${new Date().toLocaleDateString('en-IN')} | Thank you for your business!
  </div>
</div>
</body></html>`;
}
