# Kisan Seva

## Current State
- TransactionsPage.tsx (734 lines): Full transaction form with cash/credit toggle, party selector, mobile, service type, tractor/driver dropdowns, hours/minutes, amount, received, discount, split (UPI+cash), payment method buttons, save with duplicate prevention, auto-generated tx number, partial payment auto-udhar logic
- PartiesPage.tsx (213 lines): Party list with edit/delete, add form with mobile required, shows udhar balance, but no click-through to party's transactions
- i18n.ts: Trilingual translations (en/hi/gu)

## Requested Changes (Diff)

### Add
1. **Cash mode → Received auto-fill**: When `txType === 'cash'` (cash toggle selected in transaction form), whenever `amount` field changes, automatically fill `receivedAmount` with the same value
2. **Invoice modal**: After transaction save, auto-show an invoice modal/sheet with:
   - Business name + logo (from localStorage `ktp_business_name`, `ktp_business_logo`)
   - User mobile number (from localStorage `ktp_users` matched to logged-in user)
   - Party name, mobile, address
   - Transaction number, date/time (12hr format)
   - Service type, hours:minutes, rate per hour
   - Total amount, discount, received amount, balance due
   - Payment method
   - Share buttons: WhatsApp (wa.me link) and SMS (sms: link)
3. **Party detail/transaction view**: In PartiesPage, clicking a party card opens a new view (PartyDetailView) showing:
   - Party info at top (name, mobile, address, total udhar)
   - List of all transactions for that party (from localStorage `ktp_saved_transactions`)
   - Filters: date range and amount range
   - Each transaction row shows: tx number, date, service, amount, received, balance
   - "Send Reminder" button per party (or at top) → opens WhatsApp/SMS with reminder message:
     `"Namaskar [Party Name], aapka ₹[Amount] baaki hai. Kripya jald payment karein. [Business Name] [Business Mobile] — Kisan Seva"`

### Modify
- PartiesPage: Party card becomes clickable (tappable) to open PartyDetailView
- TransactionsPage: Add `useEffect` that watches `amount` and when `txType === 'cash'`, sets `receivedAmount` to same value
- TransactionsPage: After successful save, instead of just toast, show an InvoiceModal with share options
- i18n.ts: Add translation keys for invoice, share, reminder, party detail view labels

### Remove
- Nothing removed

## Implementation Plan
1. Add i18n keys for: invoiceTitle, shareWhatsapp, shareSms, sendReminder, partyTransactions, filterByDate, filterByAmount, invoiceLabel, balanceDue, businessName, viewInvoice
2. In TransactionsPage: Add `useEffect` — when `txType === 'cash'` and `amount` changes, auto-set `receivedAmount = amount`
3. Create `InvoiceModal` component (can be inline in TransactionsPage or separate file): shows invoice details, WhatsApp share button (wa.me link with pre-filled text), SMS share button (sms: link)
4. In TransactionsPage: After `handleSave` success, store last saved transaction details in state and show InvoiceModal
5. In PartiesPage: Add `selectedPartyId` state. When party card clicked, set it to show PartyDetailView
6. Create PartyDetailView (inline in PartiesPage): reads transactions from localStorage `ktp_saved_transactions`, filters by partyId, shows list with date/amount filters
7. Add "Send Reminder" button in PartyDetailView that opens WhatsApp/SMS with reminder text using party udhar amount
