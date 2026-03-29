# Kisan Seva

## Current State
- CashFlowPage.tsx uses hardcoded "In:" and "Out:" strings in summary cards and filter buttons (not translated)
- ReportPage.tsx has: Party Statement, Seva Earnings, By Tractor (expenses only), Monthly Summary, Driver Report
- Driver Report shows transactions, hours, estimated pay per driver per month
- Transactions saved to ktp_saved_transactions with: id, date, time, partyId, partyName, workType, hours, minutes, rate, amount, discount, receivedAmount, paymentMethod, driverId (NO tractorId/tractorName saved)
- Expenses tracked per tractor (maintenance), per driver (driverPayment)
- i18n.ts has 3 languages: Gujarati, Hindi, English

## Requested Changes (Diff)

### Add
- Translation keys: cashFlowIn (આવક/आवक/In), cashFlowOut (જાવક/जावक/Out) in i18n.ts for all 3 languages
- Translation keys for new report views in all 3 languages:
  - driverPerformanceReport, driverWiseProfit, tractorWiseReport, tractorWiseProfit, serviceWiseReport
  - dateFilterLabel, thisMonthFilter, thisYearFilter, customRangeFilter
  - presentLabel, absentLabel, halfDayLabel, attendanceCount, revenueGenerated, netProfit, salaryPayout, maintenanceCost
- New sub views in ReportPage:
  1. **Driver Performance Report** - per driver: transaction count, total hours, total earnings + attendance (Present/Absent/Half Day count)
  2. **Driver-wise Profit** - per driver: revenue generated (from transactions) - salary payout (from expenses driverPayment) = net profit
  3. **Tractor-wise Report** - per tractor: transaction count, total hours, total revenue
  4. **Tractor-wise Profit** - per tractor: revenue - maintenance expenses = net profit  
  5. **Service-wise Report** - per service type (workType): total transactions, total hours, total amount
- Date range filter (This Month / This Year / Custom) on all 5 new report views
- Save tractorId + tractorName into ktp_saved_transactions when saving a transaction

### Modify
- CashFlowPage.tsx: Replace hardcoded "In:" with t.cashFlowIn and "Out:" with t.cashFlowOut; also update filter buttons "In (+)" → `${t.cashFlowIn} (+)` and "Out (-)" → `${t.cashFlowOut} (-)`
- ReportPage.tsx: Add 5 new menu items under appropriate sections + implement their sub views
- TransactionsPage.tsx: Add tractorId and tractorName to the object saved in ktp_saved_transactions

### Remove
- Nothing removed

## Implementation Plan
1. Add cashFlowIn/cashFlowOut + new report translation keys to i18n.ts (all 3 languages)
2. Update CashFlowPage.tsx to use t.cashFlowIn and t.cashFlowOut
3. Update TransactionsPage.tsx to save tractorId + tractorName in ktp_saved_transactions  
4. Add 5 new sub view components in ReportPage.tsx:
   - Each reads from ktp_saved_transactions + expenses data
   - Each has date range filter (This Month / This Year / Custom range with from/to date pickers)
   - Tractor-wise Report/Profit reads tractorId from transactions (after fix)
   - Driver Performance combines attendance (from driverAttendance utils) + transaction data
   - Driver-wise Profit: sum transaction amounts per driver (as revenue) - sum driverPayment expenses per driver = net profit
   - Tractor-wise Profit: sum transaction amounts per tractor - sum maintenance expenses per tractor = net profit
   - Service-wise: group transactions by workType, sum count/hours/amount
5. Add 5 new menu items to the sections array in ReportPage main view
