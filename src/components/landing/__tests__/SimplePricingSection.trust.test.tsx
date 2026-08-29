import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SimplePricingSection } from '../SimplePricingSection';

describe('SimplePricingSection trust copy', () => {
  it('does not advertise a universal zero commission policy', () => {
    render(
      <MemoryRouter>
        <SimplePricingSection isVisible sectionRef={createRef<HTMLDivElement>()} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/0% комиссии/i)).not.toBeInTheDocument();
  });
});
