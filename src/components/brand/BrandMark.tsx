/**
 * LinkMAX mark: a bold "L" with the orange dot from lnkmx.my. Same drawing as
 * public/favicon.svg. `tile` draws the black rounded square around it (app
 * icon look); without it the glyph sits on whatever background it is placed.
 */
export function BrandMark({ size = 32, tile = true, className }: { size?: number; tile?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
      {tile && <rect width="512" height="512" rx="116" fill="#0a0a0a" />}
      <path d="M158 116v196c0 52 30 82 82 82h18" fill="none" stroke={tile ? '#f4f4f1' : 'currentColor'} strokeWidth="76" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="352" cy="394" r="42" fill="#ff6b00" />
    </svg>
  );
}
