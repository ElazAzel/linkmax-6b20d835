import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ErrorState } from '../error-state';

describe('UI state components visual snapshots', () => {
  it('renders loading states variants', () => {
    const spinner = render(<LoadingState message="Loading records" />);
    expect(spinner.container.firstChild).toMatchSnapshot('loading-spinner');

    spinner.rerender(<LoadingState variant="skeleton-list" skeletonCount={2} />);
    expect(spinner.container.firstChild).toMatchSnapshot('loading-skeleton-list');

    spinner.rerender(<LoadingState variant="skeleton-cards" skeletonCount={2} />);
    expect(spinner.container.firstChild).toMatchSnapshot('loading-skeleton-cards');
  });

  it('renders empty state with CTA', () => {
    const onCtaClick = vi.fn();
    const { container } = render(
      <EmptyState
        title="No leads yet"
        description="Start by creating your first lead"
        ctaLabel="Create lead"
        onCtaClick={onCtaClick}
      />
    );

    expect(screen.getByRole('button', { name: 'Create lead' })).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot('empty-state');
  });

  it('renders error state with retry CTA', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <ErrorState
        title="Failed to load"
        description="Please check your internet connection"
        retryLabel="Retry"
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot('error-state');
  });
});
