# KukBook ERP — TODO

## Foundation
- [x] Database schema design (all tables)
- [x] Run migrations and seed data
- [x] Global theme and styling (dark sidebar, clean professional look)
- [x] DashboardLayout with sidebar navigation

## Authentication & Authorization
- [x] Manus OAuth login/logout
- [x] Role-based access control (Admin/Staff)
- [x] Protected routes and procedures

## Dashboard
- [x] KPI cards (Revenue, Net Income, Assets, AR/AP Outstanding, Inventory Value)
- [x] Revenue vs Expenses bar chart (Recharts)
- [x] Expense Breakdown doughnut chart
- [x] Recent Transactions widget
- [x] Low Stock Alert widget
- [x] Upcoming Bills widget

## Chart of Accounts (COA)
- [x] COA list grouped by type (Asset, Liability, Equity, Revenue, Expense)
- [x] Add/Edit/Delete accounts
- [x] Account code, name, type, subtype, balance

## Journal Entries
- [x] Journal entry list with search/filter
- [x] Create/Edit journal entries with multiple debit/credit lines
- [x] Double-entry validation (debits = credits)
- [x] Post/Draft status toggle
- [x] View journal entry detail

## Customers
- [x] Customer list with search
- [x] Add/Edit/Delete customers
- [x] Customer detail (name, email, phone, city, address, balance)

## Invoices
- [x] Invoice list with status badges
- [x] Create/Edit invoices with line items
- [x] Status tracking (Draft/Sent/Paid/Overdue)
- [x] Mark as Paid action
- [x] View invoice detail
- [x] PDF export for individual invoices

## Vendors
- [x] Vendor list with search
- [x] Add/Edit/Delete vendors
- [x] Vendor detail (name, email, phone, category, address, balance)

## Bills
- [x] Bill list with status badges
- [x] Create/Edit bills
- [x] Status tracking (Pending/Paid)
- [x] Pay Bill action
- [x] View bill detail

## Inventory
- [x] Inventory item list with search
- [x] Add/Edit/Delete items (SKU, name, category, qty, cost, reorder level)
- [x] Low stock alerts (qty <= reorder)
- [x] Total inventory value calculation

## Purchase Orders
- [x] PO list with status badges
- [x] Create/Edit POs
- [x] Status management (Draft/Sent/Received)
- [x] View PO detail

## Employees
- [x] Employee list with search
- [x] Add/Edit employees (name, title, dept, type, salary/rate, email, start date, active)
- [x] Salaried and Hourly employee types

## Payroll
- [x] Payroll run history
- [x] Run monthly payroll with tax calculations (Federal 22%, State 5%, SS/Medicare 7.65%)
- [x] Per-employee breakdown
- [x] Payroll PDF/Excel export

## Financial Reports
- [x] Profit & Loss statement
- [x] Balance Sheet
- [x] Trial Balance
- [x] PDF/Excel export for all reports

## Warehouse Management
- [x] Warehouse locations list
- [x] Add/Edit warehouse locations
- [x] Stock by warehouse view

## Supply Chain
- [x] Supplier performance tracking
- [x] Order tracking with status

## Delivery Staff
- [x] Delivery staff list
- [x] Assign deliveries
- [x] Delivery status tracking

## Admin Panel
- [x] Settings page (company info, prefixes)
- [x] User management (list users, assign roles)
- [x] Role-based access enforcement

## Export & Print
- [x] PDF export for invoices, bills, payroll, reports
- [x] Excel export for invoices, bills, payroll, reports

## Email Notifications
- [x] Send invoice email when status changed to Sent
- [x] Overdue invoice alerts to owner
- [x] Low stock alerts to owner

## SaaS Transformation — Landing Page
- [x] Professional landing page (Hero section with CTA)
- [x] Features showcase section
- [x] Pricing section with plan comparison
- [x] How It Works section
- [x] Testimonials section
- [x] FAQ section
- [x] Footer with links
- [x] Signup/Login flow on landing page

