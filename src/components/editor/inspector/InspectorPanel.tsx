import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'lucide-react/dist/esm/icons/image';
import Type from 'lucide-react/dist/esm/icons/type';
import ALargeSmall from 'lucide-react/dist/esm/icons/a-large-small';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Link from 'lucide-react/dist/esm/icons/link';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { localizeValidationMessage } from '@/lib/blocks/validation-messages';
import { validateUrl } from '@/lib/blocks/block-validators';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { ImagePlacementControls } from '@/components/block-editors/ImagePlacementControls';
import { BlockSizeSelector } from '@/components/block-editors/BlockEditorShell';
import { BlockStyleEditor } from '@/components/editor/BlockStyleEditor';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { getBlockEditingConfig } from '@/lib/blocks/block-editing';
import type { Block } from '@/types/page';
import type { BlockFontFamily } from '@/types/blocks/base';

type Tool = 'image' | 'text' | 'font' | 'appearance' | 'action' | 'content';
interface Props {
  block: Block;
  title: string;
  icon: ReactNode;
  editorBody: ReactNode;
  onChange: (patch: Partial<Block>) => void;
  onClose: () => void;
  onDelete?: () => void;
  footer: ReactNode;
}

/** One inspector for pages of every age. Existing specialised fields stay in Advanced. */
export function InspectorPanel({ block, title, icon, editorBody, onChange, onClose, onDelete, footer }: Props) {
  const { t } = useTranslation();
  const quick = ['image', 'link', 'button', 'text'].includes(block.type);
  const tools: Tool[] = block.type === 'image' ? ['image', 'text', 'font', 'appearance', 'action']
    : quick ? ['text', 'font', 'appearance', ...(block.type === 'text' ? [] : ['action' as const])]
    : block.type === 'profile' ? ['content'] : ['content', 'font', 'appearance'];
  const [tool, setTool] = useState<Tool>(tools[0]);
  const [advanced, setAdvanced] = useState(false);
  const [touched, setTouched] = useState(false);
  const change = (patch: Partial<Block>) => { setTouched(true); onChange(patch); };
  const active = tools.includes(tool) ? tool : tools[0];
  const labels = {
    image: t('editor.inspector.tools.image'), text: t('editor.inspector.tools.text'),
    font: t('editor.inspector.tools.font'), appearance: t('editor.inspector.tools.appearance'),
    action: t('editor.inspector.tools.action'), content: t('editor.tabs.content'),
  };
  const icons = { image: Image, text: Type, font: ALargeSmall, appearance: Palette, action: Link, content: Type };
  const data = block as unknown as Record<string, unknown>;
  const textField = block.type === 'image' ? 'caption' : block.type === 'text' ? 'content' : 'title';
  const actionField = block.type === 'image' ? 'link' : 'url';
  const validationError = touched && quick ? (getBlockEditingConfig(block.type).validate(block)
    || (block.type === 'image' && data.link ? validateUrl(data.link) : null)) : null;
  const advancedLabel = t('blockEditor.advancedSettings');
  const fieldLabel = block.type === 'image' ? t('fields.caption') : block.type === 'text' ? t('blockTypes.text') : t('fields.title');

  const panel = (current: Tool): ReactNode => {
    switch (current) {
      case 'image': return <div className="space-y-4">
        <MediaUpload label="" value={String(data.url ?? '')} onChange={url => change({ url } as Partial<Block>)} accept="image/*" allowGif />
        <MultilingualInput label={t('fields.altText')}
          value={migrateToMultilingual(data.alt as Parameters<typeof migrateToMultilingual>[0])}
          onChange={alt => change({ alt } as Partial<Block>)} />
        <details className="rounded-control border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">{t('imagePlacement.title')}</summary>
          <div className="pt-4"><ImagePlacementControls value={block.type === 'image' ? block.imagePlacement : undefined} onChange={imagePlacement => change({ imagePlacement } as Partial<Block>)} /></div>
        </details>
      </div>;
      case 'text': return <MultilingualInput label={fieldLabel}
        value={migrateToMultilingual(data[textField] as Parameters<typeof migrateToMultilingual>[0])}
        onChange={value => change({ [textField]: value } as Partial<Block>)}
        type={block.type === 'image' || block.type === 'text' ? 'textarea' : 'input'} />;
      case 'font': return <div className="space-y-3">
        <Label htmlFor={`inspector-font-${block.id}`}>{labels.font}</Label>
        <Select value={block.blockStyle?.fontFamily || 'sans'} onValueChange={(fontFamily: string) => change({ blockStyle: { ...block.blockStyle, fontFamily: fontFamily as BlockFontFamily } } as Partial<Block>)}>
          <SelectTrigger id={`inspector-font-${block.id}`} aria-label={labels.font}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sans">Inter</SelectItem><SelectItem value="serif">Georgia</SelectItem>
            <SelectItem value="mono">Mono</SelectItem><SelectItem value="display">Display</SelectItem><SelectItem value="rounded">Rounded</SelectItem>
          </SelectContent>
        </Select>
      </div>;
      case 'appearance': return <BlockStyleEditor formData={block} onChange={change} />;
      case 'action': return <div className="space-y-3">
        <Label htmlFor={`inspector-link-${block.id}`}>{labels.action}</Label>
        <Input id={`inspector-link-${block.id}`} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off"
          value={String(data[actionField] ?? '')} placeholder="https://example.com"
          onChange={event => change({ [actionField]: event.target.value } as Partial<Block>)} />
      </div>;
      default: return editorBody;
    }
  };

  return <div className="flex h-full min-h-0 flex-col bg-card text-card-foreground">
    <div className="shrink-0 border-b border-border">
      <div className="flex items-center gap-2 px-3 py-2">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('editor.inspector.close')} className="h-11 w-11 shrink-0 rounded-full"><ChevronDown className="h-5 w-5" /></Button>
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent sm:flex">{icon}</span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
        {quick && <Button variant="ghost" size="icon" onClick={() => setAdvanced(value => !value)} aria-label={advancedLabel} aria-pressed={advanced} title={advancedLabel} className="h-11 w-11 shrink-0 rounded-full"><MoreHorizontal className="h-5 w-5" /></Button>}
        {onDelete && <Button variant="ghost" onClick={onDelete} className="h-11 shrink-0 gap-1.5 rounded-full px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" />{t('common.delete')}</Button>}
      </div>
      {getBlockEditingConfig(block.type).allowedSizes.length > 1 && <div className="flex justify-center px-3 pb-2"><BlockSizeSelector block={block} onBlockUpdate={change} /></div>}
    </div>
    {advanced ? <section aria-label={advancedLabel} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{editorBody}</section>
      : <Tabs value={active} onValueChange={value => setTool(value as Tool)} className="flex min-h-0 flex-1 flex-col">
        <TabsList aria-label={t('editor.inspector.toolsLabel')} className="w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-none border-x-0 border-t-0 bg-card p-2">
          {tools.map(item => { const Icon = icons[item]; return <TabsTrigger key={item} value={item} className="h-14 min-w-12 flex-1 flex-col gap-1 rounded-xl px-1 text-[10px] data-[state=active]:bg-accent data-[state=active]:text-primary"><Icon className="h-5 w-5" /><span>{labels[item]}</span></TabsTrigger>; })}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
          {tools.map(item => <TabsContent key={item} value={item} className="mt-4 outline-none">{panel(item)}</TabsContent>)}
          {validationError && <Alert role="status" className="mt-3 rounded-xl border-amber-500/30 bg-amber-500/10 text-foreground"><AlertDescription>{localizeValidationMessage(validationError, t)}</AlertDescription></Alert>}
        </div>
      </Tabs>}
    <div className="shrink-0 border-t border-border bg-card px-4 py-3">{footer}</div>
  </div>;
}
