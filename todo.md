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
- [ ] Proforma Invoice — Estimate se alag, formal proforma invoice type with separate numbering
- [ ] Batch / Expiry Tracking — Inventory items pe batch number + expiry date (pharma/FMCG use case)
- [ ] Approval Workflows — PO approval, expense approval before processing (maker-checker)
- [ ] Top Customers / Products Ranking — Dashboard pe top 10 customers by revenue, top products by sales
- [ ] Invoice Template Applied to PDF — Selected theme actually used when generating PDF export
- [ ] E-Way Bill NIC API Integration — Real e-way bill generation via government NIC API backend

## Pending Features — Low Priority (from Feature Audit)
- [ ] Real Email/SMS/WhatsApp Sending — Twilio/MSG91/WhatsApp Business API integration for actual delivery
- [ ] Razorpay/Paytm Payment Gateway — Customer-facing payment collection (not just Stripe subscription)
- [ ] Multi-Currency Support — USD, EUR, GBP support with exchange rates and conversion
- [ ] Bank Feeds Integration — Auto-import bank transactions (Plaid/Yodlee style)
- [ ] E-Commerce Integration — Amazon/Shopify order sync with inventory
- [ ] PWA / Offline Mode — Progressive Web App for offline access and mobile install
- [ ] Real-Time Updates — WebSocket/SSE for live data sync across tabs/users
- [ ] Audit Trail Report — Downloadable audit log report (PDF/Excel export of activity log)
- [ ] Multi-Language Support — Hindi, Gujarati, Marathi, Tamil etc. UI translations

## Partial Features — Need Completion (from Feature Audit)
- [ ] Payment Reminders — Real SMS/WhatsApp/email sending (currently UI-only, no actual delivery)
- [ ] Invoice Due Alerts — Auto-notification when invoice becomes overdue (currently just status badge)
- [ ] Invoice Themes — Apply selected template to actual PDF export (currently preview-only, not saved to DB)
- [ ] E-Way Bill — NIC API backend integration (currently frontend-only form, no API call or DB save)
- [ ] Top Customers/Products — Dashboard ranking widget (currently shows recent transactions only)
- [ ] Real-time Updates — WebSocket/SSE live sync (currently data refreshes only on page navigation)
- [ ] Razorpay/Paytm — Customer payment collection integration (currently only Stripe for subscriptions)
- [ ] WhatsApp/Email — Real API integration for message delivery (currently UI compose form only)
- [ ] Multi-Currency — Support beyond INR (currently INR-only throughout)
- [ ] Bank Reconciliation — Full implementation (currently not started at all)

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