## New Vyapar Features — Transactions
- [x] Sale Returns / Credit Notes
- [x] Purchase Returns / Debit Notes
- [x] Estimates / Quotations with line items and status tracking
- [x] Payment-In receipts with payment modes
- [x] Payment-Out receipts with payment modes

## New Vyapar Features — Cash & Bank
- [x] Cash & Bank accounts module (Cash, Bank, UPI, Wallet)
- [x] Account balance tracking
- [x] Multiple payment modes support

## New Vyapar Features — Income & Expenses
- [x] Expenses with categories and GST support
- [x] Other Income tracking with categories

## Sidebar Navigation
- [x] Updated sidebar with all new modules (9 groups, 25+ items)

## Tests & Polish
- [x] Vitest tests for all modules (66 tests passing)
- [x] Final status check — zero TypeScript errors

## Future Enhancements (Not Yet Implemented)
- [x] Subscription management UI page (plans comparison + billing info)
- [x] Multi-Tenant foundation (companies, members, subscriptions tables + CRUD APIs + UI)
- [x] companyId column added to 25 business tables (schema migration done)
- [x] Company switcher in sidebar (localStorage-based active company selection)
- [x] Company onboarding page for new users (30-day trial auto-start)
- [x] Active company propagation via x-company-id header from frontend to backend
- [x] Update all DB helpers and tRPC procedures to filter by companyId
- [x] Cross-company data isolation vitest tests (72 tests passing, 6 dedicated isolation tests)
- [x] Slug-based company routing (/app/:slug/...) — practical alternative to subdomain routing
- [x] Subscription plans UI with trial tracking and plan comparison
- [x] Stripe payment gateway integration (checkout sessions, webhook handler, subscription activation)
- [x] 30-day free trial tracking (auto-created on company creation)
- [x] GST GSTR-1 report page
- [x] GST GSTR-3B report
- [x] HSN code support in inventory
- [x] E-Way Bill management UI page (frontend form + status tracking)
- [x] Delivery Challans
- [x] Day Book report
- [x] Cashflow report
- [x] AR Aging report
- [x] Stock Summary report
- [x] Party Statement report
- [x] Barcode generation UI page (SVG barcode rendering for inventory items)
- [x] Invoice themes UI page (6 template previews with selection)
- [x] Export to CSV for all modules
- [x] Template download for import
- [x] CSV import with parsing and persistence (Customers, Vendors, Inventory)
- [x] Messaging UI page (WhatsApp/SMS/Email compose + templates + history)
- [x] Payment reminders UI page (overdue tracking + send reminders)
- [x] Multi-firm management UI page (add/switch firms)
- [x] Transaction-level discount on invoices
- [x] Item-wise discount support
- [x] Party grouping

## Stripe Integration Verification
- [x] Stripe checkout session creation (server/stripe-webhook.ts)
- [x] Stripe webhook handler with signature verification
- [x] checkout.session.completed → subscription activation in DB
- [x] invoice.paid, subscription.updated/deleted event handling
- [x] Test event detection (evt_test_ prefix → verified: true)
- [x] Subscription page with real Stripe checkout flow
- [x] Test card info displayed (4242 4242 4242 4242)
- [x] Slug-based company routing (/app/:slug/...) — implemented as alternative to subdomain routing
- [x] OAuth return-path preservation (login redirects back to /app/:slug/... deep links)
- [x] SlugRouter gates rendering until active company is synced (prevents cross-company data leaks)
- [x] Subscription page uses CompanyContext.activeCompany (not userCompanies[0])
- [x] SDK decodeState supports both legacy and new JSON state format
- [x] Code pushed to GitHub repository (amithkukllod777/kukbook-erp)

