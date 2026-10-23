import { BLOCK_SIZES, catalogEntry, type BlockSize } from "./block-catalog";
import type { DraftSnapshot } from "./draft";

/**
 * Pure edit operations on a draft snapshot. They never touch the network, so
 * the same rules are unit-tested and applied atomically before one save.
 */
export type PageOperation =
  | { op: "set_page"; fields: PageFields }
  | { op: "add_block"; block: Record<string, unknown>; size?: BlockSize; after_block_id?: string; position?: number }
  | { op: "update_block"; block_id: string; changes: Record<string, unknown>; size?: BlockSize }
  | { op: "remove_block"; block_id: string }
  | { op: "move_block"; block_id: string; position: number };

export interface PageFields {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  is_indexable?: boolean;
  city?: string | null;
  profession?: string | null;
  niche?: string | null;
  favicon_url?: string | null;
}

interface OpsResult {
  snapshot: DraftSnapshot;
  changes: string[];
  warnings: string[];
}

export class OperationError extends Error {
  constructor(public readonly index: number, message: string) {
    super(`Operation ${index + 1}: ${message}`);
    this.name = "OperationError";
  }
}

const LOCKED_KEYS = new Set(["id", "type"]);
const URL_KEYS = new Set(["url", "link", "buyLink", "avatar", "coverImage", "image", "imageUrl"]);
const SAFE_URL = /^(https?:\/\/|mailto:|tel:)/i;

function shortId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  const raw = cryptoApi?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return raw.replace(/-/g, "").slice(0, 10);
}

/** Items in lists (FAQ, prices, tiles, catalog) need ids for the editor and React keys. */
function withItemIds(block: Record<string, unknown>): Record<string, unknown> {
  const items = block.items;
  if (!Array.isArray(items)) return block;
  return {
    ...block,
    items: items.map((item, i) =>
      item && typeof item === "object" && !Array.isArray(item) && !(item as { id?: unknown }).id
        ? { ...(item as Record<string, unknown>), id: `${String(block.id)}-${i + 1}` }
        : item,
    ),
  };
}

function urlWarnings(block: Record<string, unknown>, label: string): string[] {
  const warnings: string[] = [];
  for (const [key, value] of Object.entries(block)) {
    if (URL_KEYS.has(key) && typeof value === "string" && value && !SAFE_URL.test(value)) {
      warnings.push(`${label}: "${key}" should start with https://, tel: or mailto: (got "${value.slice(0, 60)}").`);
    }
  }
  return warnings;
}

function indexOfBlock(blocks: DraftSnapshot["blocks"], id: string, opIndex: number): number {
  const index = blocks.findIndex((b) => b.id === id);
  if (index < 0) throw new OperationError(opIndex, `block "${id}" is not on this page. Call get_page for current block ids.`);
  return index;
}

function clampPosition(position: number, length: number): number {
  return Math.max(0, Math.min(Math.trunc(position), length));
}

export function applyOperations(snapshot: DraftSnapshot, operations: PageOperation[]): OpsResult {
  const next: DraftSnapshot = { ...snapshot, blocks: snapshot.blocks.map((b) => ({ ...b })) };
  const changes: string[] = [];
  const warnings: string[] = [];

  operations.forEach((operation, i) => {
    switch (operation.op) {
      case "set_page": {
        const f = operation.fields;
        const seo = { ...(next.seo ?? {}) } as Record<string, unknown>;
        if (f.seo_title !== undefined) seo.title = f.seo_title ?? "";
        if (f.seo_description !== undefined) seo.description = f.seo_description ?? "";
        if (f.seo_image !== undefined) seo.image = f.seo_image ?? "";
        if ("seo_title" in f || "seo_description" in f || "seo_image" in f) next.seo = seo;
        if (f.is_indexable !== undefined) next.isIndexable = f.is_indexable;
        for (const key of ["city", "profession", "niche", "favicon_url"] as const) {
          if (f[key] !== undefined) next[key] = f[key];
        }
        if (f.seo_image && !SAFE_URL.test(f.seo_image)) warnings.push("set_page: seo_image should be an https:// image URL.");
        changes.push(`page settings: ${Object.keys(f).join(", ") || "nothing"}`);
        break;
      }
      case "add_block": {
        const type = String(operation.block.type ?? "");
        const entry = catalogEntry(type);
        if (!entry) {
          throw new OperationError(i, `block type "${type}" cannot be created from MCP. Call get_block_catalog for the allowed types.`);
        }
        if (type === "profile" && next.blocks.some((b) => b.type === "profile")) {
          throw new OperationError(i, "the page already has a profile block; change it with update_block.");
        }
        const missing = entry.required.filter((key) => {
          const value = operation.block[key];
          return value == null || value === "" || (Array.isArray(value) && value.length === 0);
        });
        if (missing.length) throw new OperationError(i, `${type} needs ${missing.join(", ")}.`);
        const size = operation.size ?? entry.default_size;
        if (!BLOCK_SIZES.includes(size)) throw new OperationError(i, `size must be one of ${BLOCK_SIZES.join(", ")}.`);
        const id = `${type}-${shortId()}`;
        const block = withItemIds({ ...operation.block, id, type, blockSize: size });
        let at = next.blocks.length;
        if (type === "profile") at = 0;
        else if (operation.after_block_id) at = indexOfBlock(next.blocks, operation.after_block_id, i) + 1;
        else if (operation.position !== undefined) at = clampPosition(operation.position, next.blocks.length);
        next.blocks.splice(at, 0, block);
        warnings.push(...urlWarnings(block, `${type} ${id}`));
        changes.push(`added ${type} ${id} at position ${at}`);
        break;
      }
      case "update_block": {
        const index = indexOfBlock(next.blocks, operation.block_id, i);
        const current = next.blocks[index];
        const locked = Object.keys(operation.changes).filter((key) => LOCKED_KEYS.has(key));
        if (locked.length) throw new OperationError(i, `${locked.join(", ")} cannot change; remove the block and add a new one instead.`);
        const updated: Record<string, unknown> = { ...current };
        for (const [key, value] of Object.entries(operation.changes)) {
          if (value === null) delete updated[key];
          else updated[key] = value;
        }
        if (operation.size) {
          if (!BLOCK_SIZES.includes(operation.size)) throw new OperationError(i, `size must be one of ${BLOCK_SIZES.join(", ")}.`);
          updated.blockSize = operation.size;
        }
        next.blocks[index] = withItemIds(updated);
        warnings.push(...urlWarnings(operation.changes, `${String(current.type)} ${operation.block_id}`));
        changes.push(`updated ${String(current.type)} ${operation.block_id}: ${[...Object.keys(operation.changes), ...(operation.size ? ["size"] : [])].join(", ")}`);
        break;
      }
      case "remove_block": {
        const index = indexOfBlock(next.blocks, operation.block_id, i);
        if (next.blocks[index].type === "profile") {
          throw new OperationError(i, "the profile block cannot be removed: a page cannot be published without it.");
        }
        const [removed] = next.blocks.splice(index, 1);
        changes.push(`removed ${String(removed.type)} ${operation.block_id}`);
        break;
      }
      case "move_block": {
        const index = indexOfBlock(next.blocks, operation.block_id, i);
        const [block] = next.blocks.splice(index, 1);
        const at = block.type === "profile" ? 0 : Math.max(clampPosition(operation.position, next.blocks.length), next.blocks[0]?.type === "profile" ? 1 : 0);
        next.blocks.splice(at, 0, block);
        changes.push(`moved ${String(block.type)} ${operation.block_id} to position ${at}`);
        break;
      }
    }
  });

  return { snapshot: next, changes, warnings };
}
