import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { IncomeList } from '../IncomeList';

const noop = () => {};

describe('IncomeList', () => {
  test('shows header and clone button even when empty', () => {
    const onClone = vi.fn();
    render(<IncomeList entries={[]} onEdit={noop} onDelete={noop} onClone={onClone} />);

    expect(screen.getByText('Income Entries')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clone last income day/ }));
    expect(onClone).toHaveBeenCalled();
  });
});
