import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { GridBlocksRenderer } from './GridBlocksRenderer';
import { GridEditor } from '@/components/editor/GridEditor';
import { BlockInspector } from '@/components/editor/inspector/BlockInspector';
import { RenderContextProvider } from '@/contexts/RenderContext';
import { getPageThemeScope } from '@/lib/appearance/style-utils';
import { Button } from '@/components/ui/button';
import type { Block, BlockSizePreset } from '@/types/page';

const initialBlocks: Block[] = [
  { id: 'sample-profile', type: 'profile', name: 'LinkMAX Studio', bio: 'Ideas, projects and ways to connect.', avatar: '/icon-192.png' },
  { id: 'sample-socials', type: 'socials', alignment: 'left', platforms: [
    { platform: 'telegram', url: 'https://example.com/telegram' },
    { platform: 'instagram', url: 'https://example.com/instagram' },
    { platform: 'youtube', url: 'https://example.com/youtube' },
  ] },
  ...([
    ['sample-m', 'M · 1×2', 'tall', '/og-experts.jpg'],
    ['sample-xs', 'XS · 1×1', 'small', '/og-gallery.jpg'],
    ['sample-xs2', 'XS · 1×1', 'small', '/og-pricing.jpg'],
    ['sample-s', 'S · 2×1', 'wide', '/og-image.png'],
    ['sample-l', 'L · 2×2', 'large', '/og-gallery.jpg'],
  ] as const).map(([id, label, blockSize, url]) => ({ id, type: 'image' as const, url, alt: label, caption: label, blockSize: blockSize as BlockSizePreset, scale: 'cover' as const })),
  { id: 'sample-form', type: 'form', title: 'Send a message', fields: [
    { name: 'Name', type: 'text', required: true },
    { name: 'Email', type: 'email', required: true },
    { name: 'Message', type: 'textarea', required: false },
  ], submitEmail: '', buttonText: 'Send', blockSize: 'small' },
  { id: 'sample-xl', type: 'image', url: '/og-image.png', alt: 'XL tile', caption: 'XL · 2×4', blockSize: 'xl', scale: 'contain' },
];

/** Local-only demonstration: no draft service, persistence, upload or publication. */
export function PageCompositionSample() {
  const isMobile = useIsMobile();
  const [blocks, setBlocks] = useState(initialBlocks);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { useEditorStore.getState().setEditorOpen(editing && Boolean(selectedId)); }, [editing, selectedId]);
  useEffect(() => () => useEditorStore.getState().setEditorOpen(false), []);
  const scope = getPageThemeScope({});
  const update = (id: string, updates: Partial<Block>) => setBlocks(previous => previous.map(block => block.id === id ? { ...block, ...updates } as Block : block));
  return (
    <div className="-mx-4 sm:mx-0 grid gap-4" data-page-composition-sample>
      <div className="px-4 sm:px-0 flex flex-wrap gap-2">
        <Button variant={editing ? 'outline' : 'default'} onClick={() => setEditing(false)}>Preview</Button>
        <Button variant={editing ? 'default' : 'outline'} onClick={() => setEditing(true)}>Edit sample</Button>
        <Button variant="ghost" onClick={() => { setBlocks(initialBlocks); setSelectedId(null); }}>Reset sample</Button>
      </div>
      <RenderContextProvider value={editing ? 'editor' : 'public-preview'}>
        <div className={editing && !isMobile ? 'grid min-w-0 items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)]' : 'min-w-0'}>
        <div className={`${scope.className} bg-background text-foreground`} style={scope.style}>
          {editing ? (
            <GridEditor blocks={blocks} isPremium onInsertBlock={() => {}} onEditBlock={block => setSelectedId(block.id)} onDeleteBlock={id => setBlocks(previous => previous.filter(block => block.id !== id))} onUpdateBlock={update} onReorderBlocks={setBlocks} />
          ) : (
            <div className="lm-page-width py-4"><GridBlocksRenderer blocks={blocks} isPreview isOwnerPremium animation="none" /></div>
          )}
        </div>
        {editing && <BlockInspector mode={isMobile ? 'sheet' : 'docked'} block={blocks.find(block => block.id === selectedId) ?? null} onUpdateBlock={update} onClose={() => setSelectedId(null)} />}
        </div>
      </RenderContextProvider>
      <div className={`${scope.className} bg-background text-foreground`} style={scope.style}>
        <div className="lm-page-width py-4">
          <GridBlocksRenderer isPreview animation="none" blocks={[
            { id: 'sample-authored', type: 'text', content: 'An authored card keeps its own colors, spacing and shape.', blockStyle: { backgroundColor: '#192e45', textColor: '#f9f4dd', borderRadius: 'sm', padding: 'lg', shadow: 'none' } },
          ]} />
        </div>
      </div>
    </div>
  );
}
