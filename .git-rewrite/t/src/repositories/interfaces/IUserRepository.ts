/**
 * User Repository Interface - Contract for user data operations
 * Part of the Repository pattern (Clean Architecture)
 */

import type { Result } from '@/domain/value-objects/Result';
import type { UserProfile, PremiumStatus } from '@/domain/entities/User';

// ============= DTOs =============

export interface LoadUserProfileDTO {
  userId: string;
}

export interface UpdateUsernameDTO {
  userId: string;
  username: string;
}

export interface CheckUsernameAvailabilityDTO {
  username: string;
  currentUserId: string;
}

export interface CheckPremiumStatusDTO {
  userId: string;
}

// ============= Repository Interface =============

/**
 * User Repository Interface
 * Defines the contract for user data access
 */
export interface IUserRepository {
  /**
   * Load user profile by ID
   */
  loadProfile(dto: LoadUserProfileDTO): Promise<Result<UserProfile | null, Error>>;

  /**
   * Update user's username
   */
  updateUsername(dto: UpdateUsernameDTO): Promise<Result<void, Error>>;

  /**
   * Check if username is available
   */
  checkUsernameAvailability(dto: CheckUsernameAvailabilityDTO): Promise<Result<boolean, Error>>;

  /**
   * Check user's premium status
   */
  checkPremiumStatus(dto: CheckPremiumStatusDTO): Promise<Result<PremiumStatus, Error>>;

  /**
   * Create or update user profile
   */
  upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<Result<void, Error>>;
}