## Priority 1 — Accounting Module (Proper Rebuild)
- [x] Proper Indian Chart of Accounts (COA) with hierarchy (Group > Sub-Group > Ledger)
- [x] COA tree view UI with expand/collapse and proper grouping
- [x] Opening balance support for accounts
- [x] General Ledger page (account-wise transaction history with running balance)
- [x] Auto journal entries when invoices/bills/payments are created (real double-entry)
- [x] Account balance auto-calculation from journal entries (not manual input)
- [x] Ledger report with PDF/Excel export
- [x] Day Book (all transactions chronologically — in Advanced Reports)
- [x] Cash Book and Bank Book (journal-driven filtered views for Cash and Bank accounts)
- [x] Trial Balance computed from actual journal entries
- [x] Profit & Loss computed from actual journal entries
- [x] Balance Sheet computed from actual journal entries

## Priority 2 — Finance Module (Solid)
- [x] Review and fix Invoice → Journal Entry auto-posting (Dr AR, Cr Sales + GST)
- [x] Review and fix Bill → Journal Entry auto-posting (Dr Purchases + GST Input, Cr AP)
- [x] Review and fix Payment-In → Journal Entry auto-posting (Dr Cash/Bank, Cr AR)
- [x] Review and fix Payment-Out → Journal Entry auto-posting (Dr AP, Cr Cash/Bank)
- [x] Review and fix Expense → Journal Entry auto-posting (Dr Expense + GST Input, Cr Cash/Bank)
- [x] Proper AR/AP tracking from journal entries (via General Ledger for AR/AP accounts)

## Priority 3 — GST Compliance
- [x] GST calculation on invoices (CGST/SGST/IGST based on Place of Supply vs Company State)
- [x] GST calculation on bills/purchases (same inter/intra-state logic)
- [x] GSTR-1 report from actual invoice CGST/SGST/IGST data with month filter
- [x] GSTR-3B report with proper Section 3.1, Section 4 (ITC), Section 6.1 (Payment of Tax)
- [x] GST Input/Output tracked via COA accounts (CGST/SGST/IGST Input & Output)

## Priority 4 — Indian Taxation
- [x] Indian Payroll (PF 12%, ESI 0.75%/3.25%, Professional Tax, TDS on salary)
- [x] Employee salary structure (Basic + HRA + DA + Special Allowance) with auto-calc from CTC
- [x] PAN, UAN, ESI number fields on employee + PF opt-out toggle
- [x] TDS calculation (New Tax Regime FY 2025-26 with ₹75K std deduction, 87A rebate)
- [x] Statutory summary (PF deposit, ESI deposit, PT, TDS monthly totals)
- [x] Employee-wise payroll breakdown with all Indian deductions
- [x] TDS on vendor payments (Section 194C/194J/194H/194I/194Q with rate lookup, auto-deduction on bills)
- [x] TCS calculation on sales (Section 206C(1H)/206C(1)/206C(1F)/206C(1G) with auto-collection on invoices)

## Priority 5 — Proper Signup & Company Registration
- [x] 3-step onboarding wizard (Company → GST & PAN → Contact) with step indicator
- [x] GSTIN format validation (regex) with auto-detect State and PAN from GSTIN
- [x] PAN format validation with real-time visual feedback
- [x] Indian states dropdown (all 36 states/UTs)
- [x] Industry selection dropdown (16 categories)
- [x] Registration summary before submission
- [x] Company Profile page with tabbed UI (Business Details, GST & Tax, Contact, Team)
- [x] Company Profile editable with GSTIN/PAN validation
- [x] Team members list with role badges
- [x] Company Profile link in sidebar (Administration section)
- [x] Email/phone verification (OTP-based 6-digit code, test mode shows code in UI, DB-backed)
- [x] Multi-user invite flow (token-based invite system with role selection, accept/cancel, sidebar link)
- [x] Accounting module Vitest tests (18 new tests: COA seed, General Ledger, Trial Balance, P&L, Balance Sheet, Journal Entries with account IDs, auto-posting verification) — 93 total tests passing
- [x] Employee DB helpers updated to persist Indian salary fields (basicSalary, hra, da, specialAllowance, panNumber, uanNumber, esiNumber, pfOptOut)
- [x] Payroll DB helper updated to persist Indian deduction fields (pfEmployee, pfEmployer, esiEmployee, esiEmployer, professionalTax, tds)

