/**
 * SEO Library Index
 * 
 * Centralized exports for AEO/GEO functionality
 */

// Answer Block generation
export { 
  generateAnswerBlock, 
  generateAnswerBlockHtml,
  type AnswerBlockData,
} from './answer-block';

// Auto-FAQ generation
export { 
  generateAutoFAQ, 
  extractFAQContext, 
  hasUserFAQ,
  type AutoFAQItem,
} from './auto-faq';

// GEO Schemas
export { 
  generateGEOSchemas, 
  generateJsonLdGraph,
  type GEOSchemas,
} from './geo-schemas';

// Key Facts
export { 
  generateKeyFacts as generateEnhancedKeyFacts, 
  formatFactsAsBullets, 
  formatFactsAsHtml, 
  groupFactsByCategory,
  type KeyFact,
} from './key-facts';

// Entity Linking
export { 
  extractEntityLinks, 
  extractSkillTags,
  type EntityLinks,
} from './entity-linking';

// Section Anchors
export { 
  generateSectionAnchors, 
  generateKeyFacts,
  SECTION_ANCHORS, 
  SECTION_LABELS,
  type PageSection,
} from './anchors';
