# Kisan Seva

## Current State
- TransactionsPage: New transaction form only (no edit). Saves to localStorage ktp_saved_transactions and backend.
- AllTransactionsPage: Shows all transactions with Delete button only. Delete cascades to connected booking.
- Dashboard: All Transactions tab shows list read-only (no edit/delete buttons).
- BookingsPage: Shows #BKG-XXXX number in list card and form. Completed bookings stay in list.
- Driver attendance: Stored in localStorage (ktp_driver_attendance). Not auto-updated from transaction driver hours.
- Party balance (ktp_party_udhar): Updated on transaction save but not reversed on delete.
- Cash party transactions: Party name sometimes blank in list.

## Requested Changes (Diff)

### Add
- **Transaction Edit**: Edit button on each transaction in AllTransactionsPage and Dashboard's All Transactions tab. Tapping Edit opens TransactionsPage form pre-filled with all that transaction's data. On save, updates existing localStorage entry (ktp_saved_transactions) and updates ktp_party_udhar accordingly (reverse old amount, add new amount).
- **Driver hours auto-update**: When a transaction is saved with a driver selected and hours > 0, save those hours to ktp_driver_attendance for that driver on that date.
- **Party balance reversal on delete**: When a transaction is deleted, reverse the party's due/advance in ktp_party_udhar (subtract the balance that was added).
- Edit transaction needs to pass from AllTransactionsPage/Dashboard through App.tsx to TransactionsPage. App.tsx needs editTransaction state similar to bookingPrefill.

### Modify
- **BookingsPage**: Remove #BKG-XXXX number display from both booking list cards and form header.
- **Completed booking auto-delete**: After handleCompleteBooking is called in App.tsx and booking navigates to transaction, also delete the booking from backend (actor.deleteBooking) and remove from localStorage.
- **AllTransactionsPage**: Add Edit ✏️ button next to existing Delete button. On edit, call a callback to App.tsx with the transaction data.
- **Dashboard All Transactions tab**: Add Edit and Delete buttons to each transaction row.
- **All Transactions party name**: For cash transactions where partyName is empty, display "Cash" as fallback.
- **TransactionsPage**: Accept optional `editTransaction` prop. When set, pre-fill all form fields from the transaction data, change header to "Edit Transaction", on save update localStorage entry instead of creating new, also update ktp_party_udhar (reverse old balance, recalculate new balance). savedOnce logic still applies after save.

### Remove
- Booking number (#BKG-XXXX) display from BookingsPage list cards and form.

## Implementation Plan
1. Update App.tsx:
   - Add `editTransaction` state (SavedTransaction | null)
   - Pass `editTransaction` and `onEditTransaction` callback to AllTransactionsPage, Dashboard
   - Pass `editTransaction` and `onClearEdit` to TransactionsPage
   - In handleCompleteBooking: after navigating to transactions, call actor.deleteBooking(b.id)

2. Update TransactionsPage:
   - Add `editTransaction` prop (SavedTransaction | null) and `onClearEdit` callback
   - On mount/change of editTransaction: pre-fill partyId, partyMobile, workType, hours, minutes, amount, discount, receivedAmount, paymentMethod, splitCash, splitUpi, date, time, txNumber, driverId, tractorId
   - Change title to t.editTransaction when in edit mode
   - On save in edit mode: update existing entry in ktp_saved_transactions by matching txNumber/id, reverse old party balance, apply new party balance, update cash flow (remove old CF entries for this txn, add new ones)
   - On save (both new and edit): if driverId selected and hours > 0, save to ktp_driver_attendance

3. Update AllTransactionsPage:
   - Add `onEditTransaction?: (txn: SavedTransaction) => void` prop
   - Add Edit ✏️ button next to Delete in each transaction card
   - Clicking Edit calls onEditTransaction with the saved transaction data, then App navigates to "transactions" page
   - Party name fallback: if partyName empty, show "Cash"

4. Update Dashboard:
   - In All Transactions tab, add Edit ✏️ and Delete 🗑️ buttons to each transaction row
   - Add `onEditTransaction` and `onDeleteTransaction` props, or inline the delete logic using localStorage
   - Party name fallback: if partyName empty, show "Cash"

5. Update BookingsPage:
   - Remove all #BKG-XXXX references from list card and form
   - Keep booking functionality intact, just hide the number display

6. Update handleDeleteConfirm in AllTransactionsPage:
   - After deleting, reverse party balance in ktp_party_udhar
