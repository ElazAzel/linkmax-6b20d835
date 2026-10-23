import { translatablePaths } from "./block-catalog";
import type { DraftSnapshot } from "./draft";
import { isLocalizedText, isMcpLanguage } from "./languages";

/**
 * The server does not translate. It lists what is missing in which language,
 * the agent (an LLM) writes the translations, and apply_translations stores
 * them as {ru, en, kk, ...} objects the public page already renders.
 */
interface TranslationGap {
  block_id: string;
  block_type: string;
  path: string;
  source: string;
  missing: string[];
}

interface TranslationEntry {
  block_id: string;
  path: string;
  language: string;
  text: string;
}

type Container = Record<string, unknown>;

/** Expands "items[].question" into concrete paths like "items[2].question". */
function expandPath(block: Container, path: string): string[] {
  const parts = path.split(".");
  let current: Array<{ value: unknown; path: string }> = [{ value: block, path: "" }];
  for (const part of parts) {
    const isList = part.endsWith("[]");
    const key = isList ? part.slice(0, -2) : part;
    const next: Array<{ value: unknown; path: string }> = [];
    for (const { value, path: prefix } of current) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const child = (value as Container)[key];
      const childPath = prefix ? `${prefix}.${key}` : key;
      if (isList) {
        if (Array.isArray(child)) child.forEach((item, i) => next.push({ value: item, path: `${childPath}[${i}]` }));
      } else {
        next.push({ value: child, path: childPath });
      }
    }
    current = next;
  }
  return current.map((entry) => entry.path);
}

const SEGMENT = /^([A-Za-z_][\w]*)(?:\[(\d+)\])?$/;

function parse(path: string): Array<{ key: string; index?: number }> {
  return path.split(".").map((segment) => {
    const match = SEGMENT.exec(segment);
    if (!match) throw new Error(`invalid path segment "${segment}"`);
    return { key: match[1], index: match[2] === undefined ? undefined : Number(match[2]) };
  });
}

function readPath(root: Container, path: string): unknown {
  let value: unknown = root;
  for (const { key, index } of parse(path)) {
    if (!value || typeof value !== "object") return undefined;
    value = (value as Container)[key];
    if (index !== undefined) value = Array.isArray(value) ? value[index] : undefined;
  }
  return value;
}

/** Returns a copy of root with the value at path replaced; containers on the way are copied too. */
function writePath(root: Container, path: string, value: unknown): Container {
  const segments = parse(path);
  const write = (node: unknown, depth: number): unknown => {
    const { key, index } = segments[depth];
    const copy: Container = { ...((node && typeof node === "object" && !Array.isArray(node)) ? (node as Container) : {}) };
    const last = depth === segments.length - 1;
    if (index === undefined) {
      copy[key] = last ? value : write(copy[key], depth + 1);
    } else {
      const list = Array.isArray(copy[key]) ? [...(copy[key] as unknown[])] : [];
      if (index >= list.length) throw new Error(`index ${index} is out of range in "${path}"`);
      list[index] = last ? value : write(list[index], depth + 1);
      copy[key] = list;
    }
    return copy;
  };
  return write(root, 0) as Container;
}

function sourceText(value: unknown, sourceLanguage: string): string {
  if (typeof value === "string") return value;
  if (isLocalizedText(value)) return value[sourceLanguage] || Object.values(value).find((v) => typeof v === "string" && v.trim()) || "";
  return "";
}

export function findTranslationGaps(snapshot: DraftSnapshot, targets: string[], sourceLanguage: string): TranslationGap[] {
  const gaps: TranslationGap[] = [];
  for (const block of snapshot.blocks) {
    const type = String(block.type ?? "");
    const blockId = String(block.id ?? "");
    for (const pattern of translatablePaths(type)) {
      for (const path of expandPath(block, pattern)) {
        const value = readPath(block, path);
        const source = sourceText(value, sourceLanguage).trim();
        if (!source) continue;
        const missing = targets.filter((lang) => {
          if (lang === sourceLanguage) return false;
          if (typeof value === "string") return true;
          const existing = isLocalizedText(value) ? value[lang] : undefined;
          return !(typeof existing === "string" && existing.trim());
        });
        if (missing.length) gaps.push({ block_id: blockId, block_type: type, path, source, missing });
      }
    }
  }
  return gaps;
}

interface ApplyResult {
  snapshot: DraftSnapshot;
  applied: number;
  rejected: Array<{ entry: TranslationEntry; reason: string }>;
}

export function applyTranslations(snapshot: DraftSnapshot, entries: TranslationEntry[], sourceLanguage: string): ApplyResult {
  const blocks = snapshot.blocks.map((b) => ({ ...b }));
  const rejected: ApplyResult["rejected"] = [];
  let applied = 0;
  for (const entry of entries) {
    if (!isMcpLanguage(entry.language)) {
      rejected.push({ entry, reason: `unsupported language "${entry.language}"` });
      continue;
    }
    const index = blocks.findIndex((b) => b.id === entry.block_id);
    if (index < 0) {
      rejected.push({ entry, reason: "block not found; call get_page for current ids" });
      continue;
    }
    const block = blocks[index];
    const allowed = translatablePaths(String(block.type ?? "")).some((pattern) => expandPath(block, pattern).includes(entry.path));
    if (!allowed) {
      rejected.push({ entry, reason: "path is not a visitor-facing text of this block; use paths from get_translation_gaps" });
      continue;
    }
    const current = readPath(block, entry.path);
    const base: Record<string, string> = typeof current === "string"
      ? { [sourceLanguage]: current }
      : isLocalizedText(current) ? { ...(current as Record<string, string>) } : {};
    base[entry.language] = entry.text.trim();
    try {
      blocks[index] = writePath(block, entry.path, base);
      applied += 1;
    } catch (error) {
      rejected.push({ entry, reason: error instanceof Error ? error.message : "could not write path" });
    }
  }
  return { snapshot: { ...snapshot, blocks }, applied, rejected };
}
