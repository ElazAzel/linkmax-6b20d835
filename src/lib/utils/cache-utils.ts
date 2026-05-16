/**
 * Cache clearing utilities for lnkmx.my
 * 
 * Cache version is stored in the database (app_settings.cache_version).
 * Admin can bump it from the admin panel to force all users to clear cache.
 */

import { storage, session } from '@/lib/storage';
import { supabase } from '@/platform/supabase/client';

// Version key for cache invalidation
const CACHE_VERSION_KEY = 'cache_version';
const FALLBACK_CACHE_VERSION = '5'; // Fallback if DB is unreachable

/**
 * Clear all local storage items related to lnkmx.my
 */
export function clearLocalStorageCache(): void {
  const keysToRemove: string[] = [];

  // eslint-disable-next-line no-restricted-globals
  for (let i = 0; i < localStorage.length; i++) {
    // eslint-disable-next-line no-restricted-globals
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('linkmax_') ||
      key.startsWith('lnkmx_') ||
      key.startsWith('inkmax_') ||
      key.startsWith('sb-') ||
      key.includes('react-query')
    )) {
      keysToRemove.push(key);
    }
  }

  // eslint-disable-next-line no-restricted-globals
  keysToRemove.forEach(key => localStorage.removeItem(key));
  storage.clear(); // Ensure namespaced storage is cleared too
}

/**
 * Clear session storage
 */
export function clearSessionStorageCache(): void {
  const keysToRemove: string[] = [];

  // eslint-disable-next-line no-restricted-globals
  for (let i = 0; i < sessionStorage.length; i++) {
    // eslint-disable-next-line no-restricted-globals
    const key = sessionStorage.key(i);
    if (key && (
      key.startsWith('linkmax_') ||
      key.startsWith('lnkmx_') ||
      key.startsWith('inkmax_')
    )) {
      keysToRemove.push(key);
    }
  }

  // eslint-disable-next-line no-restricted-globals
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  session.clear(); // Ensure namespaced session storage is cleared too
}

interface AppSetting {
  value: string;
}

/**
 * Fetch current cache version from the database
 */
async function fetchRemoteCacheVersion(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cache_version')
      .single<AppSetting>();

    if (error || !data) return FALLBACK_CACHE_VERSION;
    return data.value;
  } catch {
    return FALLBACK_CACHE_VERSION;
  }
}

/**
 * Check if cache needs to be invalidated based on remote version
 */
export async function checkCacheVersion(): Promise<boolean> {
  const remoteVersion = await fetchRemoteCacheVersion();
  const storedVersion = storage.get<string>(CACHE_VERSION_KEY);

  if (storedVersion !== remoteVersion) {
    clearLocalStorageCache();
    clearSessionStorageCache();
    storage.set(CACHE_VERSION_KEY, remoteVersion);
    return true;
  }

  return false;
}

/**
 * Force clear all caches (for manual clearing)
 */
export function forceClearAllCaches(): void {
  clearLocalStorageCache();
  clearSessionStorageCache();

  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('linkmax') || name.includes('lnkmx')) {
          caches.delete(name);
        }
      });
    });
  }
}

/**
 * Admin: Bump cache version in the database to force all users to clear cache
 */
export async function bumpCacheVersion(): Promise<{ success: boolean; newVersion: string }> {
  const currentVersion = await fetchRemoteCacheVersion();
  const newVersion = String(parseInt(currentVersion, 10) + 1);

  const { error } = await supabase
    .from('app_settings')
    .update({ value: newVersion, updated_at: new Date().toISOString() })
    .eq('key', 'cache_version');

  if (error) {
    return { success: false, newVersion: currentVersion };
  }

  // Update local cache version too
  storage.set(CACHE_VERSION_KEY, newVersion);
  return { success: true, newVersion };
}
