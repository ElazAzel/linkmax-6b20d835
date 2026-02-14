/**
 * Unit tests for UpdateUsernameUseCase
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateUsernameUseCase } from '@/use-cases/user/UpdateUsernameUseCase';
import { success, failure, isSuccess, isFailure } from '@/domain/value-objects/Result';
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository';

describe('UpdateUsernameUseCase', () => {
  let useCase: UpdateUsernameUseCase;
  let mockRepository: IUserRepository;

  beforeEach(() => {
    mockRepository = {
      loadProfile: vi.fn(),
      updateUsername: vi.fn().mockResolvedValue(success(undefined)),
      checkUsernameAvailability: vi.fn().mockResolvedValue(success(true)),
      checkPremiumStatus: vi.fn(),
      upsertProfile: vi.fn(),
    };
    useCase = new UpdateUsernameUseCase(mockRepository);
  });

  it('should update username successfully', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      username: 'newuser',
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.username).toBe('newuser');
    }
  });

  it('should normalize username to lowercase', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      username: 'NewUser',
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.username).toBe('newuser');
    }
  });

  it('should fail when userId is missing', async () => {
    const result = await useCase.execute({
      userId: '',
      username: 'newuser',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('User ID is required');
    }
  });

  it('should fail when username is too short', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      username: 'ab',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toContain('at least 3');
    }
  });

  it('should fail when username contains invalid characters', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      username: 'user@name',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toContain('lowercase letters');
    }
  });

  it('should fail when username is already taken', async () => {
    mockRepository.checkUsernameAvailability = vi.fn().mockResolvedValue(success(false));
    useCase = new UpdateUsernameUseCase(mockRepository);

    const result = await useCase.execute({
      userId: 'user-123',
      username: 'existinguser',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('This username is already taken');
    }
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');
    mockRepository.updateUsername = vi.fn().mockResolvedValue(failure(error));
    useCase = new UpdateUsernameUseCase(mockRepository);

    const result = await useCase.execute({
      userId: 'user-123',
      username: 'newuser',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('Database error');
    }
  });
});
