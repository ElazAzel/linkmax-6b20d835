/**
 * Cache clearing utilities for LinkMAX
 */

import { storage } from './storage';

// Version key for cache invalidation
const CACHE_VERSION_KEY = 'cache_version';
const CURRENT_CACHE_VERSION = '3'; // Incremented after Pro/Business tier merge

/**
 * Clear all local storage items related to LinkMAX
 */
export function clearLocalStorageCache(): void {
  const keysToRemove: string[] = [];

  // Direct localStorage access for legacy key clearing
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('linkmax_') ||
      key.startsWith('lnkmx_') ||
      key.startsWith('sb-') || // Supabase cache
      key.includes('react-query')
    )) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Also clear our namespaced storage
  storage.clear();
}

/**
 * Clear session storage
 */
export function clearSessionStorageCache(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.startsWith('linkmax_') ||
      key.startsWith('lnkmx_')
    )) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * Check if cache needs to be invalidated based on version
 */
export function checkCacheVersion(): boolean {
  const storedVersion = storage.get<string>(CACHE_VERSION_KEY);

  if (storedVersion !== CURRENT_CACHE_VERSION) {
    // Clear old cache and set new version
    clearLocalStorageCache();
    clearSessionStorageCache();
    storage.set(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    return true; // Cache was cleared
  }

  return false;
}

/**
 * Force clear all caches (for manual clearing)
 */
export function forceClearAllCaches(): void {
  clearLocalStorageCache();
  clearSessionStorageCache();
  storage.set(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);

  // Also clear service worker caches if available
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
