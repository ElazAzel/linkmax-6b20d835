// Type declarations for Next.js shims (resolved via vite.config.ts aliases)
declare module 'next' {
  export interface Metadata {
    title?: string | { default?: string; template?: string };
    description?: string;
    metadataBase?: URL;
    openGraph?: Record<string, any>;
    twitter?: Record<string, any>;
    robots?: Record<string, any>;
    verification?: Record<string, any>;
    alternates?: Record<string, any>;
    other?: Record<string, string>;
    [key: string]: any;
  }
  export interface Viewport {
    width?: string;
    initialScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
  }
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (path: string) => void;
    replace: (path: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: () => void;
  };
  export function useParams(): Record<string, string>;
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function notFound(): never;
}

declare module 'next/link' {
  import { ComponentType } from 'react';
  interface LinkProps {
    href: string;
    children?: React.ReactNode;
    className?: string | ((props: { isActive: boolean }) => string);
    prefetch?: boolean;
    [key: string]: any;
  }
  const Link: ComponentType<LinkProps>;
  export default Link;
  export type { LinkProps };
}

declare module 'next/font/google' {
  export function Inter(options: { subsets: string[] }): { className: string };
}
