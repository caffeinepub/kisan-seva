# Kisan Seva

## Current State
- BookingsPage: Edit and Delete buttons show for ALL bookings including completed ones — no guard on status
- TransactionsPage: No delete or edit option exists for saved transactions
- AllTransactionsPage: Fetches parties but discards them (_parts unused); party name not shown in transaction list
- Dashboard All Transactions tab: Party name not shown
- Booking-Transaction link: Transaction stores bookingRef string but no cascade delete logic exists

## Requested Changes (Diff)

### Add
- Transaction edit and delete options in TransactionsPage
- Cascade delete: when a transaction is deleted, if it has a connected bookingId, delete that booking too (from backend + localStorage)
- Party name display in AllTransactionsPage list
- Party name display in Dashboard "All Transactions" tab

### Modify
- BookingsPage: Wrap Edit and Delete buttons with `b.status !== BookingStatus.completed` check — completed bookings become read-only
- AllTransactionsPage: Use the fetched parties list to look up and display party name per transaction; also fall back to ktp_saved_transactions partyName field
- Dashboard: Look up party name for each payment in transactions tab using ktp_saved_transactions (which stores partyName)
- TransactionsPage: Add delete handler that removes from backend (actor.deletePayment if available, else just localStorage), removes from ktp_saved_transactions, and cascade-deletes linked booking

### Remove
- Nothing removed

## Implementation Plan
1. BookingsPage.tsx: Add `b.status !== BookingStatus.completed` guard around Edit and Delete buttons
2. TransactionsPage.tsx / AllTransactionsPage.tsx: Add delete (and edit) buttons on saved transaction cards; delete removes from ktp_saved_transactions and cascade-deletes connected booking (by bookingRef/id from localStorage)
3. AllTransactionsPage.tsx: Use parties list to show party name in each transaction card
4. Dashboard.tsx: Show party name in All Transactions tab using ktp_saved_transactions partyName
