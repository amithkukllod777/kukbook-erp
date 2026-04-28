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
- [x] Vitest tests for all modules (45 tests passing)
- [x] Final status check — zero TypeScript errors

## Future Enhancements (Not Yet Implemented)
- [ ] Multi-Tenant Architecture (companyId isolation, subdomain routing)
- [ ] Subscription plans with payment gateway (Stripe/Razorpay)
- [ ] 30-day free trial tracking
- [ ] GST compliance (GSTR-1/3B reports, HSN codes, E-Way Bill)
- [ ] Delivery Challans
- [ ] Day Book, Cashflow, Party Statement reports
- [ ] Barcode generation and scanning
- [ ] Invoice themes (multiple templates)
- [ ] Import/Export from Excel
- [ ] WhatsApp/SMS integration
- [ ] Payment reminders (auto-send)
- [ ] Multi-firm support
- [ ] Discount management (item-wise, transaction-wise)
- [ ] Party grouping
