import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "output", "pdf");
const tmpDir = path.join(rootDir, "tmp", "pdfs");
const htmlPath = path.join(tmpDir, "lnkmx-app-summary.html");
const pdfPath = path.join(outputDir, "lnkmx-app-summary.pdf");
const pngPath = path.join(tmpDir, "lnkmx-app-summary.png");

const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const content = {
  title: "lnkmx",
  eyebrow: "APP SUMMARY",
  subtitle:
    "Repo-based snapshot of the web app, its runtime surfaces, and the fastest way to start it locally.",
  updated: "March 8, 2026",
  whatIs:
    'lnkmx is a mobile-first "micro-business OS" for building professional bio or landing pages and running lightweight business operations from one dashboard. Repo evidence also shows companion Telegram and Capacitor entry points alongside the main web app.',
  whoItsFor:
    "Primary persona in the repo: creators, freelancers, and small businesses in the CIS region that need a public page, lead capture, analytics, and simple CRM workflows without stitching together many tools.",
  features: [
    "Build and publish public bio or landing pages with block-based editing.",
    "Capture and manage leads, contacts, deals, tasks, and inbox workflows in the dashboard.",
    "Track views, clicks, experiments, and page or block analytics.",
    "Run bookings, events, products or orders, and payment flows.",
    "Support localization, SEO pages, sitemap generation, and bot-friendly SSR.",
    "Send notifications and connect services such as Telegram, email, calendar sync, and pixel tracking.",
  ],
  architecture: [
    "Vite builds two browser entries: the main React SPA and a Telegram Mini App.",
    "The shared app shell adds routing, auth, language state, toasts, React Query caching, and PWA prompts.",
    "UI code is organized into pages, components, services, repositories, domain, and use-cases layers.",
    "Data access goes through a Supabase JS client configured from env vars; schema lives in supabase/migrations.",
    "Backend logic lives in 44 Supabase Edge Function folders for AI content, leads, payments, calendar, SEO, notifications, and Telegram.",
    "A Cloudflare worker sends bot traffic to seo-ssr or generate-sitemap; human traffic stays on the SPA. Capacitor wraps the built web app for iOS and Android.",
  ],
  dataFlow:
    "Data flow: Browser or Telegram client -> React routes or screens -> services and repositories -> Supabase client and Edge Functions -> Postgres, Auth, and Storage. Bot requests -> Cloudflare worker -> SSR or sitemap Edge Functions -> HTML response.",
  runSteps: [
    "Install Node.js 18+ (20 recommended) and npm.",
    "Run npm install from the repo root.",
    "Copy .env.example to .env and set VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_URL, and VITE_APP_DOMAIN.",
    "Run npm run dev, then open http://localhost:8080.",
  ],
  evidence: [
    "README.md",
    "package.json",
    ".env.example",
    "vite.config.ts",
    "capacitor.config.ts",
    "src/main.tsx",
    "src/App.tsx",
    "src/platform/supabase/client.ts",
    "tg.html",
    "src/telegram/",
    "supabase/",
    "cloudflare-worker/",
  ],
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHyphenList(items, className = "") {
  const joined = items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<ul class="hyphen-list ${className}">${joined}</ul>`;
}

function renderEvidence(items) {
  return items
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join("");
}

function buildHtml(data) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.title)} app summary</title>
    <style>
      :root {
        --ink: #153042;
        --muted: #56707a;
        --accent: #0f766e;
        --accent-soft: #dff5f1;
        --line: #d9e4e8;
        --panel: #f6f9fa;
        --paper: #ffffff;
        --shadow: rgba(21, 48, 66, 0.08);
      }

      @page {
        size: Letter;
        margin: 0;
      }

      @media print {
        html,
        body {
          width: 8.5in;
          height: 11in;
          min-height: 0;
          padding: 0;
          margin: 0;
          display: block;
          background: #ffffff;
          overflow: hidden;
        }

        .sheet {
          margin: 0;
          box-shadow: none;
        }
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #eef3f4;
        color: var(--ink);
        font-family: "Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      }

      body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .sheet {
        width: 8.5in;
        height: 11in;
        overflow: hidden;
        background: var(--paper);
        box-shadow: 0 22px 60px var(--shadow);
        padding: 0.5in 0.58in 0.48in;
        position: relative;
      }

      .top-band {
        position: absolute;
        inset: 0 0 auto 0;
        height: 0.18in;
        background: linear-gradient(90deg, #0f766e, #3b82f6 58%, #f59e0b);
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-top: 0.06in;
        margin-bottom: 0.22in;
      }

      .eyebrow {
        font-size: 10px;
        letter-spacing: 0.18em;
        font-weight: 700;
        color: var(--accent);
        margin-bottom: 8px;
      }

      h1 {
        margin: 0;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .subtitle {
        margin: 10px 0 0;
        max-width: 4.8in;
        font-size: 11px;
        line-height: 1.45;
        color: var(--muted);
      }

      .meta-card {
        min-width: 1.7in;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(180deg, #fbfefd, #f3f8f8);
      }

      .meta-label {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: var(--muted);
        margin-bottom: 10px;
      }

      .meta-line {
        font-size: 10px;
        line-height: 1.35;
        color: var(--ink);
        margin: 0 0 6px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1.55fr 1fr;
        gap: 18px;
      }

      .section {
        margin-bottom: 14px;
        padding: 12px 14px 13px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--paper);
      }

      .section.tint {
        background: linear-gradient(180deg, #fbfefd 0%, #f7fbfb 100%);
      }

      h2 {
        margin: 0 0 8px;
        font-size: 13px;
        line-height: 1.1;
        letter-spacing: 0.02em;
      }

      p {
        margin: 0;
        font-size: 10.5px;
        line-height: 1.5;
        color: var(--ink);
      }

      .muted {
        color: var(--muted);
      }

      .hyphen-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .hyphen-list li {
        position: relative;
        padding-left: 12px;
        margin: 0 0 7px;
        font-size: 10.3px;
        line-height: 1.42;
      }

      .hyphen-list.tight li {
        margin-bottom: 6px;
      }

      .hyphen-list li:last-child {
        margin-bottom: 0;
      }

      .hyphen-list li::before {
        content: "-";
        position: absolute;
        left: 0;
        top: 0;
        color: var(--accent);
        font-weight: 700;
      }

      .flow {
        margin-top: 10px;
        padding: 10px 11px;
        border-radius: 12px;
        background: var(--panel);
        border: 1px solid var(--line);
      }

      .flow p {
        font-size: 9.8px;
        line-height: 1.45;
      }

      .steps {
        counter-reset: step;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .steps li {
        position: relative;
        padding-left: 25px;
        margin: 0 0 9px;
        font-size: 10.3px;
        line-height: 1.42;
      }

      .steps li:last-child {
        margin-bottom: 0;
      }

      .steps li::before {
        counter-increment: step;
        content: counter(step);
        position: absolute;
        left: 0;
        top: -1px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 9px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 7px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: #f8fbfc;
        color: var(--muted);
        font-size: 8.7px;
        line-height: 1;
      }

      .footer-note {
        margin-top: 8px;
        font-size: 8.9px;
        line-height: 1.4;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="top-band"></div>

      <header class="header">
        <div>
          <div class="eyebrow">${escapeHtml(data.eyebrow)}</div>
          <h1>${escapeHtml(data.title)}</h1>
          <p class="subtitle">${escapeHtml(data.subtitle)}</p>
        </div>

        <div class="meta-card">
          <div class="meta-label">SNAPSHOT</div>
          <p class="meta-line"><strong>Scope:</strong> 1-page repo summary</p>
          <p class="meta-line"><strong>Evidence:</strong> code + config + docs</p>
          <p class="meta-line"><strong>Updated:</strong> ${escapeHtml(data.updated)}</p>
        </div>
      </header>

      <div class="grid">
        <main>
          <section class="section tint">
            <h2>What It Is</h2>
            <p>${escapeHtml(data.whatIs)}</p>
          </section>

          <section class="section">
            <h2>What It Does</h2>
            ${renderHyphenList(data.features)}
          </section>

          <section class="section tint">
            <h2>How It Works</h2>
            ${renderHyphenList(data.architecture, "tight")}
            <div class="flow">
              <p>${escapeHtml(data.dataFlow)}</p>
            </div>
          </section>
        </main>

        <aside>
          <section class="section">
            <h2>Who It Is For</h2>
            <p>${escapeHtml(data.whoItsFor)}</p>
          </section>

          <section class="section tint">
            <h2>How To Run</h2>
            <ol class="steps">
              ${data.runSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
            </ol>
          </section>

          <section class="section">
            <h2>Repo Evidence Used</h2>
            <div class="chips">${renderEvidence(data.evidence)}</div>
            <p class="footer-note">If a required item had not been present in the repository, this summary would label it "Not found in repo."</p>
          </section>
        </aside>
      </div>
    </div>
  </body>
</html>`;
}

async function resolveBrowserPath() {
  for (const candidate of browserCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next installed browser.
    }
  }

  return null;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(htmlPath, buildHtml(content), "utf8");

  const executablePath = await resolveBrowserPath();
  const browser = await chromium.launch({
    executablePath: executablePath || undefined,
    headless: true,
    args: ["--allow-file-access-from-files"],
  });

  const page = await browser.newPage({
    viewport: { width: 1080, height: 1400 },
    deviceScaleFactor: 1.5,
  });

  await page.emulateMedia({ media: "print" });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });

  const overflow = await page.evaluate(() => {
    const sheet = document.querySelector(".sheet");
    if (!sheet) {
      return { missing: true, bodyOverflow: false, sheetOverflow: false };
    }

    return {
      missing: false,
      bodyOverflow: document.documentElement.scrollHeight > window.innerHeight + 2,
      sheetOverflow:
        sheet.scrollHeight > sheet.clientHeight + 2 ||
        sheet.scrollWidth > sheet.clientWidth + 2,
    };
  });

  if (overflow.missing || overflow.bodyOverflow || overflow.sheetOverflow) {
    await browser.close();
    throw new Error(`Layout overflow detected: ${JSON.stringify(overflow)}`);
  }

  await page.locator(".sheet").screenshot({
    path: pngPath,
    type: "png",
  });

  await page.pdf({
    path: pdfPath,
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0in",
      right: "0in",
      bottom: "0in",
      left: "0in",
    },
  });

  await browser.close();

  console.log(pdfPath);
  console.log(pngPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
