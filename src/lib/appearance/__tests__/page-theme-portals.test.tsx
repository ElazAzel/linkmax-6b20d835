import { afterAll, beforeAll, afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PageThemeProvider } from '../page-theme-provider';
import { getPageThemeScope } from '../style-utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const originalResizeObserver = globalThis.ResizeObserver;
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => { globalThis.ResizeObserver = originalResizeObserver; });
afterEach(cleanup);
const scope = getPageThemeScope({ accentColor: '#ff0000', textColor: '#eeeeee', backgroundColor: '#101010', buttonStyle: 'pill', fontPair: 'inter-inter' });

function expectTheme(element: HTMLElement) {
  for (const className of ['lm-page', 'lm-typography', 'dark']) expect(element.classList.contains(className)).toBe(true);
  expect(element.style.getPropertyValue('--primary')).toBe('0 100% 50%');
  expect(element.style.getPropertyValue('--radius-control')).toBe('9999px');
  expect(element.style.getPropertyValue('--lm-body-font')).toBeTruthy();
  expect(element.style.getPropertyValue('--popover-foreground')).toBe(scope.style['--popover-foreground' as keyof typeof scope.style]);
}

describe('public page portal themes', () => {
  it('carries the page theme through a dialog and nested dropdown portals', () => {
    render(<PageThemeProvider scope={scope}><Dialog open><DialogContent><DialogTitle>Registration</DialogTitle>
      <DropdownMenu open modal={false}><DropdownMenuTrigger>Calendar</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Google</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </DialogContent></Dialog></PageThemeProvider>);
    expectTheme(screen.getByRole('dialog'));
    expectTheme(screen.getByRole('menu'));
  });

  it('carries the page theme to a select portal', () => {
    render(<PageThemeProvider scope={scope}><Select open><SelectTrigger aria-label="Choice" /><SelectContent><SelectItem value="one">One</SelectItem></SelectContent></Select></PageThemeProvider>);
    expectTheme(screen.getByRole('listbox'));
  });

  it('keeps cabinet dialog styles outside the page provider', () => {
    render(<Dialog open><DialogContent style={{ maxWidth: 420 }}><DialogTitle>Cabinet</DialogTitle></DialogContent></Dialog>);
    const dialog = screen.getByRole('dialog');
    expect(dialog.classList.contains('lm-page')).toBe(false);
    expect(dialog.style.getPropertyValue('--primary')).toBe('');
    expect(dialog.style.maxWidth).toBe('420px');
  });
});
