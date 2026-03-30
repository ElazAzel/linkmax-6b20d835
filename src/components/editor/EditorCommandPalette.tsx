/**
 * EditorCommandPalette - Cmd+K command interface for the editor
 */
import { memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useEditorStore } from '@/store/useEditorStore';
import {
  buildEditorCommands,
  filterCommands,
  type EditorContext,
  type EditorCommand,
} from '@/lib/editor/editor-commands';
import { trackEditorAction } from '@/lib/editor/editor-analytics';

interface EditorCommandPaletteProps {
  context: EditorContext;
}

const GROUP_LABEL_KEYS: Record<string, { key: string; fallback: string }> = {
  action: { key: 'commands.groupActions', fallback: 'Действия' },
  edit: { key: 'commands.groupEdit', fallback: 'Редактировать блок' },
  insert: { key: 'commands.groupInsert', fallback: 'Добавить блок' },
  preset: { key: 'commands.groupPreset', fallback: 'Быстрые пресеты' },
  navigate: { key: 'commands.groupNavigate', fallback: 'Навигация' },
};

export const EditorCommandPalette = memo(function EditorCommandPalette({
  context,
}: EditorCommandPaletteProps) {
  const { t } = useTranslation();
  const { commandPaletteOpen, setCommandPaletteOpen } = useEditorStore();
  const [search, setSearch] = useState('');

  const allCommands = useMemo(() => buildEditorCommands(), []);

  const filtered = useMemo(
    () => filterCommands(allCommands, search, context),
    [allCommands, search, context]
  );

  // Group commands
  const grouped = useMemo(() => {
    const groups: Record<string, EditorCommand[]> = {};
    for (const cmd of filtered) {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [filtered]);

  const handleSelect = useCallback(
    (commandId: string) => {
      const cmd = allCommands.find((c) => c.id === commandId);
      if (!cmd || !cmd.isAvailable(context)) return;
      trackEditorAction('command_executed', { commandId, source: 'palette' });
      cmd.execute(context);
      setSearch('');
    },
    [allCommands, context]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setCommandPaletteOpen(open);
      if (open) {
        trackEditorAction('command_palette_opened');
      }
      if (!open) setSearch('');
    },
    [setCommandPaletteOpen]
  );

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder={t('commands.searchPlaceholder', 'Search commands, blocks, presets...')}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {t('commands.noResults', 'No matching commands')}
        </CommandEmpty>

        {(['action', 'edit', 'navigate', 'preset', 'insert'] as const).map((group) => {
          const cmds = grouped[group];
          if (!cmds?.length) return null;
          return (
            <CommandGroup key={group} heading={t(GROUP_LABEL_KEYS[group]?.key, GROUP_LABEL_KEYS[group]?.fallback)}>
              {cmds.map((cmd) => {
                const available = cmd.isAvailable(context);
                return (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleSelect(cmd.id)}
                    disabled={!available}
                    className="flex items-center justify-between"
                  >
                    <span className={!available ? 'opacity-40' : ''}>
                      {t(cmd.labelKey, cmd.label)}
                    </span>
                    {cmd.shortcut && (
                      <Badge variant="outline" className="ml-2 text-xs font-mono">
                        {cmd.shortcut}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
});
