import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { CanonicalDemoRedirect } from '../CanonicalDemoRedirect';

function CurrentLocation() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}`}</div>;
}

describe('CanonicalDemoRedirect', () => {
  it('resolves the legacy demo path and preserves attribution', () => {
    render(
      <MemoryRouter initialEntries={['/demo_nails?utm_source=founder']}>
        <Routes>
          <Route path="demo_nails" element={<CanonicalDemoRedirect />} />
          <Route path="demo-nails" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('/demo-nails?utm_source=founder')).toBeInTheDocument();
  });
});
