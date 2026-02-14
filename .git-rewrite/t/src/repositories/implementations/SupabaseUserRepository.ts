/**
 * Supabase User Repository - Implementation of IUserRepository
 * Infrastructure layer - handles actual data access
 */

import { supabase } from '@/integrations/supabase/client';
import { success, failure, tryCatchAsync, type Result } from '@/domain/value-objects/Result';
import { 
  type UserProfile, 
  type PremiumStatus,
  calculatePremiumStatus,
  validateUsername,
  normalizeUsername 
} from '@/domain/entities/User';
import type {
  IUserRepository,
  LoadUserProfileDTO,
  UpdateUsernameDTO,
  CheckUsernameAvailabilityDTO,
  CheckPremiumStatusDTO,
} from '../interfaces/IUserRepository';

// ============= Helpers =============

function mapDbProfileToUserProfile(data: Record<string, unknown>): UserProfile {
  return {
    id: data.id as string,
    username: data.username as string | null,
    displayName: data.display_name as string | null,
    bio: data.bio as string | null,
    avatarUrl: data.avatar_url as string | null,
    isPremium: (data.is_premium as boolean) ?? false,
    trialEndsAt: data.trial_ends_at as string | null,
    createdAt: data.created_at as string | undefined,
    updatedAt: data.updated_at as string | undefined,
  };
}

// ============= Implementation =============

export class SupabaseUserRepository implements IUserRepository {
  async loadProfile(dto: LoadUserProfileDTO): Promise<Result<UserProfile | null, Error>> {
    return tryCatchAsync(async () => {
      const { userId } = dto;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return null;
      }

      return mapDbProfileToUserProfile(data);
    });
  }

  async updateUsername(dto: UpdateUsernameDTO): Promise<Result<void, Error>> {
    const { userId, username } = dto;

    // Validate username
    const validation = validateUsername(username);
    if (!validation.valid) {
      return failure(new Error(validation.error));
    }

    const normalizedUsername = normalizeUsername(username);

    // Check availability
    const availabilityResult = await this.checkUsernameAvailability({
      username: normalizedUsername,
      currentUserId: userId,
    });

    if (!availabilityResult.success) {
      return failure((availabilityResult as { success: false; error: Error }).error);
    }

    if (!(availabilityResult as { success: true; data: boolean }).data) {
      return failure(new Error('This username is already taken'));
    }

    return tryCatchAsync(async () => {
      // Update username in profile
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        id: userId,
        username: normalizedUsername,
      });

      if (profileError) {
        throw profileError;
      }

      // Sync page slug with new username
      await supabase.from('pages').update({ slug: normalizedUsername }).eq('user_id', userId);
    });
  }

  async checkUsernameAvailability(dto: CheckUsernameAvailabilityDTO): Promise<Result<boolean, Error>> {
    return tryCatchAsync(async () => {
      const { username, currentUserId } = dto;

      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', currentUserId)
        .maybeSingle();

      return !existingUser;
    });
  }

  async checkPremiumStatus(dto: CheckPremiumStatusDTO): Promise<Result<PremiumStatus, Error>> {
    return tryCatchAsync(async () => {
      const { userId } = dto;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_premium, trial_ends_at')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return { isPremium: false, trialEndsAt: null, inTrial: false };
      }

      const profile: UserProfile = {
        id: userId,
        username: null,
        displayName: null,
        bio: null,
        avatarUrl: null,
        isPremium: data.is_premium ?? false,
        trialEndsAt: data.trial_ends_at,
      };

      return calculatePremiumStatus(profile);
    });
  }

  async upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<Result<void, Error>> {
    return tryCatchAsync(async () => {
      const { error } = await supabase.from('user_profiles').upsert({
        id: profile.id,
        username: profile.username,
        display_name: profile.displayName,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        is_premium: profile.isPremium,
        trial_ends_at: profile.trialEndsAt,
      });

      if (error) {
        throw error;
      }
    });
  }
}

// ============= Singleton Instance =============

let userRepositoryInstance: SupabaseUserRepository | null = null;

export function getUserRepository(): IUserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new SupabaseUserRepository();
  }
  return userRepositoryInstance;
}
