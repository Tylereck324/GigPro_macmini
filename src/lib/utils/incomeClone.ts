import { addDays, parseISO } from 'date-fns';
import type { CreateIncomeEntry, IncomeEntry } from '@/types/income';

export function appendCloneNote(notes: string, sourceDate: string): string {
  const suffix = `Cloned from ${sourceDate}`;
  if (!notes) return suffix;
  return `${notes}\n${suffix}`;
}

export function findMostRecentSourceDate(
  entries: IncomeEntry[],
  targetDate: string
): string | null {
  const monthKey = targetDate.slice(0, 7);
  const candidates = entries
    .map((entry) => entry.date)
    .filter((date) => date.startsWith(monthKey) && date < targetDate)
    .sort();

  if (candidates.length === 0) return null;
  return candidates[candidates.length - 1];
}

function shiftIsoToDate(isoString: string, targetDate: string): string {
  const original = parseISO(isoString);
  const base = parseISO(`${targetDate}T00:00:00`);

  base.setHours(
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds()
  );

  return base.toISOString();
}

export function shiftEntryToDate(entry: IncomeEntry, targetDate: string): CreateIncomeEntry {
  const start = entry.blockStartTime ? shiftIsoToDate(entry.blockStartTime, targetDate) : null;
  let end = entry.blockEndTime ? shiftIsoToDate(entry.blockEndTime, targetDate) : null;

  if (start && end) {
    const startDate = parseISO(start);
    let endDate = parseISO(end);

    if (endDate < startDate) {
      endDate = addDays(endDate, 1);
      end = endDate.toISOString();
    }
  }

  return {
    date: targetDate,
    platform: entry.platform,
    customPlatformName: entry.customPlatformName,
    blockStartTime: start,
    blockEndTime: end,
    blockLength: entry.blockLength,
    amount: entry.amount,
    notes: entry.notes,
  };
}

export function buildClonePayloads(
  entries: IncomeEntry[],
  sourceDate: string,
  targetDate: string
): CreateIncomeEntry[] {
  return entries.map((entry) => {
    const shifted = shiftEntryToDate(entry, targetDate);
    return {
      ...shifted,
      notes: appendCloneNote(shifted.notes ?? '', sourceDate),
    };
  });
}
