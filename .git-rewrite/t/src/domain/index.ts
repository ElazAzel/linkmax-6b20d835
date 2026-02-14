/**
 * Domain Layer - Core business logic
 * 
 * This is the innermost layer of Clean Architecture.
 * It contains:
 * - Entities: Core business objects with identity
 * - Value Objects: Immutable objects without identity
 * - Domain Services: Pure business logic
 * 
 * Rules:
 * - No external dependencies (no Supabase, no React)
 * - Only pure functions and types
 * - Business rules live here
 */

export * from './entities';
export * from './value-objects';
