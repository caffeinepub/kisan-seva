# Kisan Seva

## Current State
Kisan Seva is a trilingual tractor business management app with:
- Local auth (mobile+password) stored in localStorage (ktp_accounts, ktp_session)
- Business data (parties, transactions, bookings, drivers, tractors, expenses, services) stored in localStorage per user
- Settings page with language toggle, dark mode, business profile, and logout
- PIN-based app start with fingerprint option

## Requested Changes (Diff)

### Add
- **Backup & Restore section in Settings:**
  - "Download Backup" button: collects all user data from localStorage (parties, transactions, bookings, drivers, tractors, expenses, services, etc.) and exports as a JSON file
  - "Restore Backup" button: file upload input for JSON backup file; imports data back into localStorage and refreshes app
  - "Cloud Backup" indicator: since ICP backend stores data per identity, show last sync time or "Data synced to cloud" message for logged-in users (not guest)
- **Account Delete section in Settings:**
  - "Delete Account" danger button (red)
  - On click: show modal/dialog requiring PIN entry to confirm
  - On correct PIN: delete account from ktp_accounts, clear all user-specific data from localStorage, clear session, redirect to login page
  - Wrong PIN: show error message

### Modify
- **Settings page**: add Backup & Restore section and Account Delete section below existing content
- **i18n**: add backup/restore/account delete labels in all three languages (Gujarati, Hindi, English)

### Remove
- Nothing removed

## Implementation Plan
1. Add backup/restore/delete labels to i18n.ts in all three languages
2. Update useLocalAuth.ts to add `deleteAccount(mobile, pin)` function
3. Add backup utility functions: `exportBackup()` (reads all ktp_ localStorage keys for current user and triggers JSON download) and `restoreBackup(file)` (reads uploaded JSON and writes back to localStorage)
4. Update SettingsPage.tsx:
   - Add Backup & Restore section with Download Backup and Restore Backup (file input) buttons
   - Add Account Delete section with danger button and PIN confirmation dialog
   - Wire up all handlers
