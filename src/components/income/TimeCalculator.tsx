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

import { useState, useEffect, useCallback } from 'react';
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
// Component
// ============================================================================

export function TimeCalculator({ date, value, onChange }: TimeCalculatorProps) {
  // Local state for input fields (allows user to type before parsing)
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  // ============================================================================
  // Time Formatting
  // ============================================================================

  /**
   * Format ISO datetime string to 12-hour display format
   * @example "2024-01-01T14:30:00" => "2:30 PM"
   */
  const formatTimeDisplay = useCallback((isoString: string | null): string => {
    if (!isoString) return '';
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch {
      return '';
    }
  }, []);

  /**
   * Parse various time input formats to ISO datetime string
   * Supports: "2:30 PM", "2:30pm", "2pm", "14:30", "2:30"
   */
  const parseTimeInput = (input: string): string | null => {
    if (!input.trim()) return null;

    const trimmed = input.trim();

    // Try multiple time formats
    const formats = [
      { format: 'h:mm a', input: trimmed },           // 2:30 PM
      { format: 'h:mm a', input: trimmed.toLowerCase() }, // 2:30 pm
      { format: 'h:mma', input: trimmed.toLowerCase() },  // 2:30pm
      { format: 'h a', input: trimmed.toLowerCase() },    // 2 pm
      { format: 'ha', input: trimmed.toLowerCase() },     // 2pm
      { format: 'HH:mm', input: trimmed },            // 14:30
      { format: 'H:mm', input: trimmed },             // 2:30 (24-hour)
    ];

    for (const { format: fmt, input: testInput } of formats) {
      try {
        const parsed = parse(testInput, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
          const hours = String(parsed.getHours()).padStart(2, '0');
          const minutes = String(parsed.getMinutes()).padStart(2, '0');
          return `${date}T${hours}:${minutes}:00`;
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
   * Initialize input values from props when they change
   */
  useEffect(() => {
    if (value.blockStartTime) {
      setStartInput(formatTimeDisplay(value.blockStartTime));
    } else {
      setStartInput('');
    }
    if (value.blockEndTime) {
      setEndInput(formatTimeDisplay(value.blockEndTime));
    } else {
      setEndInput('');
    }
  }, [value.blockStartTime, value.blockEndTime, formatTimeDisplay]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle start time input change
   * Automatically calculates duration if end time is set
   */
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setStartInput(input);

    const isoString = parseTimeInput(input);

    // Calculate duration if both times are available
    const duration = isoString && value.blockEndTime
      ? calculateDuration(isoString, value.blockEndTime)
      : null;

    onChange({
      blockStartTime: isoString,
      blockEndTime: value.blockEndTime,
      blockLength: duration,
    });
  };

  /**
   * Handle end time input change
   * Automatically calculates duration if start time is set
   */
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setEndInput(input);

    const isoString = parseTimeInput(input);

    // Calculate duration if both times are available
    const duration = value.blockStartTime && isoString
      ? calculateDuration(value.blockStartTime, isoString)
      : null;

    onChange({
      blockStartTime: value.blockStartTime,
      blockEndTime: isoString,
      blockLength: duration,
    });
  };

  /**
   * Format inputs to standard display format on blur
   */
  const handleBlur = () => {
    if (value.blockStartTime) {
      setStartInput(formatTimeDisplay(value.blockStartTime));
    }
    if (value.blockEndTime) {
      setEndInput(formatTimeDisplay(value.blockEndTime));
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
            onBlur={handleBlur}
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
            onBlur={handleBlur}
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
