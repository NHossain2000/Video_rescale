import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SqueezeDial } from '../components/SqueezeDial';

describe('SqueezeDial component', () => {
  it('renders all 3 compression intensity stops', () => {
    const handleChange = vi.fn();
    render(<SqueezeDial value="regular" onChange={handleChange} />);

    expect(screen.getByRole('radio', { name: /Light/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Standard/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Maximum/i })).toBeDefined();
    expect(screen.getByText('RECOMMENDED')).toBeDefined();
  });

  it('calls onChange with correct stop when clicked', () => {
    const handleChange = vi.fn();
    render(<SqueezeDial value="regular" onChange={handleChange} />);

    const lightButton = screen.getByRole('radio', { name: /Light/i });
    fireEvent.click(lightButton);
    expect(handleChange).toHaveBeenCalledWith('light');

    const marathonButton = screen.getByRole('radio', { name: /Maximum/i });
    fireEvent.click(marathonButton);
    expect(handleChange).toHaveBeenCalledWith('marathon');
  });

  it('navigates with keyboard arrow keys', () => {
    const handleChange = vi.fn();
    render(<SqueezeDial value="light" onChange={handleChange} />);

    const radiogroup = screen.getByRole('radiogroup');
    
    // Arrow right from light (index 0) -> regular (index 1)
    fireEvent.keyDown(radiogroup, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('regular');
  });

  it('respects disabled prop', () => {
    const handleChange = vi.fn();
    render(<SqueezeDial value="regular" onChange={handleChange} disabled={true} />);

    const lightButton = screen.getByRole('radio', { name: /Light/i });
    expect(lightButton.hasAttribute('disabled')).toBe(true);

    fireEvent.click(lightButton);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
