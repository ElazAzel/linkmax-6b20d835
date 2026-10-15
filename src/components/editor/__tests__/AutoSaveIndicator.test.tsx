import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AutoSaveIndicator } from '../AutoSaveIndicator';

describe('save status', () => {
  it('shows a new failure immediately after success', () => {
    const { rerender } = render(<AutoSaveIndicator status="saved" />);
    rerender(<AutoSaveIndicator status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Saved')).toBeNull();
  });
});
