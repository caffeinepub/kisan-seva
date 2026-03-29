# Kisan Seva

## Current State
- PartiesPage has add/edit form with name, phone, address fields only
- Party balance (due/advance) is calculated purely from transactions
- ServicesPage manages services stored in localStorage `kisan_services_v2`
- No Excel import feature exists

## Requested Changes (Diff)

### Add
- Party add/edit form: two new optional fields — "Opening Due" (₹) and "Opening Advance" (₹)
- Opening balance stored in localStorage `ktp_party_opening_balance` as `{[partyId]: {due: number, advance: number}}`
- Opening balance is included when calculating party total due/advance throughout the app
- Excel Import feature (in SettingsPage or side drawer): import parties and services from .xlsx file
  - Party import: Party Name (required), Mobile Number (required), Due (optional), Advance (optional)
  - Service import: Service Name (required), Price (optional)
  - Duplicate check: skip if same mobile (party) or same name (service)
  - Show result toast: "Added X, Skipped Y"
- Install `xlsx` npm package for reading .xlsx files

### Modify
- PartiesPage: update form to include openingDue and openingAdvance fields
- PartiesPage: when calculating totalDue, include opening balance from `ktp_party_opening_balance`
- PartyDetailView: show opening balance in party info card if set
- SettingsPage: add Import section with two buttons — "Import Parties" and "Import Services" (each triggers file picker for .xlsx)

### Remove
- Nothing removed

## Implementation Plan
1. Install `xlsx` package in frontend
2. Update PartiesPage add/edit form with openingDue and openingAdvance fields
3. Update all party balance calculations to include opening balance
4. Add Excel import logic (parse .xlsx, validate columns, skip duplicates, save to localStorage)
5. Add Import UI in SettingsPage
