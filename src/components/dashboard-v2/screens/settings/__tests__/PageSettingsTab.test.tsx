import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';

import { PageSettingsTab } from '../PageSettingsTab';
import { generateWebhookSecret, getCountryOptions, getDnsRecord, isValidWebhookUrl } from '../page/helpers';

const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock('@/components/billing/PremiumFeatureGate', () => ({
  PremiumFeatureGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/form-fields/MediaUpload', () => ({
  MediaUpload: () => <div data-testid="media-upload" />,
}));
vi.mock('@/components/settings/NicheSelector', () => ({
  NicheSelector: () => <div data-testid="niche-selector" />,
}));

type Props = ComponentProps<typeof PageSettingsTab>;

function renderTab(overrides: Partial<Props> = {}) {
  const props: Props = {
    pageTitle: 'Айгерим',
    pageSlug: 'aigerim',
    displayName: 'Айгерим',
    isPremium: true,
    isPublished: true,
    onNicheChange: vi.fn(),
    onUpdateSlug: vi.fn().mockResolvedValue({ success: true }),
    onUpdateSeo: vi.fn(),
    onUpdateEntityFields: vi.fn(),
    onToggleIndexable: vi.fn(),
    ...overrides,
  };
  render(<PageSettingsTab {...props} />);
  return props;
}

const openSection = (id: string) => fireEvent.click(screen.getByTestId(`page-settings-section-${id}`));

describe('PageSettingsTab', () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastInfo.mockClear();
    toastError.mockClear();
  });

  it('groups settings into five sections', () => {
    renderTab();
    for (const id of ['address', 'profile', 'search', 'branding', 'integrations']) {
      expect(screen.getByTestId(`page-settings-section-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('page-settings-url')).toHaveTextContent('lnkmx.my/aigerim');
  });

  it('shows the search readiness score when it is provided', () => {
    renderTab({ qualityScore: 82 });
    openSection('search');
    expect(screen.getByTestId('seo-score-badge')).toHaveTextContent('82/100');
  });

  it('does not save or toast when an untouched field loses focus', () => {
    const props = renderTab({ seoTitle: 'Маникюр в Алматы' });
    openSection('search');
    fireEvent.blur(screen.getByLabelText('Заголовок для поиска'));
    expect(props.onUpdateSeo).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('shows saving in progress on a published page', () => {
    const props = renderTab({ isPublished: true });
    openSection('search');
    const title = screen.getByLabelText('Заголовок для поиска');
    fireEvent.change(title, { target: { value: 'Маникюр в Алматы' } });
    fireEvent.blur(title);
    expect(props.onUpdateSeo).toHaveBeenCalledWith({ title: 'Маникюр в Алматы', description: undefined });
    expect(toastInfo).toHaveBeenCalledWith('Сохраняем изменения', expect.objectContaining({ description: expect.any(String) }));
  });

  it('shows saving in progress while the page is not published', () => {
    renderTab({ isPublished: false });
    openSection('search');
    const title = screen.getByLabelText('Заголовок для поиска');
    fireEvent.change(title, { target: { value: 'Новый заголовок' } });
    fireEvent.blur(title);
    expect(toastInfo).toHaveBeenCalledWith('Сохраняем изменения');
  });

  it('asks for confirmation before changing the address of a published page', async () => {
    const props = renderTab({ isPublished: true });
    fireEvent.change(screen.getByTestId('page-slug-input'), { target: { value: 'aigerim-nails' } });
    fireEvent.click(screen.getByTestId('page-slug-save'));
    expect(props.onUpdateSlug).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByTestId('page-slug-confirm'));
    await waitFor(() => expect(props.onUpdateSlug).toHaveBeenCalledWith('aigerim-nails'));
  });

  it('changes the address of an unpublished page right away', async () => {
    const props = renderTab({ isPublished: false });
    fireEvent.change(screen.getByTestId('page-slug-input'), { target: { value: 'aigerim-nails' } });
    fireEvent.click(screen.getByTestId('page-slug-save'));
    await waitFor(() => expect(props.onUpdateSlug).toHaveBeenCalledWith('aigerim-nails'));
  });

  it('saves only the changed profile field and rejects a broken email', () => {
    const props = renderTab({ city: 'Алматы' });
    openSection('profile');

    const city = screen.getByLabelText('Город');
    fireEvent.change(city, { target: { value: 'Астана' } });
    fireEvent.blur(city);
    expect(props.onUpdateEntityFields).toHaveBeenCalledWith({ city: 'Астана' });

    const email = screen.getByLabelText('Email (необязательно)');
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.blur(email);
    expect(props.onUpdateEntityFields).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Проверьте адрес почты');
  });

  it('offers deletion only when the page can be deleted', () => {
    const onDeletePage = vi.fn();
    renderTab({ onDeletePage });
    fireEvent.click(screen.getByTestId('page-settings-delete'));
    expect(onDeletePage).toHaveBeenCalledTimes(1);
  });

  it('explains why the only page cannot be deleted', () => {
    renderTab({ onDeletePage: undefined });
    expect(screen.queryByTestId('page-settings-delete')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-settings-danger-zone')).toHaveTextContent('единственная страница');
  });
});

describe('page settings helpers', () => {
  it('suggests CNAME for a subdomain and ALIAS for a root domain', () => {
    expect(getDnsRecord('www.ivan.kz', 'lnkmx.my')).toEqual({ type: 'CNAME', name: 'www', value: 'lnkmx.my', isRoot: false });
    expect(getDnsRecord('ivan.kz', 'lnkmx.my')).toMatchObject({ type: 'ALIAS / ANAME', name: '@', isRoot: true });
    expect(getDnsRecord('ivan.com.kz', 'lnkmx.my')).toMatchObject({ type: 'ALIAS / ANAME', name: '@', isRoot: true });
    expect(getDnsRecord('www.ivan.co.uk', 'lnkmx.my')).toMatchObject({ type: 'CNAME', name: 'www', isRoot: false });
  });

  it('accepts only public https webhook addresses', () => {
    expect(isValidWebhookUrl('https://hooks.example.com/lead')).toBe(true);
    expect(isValidWebhookUrl('http://hooks.example.com/lead')).toBe(false);
    expect(isValidWebhookUrl('https://localhost/lead')).toBe(false);
    expect(isValidWebhookUrl('not a url')).toBe(false);
  });

  it('generates a 48-character hex secret', () => {
    expect(generateWebhookSecret()).toMatch(/^[0-9a-f]{48}$/);
  });

  it('names countries in the interface language', () => {
    const ru = getCountryOptions('ru').find((option) => option.value === 'KZ');
    const en = getCountryOptions('en').find((option) => option.value === 'KZ');
    expect(ru?.label).toContain('Казахстан');
    expect(en?.label).toContain('Kazakhstan');
  });
});
