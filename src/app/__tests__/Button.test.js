import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Button';

test('renders button with label', () => {
  render(<Button label="Click Me" />);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button label="Click Me" onClick={handleClick} />);
  fireEvent.click(screen.getByText('Click Me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
