import { describe, it, expect } from 'vitest';
import { normalizeAppError } from '../app-error-normalizer';

describe('normalizeAppError', () => {
    it('should normalize network errors', () => {
        const error = new Error('Failed to fetch from API');
        const result = normalizeAppError(error);

        expect(result.category).toBe('network');
        expect(result.i18nKey).toBe('errors.network');
        expect(result.rawError).toBe(error);
    });

    it('should normalize auth errors', () => {
        const error = { message: 'invalid claim: missing sub' };
        const result = normalizeAppError(error);

        expect(result.category).toBe('auth');
        expect(result.i18nKey).toBe('errors.auth');
        expect(result.isRecoverable).toBe(true);
    });

    it('should handle bot domain invalid as auth error', () => {
        const error = new Error('Bot domain invalid');
        const result = normalizeAppError(error);

        expect(result.category).toBe('auth');
    });

    it('should normalize validation errors', () => {
        const error = new Error('Password must be at least 8 characters');
        const result = normalizeAppError(error);

        expect(result.category).toBe('validation');
        expect(result.i18nKey).toBe('errors.validation');
    });

    it('should normalize rate limit errors', () => {
        const error = new Error('Too many requests, try again later');
        const result = normalizeAppError(error);

        expect(result.category).toBe('rate_limit');
        expect(result.i18nKey).toBe('errors.rateLimit');
    });

    it('should fallback to unknown for random errors', () => {
        const error = new Error('Some weird database exception occurred');
        const result = normalizeAppError(error);

        expect(result.category).toBe('unknown');
        expect(result.i18nKey).toBe('errors.unknown');
        expect(result.isRecoverable).toBe(false);
    });

    it('should handle plain string errors', () => {
        const error = 'Network Error';
        const result = normalizeAppError(error);

        expect(result.category).toBe('network');
    });

    it('should handle null or undefined safely', () => {
        const resultNull = normalizeAppError(null);
        expect(resultNull.category).toBe('unknown');

        const resultUndefined = normalizeAppError(undefined);
        expect(resultUndefined.category).toBe('unknown');
    });
});
