/**
 * UpdateUsernameUseCase - Application use case for updating user's username
 * Validates username, checks availability, and syncs with page slug
 */
import { success, failure, isSuccess, type Result } from '@/domain/value-objects/Result';
import { validateUsername, normalizeUsername } from '@/domain/entities/User';
import { getUserRepository } from '@/repositories/implementations/SupabaseUserRepository';
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository';

export interface UpdateUsernameInput {
  userId: string;
  username: string;
}

export interface UpdateUsernameOutput {
  username: string;
}

export class UpdateUsernameUseCase {
  constructor(private readonly userRepository: IUserRepository = getUserRepository()) {}

  async execute(input: UpdateUsernameInput): Promise<Result<UpdateUsernameOutput, Error>> {
    // Validate user ID
    if (!input.userId) {
      return failure(new Error('User ID is required'));
    }

    // Validate username format
    const validation = validateUsername(input.username);
    if (!validation.valid) {
      return failure(new Error(validation.error || 'Invalid username'));
    }

    // Normalize username
    const normalizedUsername = normalizeUsername(input.username);

    // Check availability
    const availabilityResult = await this.userRepository.checkUsernameAvailability({
      username: normalizedUsername,
      currentUserId: input.userId,
    });

    if (!isSuccess(availabilityResult)) {
      return failure(availabilityResult.error);
    }

    if (!availabilityResult.data) {
      return failure(new Error('This username is already taken'));
    }

    // Update username
    const updateResult = await this.userRepository.updateUsername({
      userId: input.userId,
      username: normalizedUsername,
    });

    if (!isSuccess(updateResult)) {
      return failure(updateResult.error);
    }

    return success({
      username: normalizedUsername,
    });
  }
}

// Factory function for easier testing
export function createUpdateUsernameUseCase(
  userRepository?: IUserRepository
): UpdateUsernameUseCase {
  return new UpdateUsernameUseCase(userRepository);
}

// Singleton instance
let instance: UpdateUsernameUseCase | null = null;

export function getUpdateUsernameUseCase(): UpdateUsernameUseCase {
  if (!instance) {
    instance = new UpdateUsernameUseCase();
  }
  return instance;
}
