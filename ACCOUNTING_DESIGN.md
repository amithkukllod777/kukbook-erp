# Accounting Module Design — KukBook ERP

## Core Principle: Journal-Driven Ledger
Every financial transaction MUST create a journal entry. Account balances are ALWAYS computed from journal lines, never stored directly.

## Schema Changes Required

### 1. accounts table — add hierarchy
- `parentId` (int, nullable) — for group/sub-group hierarchy
- `isGroup` (boolean) — true for group accounts, false for ledger accounts  
- `nature` (enum: Debit, Credit) — natural balance side
- `openingBalance` (decimal) — opening balance as of FY start
- Remove `balance` column — will be computed from journal lines

### 2. journal_lines table — link by account ID
- `accountId` (int) — FK to accounts.id (replace `account` string)
- Keep `account` as display name for quick reads

### 3. journal_entries table — add source tracking
- `sourceType` (varchar) — 'manual', 'invoice', 'bill', 'payment_in', 'payment_out', 'expense', 'other_income', 'sale_return', 'purchase_return'
- `sourceId` (int, nullable) — ID of the source document

## Indian COA Default Structure
```
Assets (Debit)
├── Current Assets
│   ├── Cash
│   ├── Bank Accounts
│   ├── Accounts Receivable (Sundry Debtors)
│   ├── Inventory
│   └── Advance Tax
├── Fixed Assets
│   ├── Furniture & Fixtures
│   ├── Plant & Machinery
│   └── Vehicles
Liabilities (Credit)
├── Current Liabilities
│   ├── Accounts Payable (Sundry Creditors)
│   ├── GST Payable
│   │   ├── CGST Payable
│   │   ├── SGST Payable
│   │   └── IGST Payable
│   ├── TDS Payable
│   └── Salary Payable
├── Long-term Liabilities
│   └── Loans
Equity (Credit)
├── Capital Account
├── Reserves & Surplus
└── Retained Earnings
Revenue (Credit)
├── Sales
├── Other Income
└── Interest Income
Expenses (Debit)
├── Cost of Goods Sold
├── Salaries & Wages
├── Rent
├── Utilities
├── Office Supplies
├── GST Input
│   ├── CGST Input
│   ├── SGST Input
│   └── IGST Input
└── Depreciation
```

## Auto Journal Entry Rules

### Invoice Created (Sales)
Dr. Accounts Receivable (Customer)  ₹Total
  Cr. Sales Revenue                   ₹(Total - GST)
  Cr. CGST Payable                    ₹CGST
  Cr. SGST Payable                    ₹SGST

### Bill Created (Purchase)
Dr. Purchase/Expense Account          ₹(Amount - GST)
Dr. CGST Input                        ₹CGST
Dr. SGST Input                        ₹SGST
  Cr. Accounts Payable (Vendor)       ₹Total

### Payment Received (from Customer)
Dr. Cash/Bank                         ₹Amount
  Cr. Accounts Receivable (Customer)  ₹Amount

### Payment Made (to Vendor)
Dr. Accounts Payable (Vendor)         ₹Amount
  Cr. Cash/Bank                       ₹Amount

### Expense Recorded
Dr. Expense Category Account          ₹Amount
  Cr. Cash/Bank                       ₹Amount

### Other Income
Dr. Cash/Bank                         ₹Amount
  Cr. Other Income Account            ₹Amount

## Computed Reports
- **General Ledger**: All journal lines for a specific account, with running balance
- **Trial Balance**: Sum of all debit/credit for each account from journal lines
- **P&L**: Revenue accounts total minus Expense accounts total
- **Balance Sheet**: Assets = Liabilities + Equity (all from journal lines)
- **Day Book**: All journal entries for a date
- **Cash Book**: All journal lines touching Cash/Bank accounts
