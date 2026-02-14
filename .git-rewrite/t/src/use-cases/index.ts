/**
 * Use Cases - Application business logic
 * 
 * This layer contains application-specific business rules.
 * Use cases orchestrate the flow of data to and from entities,
 * and direct those entities to use their enterprise-wide business rules.
 * 
 * Rules:
 * - Use cases depend on repository interfaces, not implementations
 * - Each use case represents a single user action
 * - Use cases return Result types for error handling
 */

// Page use cases
export * from './page';

// User use cases
export * from './user';

// Re-export repository interfaces for dependency injection
export type { IPageRepository } from '@/repositories/interfaces/IPageRepository';
export type { IUserRepository } from '@/repositories/interfaces/IUserRepository';
export type { IAnalyticsRepository } from '@/repositories/interfaces/IAnalyticsRepository';
