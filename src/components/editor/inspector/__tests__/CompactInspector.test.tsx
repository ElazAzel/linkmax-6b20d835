import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlockInspector } from '@/components/editor/inspector/BlockInspector';
import type { Block } from '@/types/page';

vi.mock('@/hooks/user/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('react-i18next', async () => {
  const { default: ru } = await import('@/i18n/locales/ru.json');
  const read = (root: unknown, key: string): unknown => key.split('.').reduce<unknown>((value, part) =>
    value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined, root);
  return { useTranslation: () => ({ i18n: { language: 'ru' }, t: (key: string, fallback?: string) => {
    const value = read(ru, key);
    return typeof value === 'string' ? value : fallback ?? key;
  } }) };
});

const legacyImage = {
  id: 'old-image', type: 'image', url: 'https://example.com/old.jpg',
  link: 'https://example.com/project', blockSize: 'full', style: 'banner', scale: 'contain',
  caption: { ru: 'Старый текст', en: 'Original caption' },
} as unknown as Block;

describe('compact tools for existing and newly created pages', () => {
  it('opens an old image in the same focused photo tool without rewriting its data', async () => {
    const update = vi.fn();
    render(<BlockInspector mode="docked" block={legacyImage} onUpdateBlock={update} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Фото' })).toHaveAttribute('aria-selected', 'true');
    // A legacy full-size image shows at its own aspect ratio now.
    expect(screen.getByRole('button', { name: /По размеру фото/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /\(2×1\)/ })).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByDisplayValue('https://example.com/old.jpg')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('edits legacy text while preserving translations, image fitting and link', async () => {
    const update = vi.fn();
    render(<BlockInspector mode="docked" block={legacyImage} onUpdateBlock={update} onClose={vi.fn()} />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Текст' }), { button: 0, ctrlKey: false });
    fireEvent.change(await screen.findByDisplayValue('Старый текст'), { target: { value: 'Новый текст' } });
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(update).toHaveBeenLastCalledWith('old-image', expect.objectContaining({
      caption: { ru: 'Новый текст', en: 'Original caption' },
      link: 'https://example.com/project', scale: 'contain', style: 'banner',
    }));
  });

  it('preserves other image description translations when editing the current language', () => {
    const update = vi.fn();
    render(<BlockInspector mode="docked" block={{ ...legacyImage, alt: { ru: 'Описание', en: 'Original description' } } as Block}
      onUpdateBlock={update} onClose={vi.fn()} />);
    fireEvent.change(screen.getByDisplayValue('Описание'), { target: { value: 'Новое описание' } });
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(update).toHaveBeenLastCalledWith('old-image', expect.objectContaining({
      alt: { ru: 'Новое описание', en: 'Original description' }, link: 'https://example.com/project',
    }));
  });

  it('offers the same tools to a new image without a saved size or style', () => {
    render(<BlockInspector mode="docked" block={{ id: 'new-image', type: 'image', url: '' } as Block} onUpdateBlock={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('tablist', { name: 'Инструменты блока' })).toBeInTheDocument();
    expect(within(screen.getByRole('tablist', { name: 'Инструменты блока' })).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Фото', 'Текст', 'Вид', 'Шрифт']);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Шрифт' }), { button: 0, ctrlKey: false });
    expect(screen.getByRole('combobox', { name: 'Шрифт' })).toBeInTheDocument();
  });

  it('adds a block right below the edited one and closes the settings', () => {
    const addBelow = vi.fn(); const close = vi.fn();
    render(<BlockInspector mode="sheet" block={legacyImage} onUpdateBlock={vi.fn()} onClose={close} onAddBelow={addBelow} />);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить блок ниже' }));
    expect(close).toHaveBeenCalledOnce();
    expect(addBelow).toHaveBeenCalledExactlyOnceWith('old-image');
  });

  it('shows localized validation after editing an invalid URL and clears it when corrected', () => {
    render(<BlockInspector mode="docked"
      block={{ id: 'validation-button', type: 'button', title: { ru: 'Записаться' }, url: 'https://example.com' } as Block}
      onUpdateBlock={vi.fn()} onClose={vi.fn()} />);
    // Title and URL share the first tab.
    expect(screen.getByRole('tab', { name: 'Содержание' })).toHaveAttribute('aria-selected', 'true');
    const input = screen.getByRole('textbox', { name: 'Ссылка' });
    fireEvent.change(input, { target: { value: 'not-a-url' } });
    expect(screen.getByRole('status')).toHaveTextContent('нужна ссылка, начиная с https://');
    fireEvent.change(input, { target: { value: 'https://example.com/new' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps specialised existing fields reachable through advanced tools', async () => {
    render(<BlockInspector mode="docked" block={legacyImage} onUpdateBlock={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дополнительные настройки' }));
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(screen.getByRole('button', { name: 'Кадрирование и положение' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Стиль и SEO' })).toBeInTheDocument();
  });

  it('shows a readable delete action and only deletes after explicit confirmation', () => {
    const remove = vi.fn(); const close = vi.fn();
    render(<BlockInspector mode="sheet" block={legacyImage} onUpdateBlock={vi.fn()} onDeleteBlock={remove} onClose={close} />);
    const button = screen.getByRole('button', { name: 'Удалить' });
    expect(button).toHaveTextContent('Удалить');
    fireEvent.click(button);
    expect(screen.getByRole('alertdialog', { name: 'Удалить блок?' })).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Удалить' }));
    expect(remove).toHaveBeenCalledExactlyOnceWith('old-image');
    expect(close).toHaveBeenCalledOnce();
  });

  it('flushes the current edit with Ctrl/Cmd+S without opening browser save or closing settings', () => {
    const update = vi.fn(); const close = vi.fn();
    render(<BlockInspector mode="docked"
      block={{ id: 'keyboard-button', type: 'button', title: { ru: 'Записаться' }, url: 'https://example.com' } as Block}
      onUpdateBlock={update} onClose={close} />);
    const input = screen.getByDisplayValue('Записаться');
    for (const modifier of ['ctrlKey', 'metaKey']) {
      fireEvent.change(input, { target: { value: modifier } });
      expect(fireEvent.keyDown(input, { key: 's', [modifier]: true })).toBe(false);
      expect(update).toHaveBeenLastCalledWith('keyboard-button', expect.objectContaining({ title: { ru: modifier } }));
    }
    expect(close).not.toHaveBeenCalled();
  });

  it('does not flush a pending edit after the block has been deleted', () => {
    vi.useFakeTimers();
    const update = vi.fn();
    const { unmount } = render(<BlockInspector mode="docked"
      block={{ id: 'old-button', type: 'button', title: { ru: 'Записаться' }, url: 'https://example.com' } as Block}
      onUpdateBlock={update} onDeleteBlock={vi.fn()} onClose={vi.fn()} />);
    try {
      fireEvent.change(screen.getByDisplayValue('Записаться'), { target: { value: 'Запись' } });
      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Удалить' }));
      unmount();
      expect(update).not.toHaveBeenCalled();
    } finally { unmount(); vi.useRealTimers(); }
  });
});
