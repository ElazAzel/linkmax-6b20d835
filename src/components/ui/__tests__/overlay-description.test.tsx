import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Sheet, SheetContent, SheetTitle } from '../sheet';
import { Drawer, DrawerContent, DrawerTitle } from '../drawer';

const missingDescription = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.some((args) => String(args[0]).includes('Missing `Description`'));

describe('sheet and drawer without a description', () => {
  afterEach(() => vi.restoreAllMocks());

  it('Sheet does not trigger the Radix description warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Меню</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(missingDescription(warn)).toBe(false);
  });

  it('Drawer does not trigger the Radix description warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>Блок</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(missingDescription(warn)).toBe(false);
  });
});
