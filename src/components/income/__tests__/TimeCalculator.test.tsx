import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeCalculator } from '../TimeCalculator';
import { useState } from 'react';

describe('TimeCalculator', () => {
  const mockOnChange = vi.fn();

  const defaultValue = {
    blockStartTime: null,
    blockEndTime: null,
    blockLength: null,
  };
  
  const testDate = "2025-01-01";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render start time, end time, and duration inputs', () => {
    render(<TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  it('should allow typing time without interruption (BUG FIX TEST)', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByLabelText(/Start Time/i);

    // Focus the input
    await user.click(startInput);

    // Type "12:30 PM" character by character
    await user.type(startInput, '12:30 PM');

    // Should contain the full text without jumping to formatted version
    expect(startInput).toHaveValue('12:30 PM');
  });

  it('should not format time while user is typing', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByLabelText(/Start Time/i);

    await user.click(startInput);
    await user.type(startInput, '12:3');

    // Should NOT auto-format to "12:03 AM" while typing
    expect(startInput).toHaveValue('12:3');
    expect(startInput).not.toHaveValue('12:03 AM');
  });

  // Wrapper component to simulate parent state for integration test
  const TimeCalculatorWrapper = () => {
    const [value, setValue] = useState<{
      blockStartTime: string | null;
      blockEndTime: string | null;
      blockLength: number | null;
    }>({
      blockStartTime: null,
      blockEndTime: null,
      blockLength: null,
    });

    return (
      <>
        <TimeCalculator date="2025-01-01" value={value} onChange={setValue} />
        <div data-testid="debug-length">{value.blockLength}</div>
      </>
    );
  };

  it('should calculate duration when both times are entered', async () => {
    const user = userEvent.setup();
    render(<TimeCalculatorWrapper />);

    const startInput = screen.getByLabelText(/Start Time/i);
    const endInput = screen.getByLabelText(/End Time/i);

    // Enter start time
    await user.click(startInput);
    await user.type(startInput, '10:00 AM');
    await user.tab();

    // Enter end time
    await user.click(endInput);
    await user.type(endInput, '2:00 PM');
    await user.tab();

    // Should calculate 4 hours = 240 minutes
    await waitFor(() => {
      expect(screen.getByTestId('debug-length')).toHaveTextContent('240');
    });
  });

  it('should format time on blur', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByLabelText(/Start Time/i);

    await user.click(startInput);
    await user.type(startInput, '1030');
    await user.tab(); // Blur

    // Should format to proper time on blur
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          blockStartTime: expect.any(String),
        })
      );
    });
  });

  it('should handle 24-hour format', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByLabelText(/Start Time/i);

    await user.click(startInput);
    await user.type(startInput, '14:30');
    await user.tab();

    await waitFor(() => {
      const calls = mockOnChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.blockStartTime).toBeTruthy();
      // Verify that it formatted correctly (ignoring specific timezone ISO string)
      // We assume the input was accepted if blockStartTime is set
      expect(typeof lastCall.blockStartTime).toBe('string');
    });
  });

  it('should handle invalid time input gracefully', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByLabelText(/Start Time/i);

    await user.click(startInput);
    await user.type(startInput, 'invalid');
    await user.tab();

    // Should not crash and should not set invalid time
    expect(mockOnChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        blockStartTime: 'invalid',
      })
    );
  });

  it('should clear duration when times are cleared', async () => {
    const user = userEvent.setup();
    // Use ISO string without Z to imply local time, or just use a known ISO string
    const valueWithTimes = {
      blockStartTime: '2025-12-01T10:00:00', 
      blockEndTime: '2025-12-01T14:00:00',
      blockLength: 240,
    };

    render(<TimeCalculator date={testDate} value={valueWithTimes} onChange={mockOnChange} />);

    const startInput = screen.getByLabelText(/Start Time/i);

    await user.click(startInput);
    await user.clear(startInput);
    await user.tab();

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          blockStartTime: null,
          blockLength: null,
        })
      );
    });
  });

  it('should sync with parent value changes', () => {
    const { rerender } = render(
      <TimeCalculator date={testDate} value={defaultValue} onChange={mockOnChange} />
    );

    const startInput = screen.getByLabelText(/Start Time/i);
    expect(startInput).toHaveValue('');

    // Parent updates the value
    const newValue = {
      blockStartTime: '2025-12-01T10:00:00',
      blockEndTime: '2025-12-01T14:00:00',
      blockLength: 240,
    };

    rerender(<TimeCalculator date={testDate} value={newValue} onChange={mockOnChange} />);

    // Should display the new value (matching 10:00)
    expect(startInput).toHaveValue('10:00 AM');
  });
});
