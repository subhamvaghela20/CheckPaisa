# Mobile verification

Automated tests use mocked native components and storage. They exercise React events and data flows but do not measure real device layouts or launch the operating-system file picker. JavaScript/Hermes export checks are not APK/IPA installation tests.

## Before release

- Install a fresh native build on Android and iOS. Test a small screen and a device with a notch, in both themes and with large system text.
- Add/edit a transaction, scroll through every recurring control, focus the last note field, dismiss the keyboard, and save. Confirm all fields and the footer are reachable.
- Edit the last category budget with the keyboard open. Open the category editor, scroll all icon/color choices, and save a long category name.
- Check long names, large amounts, and notes in recurring cards, Home, Reports, and transaction details. Confirm no overlap or clipped controls.
- Export from Profile using **Export Transactions (.xlsx)**. Save the shared workbook to Files/Downloads and open it in Excel. Verify amounts, timestamps, leading-zero IDs, Unicode and multiline notes.
- Use **Import Excel File (.xlsx / .xls)** to select that workbook. Confirm repeat import skips duplicates. Test picker cancellation, a damaged workbook, missing required columns, an invalid amount/date and a file over 5 MB.
- Pause and resume a schedule, edit one generated entry, edit a rule, and convert a one-time entry. Confirm existing entries are retained once and future dates follow the edited schedule.
- Background and reopen the app after a due date; also leave it open across midnight. This app processes due dates while open and on return; it does not execute schedules while terminated.
- Rename a used category; check historical transactions, budgets and rules. Used categories must be deactivated instead of deleted.
- Rename the account email and sign in again. Delete a test account and recreate it with the same email. Old recurring schedules must not return.
- Delete a secondary wallet and verify its entries and schedules move to a remaining wallet. Reset a test account and confirm its schedules are cleared.

## Excel format

Export produces a genuine `.xlsx` workbook with a `Transactions` sheet. Required import headers are `Type`, `Category`, `Amount`, and `Date`, starting in row 1 at A1. Optional columns are `ID`, `Notes`, `Wallet ID`, and `Recurring Rule ID`.

Use positive numeric amounts and Excel date cells or ISO dates (`YYYY-MM-DD` or an ISO timestamp). Formula cells are rejected; paste their values first. Limits are 10,000 transaction rows and 5 MB per workbook. Import validates all rows before saving. It does not create recurring schedules; links are retained only for rules already in the account. Unknown wallet IDs use the selected wallet.

## Automated checks

Use Node.js 24 with `npm ci`, then run `npm test`, `npm run check`, and `npx expo install --check`. Verify both native bundles with `npx expo export --platform android --platform ios --output-dir dist/verification`.

File integration follows [Expo DocumentPicker](https://docs.expo.dev/versions/v54.0.0/sdk/document-picker/) and [SheetJS React Native guidance](https://docs.sheetjs.com/docs/demos/mobile/reactnative/).
