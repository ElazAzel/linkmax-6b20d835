// ported from main.tsx: i18n must initialise before any component renders
import { i18nReady } from "@/i18n/config";

import { useEffect, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "@/components/layout/AppShell";
import NotFound from "@/pages/NotFound";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { startClientBootstrap } from "@/lib/client-bootstrap";

import { CONTENT_SECURITY_POLICY as CSP } from "@/lib/security/content-security-policy";
import { LINKMAX_UI_V2 } from '@/lib/ui-v2';
import { colors, fonts } from "@/design-system/tokens";

// Cancelled requests are expected: stop them before any crash reporter sees them.
const ABORT_GUARD = `window.addEventListener('unhandledrejection',function(e){var r=e.reason;if(r&&(r.name==='AbortError'||String(r.message||'').indexOf('signal is aborted')!==-1)){e.preventDefault();e.stopImmediatePropagation();}},true);`;

// Apply the interface surface and theme before first paint (no flash).
// Keep the segment list in sync with src/design-system/surface.ts (tested).
const THEME_BOOTSTRAP = `(function(){try{var APP_FIRST_SEGMENTS = ["","index","ru","en","kk","uz","auth","dashboard","admin","install","join","invites",".lovable","pricing","gallery","customers","alternatives","seo-landing","experts","terms","privacy","payment-terms","sitemap","blog","for-masters","for","dlya","для-репетиторов","для-бьюти-мастеров","taplink-alternative","sayt-vizitka-dlya-uslug","multilink","link-in-bio-ru","vizitka-onlayn","design-system"]; var first=location.pathname.split("/")[1]||"";try{first=decodeURIComponent(first);}catch(e){}if(APP_FIRST_SEGMENTS.indexOf(first)===-1)return;var root=document.documentElement;root.classList.add("lm-app");var saved=localStorage.getItem("lm-app-theme");var dark=saved==="dark"||((!saved||saved==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);root.setAttribute("data-app-theme",dark?"dark":"light");}catch(e){}})();`;

const CRITICAL_CSS = `body{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;background-color:#f3f3f3;color:#1f1f1f}html.lm-app body{font-family:${fonts.sans};background-color:hsl(${colors.light.background});color:hsl(${colors.light.foreground})}html.lm-app[data-app-theme="dark"] body{background-color:hsl(${colors.dark.background});color:hsl(${colors.dark.foreground})}`;

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LinkMAX - The Business OS",
  alternateName: "lnkmx.my",
  url: "https://lnkmx.my/",
  description:
    "Операционная система для микробизнеса: AI-конструктор страниц, Business Zones (CRM), Fintech Core и аналитика кликов.",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: ["Website Builder", "CRM Software", "Analytics Platform", "Financial Software"],
  operatingSystem: "Web, PWA",
  featureList: [
    "AI Page Builder",
    "Business Zones (Multi-tenant Workspaces)",
    "Mini-CRM & Sales Pipeline (Kanban)",
    "Fintech Core (Ledger & Invoicing)",
    "Telegram notifications & Team Inbox",
    "Server-side Analytics (Pixel Proxy)",
  ],
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "KZT", description: "Identity (Free) - 1 page" },
    { "@type": "Offer", price: "0", priceCurrency: "KZT", description: "Starter (Success) - 7% fee" },
    { "@type": "Offer", price: "3045", priceCurrency: "KZT", description: "Pro (Business) - Annual" },
  ],
  author: { "@type": "Organization", name: "LinkMAX", url: "https://lnkmx.my/" },
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://lnkmx.my#organization",
  name: "LinkMAX",
  url: "https://lnkmx.my/",
  logo: "https://lnkmx.my/icon-512.png",
  sameAs: ["https://t.me/lnkmx_app", "https://instagram.com/lnkmx_app"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["Russian", "English", "Kazakh"],
  },
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Wait for the active locale chunk so neither SSR nor first paint shows raw keys.
  beforeLoad: async () => {
    await i18nReady;
  },
  head: ({ matches }) => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover",
      },
      { httpEquiv: "Content-Security-Policy", content: CSP },
      { title: "LinkMAX — страницы, CRM и аналитика для микробизнеса" },
      {
        name: "description",
        content:
          "Конструктор страниц с AI, мини-CRM и аналитика кликов для микробизнеса. Создайте сайт, принимайте заявки и управляйте клиентами в одном месте.",
      },
      { name: "author", content: "LinkMAX" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "LinkMAX - The Micro-Business OS | Конструктор + CRM + Аналитика" },
      {
        property: "og:description",
        content: "Операционная система для микробизнеса. Конструктор страниц, CRM, аналитика и AI-генерация в одном месте.",
      },
      { property: "og:image", content: "https://lnkmx.my/og-image.png" },
      // Profiles bring their own image of unknown size; only the site card is 1200×630.
      ...(matches.some((m) => (m.routeId as string) === "/$slug/")
        ? []
        : [
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]),
      { property: "og:image:alt", content: "LinkMAX - The Micro-Business OS" },
      { property: "og:site_name", content: "LinkMAX" },
      { property: "og:locale", content: "ru_RU" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:locale:alternate", content: "kk_KZ" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LinkMAX - The Micro-Business OS" },
      { name: "twitter:description", content: "Операционная система для микробизнеса: конструктор страниц, CRM, аналитика." },
      { name: "twitter:image", content: "https://lnkmx.my/og-image.png" },
      { name: "twitter:image:alt", content: "LinkMAX - The Micro-Business OS" },
      { name: "twitter:site", content: "@LinkMAX_app" },
      { name: "twitter:creator", content: "@LinkMAX_app" },
      { name: "google-site-verification", content: "Dx08PVLcT8XZVNiN_dAiPQKfgSJKHehjAGV5OPBNxB4" },
      { name: "theme-color", content: "#f4f4ef", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#111418", media: "(prefers-color-scheme: dark)" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "LinkMAX" },
      { name: "application-name", content: "LinkMAX" },
      { name: "format-detection", content: "telephone=no" },
      {
        name: "ai-summary",
        content:
          "LinkMAX is the Business OS for the Solo-Economy. It combines an AI-powered Page Builder, Business Zones (multi-tenant CRM workspaces), and a Fintech Core with a Step-by-Growth monetization model. Optimized for independent professionals to manage their entire digital enterprise in one place.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "/fonts/global.css" },
      // Profiles set their own icon (the author) and are single-language: the
      // site-wide hreflang set points at the home page and must not leak there.
      ...(matches.some((m) => (m.routeId as string) === "/$slug/")
        ? []
        : [
            { rel: "alternate", hrefLang: "ru", href: "https://lnkmx.my/?lang=ru" },
            { rel: "alternate", hrefLang: "en", href: "https://lnkmx.my/?lang=en" },
            { rel: "alternate", hrefLang: "kk", href: "https://lnkmx.my/?lang=kk" },
            { rel: "alternate", hrefLang: "x-default", href: "https://lnkmx.my/" },
            { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
            { rel: "icon", type: "image/png", href: "/favicon.png" },
            { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
          ]),
      { rel: "manifest", href: "/manifest.json" },
    ],
    styles: [{ children: CRITICAL_CSS }],
    scripts: [
      { children: ABORT_GUARD },
      { children: THEME_BOOTSTRAP },
      // A profile page describes its owner (route JSON-LD); the app itself is only the publisher.
      ...(matches.some((m) => (m.routeId as string) === "/$slug/")
        ? []
        : [{ type: "application/ld+json", children: JSON.stringify(SOFTWARE_LD) }]),
      { type: "application/ld+json", children: JSON.stringify(ORG_LD) },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundBoundary,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-linkmax-ui={LINKMAX_UI_V2 ? 'v2' : 'v1'} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    startClientBootstrap();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function NotFoundBoundary() {
  useEffect(() => {
    // Managed OAuth endpoints are served by the platform, not the app.
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/~oauth")) {
      window.location.reload();
    }
  }, []);
  return <NotFound />;
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">This page didn't load</h1>
        <p className="text-sm text-muted-foreground">Что-то пошло не так. Попробуйте ещё раз.</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Try again
          </button>
          <Link to="/" className="rounded-lg bg-muted px-4 py-2 font-medium text-foreground">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
