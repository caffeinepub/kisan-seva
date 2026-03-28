# Kisan Seva

## Current State
- PaymentInPage: Shows only parties with pending dues (totalDue > 0); parties with no due are not shown
- All pages: Headers have a Menu (hamburger) button on left; no back navigation arrow
- Language: Some pages may have hardcoded English strings instead of using `t.xxx` translation keys
- App has trilingual support (EN/HI/GU) via `t` from `useApp()`

## Requested Changes (Diff)

### Add
1. **Back arrow in all page headers** — Each page's top header should have a back arrow (ArrowLeft icon) on the left side. Clicking it should navigate back to the previous page or to 'home' if no history.
2. **PaymentIn — Advance payment for all parties** — Even when a party has zero or no due, they should appear in PaymentIn. User can record an advance payment received. This is stored and shown as negative/advance balance on the party.

### Modify
1. **PaymentInPage**: 
   - Show ALL parties (not just those with due > 0), except Cash party
   - Add a toggle/tab: "Pending Dues" | "All Parties" 
   - "Pending Dues" tab = existing behavior (parties with due > 0)
   - "All Parties" tab = all parties shown; selecting any party allows recording advance payment
   - When advance is received for a party with 0 due, store it as advance credit (reduce future dues)
   - Label: advance payment mode shows "Advance Received" badge/note

2. **All pages — Back arrow in header**:
   - Pages that currently show Menu button: add back arrow BEFORE (left of) the menu button, OR replace menu with back arrow and move menu to right side
   - Actually: implement a navigation history stack in App.tsx, and show a back arrow on all non-home pages
   - Pages: BookingsPage, TransactionsPage, ReportPage, PartiesPage, TractorsPage, DriversPage, ExpensesPage, ServicesPage, SettingsPage, NotificationsPage, AllTransactionsPage, PaymentInPage
   - Back arrow navigates to previous page in stack (or 'home' if stack empty)

3. **Language bugs — fix all pages**:
   - Audit all pages for hardcoded English strings
   - Replace with `t.xxx` translation keys
   - Ensure all UI strings (buttons, labels, placeholders, messages) use translations
   - Pages to check: all pages listed above
   - Key areas: button labels, section headers, empty state messages, toast messages, form labels

### Remove
- Nothing removed

## Implementation Plan
1. Add `pageHistory` stack to App.tsx state; update `setPage` to push to stack; add `goBack()` function that pops stack
2. Add `goBack` to AppContext so all pages can call it
3. Update all page headers to show ArrowLeft icon on left that calls `goBack()`
4. Update PaymentInPage to show all parties with a tabs/toggle for Pending Dues vs All Parties
5. Audit and fix language strings across all pages
6. Add any missing translation keys to i18n/translations