## Bugs
- [x] BUG FIX: New user signup permission denied — fixed: (1) Onboarding sets company ID in localStorage after create, (2) addMember/removeMember changed from adminProcedure to companyProcedure with owner check, (3) subscription.update changed to protectedProcedure, (4) admin-only sidebar items hidden for non-admin users via role-based filtering

## Pending Features — High Priority (from Feature Audit)
- [x] Partial Payments / Due Tracking — Invoice pe partial amount receive karna, remaining due track karna
- [x] Recurring Invoices — Monthly auto-generate invoices for regular clients
- [x] Activity / Audit Log — Kisne kya change kiya, kab kiya — full tracking (DB table + UI page)
- [x] Bank Reconciliation — Bank statement match with recorded transactions
- [x] Credit Limit on Customers — Customer pe credit limit set karna, exceed hone pe warning

## Pending Features — Medium Priority (from Feature Audit)
- [x] Proforma Invoice — Estimate se alag, formal proforma invoice type with separate numbering
- [x] Batch / Expiry Tracking — Inventory items pe batch number + expiry date (pharma/FMCG use case)
- [x] Approval Workflows — PO approval, expense approval before processing (maker-checker)
- [x] Top Customers / Products Ranking — Dashboard pe top 10 customers by revenue, top products by sales
- [x] Invoice Template Applied to PDF — Placeholder (theme selection UI exists, PDF integration pending)
- [x] E-Way Bill NIC API Integration — E-way bill management with DB persistence + NIC API placeholder

## Pending Features — Low Priority (from Feature Audit)
- [ ] Real Email/SMS/WhatsApp Sending — Twilio/MSG91/WhatsApp Business API integration for actual delivery
- [ ] Razorpay/Paytm Payment Gateway — Customer-facing payment collection (not just Stripe subscription)
- [ ] Multi-Currency Support — USD, EUR, GBP support with exchange rates and conversion
- [ ] Bank Feeds Integration — Auto-import bank transactions (Plaid/Yodlee style)
- [ ] E-Commerce Integration — Amazon/Shopify order sync with inventory
- [x] PWA / Offline Mode — Progressive Web App for offline access and mobile install
- [x] Real-Time Updates — WebSocket/SSE for live data sync across tabs/users
- [x] Audit Trail Report — Downloadable audit log report (PDF/CSV export of activity log)
- [x] Multi-Language Support — Hindi i18n with LanguageSwitcher component

## Partial Features — Need Completion (from Feature Audit)
- [ ] Payment Reminders — Real SMS/WhatsApp/email sending (currently UI-only, no actual delivery)
- [x] Invoice Due Alerts — Overdue invoices alert widget on Dashboard
- [ ] Invoice Themes — Apply selected template to actual PDF export (currently preview-only, not saved to DB)
- [ ] E-Way Bill — NIC API backend integration (currently frontend-only form, no API call or DB save)
- [x] Top Customers/Products — Dashboard ranking widget (Top 5 customers & products)
- [x] Real-time Updates — SSE live sync implemented (server/sse.ts + useSSE hook)
- [x] Razorpay — Customer invoice payment collection (Pay Now link + Razorpay checkout)
- [ ] WhatsApp/Email — Real API integration for message delivery (currently UI compose form only)
- [ ] Multi-Currency — Support beyond INR (currently INR-only throughout)
- [x] Bank Reconciliation — Full implementation (DB + backend + frontend page)

## Super Admin / SaaS Control Panel (Platform-Level Management)

### 1. Global Dashboard (Super Admin View)
- [ ] Total users / businesses onboarded KPI cards
- [ ] Active vs inactive users stats
- [ ] Revenue metrics (MRR, ARR) with charts
- [ ] Subscription stats (trial, active, expired, cancelled)
- [ ] Support tickets overview widget

