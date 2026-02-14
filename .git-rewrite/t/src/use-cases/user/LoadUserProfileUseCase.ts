/**
 * LoadUserProfileUseCase - Application use case for loading user profile
 */
import { success, failure, isSuccess, type Result } from '@/domain/value-objects/Result';
import { calculatePremiumStatus, type UserProfile, type PremiumStatus } from '@/domain/entities/User';
import { getUserRepository } from '@/repositories/implementations/SupabaseUserRepository';
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository';

export interface LoadUserProfileInput {
  userId: string;
}

export interface LoadUserProfileOutput {
  profile: UserProfile;
  premiumStatus: PremiumStatus;
}

export class LoadUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository = getUserRepository()) {}

  async execute(input: LoadUserProfileInput): Promise<Result<LoadUserProfileOutput, Error>> {
    if (!input.userId) {
      return failure(new Error('User ID is required'));
    }

    const result = await this.userRepository.loadProfile({ userId: input.userId });

    if (!isSuccess(result)) {
      return failure(result.error);
    }

    if (!result.data) {
      return failure(new Error('User profile not found'));
    }

    const premiumStatus = calculatePremiumStatus(result.data);

    return success({
      profile: result.data,
      premiumStatus,
    });
  }
}

// Factory function for easier testing
export function createLoadUserProfileUseCase(
  userRepository?: IUserRepository
): LoadUserProfileUseCase {
  return new LoadUserProfileUseCase(userRepository);
}

// Singleton instance
let instance: LoadUserProfileUseCase | null = null;

export function getLoadUserProfileUseCase(): LoadUserProfileUseCase {
  if (!instance) {
    instance = new LoadUserProfileUseCase();
  }
  return instance;
}
