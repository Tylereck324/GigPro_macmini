import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeCalculator } from '../TimeCalculator';

describe('TimeCalculator', () => {
  const mockOnChange = vi.fn();

  const defaultValue = {
    blockStartTime: null,
    blockEndTime: null,
    blockLength: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render start time, end time, and duration inputs', () => {
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText(/start time/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/end time/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/duration/i)).toBeInTheDocument();
  });

  it('should allow typing time without interruption (BUG FIX TEST)', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);

    // Focus the input
    await user.click(startInput);

    // Type "12:30 PM" character by character
    await user.type(startInput, '12:30 PM');

    // Should contain the full text without jumping to formatted version
    expect(startInput).toHaveValue('12:30 PM');
  });

  it('should not format time while user is typing', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);

    await user.click(startInput);
    await user.type(startInput, '12:3');

    // Should NOT auto-format to "12:03 AM" while typing
    expect(startInput).toHaveValue('12:3');
    expect(startInput).not.toHaveValue('12:03 AM');
  });

  it('should calculate duration when both times are entered', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);
    const endInput = screen.getByPlaceholderText(/end time/i);

    // Enter start time
    await user.click(startInput);
    await user.type(startInput, '10:00 AM');
    await user.tab(); // Blur to trigger calculation

    // Enter end time
    await user.click(endInput);
    await user.type(endInput, '2:00 PM');
    await user.tab(); // Blur to trigger calculation

    // Should calculate 4 hours = 240 minutes
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          blockLength: 240,
        })
      );
    });
  });

  it('should format time on blur', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);

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
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);

    await user.click(startInput);
    await user.type(startInput, '14:30');
    await user.tab();

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          blockStartTime: expect.stringMatching(/14:30/),
        })
      );
    });
  });

  it('should handle invalid time input gracefully', async () => {
    const user = userEvent.setup();
    render(<TimeCalculator value={defaultValue} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);

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
    const valueWithTimes = {
      blockStartTime: '2025-12-01T10:00:00Z',
      blockEndTime: '2025-12-01T14:00:00Z',
      blockLength: 240,
    };

    render(<TimeCalculator value={valueWithTimes} onChange={mockOnChange} />);

    const startInput = screen.getByPlaceholderText(/start time/i);

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
      <TimeCalculator value={defaultValue} onChange={mockOnChange} />
    );

    const startInput = screen.getByPlaceholderText(/start time/i);
    expect(startInput).toHaveValue('');

    // Parent updates the value
    const newValue = {
      blockStartTime: '2025-12-01T10:00:00Z',
      blockEndTime: '2025-12-01T14:00:00Z',
      blockLength: 240,
    };

    rerender(<TimeCalculator value={newValue} onChange={mockOnChange} />);

    // Should display the new value
    expect(startInput).toHaveValue(expect.stringMatching(/10:00/));
  });
});