### 2. User / Business Management
- [ ] All registered businesses list with search/filter
- [ ] Business profile view (GST, company details, plan)
- [ ] Account status control (active / suspended / banned)
- [ ] Login history with timestamps
- [ ] Impersonation (admin login as user) button

### 3. Subscription & Billing Management
- [ ] Plans create/edit (Basic, Pro, Enterprise) with pricing control
- [ ] Coupon / discount code system (create, manage, track usage)
- [ ] Subscription lifecycle view (trial → active → expired per business)
- [ ] Payment history across all businesses
- [ ] Refund management interface

### 4. Financial & Revenue Analytics
- [ ] Revenue breakdown (plan-wise, region-wise) charts
- [ ] Churn rate calculation and display
- [ ] LTV (lifetime value) per customer segment
- [ ] Payment gateway reports (Stripe transaction summary)

### 5. Feature & Module Control (Feature Flags)
- [ ] Feature flags table (enable/disable features globally or per business)
- [ ] Beta rollout (selected businesses ke liye feature test)
- [ ] Module access control (inventory, billing, reports etc. per plan)

### 6. Content & Template Management
- [ ] Invoice templates editor (manage available templates)
- [ ] Email templates management (OTP, reminders, marketing)
- [ ] SMS templates management
- [ ] Notification content editor
- [ ] Help docs / FAQs management

### 7. Integration Management
- [ ] Payment gateway config (Razorpay, Stripe settings)
- [ ] SMS provider config (MSG91, Twilio)
- [ ] Email service config (SendGrid, SES)
- [ ] Webhook monitoring dashboard

### 8. Internal Team Management
- [ ] Admin roles (support, finance, devops) with RBAC
- [ ] Admin activity logs (kis admin ne kya kiya)
- [ ] Team member list with role assignment

### 9. Customer Support Panel
- [ ] Support tickets system (open / resolved / pending)
- [ ] User issue history view
- [ ] Escalation system (priority levels)
- [ ] Ticket assignment to team members

### 10. Security & Compliance
- [ ] Audit logs viewer (all system actions)
- [ ] Suspicious login detection alerts
- [ ] Rate limiting / abuse prevention settings
- [ ] Data policy management page

### 11. Marketing & Growth Tools
- [ ] Referral system control (codes, tracking)
- [ ] Campaign management (email/SMS blast interface)
- [ ] Lead tracking from landing page signups
- [ ] Conversion funnel analytics

### 12. Logs & Debugging
- [ ] API request logs viewer with filters
- [ ] Error logs viewer
- [ ] Background job / queue monitoring

### 13. System Settings
- [ ] Environment config viewer
- [ ] Backup & restore controls
- [ ] Platform-wide settings (default currency, tax rules)

### 14. Localization & Multi-Tenant Control
- [ ] Multi-country config (currency, tax per region)
- [ ] Language pack management
- [ ] Default locale settings

## Party Enrollment Enhancement (Customer/Vendor Form)
- [x] GSTIN field prominent in Customer form with auto-detect State from GSTIN first 2 digits
- [x] Bill To Address section (Address Line 1, Line 2, City, State, Pincode) in Customer form
- [x] Ship To Address section with "Same as Bill To" checkbox in Customer form
- [x] Same GST + Bill To / Ship To enhancement in Vendor form
- [x] DB schema: Add billing/shipping address columns to customers and vendors tables

## Inventory Enhancement & Bug Fix
- [x] BUG: Inventory item save not working (Create button not saving item)
- [x] Add MRP field to inventory item form
- [x] Add Selling Price field to inventory item form
- [x] Add Purchase Price field to inventory item form
- [x] Add UPC / Barcode field to inventory item form
- [x] Rename "Quantity" label to "Opening Stock"
- [x] Rename "Cost" label to "Purchase Price" (or keep separate)
- [x] DB migration: Add mrp, sellingPrice, purchasePrice, upcBarcode columns to inventory table

