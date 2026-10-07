// Browser-only startup work, ported from the former src/main.tsx.
// Called once from the root route after hydration.
import { validateEnv } from "@/lib/utils/env-validator";
import {
  CHUNK_RECOVERY_KEY,
  isChunkRuntimeError,
  recoverFromStaleAssets,
} from "@/lib/utils/runtime-recovery";
import { PushService } from "@/lib/notifications/push-service";

let started = false;

export function startClientBootstrap(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  validateEnv();

  const ric: (cb: () => void) => number =
    typeof window.requestIdleCallback === "function"
      ? (cb) => window.requestIdleCallback(cb)
      : (cb) => window.setTimeout(cb, 1);

  // Defer non-critical init: first user interaction or 10s idle.
  const deferNonCritical = () => {
    void import("@/lib/utils/cache-utils").then(({ checkCacheVersion }) => {
      checkCacheVersion();
    });
  };
  let deferFired = false;
  const events = ["scroll", "click", "keydown", "touchstart"] as const;
  const fireDeferOnce = () => {
    if (deferFired) return;
    deferFired = true;
    events.forEach((e) => window.removeEventListener(e, fireDeferOnce));
    ric(deferNonCritical);
  };
  events.forEach((e) => window.addEventListener(e, fireDeferOnce, { once: true, passive: true }));
  window.setTimeout(fireDeferOnce, 10000);

  // Benign browser warning: swallow it so overlays/handlers never treat it as a crash.
  window.addEventListener(
    "error",
    (event) => {
      if (typeof event.message === "string" && event.message.includes("ResizeObserver loop")) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true,
  );

  window.addEventListener("error", (event) => {
    if (isChunkRuntimeError(event.error || event.message)) {
      recoverFromStaleAssets("window.error");
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { name?: string; message?: string } | undefined;
    // Cancelled requests (navigation, unmount, auth lock) are expected, not crashes.
    if (reason?.name === "AbortError" || String(reason?.message ?? "").includes("signal is aborted")) {
      event.preventDefault();
      return;
    }
    if (isChunkRuntimeError(event.reason)) {
      event.preventDefault();
      recoverFromStaleAssets("unhandledrejection");
    }
  });

  // If app boot succeeded, allow future recovery attempts.
  window.setTimeout(() => {
    window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
  }, 15000);

  // Push notifications for the native mobile shell.
  PushService.init();
}
