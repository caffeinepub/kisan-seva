# Kisan Seva

## Current State
- App has booking numbers (#BKG-XXXX) shown in bookings
- Dashboard All Transactions tab shows basic transaction cards
- Admin Panel has block/unblock only
- Splash screen shows on first app load each session
- Transactions have edit/delete but delete may not fully cascade to all places
- Booking form does not carry payment method to transaction form
- Party selected in booking doesn't influence dashboard tabs

## Requested Changes (Diff)

### Add
- Transaction detail modal/drawer: clicking any transaction card anywhere in app shows full details (party, amount, service, hours, time, payment method, discount, balance due, driver, tractor, date)
- Admin Panel: Active/Inactive status per user (separate from Blocked) — admin can toggle user active/inactive; inactive user cannot login
- Dashboard All Transactions tab: show complete transaction data in each card (party name, amount, payment method, service type, hours, date, #TXN number)

### Modify
- **Remove booking numbers** completely from entire app (BookingsPage form, BookingsPage list, anywhere #BKG-XXXX appears)
- **Remove Splash Screen** — delete SplashScreen usage from App.tsx; remove `showSplash` state and SplashScreen component rendering entirely; app goes directly to login/pin/home on load
- **Transaction delete cascade**: when a transaction is deleted from ANY location (AllTransactionsPage, Dashboard, PartiesPage, TransactionsPage list), it must: (a) remove from ktp_saved_transactions, (b) reverse party balance/udhar (ktp_party_udhar and ktp_party_advance), (c) delete connected booking from localStorage, (d) update cash flow entries (ktp_cash_flow_entries), (e) reload all affected views
- **Booking → Transaction payment method carry-forward**: if booking has payment method "cash" selected, when booking is completed and navigates to TransactionsPage, the payment method should be pre-set to "cash". If a party (non-cash) is selected in booking, it should prefill party in transaction and the transaction goes to credit/udhar (party due tab).
- Admin Panel: Add Active/Inactive toggle alongside Block/Unblock. Inactive users get error on login attempt.

### Remove
- Booking number (#BKG-XXXX) from all UI locations
- SplashScreen rendering in App.tsx (remove showSplash state, SplashScreen import usage in App)

## Implementation Plan
1. In App.tsx: remove `showSplash` state, `setShowSplash`, and the SplashScreen render block entirely
2. In BookingsPage.tsx: remove all references to booking number display (#BKG-XXXX), remove bkgRef/storedNum display in form and list
3. In App.tsx handleCompleteBooking: pass payment method in bookingPrefill so TransactionsPage can use it; also pass partyId/partyName properly so credit tab works
4. In AdminPanelPage.tsx: add `status: 'active' | 'inactive'` field to user records; add Active/Inactive toggle button per user; inactive users blocked at login
5. In useLocalAuth.ts (or wherever login logic is): check for inactive status and show error
6. In Dashboard.tsx All Transactions tab: show richer transaction cards with service type, hours, payment method badge, amount, party name, #TXN number; add click handler to open detail modal
7. Create TransactionDetailModal component (or inline dialog): shows all transaction fields
8. In AllTransactionsPage, PartiesPage, Dashboard — use shared delete logic that reverses: party udhar, party advance, cash flow entries, connected booking
9. In BookingsPage: pass paymentMethod in booking prefill data when completing booking
