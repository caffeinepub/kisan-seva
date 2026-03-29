# Kisan Seva

## Current State
- TractorsPage: Add/edit tractor with name and model fields only (no purchase price). No sell functionality.
- BalanceSheetPage: Shows total tractor count, income vs expenses, net profit/loss, party-wise dues. No asset purchase/sell tracking.
- No Equipment management exists anywhere.

## Requested Changes (Diff)

### Add
- **Purchase Price field** in TractorsPage add/edit form (optional, numeric)
- **Sell Tractor** button on each tractor card in TractorsPage — opens a form with sell price and sell date; marks tractor as "Sold"; saves sell record to localStorage
- **Tractor Asset History** section in BalanceSheetPage: shows each tractor with purchase price, sell price (if sold), date bought, date sold, net gain/loss
- **Equipment Page** (new page `EquipmentPage`): Add/edit/delete equipment items (name, purchase price, purchase date); Sell equipment (sell price, sell date); History per equipment item
- Equipment accessible from side drawer as "Equipment"
- New `Page` type: `"equipment"`
- **Balance Sheet Assets section** upgraded: Tractors asset value (total purchase - sold), Equipment asset value (total purchase - sold), each shown separately with totals

### Modify
- TractorsPage: Add `purchasePrice` and `purchaseDate` fields to tractor form; save to localStorage key `ktp_tractor_assets`
- TractorsPage: Add "Sell" button per tractor card; on sell, record sell price + date to `ktp_tractor_assets`
- BalanceSheetPage: Replace basic tractor count with full asset valuation from `ktp_tractor_assets` + `ktp_equipment_assets`
- App.tsx: Add `"equipment"` to Page type; add sidebar item; add route rendering `<EquipmentPage />`
- Sidebar: Add "Equipment" link

### Remove
- Nothing removed

## Implementation Plan
1. Add `purchasePrice: number, purchaseDate: string, soldPrice?: number, soldDate?: string, sold: boolean` tracking to localStorage `ktp_tractor_assets` (keyed by tractor id) in TractorsPage
2. Add purchase price + date fields in tractor add/edit form
3. Add "Sell" button per tractor → modal with sell price + date → save + mark sold
4. Create `EquipmentPage.tsx` with full CRUD + sell functionality, data in `ktp_equipment_assets` localStorage
5. Update `BalanceSheetPage.tsx` to compute asset values from both `ktp_tractor_assets` and `ktp_equipment_assets`, show history section
6. Update `App.tsx` Page type + routing + sidebar
