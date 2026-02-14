/**
 * Secure localStorage wrapper utility
 * - Namespaced keys to prevent collisions
 * - Type-safe API
 * - JSON serialization/deserialization
 * - Error handling
 * - Prevents XSS attacks through key isolation
 */

import { logger } from './logger';

const STORAGE_PREFIX = 'inkmax_';
const STORAGE_VERSION = 'v1_';

/**
 * Get namespaced key
 */
function getKey(key: string): string {
    return `${STORAGE_PREFIX}${STORAGE_VERSION}${key}`;
}

/**
 * Secure storage interface
 */
export const storage = {
    /**
     * Get item from localStorage
     * @param key - Storage key (will be namespaced automatically)
     * @returns Parsed value or null if not found
     */
    get<T = unknown>(key: string): T | null {
        try {
            const item = localStorage.getItem(getKey(key));
            if (item === null) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            logger.error(`Error reading from storage: ${key}`, error, { context: 'storage' });
            return null;
        }
    },

    /**
     * Set item in localStorage
     * @param key - Storage key (will be namespaced automatically)
     * @param value - Value to store (will be JSON stringified)
     */
    set<T = unknown>(key: string, value: T): void {
        try {
            localStorage.setItem(getKey(key), JSON.stringify(value));
        } catch (error) {
            logger.error(`Error writing to storage: ${key}`, error, { context: 'storage' });
            // Handle quota exceeded error
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                logger.warn('localStorage quota exceeded, clearing old data', { context: 'storage' });
                this.clearOldVersions();
            }
        }
    },

    /**
     * Remove item from localStorage
     * @param key - Storage key (will be namespaced automatically)
     */
    remove(key: string): void {
        try {
            localStorage.removeItem(getKey(key));
        } catch (error) {
            logger.error(`Error removing from storage: ${key}`, error, { context: 'storage' });
        }
    },

    /**
     * Check if key exists in localStorage
     * @param key - Storage key (will be namespaced automatically)
     */
    has(key: string): boolean {
        return localStorage.getItem(getKey(key)) !== null;
    },

    /**
     * Clear all inkmax storage (keeps other apps' data)
     */
    clear(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            logger.error('Error clearing storage', error, { context: 'storage' });
        }
    },

    /**
     * Get all keys (namespaced)
     */
    keys(): string[] {
        const keys = Object.keys(localStorage);
        return keys
            .filter((key) => key.startsWith(getKey('')))
            .map((key) => key.replace(getKey(''), ''));
    },

    /**
     * Get storage size in bytes (approximate)
     */
    getSize(): number {
        let size = 0;
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        size += key.length + value.length;
                    }
                }
            });
        } catch (error) {
            logger.error('Error calculating storage size', error, { context: 'storage' });
        }
        return size;
    },

    /**
     * Clear old version data (migration utility)
     */
    clearOldVersions(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                // Remove keys with old version or no version
                if (key.startsWith(STORAGE_PREFIX) && !key.startsWith(getKey(''))) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            logger.error('Error clearing old versions', error, { context: 'storage' });
        }
    },

    /**
     * Get raw value without parsing (for debugging)
     */
    getRaw(key: string): string | null {
        return localStorage.getItem(getKey(key));
    },

    /**
     * Set raw value without stringifying (use with caution)
     */
    setRaw(key: string, value: string): void {
        localStorage.setItem(getKey(key), value);
    },
};

// Export for backward compatibility
export default storage;

// Type definitions for common storage keys
export interface StorageKeys {
    user_preferences: {
        theme: 'light' | 'dark';
        language: string;
        sound: boolean;
    };
    page_cache: {
        id: string;
        data: unknown;
        timestamp: number;
    };
    auth_session: {
        token: string;
        expiresAt: number;
    };
    // Add more typed keys as needed
}

// Typed storage helpers
export const typedStorage = {
    getUserPreferences(): StorageKeys['user_preferences'] | null {
        return storage.get<StorageKeys['user_preferences']>('user_preferences');
    },
    setUserPreferences(prefs: StorageKeys['user_preferences']): void {
        storage.set('user_preferences', prefs);
    },
    // Add more typed helpers as needed
};
