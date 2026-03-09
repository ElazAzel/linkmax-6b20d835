/**
 * Intelligence Layer — Shared types
 * All engines produce typed, explainable results. Zero AI tokens.
 */

import type { BlockType } from '@/types/blocks/base';

// ── Suggestion Types ──

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
export type SuggestionEffort = 'instant' | 'quick' | 'moderate';
export type SuggestionCategory =
  | 'add_block'
  | 'fix_block'
  | 'reorder'
  | 'fill_field'
  | 'publish'
  | 'share'
  | 'settings';

export interface Suggestion {
  id: string;
  titleKey: string;
  reasonKey: string;
  priority: SuggestionPriority;
  effort: SuggestionEffort;
  category: SuggestionCategory;
  impactScore: number; // 0-100
  targetBlockId?: string;
  targetBlockType?: BlockType;
  actionType: string;
  meta?: Record<string, unknown>;
}

// ── Block Quality ──

export interface BlockIssue {
  key: string;
  severity: 'error' | 'warning' | 'info';
  messageKey: string;
}

export interface BlockQualityReport {
  blockId: string;
  blockType: string;
  score: number; // 0-100
  issues: BlockIssue[];
}

// ── Composition ──

export interface CompositionCoverage {
  hasIdentity: boolean;
  hasOffer: boolean;
  hasTrust: boolean;
  hasCTA: boolean;
  hasContact: boolean;
  hasContent: boolean;
}

export type BlockRole = 'identity' | 'offer' | 'trust' | 'cta' | 'contact' | 'content' | 'filler';

export interface CompositionReport {
  coverage: CompositionCoverage;
  missingEssentials: string[];
  weakSpots: string[];
  structuralScore: number;
  conversionReadiness: number;
  blockRoles: Map<string, BlockRole>;
}

// ── Structural Repair ──

export interface StructuralSuggestion {
  id: string;
  pattern: string;
  severity: 'error' | 'warning';
  messageKey: string;
  fromIndex?: number;
  toIndex?: number;
  targetBlockId?: string;
}

// ── Readiness ──

export interface ReadinessResult {
  ready: boolean;
  score: number; // 0-100
  blockers: string[];
  improvements: string[];
}

// ── Niche Pack ──

export interface NichePack {
  id: string;
  idealStack: BlockType[];
  criticalBlocks: BlockType[];
  trustBlocks: BlockType[];
  ctaBlocks: BlockType[];
  presetIds: string[];
  /** Weight multiplier for suggestions involving these blocks */
  blockWeights: Partial<Record<BlockType, number>>;
}

// ── Full Intelligence Result ──

export interface PageIntelligence {
  composition: CompositionReport;
  blockQuality: BlockQualityReport[];
  structural: StructuralSuggestion[];
  publishReady: ReadinessResult;
  activationReady: ReadinessResult;
  conversionReady: ReadinessResult;
  nextActions: Suggestion[];
}
