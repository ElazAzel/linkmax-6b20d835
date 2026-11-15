// psl ships this type but does not expose it through its package exports.
declare module 'psl' {
  export function get(domain: string): string | null;
}
