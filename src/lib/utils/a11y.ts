import type { KeyboardEvent } from 'react';

export function handleKeyboardActivation(
  event: KeyboardEvent<HTMLElement>,
  onActivate: () => void
) {
  if (event.currentTarget !== event.target) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();
  onActivate();
}
