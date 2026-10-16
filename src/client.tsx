import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start/client';
import { i18nReady } from '@/i18n/config';

// Same as TanStack Start's default client entry, but hydration waits for the
// locale chunk. The root beforeLoad awaits it too, yet routes that never run
// it on the client (not-found, error boundaries) would otherwise hydrate with
// an empty store, render the English fallbacks and fail with React #418.
function hydrate() {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    );
  });
}

i18nReady.then(hydrate, hydrate);
