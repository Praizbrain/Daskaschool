# DaskaSchool User Guide

## Purpose

This guide explains the normal staff journey from sign in to sign out. It also records the checks completed for the fee and inventory wiring update on 1 October 2026.

## Sign in

1. Open the DaskaSchool address in a current browser.
2. Enter your staff email address and password.
3. Select Sign in.
4. Confirm that the Financial overview dashboard opens and your role appears in the top bar.

Do not save school credentials in this file or in the browser on a shared computer.

## Daily payment journey

1. From Dashboard, Finance, Students, or an individual student profile, select Record payment.
2. Search for and select the student when one is not already selected.
3. Choose a fee, class charge, or assigned inventory item from the same fee list.
4. Required inventory is marked Required inventory. Optional inventory is marked Inventory. Out of stock inventory cannot be selected.
5. Choose Cash, Transfer, or POS.
6. Select Review payment, verify the student, items, total, and method, then select Confirm and record.
7. Print the receipt when needed, then select Done.
8. Confirm that the Dashboard collected revenue, today revenue, student balance, class collection amount, and Finance ledger update.

## Inventory journey

1. Open Inventory and select Add item.
2. Enter the item name, category, prices, stock count, and low stock threshold.
3. For a category not already listed, choose Other and enter a Custom category name.
4. Save the item.
5. Open Class Assignments, choose a class, and assign the item.
6. Mark the assignment Required only when every student in that class is expected to buy it.
7. Required inventory is added to that class expected revenue. Optional inventory is only added to collected revenue when a payment is recorded.

Adding stock alone is not revenue.

## Fee template journey

1. Open Settings, then Fee Templates.
2. Add or edit the section fee name, amount, and installment option.
3. An amount of 0 is valid and can be saved when it is intentional.
4. Expand an item to set a class specific override or deactivate it for a class.
5. Check the class detail fee structure and Dashboard expected revenue after making a required class inventory assignment or changing a fee.

## Sign out

1. Open the profile menu in the top right corner.
2. Select Logout.
3. Confirm that the sign in page returns and that a protected route no longer opens without signing in again.

## Test record, 1 October 2026

### Completed in this workspace

- TypeScript check: passed with `npx tsc --noEmit`.
- Production build: passed with `npm run build`.
- Code path review: Dashboard, Finance, Students, and Student Profile all open the shared payment modal through `PaymentModalProvider`.
- Code path review: assigned class inventory is included in the payment item list. Required assignments are included in expected revenue. Optional assignments remain sale only.

### Still requires a live browser pass

This execution environment has no browser interaction tool, so no credentials were entered and no live data was changed. Complete the sign in, payment, inventory assignment, dashboard refresh, and sign out steps above on the running app before treating the change as fully verified.
