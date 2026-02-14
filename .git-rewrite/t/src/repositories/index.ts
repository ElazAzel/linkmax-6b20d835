/**
 * Repositories Layer - Data access abstraction
 * 
 * This layer implements the Repository pattern from Clean Architecture.
 * It contains:
 * - Interfaces: Contracts that define data access methods
 * - Implementations: Concrete implementations (e.g., Supabase)
 * 
 * Rules:
 * - Repositories abstract data access from business logic
 * - Use-cases depend on interfaces, not implementations
 * - Implementations can be swapped without changing business logic
 */

// Interfaces
export * from './interfaces';

// Implementations
export * from './implementations';
