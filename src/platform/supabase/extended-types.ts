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
