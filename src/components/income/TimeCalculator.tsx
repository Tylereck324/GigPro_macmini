/**
 * TimeCalculator Component
 *
 * Provides time entry inputs with automatic duration calculation
 * Features:
 * - Flexible time input parsing (12-hour, 24-hour, with/without spaces)
 * - Automatic duration calculation
 * - Support for overnight shifts (automatically adds 24 hours)
 * - User-friendly time formatting on blur
 */

'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, parse, differenceInMinutes } from 'date-fns';
import { Input } from '../ui';
import { formatDuration } from '@/lib/utils/timeCalculations';

// ============================================================================
// Types
// ============================================================================

interface TimeData {
  blockStartTime: string | null;
  blockEndTime: string | null;
  blockLength: number | null;
}

interface TimeCalculatorProps {
  /** Date for the work block (YYYY-MM-DD) */
  date: string;
  /** Current time data */
  value: TimeData;
  /** Callback when time data changes */
  onChange: (timeData: TimeData) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format ISO datetime string to 12-hour display format
 * @example "2024-01-01T14:30:00" => "2:30 PM"
 */
const formatTimeDisplay = (isoString: string | null): string => {
  if (!isoString) return '';
  try {
    const formatted = format(parseISO(isoString), 'p');
    return formatted;
  } catch (err) {
    return '';
  }
};

// ============================================================================
// Component
// ============================================================================

export function TimeCalculator({ date, value, onChange }: TimeCalculatorProps) {
  // Local state for input fields (user's raw input)
  const [startInput, setStartInput] = useState(() => value.blockStartTime ? formatTimeDisplay(value.blockStartTime) : '');
  const [endInput, setEndInput] = useState(() => value.blockEndTime ? formatTimeDisplay(value.blockEndTime) : '');

  // Track which input is currently focused to prevent unwanted updates
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);

  // ============================================================================
  // Time Formatting
  // ============================================================================

  /**
   * Parse various time input formats to ISO datetime string
   * Supports: "2:30 PM", "2:30pm", "2pm", "14:30", "2:30"
   */
  const parseTimeInput = (input: string): string | null => {
    if (!input.trim()) return null;

    const trimmed = input.trim();
    const baseDate = parseISO(`${date}T00:00:00`);

    // Define a prioritized list of formats to try
    const formats = [
      // 1. Most specific 12-hour formats (case-sensitive)
      { format: 'h:mm a', testInput: trimmed },           // e.g., "3:30 PM"
      { format: 'h a', testInput: trimmed },              // e.g., "3 PM"

      // 2. Most specific 24-hour formats (expects two-digit minutes)
      { format: 'HH:mm', testInput: trimmed },            // e.g., "15:30"
      { format: 'H:mm', testInput: trimmed },             // e.g., "3:30"
      { format: 'HHmm', testInput: trimmed },             // e.g., "1030"

      // 3. Flexible 12-hour (case-insensitive)
      { format: 'h:mm a', testInput: trimmed.toLowerCase() },
      { format: 'h:mma', testInput: trimmed.toLowerCase() },
      { format: 'h a', testInput: trimmed.toLowerCase() },
      { format: 'ha', testInput: trimmed.toLowerCase() },
    ];

    for (const { format: fmt, testInput } of formats) {
      try {
        const parsed = parse(testInput, fmt, baseDate);
        if (!isNaN(parsed.getTime())) { // Check if parsing produced a valid date
            return parsed.toISOString();
        }
      } catch {
        continue;
      }
    }

    return null;
  };