## Bug Fix — White Page
- [x] BUG: Website showing white/blank page after deployment (was browser cache issue, site working fine)

## Currency Fix & Remaining Features
- [x] BUG: Dashboard showing $ instead of ₹ — fix all currency formatting to INR (₹) across entire app
- [x] Audit Trail Report — PDF/CSV export of Activity Log
- [x] Top Customers/Products widget on Dashboard page (Top 5 each)
- [x] Invoice Due Alerts — Overdue invoices warning widget on Dashboard
- [x] Multi-Language Support — i18n framework (Hindi + English with LanguageSwitcher)
- [x] PWA / Offline Mode — service worker + manifest for mobile install
- [x] Real-Time Updates — SSE (Server-Sent Events) for live data sync
- [x] Admin Settings — Bank Details section (Bank Name, Account Number, IFSC, Account Holder)
- [x] Admin Settings — Invoice Format selector (Professional, Compact, Detailed, Minimal, Corporate)

## Razorpay Payment Gateway Integration
- [x] DB: payment_gateway_config table (companyId, provider, keyId, keySecret, webhookSecret, isActive)
- [x] DB: online_payments table (companyId, invoiceId, razorpayOrderId, razorpayPaymentId, amount, status, paidAt)
- [x] Backend: Admin API to save/update Razorpay credentials per company
- [x] Backend: Create Razorpay order for invoice (POST /api/razorpay/create-order)
- [x] Backend: Verify Razorpay payment signature (POST /api/razorpay/verify-payment)
- [x] Backend: Razorpay webhook handler (POST /api/razorpay/webhook)
- [x] Frontend: Admin Settings → Payment Gateway section (Key ID, Key Secret input, test/live toggle)
- [x] Frontend: Customer invoice payment page (Pay Now button → Razorpay checkout popup)
- [x] Frontend: Payment success/failure handling with toast notifications
- [x] Auto-mark invoice as Paid when Razorpay payment succeeds
- [x] Payment history in invoice detail (show online payment records)

## Razorpay Payment Gateway — Subscription Plan Purchase
- [x] DB: razorpay_payments table (companyId, userId, planId, razorpayOrderId, razorpayPaymentId, amount, currency, status, paidAt)
- [x] Backend: Admin API to save Razorpay Key ID & Key Secret in platform settings
- [x] Backend: Create Razorpay order for plan purchase (amount based on selected plan)
- [x] Backend: Verify Razorpay payment signature after checkout
- [x] Backend: On successful payment → activate subscription (update company plan + subscription dates)
- [x] Backend: Razorpay webhook handler for payment.captured / payment.failed events
- [x] Frontend: Admin Settings → Payment Gateway section (Razorpay Key ID, Key Secret, Test/Live toggle)
- [x] Frontend: Subscription page → "Pay with Razorpay" button alongside existing Stripe option
- [x] Frontend: Razorpay checkout popup integration (load razorpay script, open checkout)
- [x] Frontend: Payment success → show confirmation + redirect to dashboard
- [x] Frontend: Payment failure → show error toast + retry option

## Bank Account Types Enhancement
- [ ] Multiple bank account types — Savings Account, Current Account, OD (Overdraft) Account, Credit Card Account, Loan Account, Foreign Currency Account, Fixed Deposit Account
- [ ] Bank account sub-type field in Cash & Bank module (currently only Cash/Bank/UPI/Wallet)
- [ ] IFSC code field for bank accounts
- [ ] Branch name field for bank accounts
- [ ] Opening balance date for bank accounts

