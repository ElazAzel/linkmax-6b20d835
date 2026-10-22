import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AIGenerator } from '../AIGenerator';
vi.mock('@/hooks/user/useFreemiumLimits', () => ({ useFreemiumLimits: () => { throw new Error('Page builder must not access AI quotas'); } }));
it('opens the local builder from the legacy AI entry without accessing model quotas', () => {
  render(<AIGenerator type="ai-builder" isOpen onClose={vi.fn()} onResult={vi.fn()} />);
  expect(screen.getByText('Что должна делать страница?')).toBeInTheDocument();
});
