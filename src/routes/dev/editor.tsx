import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import NotFound from "@/pages/NotFound";
import { EditorScreen } from "@/components/dashboard-v2/screens/EditorScreen";
import { fetchPublicPageSnapshot } from "@/lib/seo/public-page-snapshot";
import { createBlock } from "@/lib/blocks/block-factory";
import { createDefaultPageData } from "@/lib/constants";
import { createTemplateBlock, HARDCODED_TEMPLATES } from "@/data/templates";
import { templateBlocksForFeatures } from "@/lib/blocks/template-features";
import { useBusinessFeatures } from "@/lib/features";
import { useEditorStore } from "@/store/useEditorStore";
import type { Block, PageData } from "@/types/page";

/**
 * Dev-only editor playground: the real EditorScreen on an in-memory copy of a
 * published page (?slug=...) or a built-in template (?template=barber), so the editor can be checked in a browser
 * without signing in. Nothing is saved. Production builds render 404.
 */
export const Route = createFileRoute("/dev/editor")({
  ssr: false,
  head: () => ({ meta: [{ title: "Editor playground" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: import.meta.env.DEV ? EditorPlayground : NotFound,
});

function EditorPlayground() {
  const businessEnabled = useBusinessFeatures();
  const [page, setPage] = useState<PageData | null>(null);
  const setEditingBlock = useEditorStore((s) => s.setEditingBlock);
  const setEditorOpen = useEditorStore((s) => s.setEditorOpen);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const template = HARDCODED_TEMPLATES.find((t) => t.id === params.get("template"));
    if (template) {
      // Offline fixture: a full page from a built-in template, no network.
      const blocks = templateBlocksForFeatures(template.blocks, businessEnabled)
        .map((b) => createTemplateBlock(b.type, b.overrides));
      const initial = createDefaultPageData("playground");
      setPage({ ...initial, blocks, theme: { ...initial.theme, ...template.theme } });
      return;
    }
    const slug = params.get("slug") || "elazart";
    void fetchPublicPageSnapshot(slug).then((snapshot) => {
      setPage(snapshot.status === "ok" ? snapshot.page : createDefaultPageData("playground"));
    });
  }, [businessEnabled]);

  const updateBlocks = useCallback((fn: (blocks: Block[]) => Block[]) => {
    setPage((prev) => (prev ? { ...prev, blocks: fn(prev.blocks) } : prev));
  }, []);

  const editBlock = useCallback((block: Block) => {
    setEditingBlock(block);
    setEditorOpen(true);
  }, [setEditingBlock, setEditorOpen]);

  const insertBlock = useCallback((type: string, position: number) => {
    const block = createBlock(type);
    updateBlocks((blocks) => [...blocks.slice(0, position), block, ...blocks.slice(position)]);
    editBlock(block);
    return { success: true, blockId: block.id };
  }, [editBlock, updateBlocks]);

  return (
    <EditorScreen
      pageData={page}
      loading={!page}
      isPremium
      onInsertBlock={insertBlock}
      onEditBlock={editBlock}
      onDeleteBlock={(id) => updateBlocks((blocks) => blocks.filter((b) => b.id !== id))}
      onDeleteBlocks={(ids) => updateBlocks((blocks) => blocks.filter((b) => !ids.includes(b.id)))}
      onUpdateBlock={(id, updates) => updateBlocks((blocks) => blocks.map((b) => (b.id === id ? ({ ...b, ...updates } as Block) : b)))}
      onReorderBlocks={(blocks) => updateBlocks(() => blocks)}
      onDuplicateBlock={(id) => updateBlocks((blocks) => blocks.flatMap((b) => (b.id === id ? [b, { ...b, id: `${b.id}-copy-${Date.now()}` }] : [b])))}
      onPreview={() => undefined}
      onShare={() => undefined}
      onOpenTemplates={() => undefined}
      onOpenAI={() => undefined}
      onOpenTheme={() => undefined}
      onApplyTheme={(theme) => setPage((prev) => (prev ? { ...prev, theme: { ...prev.theme, ...theme } } : prev))}
    />
  );
}
