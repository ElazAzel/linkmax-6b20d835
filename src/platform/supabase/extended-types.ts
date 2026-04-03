import type { Database, Json } from '@/platform/supabase/types';

type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never;
};

// Supabase generated types are missing some tables/columns from recent schema updates.
// We augment the Database type here strictly to avoid using 'any' across hooks.
// Types for missing tables to avoid 'any'
export type EmailSequenceStatus = 'active' | 'paused' | 'draft';

export type AppDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Merge<
      Database['public']['Tables'],
      {
        // Email marketing tables
        email_sequences: {
          Row: {
            id: string;
            user_id: string;
            name: string;
            status: EmailSequenceStatus;
            description: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            name: string;
            status?: EmailSequenceStatus;
            description?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            name?: string;
            status?: EmailSequenceStatus;
            description?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
        email_sequence_steps: {
          Row: {
            id: string;
            sequence_id: string;
            template_id: string;
            delay_hours: number;
            step_order: number;
            created_at: string;
          };
          Insert: {
            id?: string;
            sequence_id: string;
            template_id: string;
            delay_hours: number;
            step_order: number;
            created_at?: string;
          };
          Update: {
            id?: string;
            sequence_id?: string;
            template_id?: string;
            delay_hours?: number;
            step_order?: number;
            created_at?: string;
          };
          Relationships: [];
        };
        email_templates: {
          Row: {
            id: string;
            user_id: string;
            name: string;
            subject: string;
            content_html: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            name: string;
            subject: string;
            content_html: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            name?: string;
            subject?: string;
            content_html?: string;
            created_at?: string;
          };
          Relationships: [];
        };
        // A/B testing tables
        experiments: {
          Row: {
            id: string;
            page_id: string;
            block_id: string;
            name: string;
            status: 'draft' | 'running' | 'paused' | 'ended';
            winning_variant_id: string | null;
            started_at: string | null;
            ended_at: string | null;
            created_at: string;
            created_by: string | null;
            // Virtual extension for joined queries
            experiment_variants: AppDatabase['public']['Tables']['experiment_variants']['Row'][];
          };
          Insert: {
            id?: string;
            page_id: string;
            block_id: string;
            name: string;
            status?: 'draft' | 'running' | 'paused' | 'ended';
            winning_variant_id?: string | null;
            started_at?: string | null;
            ended_at?: string | null;
            created_at?: string;
            created_by?: string | null;
          };
          Update: {
            id?: string;
            page_id?: string;
            block_id?: string;
            name?: string;
            status?: 'draft' | 'running' | 'paused' | 'ended';
            winning_variant_id?: string | null;
            started_at?: string | null;
            ended_at?: string | null;
            created_at?: string;
            created_by?: string | null;
          };
          Relationships: [];
        };
        experiment_variants: {
          Row: {
            id: string;
            experiment_id: string;
            variant_key: string;
            block_data: Json;
            traffic_weight: number | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            experiment_id: string;
            variant_key: string;
            block_data: Json;
            traffic_weight?: number | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            experiment_id?: string;
            variant_key?: string;
            block_data?: Json;
            traffic_weight?: number | null;
            created_at?: string;
          };
          Relationships: [];
        };
        pages: {
          Row: Database['public']['Tables']['pages']['Row'] & {
            webhook_url: string | null;
            webhook_secret: string | null;
          };
          Insert: Database['public']['Tables']['pages']['Insert'] & {
            webhook_url?: string | null;
            webhook_secret?: string | null;
          };
          Update: Database['public']['Tables']['pages']['Update'] & {
            webhook_url?: string | null;
            webhook_secret?: string | null;
          };
          Relationships: Database['public']['Tables']['pages']['Relationships'];
        },
        blocks: {
          Row: Database['public']['Tables']['blocks']['Row'] & {
            deleted_at: string | null;
          };
          Insert: Database['public']['Tables']['blocks']['Insert'] & {
            deleted_at?: string | null;
          };
          Update: Database['public']['Tables']['blocks']['Update'] & {
            deleted_at?: string | null;
          };
          Relationships: Database['public']['Tables']['blocks']['Relationships'];
        },
        notification_queue: {
          Row: {
            id: string;
            user_id: string;
            event_type: string;
            payload: Json;
            status: 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';
            retry_count: number;
            last_error: string | null;
            idempotency_key: string | null;
            created_at: string;
            processed_at: string | null;
          };
          Insert: {
            id?: string;
            user_id: string;
            event_type: string;
            payload: Json;
            status?: 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';
            retry_count?: number;
            last_error?: string | null;
            idempotency_key?: string | null;
            created_at?: string;
            processed_at?: string | null;
          };
          Update: {
            id?: string;
            user_id?: string;
            event_type?: string;
            payload?: Json;
            status?: 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';
            retry_count?: number;
            last_error?: string | null;
            idempotency_key?: string | null;
            created_at?: string;
            processed_at?: string | null;
          };
          Relationships: [];
        },
        media_assets: {
          Row: {
            id: string;
            file_path: string;
            file_type: string | null;
            file_size: number | null;
            checksum: string | null;
            reference_count: number;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            file_path: string;
            file_type?: string | null;
            file_size?: number | null;
            checksum?: string | null;
            reference_count?: number;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            file_path?: string;
            file_type?: string | null;
            file_size?: number | null;
            checksum?: string | null;
            reference_count?: number;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        },
        media_references: {
          Row: {
            id: string;
            asset_id: string;
            page_id: string;
            block_id: string | null;
            reference_type: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            asset_id: string;
            page_id: string;
            block_id?: string | null;
            reference_type: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            asset_id?: string;
            page_id?: string;
            block_id?: string | null;
            reference_type?: string;
            created_at?: string;
          };
          Relationships: [];
        },
        // CRM / Zone tables (Mapping from src/types/zones.ts)
        zone_contacts: {
          Row: {
            id: string;
            zone_id: string;
            name: string;
            phone: string | null;
            email: string | null;
            telegram_user_id: string | null;
            telegram_username: string | null;
            tags: string[];
            owner_user_id: string | null;
            company: string | null;
            position: string | null;
            address: string | null;
            source: string | null;
            notes: string | null;
            custom_fields: Json | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            zone_id: string;
            name: string;
            phone?: string | null;
            email?: string | null;
            address?: string | null;
            company?: string | null;
            position?: string | null;
            source?: string | null;
            notes?: string | null;
            owner_user_id?: string | null;
            tags?: string[];
            telegram_user_id?: string | null;
            telegram_username?: string | null;
            custom_fields?: any | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            zone_id?: string;
            name?: string;
            phone?: string | null;
            email?: string | null;
            address?: string | null;
            company?: string | null;
            position?: string | null;
            source?: string | null;
            notes?: string | null;
            owner_user_id?: string | null;
            tags?: string[];
            telegram_user_id?: string | null;
            telegram_username?: string | null;
            custom_fields?: any | null;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
        // Adding placeholders for others to ensure they have at least basic structure, 
        // replacing the GenericTable completely.
        zone_deals: {
          Row: {
            id: string;
            zone_id: string;
            contact_id: string | null;
            pipeline_id: string | null;
            title: string;
            stage_id: string | null;
            value_amount: number;
            currency: string;
            status: 'open' | 'won' | 'lost';
            created_at: string;
            updated_at: string;
            deleted_at: string | null;
          };
          Insert: {
            id?: string;
            zone_id: string;
            contact_id?: string | null;
            pipeline_id?: string | null;
            title: string;
            stage_id?: string | null;
            value_amount?: number;
            currency?: string;
            status?: 'open' | 'won' | 'lost';
            created_at?: string;
            updated_at?: string;
            deleted_at?: string | null;
          };
          Update: {
            id?: string;
            zone_id?: string;
            contact_id?: string | null;
            pipeline_id?: string | null;
            title?: string;
            stage_id?: string | null;
            value_amount?: number;
            currency?: string;
            status?: 'open' | 'won' | 'lost';
            created_at?: string;
            updated_at?: string;
            deleted_at?: string | null;
          };
          Relationships: [];
        };
        zone_tasks: {
          Row: {
            id: string;
            zone_id: string;
            title: string;
            status: 'todo' | 'in_progress' | 'done' | 'cancelled';
            priority: 'low' | 'medium' | 'high' | 'urgent';
            due_date: string | null;
            created_at: string;
            updated_at: string;
            deleted_at: string | null;
          };
          Insert: {
            id?: string;
            zone_id: string;
            title: string;
            status?: 'todo' | 'in_progress' | 'done' | 'cancelled';
            priority?: 'low' | 'medium' | 'high' | 'urgent';
            due_date?: string | null;
            created_at?: string;
            updated_at?: string;
            deleted_at?: string | null;
          };
          Update: {
            id?: string;
            zone_id?: string;
            title?: string;
            status?: 'todo' | 'in_progress' | 'done' | 'cancelled';
            priority?: 'low' | 'medium' | 'high' | 'urgent';
            due_date?: string | null;
            created_at?: string;
            updated_at?: string;
            deleted_at?: string | null;
          };
          Relationships: [];
        };
        zone_invoices: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json>; Relationships: []; };
        referral_codes: {
          Row: {
            id: string;
            user_id: string;
            code: string;
            usage_count: number;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            code: string;
            usage_count?: number;
            created_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            code?: string;
            usage_count?: number;
            created_at?: string;
          };
          Relationships: [];
        };
        user_profiles: {
          Row: Database['public']['Tables']['user_profiles']['Row'] & {
            kaspi_widget_enabled: boolean | null;
            premium_tier: string | null;
            premium_expires_at: string | null;
          };
          Insert: Database['public']['Tables']['user_profiles']['Insert'] & {
            kaspi_widget_enabled?: boolean | null;
            premium_tier?: string | null;
            premium_expires_at?: string | null;
          };
          Update: Database['public']['Tables']['user_profiles']['Update'] & {
            kaspi_widget_enabled?: boolean | null;
            premium_tier?: string | null;
            premium_expires_at?: string | null;
          };
          Relationships: Database['public']['Tables']['user_profiles']['Relationships'];
        };
        newsletter_subscriptions: {
          Row: {
            id: string;
            email: string;
            page_id: string;
            block_id: string;
            owner_id: string;
            status: 'active' | 'unsubscribed';
            created_at: string;
          };
          Insert: {
            id?: string;
            email: string;
            page_id: string;
            block_id: string;
            owner_id: string;
            status?: 'active' | 'unsubscribed';
            created_at?: string;
          };
          Update: {
            id?: string;
            email?: string;
            page_id?: string;
            block_id?: string;
            owner_id?: string;
            status?: 'active' | 'unsubscribed';
            created_at?: string;
          };
          Relationships: [];
        };
        leads: {
          Row: {
            id: string;
            user_id: string;
            name: string;
            email: string | null;
            phone: string | null;
            notes: string | null;
            status: Database["public"]["Enums"]["lead_status"];
            source: Database["public"]["Enums"]["lead_source"];
            automation_sent_count: number | null;
            last_automation_check: string | null;
            metadata: any | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
            notes?: string | null;
            status?: Database["public"]["Enums"]["lead_status"];
            source?: Database["public"]["Enums"]["lead_source"];
            automation_sent_count?: number | null;
            last_automation_check?: string | null;
            metadata?: any | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            name?: string;
            email?: string | null;
            phone?: string | null;
            notes?: string | null;
            status?: Database["public"]["Enums"]["lead_status"];
            source?: Database["public"]["Enums"]["lead_source"];
            automation_sent_count?: number | null;
            last_automation_check?: string | null;
            metadata?: any | null;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
        lead_interactions: {
          Row: {
            id: string;
            lead_id: string;
            user_id: string;
            type: Database["public"]["Enums"]["interaction_type"];
            content: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            lead_id: string;
            user_id: string;
            type: Database["public"]["Enums"]["interaction_type"];
            content: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            lead_id?: string;
            user_id?: string;
            type?: Database["public"]["Enums"]["interaction_type"];
            content?: string;
            created_at?: string;
          };
          Relationships: [];
        };
        booking_slots: {
          Row: {
            id: string;
            page_id: string;
            block_id: string;
            staff_id: string | null;
            resource_id: string | null;
            day_of_week: number | null;
            specific_date: string | null;
            start_time: string;
            end_time: string | null;
            is_available: boolean;
            created_at: string;
          };
          Insert: {
            id?: string;
            page_id: string;
            block_id: string;
            staff_id?: string | null;
            resource_id?: string | null;
            day_of_week?: number | null;
            specific_date?: string | null;
            start_time: string;
            end_time?: string | null;
            is_available?: boolean;
            created_at?: string;
          };
          Update: {
            id?: string;
            page_id?: string;
            block_id?: string;
            staff_id?: string | null;
            resource_id?: string | null;
            day_of_week?: number | null;
            specific_date?: string | null;
            start_time?: string;
            end_time?: string | null;
            is_available?: boolean;
            created_at?: string;
          };
          Relationships: [];
        };
        bookings: {
          Row: {
            id: string;
            page_id: string;
            block_id: string;
            user_id: string | null;
            staff_id: string | null;
            resource_id: string | null;
            slot_date: string;
            slot_time: string;
            slot_end_time: string | null;
            client_name: string;
            client_phone: string | null;
            client_email: string | null;
            client_notes: string | null;
            status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
            payment_status: 'none' | 'pending' | 'paid' | 'refunded';
            payment_amount: number | null;
            payment_method: string | null;
            gcal_event_id: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            page_id: string;
            block_id: string;
            user_id?: string | null;
            staff_id?: string | null;
            resource_id?: string | null;
            slot_date: string;
            slot_time: string;
            slot_end_time?: string | null;
            client_name: string;
            client_phone?: string | null;
            client_email?: string | null;
            client_notes?: string | null;
            status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
            payment_status?: 'none' | 'pending' | 'paid' | 'refunded';
            payment_amount?: number | null;
            payment_method?: string | null;
            gcal_event_id?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            page_id?: string;
            block_id?: string;
            user_id?: string | null;
            staff_id?: string | null;
            resource_id?: string | null;
            slot_date?: string;
            slot_time?: string;
            slot_end_time?: string | null;
            client_name?: string;
            client_phone?: string | null;
            client_email?: string | null;
            client_notes?: string | null;
            status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
            payment_status?: 'none' | 'pending' | 'paid' | 'refunded';
            payment_amount?: number | null;
            payment_method?: string | null;
            gcal_event_id?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
        analytics: {
          Row: {
            id: string;
            page_id: string;
            block_id: string | null;
            event_type: string;
            metadata: any | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            page_id: string;
            block_id?: string | null;
            event_type: string;
            metadata?: any | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            page_id?: string;
            block_id?: string | null;
            event_type?: string;
            metadata?: any | null;
            created_at?: string;
          };
          Relationships: [];
        };
        experiment_events: {
          Row: {
            id: string;
            experiment_id: string;
            variant_id: string;
            event_type: 'impression' | 'conversion';
            visitor_id: string;
            conversion_type: string | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            experiment_id: string;
            variant_id: string;
            event_type: 'impression' | 'conversion';
            visitor_id: string;
            conversion_type?: string | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            experiment_id?: string;
            variant_id?: string;
            event_type?: 'impression' | 'conversion';
            visitor_id?: string;
            conversion_type?: string | null;
            created_at?: string;
          };
          Relationships: [];
        };
        // Fintech / Wallet tables (Missing from generated types)
        user_wallets: {
          Row: {
            id: string;
            user_id: string;
            balance: number;
            currency: string;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            balance?: number;
            currency?: string;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            balance?: number;
            currency?: string;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
        wallet_transactions: {
          Row: {
            id: string;
            wallet_id: string;
            user_id: string;
            gross_amount: number;
            fee_amount: number;
            net_amount: number;
            type: 'payment' | 'withdrawal' | 'refund' | 'fee';
            status: 'pending' | 'completed' | 'failed' | 'cancelled';
            description: string | null;
            related_entity_id: string | null;
            related_entity_type: string | null;
            metadata: any | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            wallet_id: string;
            user_id: string;
            gross_amount: number;
            fee_amount: number;
            net_amount: number;
            type: 'payment' | 'withdrawal' | 'refund' | 'fee';
            status?: 'pending' | 'completed' | 'failed' | 'cancelled';
            description?: string | null;
            related_entity_id?: string | null;
            related_entity_type?: string | null;
            metadata?: any | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            wallet_id?: string;
            user_id?: string;
            gross_amount?: number;
            fee_amount?: number;
            net_amount?: number;
            type?: 'payment' | 'withdrawal' | 'refund' | 'fee';
            status?: 'pending' | 'completed' | 'failed' | 'cancelled';
            description?: string | null;
            related_entity_id?: string | null;
            related_entity_type?: string | null;
            metadata?: any | null;
            created_at?: string;
          };
          Relationships: [];
        };
        token_withdrawals: {
          Row: {
            id: string;
            user_id: string;
            amount: number;
            payment_method: string;
            payment_details: any;
            status: 'pending' | 'approved' | 'rejected' | 'completed';
            processed_at: string | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            amount: number;
            payment_method: string;
            payment_details: any;
            status?: 'pending' | 'approved' | 'rejected' | 'completed';
            processed_at?: string | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            amount?: number;
            payment_method?: string;
            payment_details?: any;
            status?: 'pending' | 'approved' | 'rejected' | 'completed';
            processed_at?: string | null;
            created_at?: string;
          };
          Relationships: [];
        };
        zone_staff: {
          Row: {
            id: string;
            zone_id: string;
            user_id: string | null;
            name: string;
            avatar_url: string | null;
            bio: string | null;
            specialization: string | null;
            is_active: boolean;
            gcal_sync_enabled: boolean;
            gcal_calendar_id: string;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            zone_id: string;
            user_id?: string | null;
            name: string;
            avatar_url?: string | null;
            bio?: string | null;
            specialization?: string | null;
            is_active?: boolean;
            gcal_sync_enabled?: boolean;
            gcal_calendar_id?: string;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            zone_id?: string;
            user_id?: string | null;
            name?: string;
            avatar_url?: string | null;
            bio?: string | null;
            specialization?: string | null;
            is_active?: boolean;
            gcal_sync_enabled?: boolean;
            gcal_calendar_id?: string;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
        zone_staff_availability: {
          Row: {
            id: string;
            staff_id: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            is_available: boolean;
            created_at: string;
          };
          Insert: {
            id?: string;
            staff_id: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            is_available?: boolean;
            created_at?: string;
          };
          Update: {
            id?: string;
            staff_id?: string;
            day_of_week?: number;
            start_time?: string;
            end_time?: string;
            is_available?: boolean;
            created_at?: string;
          };
          Relationships: [];
        };
        zone_resources: {
          Row: {
            id: string;
            zone_id: string;
            name: string;
            description: string | null;
            type: 'room' | 'equipment' | 'other';
            capacity: number;
            is_active: boolean;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            zone_id: string;
            name: string;
            description?: string | null;
            type?: 'room' | 'equipment' | 'other';
            capacity?: number;
            is_active?: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            zone_id?: string;
            name?: string;
            description?: string | null;
            type?: 'room' | 'equipment' | 'other';
            capacity?: number;
            is_active?: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
      }
    >
  }
};