  /**
   * Calculate duration between start and end times
   * Handles overnight shifts by adding 24 hours when end < start
   */
  const calculateDuration = (startIso: string, endIso: string): number | null => {
    try {
      const start = parseISO(startIso);
      const end = parseISO(endIso);
      let diff = differenceInMinutes(end, start);

      // Handle overnight shifts (e.g., 10 PM to 4 AM)
      if (diff < 0) {
        diff += 24 * 60; // Add 24 hours in minutes
      }

      return diff;
    } catch {
      return null;
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Synchronize local input states with prop values ONLY when not focused
   * This prevents interrupting the user while they're typing
   */
  useEffect(() => {
    // Don't update start input while user is typing in it
    if (!startFocused) {
      const newStart = value.blockStartTime ? formatTimeDisplay(value.blockStartTime) : '';
      setStartInput(newStart);
    }
  }, [value.blockStartTime, startFocused]);

  useEffect(() => {
    // Don't update end input while user is typing in it
    if (!endFocused) {
      const newEnd = value.blockEndTime ? formatTimeDisplay(value.blockEndTime) : '';
      setEndInput(newEnd);
    }
  }, [value.blockEndTime, endFocused]);


  // ============================================================================
  // Event Handlers
  // ============================================================================

  // Handle raw user input, just update local state
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartInput(e.target.value);
  };

  // Handle raw user input, just update local state
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndInput(e.target.value);
  };

  /**
   * Handle blur event for time input fields
   * This is where parsing, duration calculation, and parent `onChange` are triggered.
   */
  const handleInputBlur = (type: 'start' | 'end') => {
    const currentInput = type === 'start' ? startInput : endInput;
    const otherInputIso = type === 'start' ? value.blockEndTime : value.blockStartTime;

    const parsedIsoString = parseTimeInput(currentInput);

    let newBlockStartTime = value.blockStartTime;
    let newBlockEndTime = value.blockEndTime;

    if (type === 'start') {
      newBlockStartTime = parsedIsoString;
    } else {
      newBlockEndTime = parsedIsoString;
    }

    // Recalculate duration if both times are now valid
    let newBlockLength: number | null = null;
    if (newBlockStartTime && newBlockEndTime) {
      newBlockLength = calculateDuration(newBlockStartTime, newBlockEndTime);
    }

    onChange({
      blockStartTime: newBlockStartTime,
      blockEndTime: newBlockEndTime,
      blockLength: newBlockLength,
    });

    // Update local state with formatted time only if successfully parsed
    if (parsedIsoString) {
      if (type === 'start') {
        setStartInput(formatTimeDisplay(parsedIsoString));
      } else {
        setEndInput(formatTimeDisplay(parsedIsoString));
      }
    } else {
      // If parsing fails, keep user's raw input but clear the parent's state
      // (parent will then push null back, local state stays raw until valid)
      if (type === 'start') {
        // No change to local startInput, it keeps raw text
      } else {
        // No change to local endInput, it keeps raw text
      }
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Time Input */}
        <div>
          <Input
            type="text"
            label="Start Time"
            value={startInput}
            onChange={handleStartTimeChange}
            onFocus={() => setStartFocused(true)}
            onBlur={() => {
              setStartFocused(false);
              handleInputBlur('start');
            }}
            placeholder="2:30 PM"
            fullWidth
          />
          <p className="text-xs text-textSecondary mt-1">e.g. 2:30 PM, 14:30</p>
        </div>

        {/* End Time Input */}
        <div>
          <Input
            type="text"
            label="End Time"
            value={endInput}
            onChange={handleEndTimeChange}
            onFocus={() => setEndFocused(true)}
            onBlur={() => {
              setEndFocused(false);
              handleInputBlur('end');
            }}
            placeholder="5:45 PM"
            fullWidth
          />
          <p className="text-xs text-textSecondary mt-1">e.g. 5:45 PM, 17:45</p>
        </div>

        {/* Auto-calculated Duration (Read-only) */}
        <div>
          <Input
            type="text"
            label="Duration"
            value={value.blockLength !== null ? formatDuration(value.blockLength) : ''}
            readOnly
            placeholder="Auto-calculated"
            fullWidth
            className="bg-background/50"
          />
          <p className="text-xs text-success mt-1">
            {value.blockLength !== null ? '✓ Auto-calculated' : '\u00A0'}
          </p>
        </div>
      </div>

      <p className="text-xs text-textSecondary">
        Enter start and end times - duration will be calculated automatically. Supports overnight shifts.
      </p>
    </div>
  );
}