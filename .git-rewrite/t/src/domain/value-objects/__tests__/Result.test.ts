/**
 * Unit tests for Result value object
 */
import { describe, it, expect } from 'vitest';
import {
  success,
  failure,
  isSuccess,
  isFailure,
  map,
  flatMap,
  getOrDefault,
  getOrThrow,
  combine,
  tryCatch,
  tryCatchAsync,
} from '@/domain/value-objects/Result';

describe('Result Value Object', () => {
  describe('success', () => {
    it('should create a successful result', () => {
      const result = success(42);
      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });
  });

  describe('failure', () => {
    it('should create a failure result', () => {
      const error = new Error('test error');
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe('isSuccess', () => {
    it('should return true for success', () => {
      expect(isSuccess(success(42))).toBe(true);
    });

    it('should return false for failure', () => {
      expect(isSuccess(failure(new Error()))).toBe(false);
    });
  });

  describe('isFailure', () => {
    it('should return true for failure', () => {
      expect(isFailure(failure(new Error()))).toBe(true);
    });

    it('should return false for success', () => {
      expect(isFailure(success(42))).toBe(false);
    });
  });

  describe('map', () => {
    it('should transform successful result', () => {
      const result = map(success(5), (x) => x * 2);
      expect(isSuccess(result) && result.data).toBe(10);
    });

    it('should not transform failure', () => {
      const error = new Error('test');
      const result = map(failure(error), (x: number) => x * 2);
      expect(isFailure(result) && result.error).toBe(error);
    });
  });

  describe('flatMap', () => {
    it('should chain successful results', () => {
      const result = flatMap(success(5), (x) => success(x * 2));
      expect(isSuccess(result) && result.data).toBe(10);
    });

    it('should propagate failure', () => {
      const error = new Error('test');
      const result = flatMap(failure(error), (x: number) => success(x * 2));
      expect(isFailure(result) && result.error).toBe(error);
    });
  });

  describe('getOrDefault', () => {
    it('should return data for success', () => {
      expect(getOrDefault(success(42), 0)).toBe(42);
    });

    it('should return default for failure', () => {
      expect(getOrDefault(failure(new Error()), 0)).toBe(0);
    });
  });

  describe('getOrThrow', () => {
    it('should return data for success', () => {
      expect(getOrThrow(success(42))).toBe(42);
    });

    it('should throw for failure', () => {
      expect(() => getOrThrow(failure(new Error('test')))).toThrow('test');
    });
  });

  describe('combine', () => {
    it('should combine successful results', () => {
      const results = [success(1), success(2), success(3)];
      const combined = combine(results);
      expect(isSuccess(combined) && combined.data).toEqual([1, 2, 3]);
    });

    it('should return first failure', () => {
      const error = new Error('test');
      const results = [success(1), failure(error), success(3)];
      const combined = combine(results);
      expect(isFailure(combined) && combined.error).toBe(error);
    });
  });

  describe('tryCatch', () => {
    it('should return success for non-throwing function', () => {
      const result = tryCatch(() => 42);
      expect(isSuccess(result) && result.data).toBe(42);
    });

    it('should return failure for throwing function', () => {
      const result = tryCatch(() => {
        throw new Error('test');
      });
      expect(isFailure(result) && result.error.message).toBe('test');
    });
  });

  describe('tryCatchAsync', () => {
    it('should return success for resolving promise', async () => {
      const result = await tryCatchAsync(async () => 42);
      expect(isSuccess(result) && result.data).toBe(42);
    });

    it('should return failure for rejecting promise', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('test');
      });
      expect(isFailure(result) && result.error.message).toBe('test');
    });
  });
});
