import { describe, test, expect } from 'vitest';
import type { IncomeEntry } from '@/types/income';
import {
  appendCloneNote,
  findMostRecentSourceDate,
  shiftEntryToDate,
  buildClonePayloads,
} from '../incomeClone';

describe('incomeClone helpers', () => {
  test('appendCloneNote appends source date and preserves existing notes', () => {
    expect(appendCloneNote('', '2025-12-10')).toBe('Cloned from 2025-12-10');
    expect(appendCloneNote('foo', '2025-12-10')).toBe('foo\nCloned from 2025-12-10');
  });

  test('findMostRecentSourceDate returns nearest prior date in same month', () => {
    const entries = [
      { id: '1', date: '2025-12-03' },
      { id: '2', date: '2025-12-12' },
      { id: '3', date: '2025-12-20' },
    ] as IncomeEntry[];

    expect(findMostRecentSourceDate(entries, '2025-12-15')).toBe('2025-12-12');
    expect(findMostRecentSourceDate(entries, '2025-12-04')).toBe('2025-12-03');
    expect(findMostRecentSourceDate(entries, '2025-12-02')).toBeNull();
  });

  test('shiftEntryToDate preserves clock times and handles overnight end', () => {
    const source: IncomeEntry = {
      id: 'a',
      date: '2025-12-10',
      platform: 'AmazonFlex',
      customPlatformName: undefined,
      blockStartTime: '2025-12-10T22:00:00.000Z',
      blockEndTime: '2025-12-11T02:00:00.000Z',
      blockLength: 240,
      amount: 120,
      notes: '',
      createdAt: 0,
      updatedAt: 0,
    };

    const shifted = shiftEntryToDate(source, '2025-12-15');
    expect(shifted.date).toBe('2025-12-15');
    expect(shifted.blockStartTime?.startsWith('2025-12-15T')).toBe(true);
    expect(shifted.blockEndTime?.startsWith('2025-12-16T')).toBe(true);
  });

  test('buildClonePayloads builds CreateIncomeEntry list with notes appended', () => {
    const source: IncomeEntry = {
      id: 'a',
      date: '2025-12-10',
      platform: 'DoorDash',
      customPlatformName: undefined,
      blockStartTime: null,
      blockEndTime: null,
      blockLength: null,
      amount: 55,
      notes: 'evening shift',
      createdAt: 0,
      updatedAt: 0,
    };

    const payloads = buildClonePayloads([source], '2025-12-10', '2025-12-15');
    expect(payloads).toHaveLength(1);
    expect(payloads[0].date).toBe('2025-12-15');
    expect(payloads[0].notes).toBe('evening shift\nCloned from 2025-12-10');
  });
});
