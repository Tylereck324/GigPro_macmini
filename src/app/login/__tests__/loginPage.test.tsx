import { render, screen } from '@testing-library/react';
import LoginPage from '../page';

describe('LoginPage', () => {
  it('renders PIN input and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/pin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});

