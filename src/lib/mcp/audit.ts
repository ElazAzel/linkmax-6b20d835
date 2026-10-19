import { catalogEntry } from "./block-catalog";
import type { DraftSnapshot } from "./draft";
import { isLocalizedText, textIn } from "./languages";
import type { PageAnalytics } from "./page-analytics";
import { findTranslationGaps } from "./translations";

/**
 * Deterministic page review. Every finding names the evidence it is based on
 * and the tool that fixes it, so the agent can act instead of guessing.
 */
export type Severity = "high" | "medium" | "low";

export interface Finding {
  code: string;
  area: "content" | "conversion" | "seo" | "languages" | "publishing" | "traffic";
  message: string;
  fix?: string;
  severity?: Severity;
}

export interface AuditReport {
  score: number;
  strengths: Finding[];
  weaknesses: Finding[];
  languages: string[];
  next_steps: string[];
}

const WEIGHT: Record<Severity, number> = { high: 18, medium: 9, low: 4 };
const CONTACT_URL = /(wa\.me|whatsapp|t\.me|telegram|tel:|mailto:|instagram\.com|viber)/i;
const CLICKABLE = new Set(["button", "link", "card", "messenger", "socials", "product", "tiles"]);

function blocksOf(snapshot: DraftSnapshot, type: string) {
  return snapshot.blocks.filter((b) => b.type === type);
}