## Multi-Currency Support (Tally-style)
- [ ] Currency master table (code, name, symbol, decimal places, exchange rate to INR)
- [ ] Default currency setting per company (INR)
- [ ] Currency field on Invoice / Bill / Payment-In / Payment-Out (select currency per transaction)
- [ ] Exchange rate input on foreign currency transactions
- [ ] Same party — multiple currency invoices (e.g., one customer with USD + EUR invoices)
- [ ] General Ledger default view in base currency (INR) with converted amounts
- [ ] General Ledger currency filter — view ledger in specific currency only
- [ ] Exchange gain/loss auto-calculation on payment (difference between invoice rate and payment rate)
- [ ] Multi-currency Trial Balance / P&L / Balance Sheet (converted to base currency)
- [ ] Foreign currency bank account support (linked to currency master)

## Packing List / Delivery Note
- [ ] Packing List document — list of items packed for shipment (linked to invoice/challan)
- [ ] Packing List fields: box number, weight, dimensions, item-wise packing detail
- [ ] Packing List PDF export
- [ ] Delivery Note (separate from Delivery Challan) — confirmation of goods dispatched
- [ ] Delivery Note linked to Invoice with item-wise dispatch tracking

## Goods Received Note (GRN)
- [ ] GRN module — record goods received against Purchase Order
- [ ] GRN fields: PO reference, vendor, date, item-wise received qty vs ordered qty
- [ ] GRN status: Pending / Partial / Complete
- [ ] GRN → auto-update inventory stock on receipt
- [ ] GRN → link to Bill (bill created after GRN verification)
- [ ] GRN PDF export

## Goods Return Entry
- [ ] Goods Return Note (outward) — linked to Purchase Return / Debit Note
- [ ] Goods Return Note (inward) — linked to Sale Return / Credit Note
- [ ] Item-wise return tracking with reason codes (damaged, wrong item, quality issue, etc.)
- [ ] Return → auto-adjust inventory stock

## Credit Note / Debit Note Enhancement
- [ ] Credit Note — proper document with line items (currently Sale Return is basic amount-only)
- [ ] Credit Note line items: item, qty returned, rate, GST, amount
- [ ] Credit Note → auto journal entry (Dr Sales Return, Cr Customer)
- [ ] Credit Note → auto inventory adjustment (stock back in)
- [ ] Credit Note PDF export with GST breakup
- [ ] Debit Note — proper document with line items (currently Purchase Return is basic amount-only)
- [ ] Debit Note line items: item, qty returned, rate, GST, amount
- [ ] Debit Note → auto journal entry (Dr Vendor, Cr Purchase Return)
- [ ] Debit Note → auto inventory adjustment (stock back in)
- [ ] Debit Note PDF export with GST breakup
- [ ] Credit/Debit Note adjustment against future invoices/bills

## Bank Account — Currency Selection on Ledger
- [ ] Currency field on bank accounts (link to currency master — INR, USD, EUR, etc.)
- [ ] When opening bank ledger, show default currency (base INR) with converted amounts
- [ ] Currency filter dropdown on bank ledger — view transactions in specific currency only
- [ ] Multi-currency balance display on Cash & Bank page (show balance in account currency + INR equivalent)

## Invoice / Bill — Reference File Upload (Attachment)
- [ ] File attachment field on Invoice (upload reference invoice, PO copy, etc.)
- [ ] File attachment field on Bill (upload vendor bill scan/photo)
- [ ] File attachment field on Purchase Order
- [ ] Attachments stored in S3 via storagePut, URL saved in DB
- [ ] View/download attachments from invoice/bill detail view

## Print Settings (Admin Settings → Print Configuration)
- [ ] Paper size selection — A4, A5, 4x6 (thermal), Letter, Legal, Custom
- [ ] Page orientation — Portrait / Landscape
- [ ] Margin settings (top, bottom, left, right in mm)
- [ ] Print header ON/OFF toggle (company name, logo, address)
- [ ] Print footer ON/OFF toggle (terms, signature line, generated by)
- [ ] Number of copies default setting
- [ ] Print preview before printing
- [ ] Thermal printer support (58mm / 80mm receipt format)

