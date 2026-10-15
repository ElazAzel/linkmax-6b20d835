import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from '@/testing/router';
import { useLocation } from '@/lib/router-compat';
import { describe, expect, it } from 'vitest';

import { CanonicalDemoRedirect } from '../CanonicalDemoRedirect';

function CurrentLocation() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}`}</div>;
}

describe('CanonicalDemoRedirect', () => {
  it('resolves the legacy demo path and preserves attribution', async () => {
    render(
      <MemoryRouter initialEntries={['/demo_nails?utm_source=founder']}>
        <Routes>
          <Route path="demo_nails" element={<CanonicalDemoRedirect />} />
          <Route path="demo-nails" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('/demo-nails?utm_source=founder')).toBeInTheDocument();
  });
});