function languagesIn(snapshot: DraftSnapshot): string[] {
  const found = new Set<string>();
  const walk = (value: unknown) => {
    if (isLocalizedText(value)) {
      for (const [lang, text] of Object.entries(value)) if (typeof text === "string" && text.trim()) found.add(lang);
      return;
    }
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(snapshot.blocks);
  return [...found].sort();
}

export function auditPage(input: {
  snapshot: DraftSnapshot;
  isPublished: boolean;
  hasUnpublishedChanges: boolean;
  analytics?: PageAnalytics | null;
  sourceLanguage?: string;
}): AuditReport {
  const { snapshot, analytics } = input;
  const strengths: Finding[] = [];
  const weaknesses: Finding[] = [];
  const weak = (f: Finding & { severity: Severity }) => weaknesses.push(f);
  const strong = (f: Finding) => strengths.push(f);
  const blocks = snapshot.blocks;

  // Profile
  const profile = blocksOf(snapshot, "profile")[0];
  if (!profile) {
    weak({ code: "no_profile", area: "content", severity: "high", message: "No profile block: visitors do not see who this is, and the page cannot be published.", fix: "edit_page add_block {type: profile, name, bio, avatar}" });
  } else {
    const name = textIn(profile.name, "ru");
    const bio = textIn(profile.bio, "ru");
    if (!name) weak({ code: "no_name", area: "content", severity: "high", message: "Profile has no name.", fix: "edit_page update_block profile {name}" });
    if (bio.length < 40) weak({ code: "short_bio", area: "content", severity: "medium", message: `Bio is ${bio.length} characters; one clear sentence about who you help and how converts better (aim for 60-160).`, fix: "edit_page update_block profile {bio}" });
    else strong({ code: "clear_bio", area: "content", message: "Profile explains who this is in a full sentence." });
    if (!profile.avatar) weak({ code: "no_avatar", area: "content", severity: "medium", message: "No profile photo: pages with a face get more trust and clicks.", fix: "edit_page update_block profile {avatar: image URL}" });
    if (profile.coverImage || (snapshot.seo as { image?: string } | null)?.image) strong({ code: "share_image", area: "seo", message: "Has a wide image, so links shared in messengers show a large preview." });
    else weak({ code: "no_share_image", area: "seo", severity: "low", message: "No cover or SEO image: shared links show only a small avatar card.", fix: "edit_page update_block profile {coverImage} or set_page {seo_image}" });
  }

  // Contact path and calls to action
  const contactBlocks = blocks.filter((b) => b.type === "messenger" || b.type === "form" || ((b.type === "button" || b.type === "link") && typeof b.url === "string" && CONTACT_URL.test(b.url)));
  if (contactBlocks.length === 0) {
    weak({ code: "no_contact", area: "conversion", severity: "high", message: "No way to contact the owner (no messenger, form or WhatsApp/Telegram button). Visitors leave without a lead.", fix: "edit_page add_block {type: messenger} near the top" });
  } else {
    strong({ code: "contact_path", area: "conversion", message: `Visitors can reach the owner directly (${contactBlocks.map((b) => b.type).join(", ")}).` });
    const firstContact = blocks.indexOf(contactBlocks[0]);
    if (firstContact > 4) weak({ code: "contact_too_low", area: "conversion", severity: "medium", message: `The first contact block is at position ${firstContact + 1}; on a phone it is below several screens.`, fix: "edit_page move_block to position 1-3" });
  }
  const ctas = blocks.filter((b) => b.type === "button" || b.type === "card" || b.type === "messenger");
  if (ctas.length > 4) weak({ code: "too_many_ctas", area: "conversion", severity: "low", message: `${ctas.length} competing calls to action; one or two main actions convert better.`, fix: "edit_page remove_block or turn extras into links" });

  // Substance
  if (blocks.length < 4) weak({ code: "thin_page", area: "content", severity: "medium", message: `Only ${blocks.length} blocks: not enough to show what is offered.`, fix: "edit_page add_block pricing / card / faq" });
  if (blocks.length > 25) weak({ code: "long_page", area: "content", severity: "low", message: `${blocks.length} blocks: visitors rarely scroll that far on a phone.`, fix: "edit_page remove_block the weakest blocks (see get_page_analytics)" });
  const offer = blocks.filter((b) => ["pricing", "product", "catalog", "card", "booking"].includes(String(b.type)));
  if (offer.length) strong({ code: "clear_offer", area: "conversion", message: "Shows what is sold and, where given, for how much." });
  else weak({ code: "no_offer", area: "conversion", severity: "medium", message: "No prices, services or products: visitors must ask before they know if it fits.", fix: "edit_page add_block {type: pricing} or card" });
  if (blocksOf(snapshot, "faq").length) strong({ code: "faq", area: "seo", message: "FAQ answers objections and is quoted by search engines and AI assistants." });
  else weak({ code: "no_faq", area: "seo", severity: "low", message: "No FAQ: 3-5 real questions help both visitors and AI search.", fix: "edit_page add_block {type: faq}" });
  if (blocksOf(snapshot, "testimonial").length) strong({ code: "social_proof", area: "conversion", message: "Has client reviews." });

  const incomplete = blocks.filter((b) => {
    const entry = catalogEntry(String(b.type));
    return entry?.required.some((key) => { const v = b[key]; return v == null || v === "" || (Array.isArray(v) && v.length === 0); });
  });
  if (incomplete.length) weak({ code: "incomplete_blocks", area: "content", severity: "medium", message: `${incomplete.length} block(s) miss required content and are hidden from visitors: ${incomplete.map((b) => `${b.type} ${b.id}`).join(", ")}.`, fix: "edit_page update_block or remove_block" });
  const noAlt = blocksOf(snapshot, "image").filter((b) => !textIn(b.alt, "ru"));
  if (noAlt.length) weak({ code: "image_alt", area: "seo", severity: "low", message: `${noAlt.length} image(s) without alt text.`, fix: "edit_page update_block {alt}" });

  // SEO
  const seo = (snapshot.seo ?? {}) as { title?: string; description?: string };
  if (snapshot.isIndexable === false) weak({ code: "noindex", area: "seo", severity: "high", message: "The page is hidden from search engines.", fix: "edit_page set_page {is_indexable: true}" });
  const description = seo.description || (profile ? textIn(profile.bio, "ru") : "");
  if (description.length < 50) weak({ code: "seo_description", area: "seo", severity: "low", message: "Search snippet text is short; Google will make one up.", fix: "edit_page set_page {seo_description: 120-160 chars}" });
  if (snapshot.city || snapshot.profession) strong({ code: "local_seo", area: "seo", message: "City/profession are set, which helps local search." });
  else weak({ code: "no_city", area: "seo", severity: "low", message: "City and profession are empty; they power local search titles.", fix: "edit_page set_page {city, profession}" });

  // Languages
  const languages = languagesIn(snapshot);
  if (languages.length > 1) {
    const gaps = findTranslationGaps(snapshot, languages, input.sourceLanguage ?? "ru");
    if (gaps.length) weak({ code: "partial_translation", area: "languages", severity: "medium", message: `Page uses ${languages.join(", ")} but ${gaps.length} text(s) are missing in some of them; those visitors see mixed languages.`, fix: "get_translation_gaps then apply_translations" });
    else strong({ code: "multilingual", area: "languages", message: `Fully translated: ${languages.join(", ")}.` });
  }

  // Publishing
  if (!input.isPublished) weak({ code: "not_published", area: "publishing", severity: "high", message: "The page is not published; nobody can open it.", fix: "publish_page" });
  else if (input.hasUnpublishedChanges) weak({ code: "unpublished_changes", area: "publishing", severity: "low", message: "The draft has changes that are not live yet.", fix: "publish_page" });

  // Traffic
  if (analytics) {
    if (analytics.views === 0) {
      weak({ code: "no_traffic", area: "traffic", severity: "medium", message: `No visits in ${analytics.window_days} days: the link is not where the audience is.`, fix: "Put the link in Instagram/Telegram/TikTok bio and 2GIS" });
    } else {
      if (analytics.click_through_percent >= 15) strong({ code: "good_ctr", area: "traffic", message: `${analytics.click_through_percent}% of visits end in a click.` });
      else if (analytics.views >= 30 && analytics.click_through_percent < 5) weak({ code: "low_ctr", area: "traffic", severity: "high", message: `Only ${analytics.click_through_percent}% of ${analytics.views} visits click anything.`, fix: "Move the main action to the top and make it one clear button" });
      const trend = analytics.change_vs_previous.views_percent;
      if (trend !== null && trend <= -30) weak({ code: "falling_traffic", area: "traffic", severity: "medium", message: `Visits fell ${Math.abs(trend)}% versus the previous period.` });
      if (trend !== null && trend >= 30) strong({ code: "growing_traffic", area: "traffic", message: `Visits grew ${trend}% versus the previous period.` });
      const dead = analytics.blocks.filter((b) => CLICKABLE.has(b.type) && b.impressions >= 20 && b.clicks === 0);
      if (dead.length) weak({ code: "dead_blocks", area: "traffic", severity: "low", message: `Seen but never clicked: ${dead.map((b) => `${b.label} (${b.block_id})`).join(", ")}.`, fix: "Rewrite, move or remove these blocks" });
      const best = analytics.blocks.find((b) => b.clicks > 0);
      if (best) strong({ code: "top_block", area: "traffic", message: `Most clicked: ${best.label} (${best.clicks} clicks).` });
      if (analytics.views >= 100 && analytics.leads === 0) weak({ code: "no_leads", area: "conversion", severity: "medium", message: `${analytics.views} visits and no leads.`, fix: "Add a form or messenger block with a concrete offer" });
    }
  }

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  weaknesses.sort((a, b) => order[a.severity ?? "low"] - order[b.severity ?? "low"]);
  const score = Math.max(0, Math.min(100, 100 - weaknesses.reduce((sum, w) => sum + WEIGHT[w.severity ?? "low"], 0)));
  return {
    score,
    strengths,
    weaknesses,
    languages,
    next_steps: weaknesses.slice(0, 3).map((w) => w.fix ?? w.message),
  };
}
