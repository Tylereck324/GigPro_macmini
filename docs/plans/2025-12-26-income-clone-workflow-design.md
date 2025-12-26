# Income Clone Workflow Design

## Goal

Speed up daily income entry by letting users clone entries from the most recent prior day in the same month, with a modal picker to choose which entries to copy.

## Non-goals

- Server-side bulk clone or transactional RPC changes.
- Recurring templates or cross-month cloning.
- Bulk import from CSV or external sources.

## User Decisions (Confirmed)

- Focus area: Income tracking workflow polish.
- Clone source default: most recent day with income entries, before the target day.
- Clone content: copy all fields (platform, times, amount, notes).
- Picker: modal with checklist, all entries preselected, ordered as in source day.
- Source date selection: date picker in modal, same month, only dates before target day.
- If target day has entries: confirm modal with Append (primary) or Replace.
- If no source day exists: open blank entry form + toast.
- After clone: create immediately, show success toast with 10s undo.
- Notes: append "Cloned from YYYY-MM-DD".
- Times: keep same clock times on target date; treat end < start as overnight.
- Income list header + Clone button should show even on empty days.

## UX Flow

1. Day view shows an "Income Entries" header with a "Clone last income day" action even when empty.
2. Clicking clone loads month data (if not already loaded) and finds the most recent day in the same month before the target date that has entries.
3. If no source day is found, scroll to the Add Income Entry form and show a toast: "No prior income entries to clone".
4. If a source day exists, open a modal with:
   - Date picker (bounded to month start and day before target date).
   - Dynamic summary (source date, selected count, total amount).
   - Checklist of entries (ordered as in source day, all selected by default).
5. Confirm clone:
   - If target day has entries, show a confirm dialog with Append (primary) and Replace.
   - Append adds clones; Replace deletes existing entries then adds clones.
6. Success toast includes Undo action. Undo removes cloned entries; if Replace, it restores originals.

## Data & Logic

- Use `incomeByMonth[monthKey]` for source discovery and entry lists.
- On modal open, call `loadIncomeEntries({ dateRange: { start: monthStart, end: monthEnd } })` to ensure full-month data (Day view currently only loads a rolling week).
- Build a map of entries by date for quick lookup.
- Create payloads using `CreateIncomeEntry`:
  - `date`: target date.
  - `blockStartTime`/`blockEndTime`: same clock time, new date.
  - If end clock time < start clock time, set end date to target date + 1 day.
  - `blockLength`: same as source.
  - `notes`: append "Cloned from YYYY-MM-DD".
- Clone execution:
  - Append: call `addIncomeEntry` for each payload.
  - Replace: capture originals, delete each, then add clones.
- Undo:
  - Track cloned entry IDs.
  - If Append: delete cloned IDs.
  - If Replace: delete cloned IDs and re-add originals.

## Components

- `CloneIncomeModal` (new, under `src/components/income/`): date picker, entry checklist, summary, confirm.
- Reuse `ConfirmDialog` for Append/Replace confirmation.
- Update `IncomeList` to always render the header, clone button, and empty state.

## Error Handling

- Missing source day: toast + open blank Add Income Entry form.
- Source date with no entries: disable confirm, show empty state.
- Partial clone failure: toast with error, stop remaining adds.
- Undo failure: toast indicating rollback incomplete.

## Testing

- Unit tests for helpers:
  - `findMostRecentSourceDate`
  - `shiftEntryToDate`
  - `appendCloneNote`
  - `buildClonePayloads`
- Component tests:
  - Default source selection, summary updates, confirm disabled on empty.
- Integration tests:
  - Append flow + undo.
  - Replace flow + undo restores originals.