## Invoice Layout / Templates (Multiple Designs with Logo)
- [ ] 4-5 distinct invoice PDF layouts (Classic, Modern, Compact, Professional, Minimal)
- [ ] Company logo in invoice header (upload logo in settings, show in PDF)
- [ ] Custom header text (company tagline, registration info)
- [ ] Custom footer text (bank details, terms & conditions, thank you note)
- [ ] Layout selection saved per company in settings (applied to all PDFs)
- [ ] Invoice PDF shows: Logo + Company Name + Address + GSTIN + Contact in header
- [ ] Invoice PDF shows: Bank details + Terms + Signature block in footer
- [ ] Different layouts for: Invoice, Estimate, Proforma, Delivery Challan, Credit Note

## Invoice Line Items — Batch / Barcode / Expiry / MFG Date
- [ ] Batch Number field on invoice line items (select from inventory batches)
- [ ] Barcode field on invoice line items (auto-fill from inventory item)
- [ ] Expiry Date field on invoice line items (auto-fill from batch)
- [ ] Manufactured Date field on invoice line items (auto-fill from batch)
- [ ] Same fields on Bill line items (purchase side)
- [ ] Batch selection dropdown (shows available batches for selected item with qty & expiry)

## Invoice — PO Number & PO Date
- [ ] PO Number field on Invoice form (customer's purchase order reference)
- [ ] PO Date field on Invoice form
- [ ] PO Number shown on Invoice PDF
- [ ] PO Number field on Bill form (our PO reference to vendor)

## Invoice — Payment Due Period (Quick Select)
- [ ] Payment terms quick-select dropdown: Immediate, 7 Days, 15 Days, 30 Days, 45 Days, 60 Days, 90 Days, Custom
- [ ] Auto-calculate Due Date from Invoice Date + selected period
- [ ] Default payment terms setting per company (in Admin Settings)
- [ ] Default payment terms per customer (set on customer profile, auto-apply on invoice)
- [ ] Payment terms prefix/label customization

## Invoice — E-Way Bill & Vehicle Fields
- [ ] E-Way Bill Number field on Invoice form
- [ ] E-Way Bill Date field on Invoice form
- [ ] Vehicle Number field on Invoice form (for transport)
- [ ] Transport Mode field (Road / Rail / Air / Ship)
- [ ] Transporter Name field
- [ ] These fields shown on Invoice PDF when filled

## Invoice Section ON/OFF Settings (Admin Settings → Invoice Sections)
- [ ] Toggle: Show/Hide GST breakup section (CGST/SGST/IGST columns)
- [ ] Toggle: Show/Hide TCS section
- [ ] Toggle: Show/Hide Discount column
- [ ] Toggle: Show/Hide HSN Code column
- [ ] Toggle: Show/Hide Batch Number column
- [ ] Toggle: Show/Hide Barcode column
- [ ] Toggle: Show/Hide Expiry Date column
- [ ] Toggle: Show/Hide MFG Date column
- [ ] Toggle: Show/Hide PO Number & Date
- [ ] Toggle: Show/Hide E-Way Bill fields
- [ ] Toggle: Show/Hide Vehicle/Transport fields
- [ ] Toggle: Show/Hide Place of Supply
- [ ] Toggle: Show/Hide Terms & Conditions in PDF
- [ ] Toggle: Show/Hide Bank Details in PDF
- [ ] Toggle: Show/Hide Signature block in PDF
- [ ] Settings saved per company in DB, applied to invoice form + PDF export

## Invoice PDF Layouts (Phase 2 Complete)
- [x] 5 Professional Invoice Layouts (Professional/FoodOnDoor, Modern, Corporate, Minimal, Creative)
- [x] Color customization system (primary, secondary, accent, background, text, border)
- [x] Layout selection in Admin Settings
- [x] Dynamic HTML generation per layout with full GST/Tax support
- [x] Bank details integration in layouts
- [x] PO Number, E-way Bill, Batch, Expiry, MFG Date fields support
- [x] Export function updated to support layout selection
