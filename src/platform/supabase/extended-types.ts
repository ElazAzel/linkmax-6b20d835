import type { Database } from '@/platform/supabase/types';

type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never;
};

// Supabase generated types are missing some tables/columns from recent schema updates.
// We augment the Database type here strictly to avoid using 'any' across hooks.
export type AppDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Merge<
      Database['public']['Tables'],
      {
        // Missing tables
        zone_contacts: GenericTable;
        zone_deal_stages: GenericTable;
        zone_deals: GenericTable;
        zone_deal_activities: GenericTable;
        zone_contact_notes: GenericTable;
        zone_pipelines: GenericTable;
        zone_deal_products: GenericTable;
        zone_deal_comments: GenericTable;
        zone_invoice_items: GenericTable;
        zone_task_checklist: GenericTable;
        zone_task_comments: GenericTable;
        zone_products: GenericTable;
        zone_documents: GenericTable;
        zone_document_templates: GenericTable;
        zone_conversations: GenericTable;
        zone_messages: GenericTable;
        zone_tasks: GenericTable;
        zone_invoices: GenericTable;
        zone_invites: GenericTable;
        zone_automations: GenericTable;
        zone_contact_fields: GenericTable;
        zone_deal_fields: GenericTable;
        zone_events: GenericTable;
        zone_notifications: GenericTable;
        zone_bookings: GenericTable;
        zone_analytics: GenericTable;
        // Email marketing tables (CRIT-4 fix)
        email_sequences: GenericTable;
        email_sequence_steps: GenericTable;
        email_templates: GenericTable;
        email_logs: GenericTable;
        lead_sequence_subscriptions: GenericTable;
        // A/B testing tables (CRIT-4 fix)
        experiments: GenericTable;
        experiment_variants: GenericTable;
        experiment_events: GenericTable;
        // Social/gamification tables
        premium_gifts: GenericTable;
        page_boosts: GenericTable;
        friend_activities: GenericTable;
        // Referral tables
        referral_codes: GenericTable;
        referrals: GenericTable;
        user_profiles: {
          Row: Database['public']['Tables']['user_profiles']['Row'] & {
            kaspi_widget_enabled: boolean | null;
          };
          Insert: Database['public']['Tables']['user_profiles']['Insert'] & {
            kaspi_widget_enabled?: boolean | null;
          };
          Update: Database['public']['Tables']['user_profiles']['Update'] & {
            kaspi_widget_enabled?: boolean | null;
          };
          Relationships: Database['public']['Tables']['user_profiles']['Relationships'];
        };
      }
    >
  }
};

type GenericTable = {
  Row: any;
  Insert: any;
  Update: any;
  Relationships: any;
};
