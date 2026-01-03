import { render, screen } from '@testing-library/react';
import SetupPage from '../page';

describe('SetupPage', () => {
  it('renders setup and reset forms', () => {
    render(<SetupPage />);

    expect(screen.getAllByLabelText(/setup token/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset pin/i })).toBeInTheDocument();
  });
});

