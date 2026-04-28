# KukBook ERP — Baaki Kaam Ki List

> Ye list un sabhi features aur improvements ki hai jo abhi tak puri tarah implement nahi hui hain ya sirf frontend UI hai (backend/database mein data save nahi hota).

---

## 1. Frontend-Only Pages (Sirf UI Hai, Database Mein Save Nahi Hota)

Ye pages dikhte toh hain lekin inme data sirf browser memory mein rehta hai — refresh karne pe sab gayab ho jaata hai.

| # | Page | Kya Baaki Hai |
|---|------|--------------|
| 1 | **E-Way Bill** | E-Way bill ka data database mein save nahi hota. Sirf frontend form hai. Backend API aur DB table banana padega. |
| 2 | **Invoice Themes** | Theme selection sirf local state mein hai. DB mein save nahi hota. Invoice PDF mein selected theme apply nahi hota. |
| 3 | **Barcode** | Barcode generate hota hai SVG mein lekin save/print history DB mein nahi jaati. |
| 4 | **Messaging (WhatsApp/SMS/Email)** | Sirf UI hai — koi actual WhatsApp, SMS ya Email API connected nahi hai. Sent messages DB mein save nahi hote. Real integration ke liye Twilio/WhatsApp Business API lagega. |
| 5 | **Payment Reminders** | Overdue invoices dikhata hai lekin reminder bhejne ka koi real mechanism nahi hai. Sirf UI button hai, actual email/SMS nahi jaata. |

---

## 2. Backend Features Jo Missing Hain

| # | Feature | Detail |
|---|---------|--------|
| 1 | **E-Way Bill DB Table + API** | `eway_bills` table banana padega schema mein. CRUD procedures likhne padenge. |
| 2 | **Messaging History DB Table** | `messages` table banana padega taaki sent messages ka record rahe. |
| 3 | **Payment Reminders DB Table** | `payment_reminders` table banana padega taaki reminder history track ho sake. |
| 4 | **Invoice Theme Selection Persistence** | Company settings mein selected theme ID save karna padega. |
| 5 | **Barcode Print/Download History** | Optional — agar history chahiye toh DB table banana padega. |

---

## 3. Real Integrations Jo Lagani Hain

| # | Integration | Detail |
|---|------------|--------|
| 1 | **WhatsApp Business API** | Messaging page ke liye real WhatsApp API connect karna padega (Meta Business / Twilio). |
| 2 | **SMS Gateway** | SMS bhejne ke liye Twilio, MSG91, ya koi Indian SMS provider lagana padega. |
| 3 | **Email Service (Transactional)** | Abhi sirf `notifyOwner` se owner ko notification jaata hai. Customer ko direct invoice email bhejne ke liye SMTP/SendGrid/Resend lagana padega. |
| 4 | **GST Portal API** | GSTR-1/3B reports generate hote hain lekin GST portal pe direct file karne ka integration nahi hai. |
| 5 | **E-Way Bill Portal API** | E-Way Bill generate karne ke liye NIC portal ka API connect karna padega. |
| 6 | **Stripe Live Mode** | Abhi test sandbox hai. Live payments ke liye Stripe KYC complete karke live keys lagani padengi (Settings > Payment se). |

---

## 4. Business Logic Improvements

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Auto Invoice Numbering per Company** | Abhi global counter hai, company-wise prefix aur sequence banana padega. |
| 2 | **Recurring Invoices** | Monthly/weekly auto-generate hone wale invoices ka system nahi hai. |
| 3 | **Multi-Currency Support** | Abhi sirf INR (₹) hai. USD, AED, etc. support add karna padega. |
| 4 | **TDS/TCS Calculation** | Tax Deducted/Collected at Source ka calculation nahi hai. |
| 5 | **Bank Reconciliation** | Bank statement import karke transactions match karne ka feature nahi hai. |
| 6 | **Audit Trail / Activity Log** | Kaun ne kya change kiya — ye track nahi hota abhi. |
| 7 | **Credit Limit per Customer** | Customer ke liye credit limit set karne ka option nahi hai. |
| 8 | **Inventory Batch/Serial Tracking** | Batch number ya serial number se inventory track nahi hoti. |
| 9 | **Purchase Order to Bill Conversion** | PO ko directly bill mein convert karne ka shortcut nahi hai. |
| 10 | **Estimate to Invoice Conversion** | Estimate accept hone pe auto invoice banana ka feature nahi hai. |
| 11 | **Payroll — Indian Tax Rules** | Abhi US tax rates hain (Federal 22%, State 5%). Indian PF, ESI, TDS rules lagane padenge. |
| 12 | **Late Payment Interest Calculation** | Overdue invoices pe automatic interest calculate nahi hota. |

---

## 5. UI/UX Improvements

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Mobile Responsive Testing** | Sabhi pages ka mobile view test aur fix karna padega. |
| 2 | **Dark Mode** | Theme toggle hai lekin dark mode properly test nahi hua. |
| 3 | **Dashboard Date Range Filter** | Dashboard pe date range select karke data filter karne ka option nahi hai. |
| 4 | **Search Across All Modules** | Global search bar jo sabhi modules mein search kare. |
| 5 | **Keyboard Shortcuts** | Fast data entry ke liye keyboard shortcuts (Ctrl+N for new, etc.). |
| 6 | **Print-Friendly Views** | Invoices, bills, reports ka print layout optimize karna padega. |
| 7 | **Bulk Actions** | Multiple invoices/bills select karke ek saath delete/status change. |
| 8 | **Data Validation** | GSTIN format validation, email validation, phone number validation improve karna padega. |

---

## 6. Security & Performance

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Rate Limiting** | API pe rate limiting nahi hai — abuse se bachne ke liye lagana padega. |
| 2 | **Input Sanitization** | XSS protection ke liye sabhi user inputs sanitize karne padenge. |
| 3 | **Pagination** | Bade data sets ke liye server-side pagination implement karna padega (abhi sab ek saath load hota hai). |
| 4 | **Data Backup System** | Automatic database backup ka mechanism nahi hai. |
| 5 | **Two-Factor Authentication** | Extra security ke liye 2FA option nahi hai. |

---

## 7. Deployment & Operations

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Stripe Sandbox Claim** | Stripe test sandbox claim karna padega: [Claim Link](https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVFBoRUxTeFdrNHhGQzBaLDE3Nzc5ODEyMzIv1000qyQA00z) |
| 2 | **Custom Domain Setup** | `kukbook.manus.space` pe deploy hai, custom domain (jaise kukbook.in) lagana ho toh Settings > Domains se. |
| 3 | **Logo & Favicon** | Custom logo aur favicon set karna padega Settings se. |
| 4 | **SEO Optimization** | Landing page ke meta tags, Open Graph tags, sitemap.xml banana padega. |

---

## Summary — Priority Wise

**High Priority (Pehle Karo):**
1. E-Way Bill backend + DB persistence
2. Messaging real integration (WhatsApp/SMS/Email)
3. Payment Reminders backend persistence
4. Indian payroll tax rules (PF, ESI, TDS)
5. Stripe sandbox claim karo

**Medium Priority:**
6. Invoice theme persistence + PDF mein apply
7. Recurring invoices
8. Estimate → Invoice conversion
9. PO → Bill conversion
10. Pagination for large data

**Low Priority (Baad Mein):**
11. Multi-currency support
12. Bank reconciliation
13. Audit trail
14. Batch/Serial inventory tracking
15. Global search
