// Shared blog types. Kept in a leaf module so blog-posts.ts and
// blog-posts-hub.ts can both depend on them without a circular import.

export interface BlogPostSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Internal links shown under the section */
  links?: Array<{ label: string; href: string }>;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** Optional SEO title override (keep under 60 chars incl. brand suffix) */
  metaTitle?: string;
  /** Optional SEO description override (keep under 160 chars) */
  metaDescription?: string;
  publishedAt: string; // ISO date

  updatedAt?: string;
  readingMinutes: number;
  tags: string[];
  cover?: string;
  // Short ~50 word answer block for AEO/featured snippets
  answer: string;
  sections: BlogPostSection[];
  faq?: Array<{ question: string; answer: string }>;
  cta?: { label: string; href: string };
  /** Slugs of related posts (SEO hub internal linking) */
  related?: string[];
}
