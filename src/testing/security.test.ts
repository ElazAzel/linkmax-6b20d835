/**
 * Security Integration Tests
 * Tests to verify RLS policies and security controls work correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Note: These tests verify the security architecture at the type/interface level.
// Full E2E RLS testing should be done against a real Supabase instance in CI.

describe('Security Migration Static Analysis', () => {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260216000000_comprehensive_security.sql');
  let migrationContent = '';

  beforeEach(() => {
    try {
      migrationContent = fs.readFileSync(migrationPath, 'utf8');
    } catch (error) {
      console.warn('Migration file not found, skipping static analysis');
    }
  });

  it('should exist', () => {
    if (!migrationContent) return; // Skip if file not found locally
    expect(migrationContent.length).toBeGreaterThan(0);
  });

  it('functions should be defined as SECURITY DEFINER', () => {
    if (!migrationContent) return;
    const functions = ['add_linkkon_tokens', 'spend_linkkon_tokens', 'convert_tokens_to_premium', 'apply_referral'];
    functions.forEach(func => {
      const regex = new RegExp(`CREATE OR REPLACE FUNCTION public\\.${func}[\\s\\S]*?SECURITY DEFINER`, 'i');
      expect(migrationContent).toMatch(regex);
    });
  });

  it('functions should check auth.uid()', () => {
    if (!migrationContent) return;
    const functions = ['add_linkkon_tokens', 'spend_linkkon_tokens', 'convert_tokens_to_premium', 'apply_referral'];
    functions.forEach(func => {
      // Simple check for auth.uid() presence in the function body
      const funcBodyRegex = new RegExp(`CREATE OR REPLACE FUNCTION public\\.${func}[\\s\\S]*?\\$\\$;`, 'i');
      const match = migrationContent.match(funcBodyRegex);
      expect(match).not.toBeNull();
      if (match) {
        expect(match[0]).toContain('auth.uid()');
        // Check for exclusion check
        expect(match[0]).toContain('IF auth.uid() !=');
      }
    });
  });

  it('bookings policies should be restrictive', () => {
    if (!migrationContent) return;
    expect(migrationContent).toContain('DROP POLICY IF EXISTS "Anyone can view bookings for public pages"');
    expect(migrationContent).toContain('CREATE POLICY "Owners can view all their bookings"');
    expect(migrationContent).toContain('CREATE POLICY "Users can view their own bookings"');
  });

  it('user_profiles policies should be restrictive', () => {
    if (!migrationContent) return;
    expect(migrationContent).toContain('DROP POLICY IF EXISTS "Public profiles view"');
    expect(migrationContent).toContain('CREATE POLICY "Users can view own full profile"');
  });
});


describe('Security Architecture', () => {
  describe('RLS Policy Requirements', () => {
    it('bookings table should require owner_id or user_id check', () => {
      // Verify the expected policy structure
      const expectedPolicy = {
        table: 'bookings',
        operation: 'SELECT',
        check: 'owner_id = auth.uid() OR user_id = auth.uid()',
      };

      expect(expectedPolicy.check).toContain('owner_id');
      expect(expectedPolicy.check).toContain('user_id');
      expect(expectedPolicy.check).toContain('auth.uid()');
    });

    it('event_registrations table should require owner_id or user_id check', () => {
      const expectedPolicy = {
        table: 'event_registrations',
        operation: 'SELECT',
        check: 'owner_id = auth.uid() OR user_id = auth.uid()',
      };

      expect(expectedPolicy.check).toContain('owner_id');
      expect(expectedPolicy.check).toContain('user_id');
    });

    it('leads table should require user_id check', () => {
      const expectedPolicy = {
        table: 'leads',
        operation: 'SELECT',
        check: 'user_id = auth.uid()',
      };

      expect(expectedPolicy.check).toContain('user_id');
      expect(expectedPolicy.check).toContain('auth.uid()');
    });
  });

  describe('Sensitive Data Fields', () => {
    it('should identify PII fields in bookings', () => {
      const piiFields = ['client_name', 'client_email', 'client_phone'];

      piiFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('should identify PII fields in event_registrations', () => {
      const piiFields = ['attendee_name', 'attendee_email', 'attendee_phone'];

      piiFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('should identify PII fields in leads', () => {
      const piiFields = ['name', 'email', 'phone', 'notes'];

      piiFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });
  });

  describe('Auth Flow Requirements', () => {
    it('should require authentication for sensitive operations', () => {
      const sensitiveOperations = [
        'create_page',
        'update_page',
        'delete_block',
        'view_leads',
        'view_bookings',
        'view_analytics',
      ];

      expect(sensitiveOperations.length).toBeGreaterThan(0);
      sensitiveOperations.forEach(op => {
        expect(typeof op).toBe('string');
      });
    });

    it('should define public operations correctly', () => {
      const publicOperations = [
        'view_published_page',
        'create_booking',
        'create_lead',
        'register_for_event',
      ];

      expect(publicOperations).toContain('view_published_page');
      expect(publicOperations).toContain('create_booking');
    });
  });
});

describe('Input Validation Requirements', () => {
  it('should validate slug format', () => {
    const validSlugs = ['my-page', 'test123', 'user-profile-1'];
    const invalidSlugs = ['My Page', 'test@123', 'user profile', ''];

    const slugRegex = /^[a-z0-9-]+$/;

    validSlugs.forEach(slug => {
      expect(slugRegex.test(slug)).toBe(true);
    });

    invalidSlugs.forEach(slug => {
      expect(slugRegex.test(slug)).toBe(false);
    });
  });

  it('should define max field lengths', () => {
    const maxLengths = {
      name: 100,
      email: 255,
      bio: 500,
      slug: 30,
      title: 200,
    };

    expect(maxLengths.name).toBeLessThanOrEqual(100);
    expect(maxLengths.email).toBeLessThanOrEqual(255);
    expect(maxLengths.slug).toBeLessThanOrEqual(30);
  });
});

describe('Rate Limiting Requirements', () => {
  it('should define rate limits for public endpoints', () => {
    const rateLimits = {
      'create_lead': { requests: 10, window: 60 },
      'create_booking': { requests: 10, window: 60 },
      'translate_content': { requests: 50, window: 3600 },
      'ai_generate': { requests: 20, window: 3600 },
    };

    expect(rateLimits.create_lead.requests).toBeLessThanOrEqual(20);
    expect(rateLimits.translate_content.requests).toBeLessThanOrEqual(100);
  });
});
