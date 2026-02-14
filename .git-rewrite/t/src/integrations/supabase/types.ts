export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          block_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_id: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_id?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          sent_at?: string | null
          status: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "crm_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          click_count: number | null
          content: Json
          created_at: string | null
          id: string
          is_premium: boolean | null
          page_id: string
          position: number
          schedule: Json | null
          style: Json | null
          title: string | null
          type: string
        }
        Insert: {
          click_count?: number | null
          content?: Json
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          page_id: string
          position: number
          schedule?: Json | null
          style?: Json | null
          title?: string | null
          type: string
        }
        Update: {
          click_count?: number | null
          content?: Json
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          page_id?: string
          position?: number
          schedule?: Json | null
          style?: Json | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_slots: {
        Row: {
          block_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          owner_id: string
          page_id: string
          specific_date: string | null
          start_time: string
        }
        Insert: {
          block_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          owner_id: string
          page_id: string
          specific_date?: string | null
          start_time: string
        }
        Update: {
          block_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          owner_id?: string
          page_id?: string
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_slots_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_slots_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          block_id: string
          cancelled_by: string | null
          client_email: string | null
          client_name: string
          client_notes: string | null
          client_phone: string | null
          created_at: string
          id: string
          owner_id: string
          page_id: string
          slot_date: string
          slot_end_time: string | null
          slot_time: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          block_id: string
          cancelled_by?: string | null
          client_email?: string | null
          client_name: string
          client_notes?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          owner_id: string
          page_id: string
          slot_date: string
          slot_end_time?: string | null
          slot_time: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          block_id?: string
          cancelled_by?: string | null
          client_email?: string | null
          client_name?: string
          client_notes?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          page_id?: string
          slot_date?: string
          slot_end_time?: string | null
          slot_time?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_count: number
          id: string
          is_completed: boolean
          reward_claimed: boolean
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          block_settings: Json | null
          collab_slug: string | null
          created_at: string
          id: string
          message: string | null
          requester_id: string
          requester_page_id: string
          status: Database["public"]["Enums"]["collab_status"]
          target_id: string
          target_page_id: string | null
          updated_at: string
        }
        Insert: {
          block_settings?: Json | null
          collab_slug?: string | null
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          requester_page_id: string
          status?: Database["public"]["Enums"]["collab_status"]
          target_id: string
          target_page_id?: string | null
          updated_at?: string
        }
        Update: {
          block_settings?: Json | null
          collab_slug?: string | null
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          requester_page_id?: string
          status?: Database["public"]["Enums"]["collab_status"]
          target_id?: string
          target_page_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_requester_page_id_fkey"
            columns: ["requester_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_requester_page_id_fkey"
            columns: ["requester_page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_target_page_id_fkey"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_target_page_id_fkey"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automations: {
        Row: {
          automation_type: string
          created_at: string
          id: string
          is_enabled: boolean
          template_message: string
          trigger_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_type: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          template_message: string
          trigger_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          template_message?: string
          trigger_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_quests_completed: {
        Row: {
          completed_date: string
          created_at: string
          id: string
          quest_key: string
          reward_claimed: boolean
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          id?: string
          quest_key: string
          reward_claimed?: boolean
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          id?: string
          quest_key?: string
          reward_claimed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      daily_token_limits: {
        Row: {
          action_date: string
          action_type: string
          claimed: boolean
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_date?: string
          action_type: string
          claimed?: boolean
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_date?: string
          action_type?: string
          claimed?: boolean
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          answers_json: Json | null
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          block_id: string
          created_at: string
          event_id: string
          id: string
          owner_id: string
          page_id: string
          payment_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers_json?: Json | null
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          block_id: string
          created_at?: string
          event_id: string
          id?: string
          owner_id: string
          page_id: string
          payment_status?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers_json?: Json | null
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          block_id?: string
          created_at?: string
          event_id?: string
          id?: string
          owner_id?: string
          page_id?: string
          payment_status?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          checked_in_at: string | null
          created_at: string
          id: string
          registration_id: string
          status: string
          ticket_code: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          registration_id: string
          status?: string
          ticket_code: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          registration_id?: string
          status?: string
          ticket_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          block_id: string
          capacity: number | null
          cover_url: string | null
          created_at: string
          currency: string | null
          description_i18n_json: Json | null
          end_at: string | null
          form_schema_json: Json | null
          id: string
          is_paid: boolean
          location_type: string | null
          location_value: string | null
          owner_id: string
          page_id: string
          price_amount: number | null
          registration_closes_at: string | null
          settings_json: Json | null
          start_at: string | null
          status: string
          timezone: string | null
          title_i18n_json: Json
          updated_at: string
        }
        Insert: {
          block_id: string
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          description_i18n_json?: Json | null
          end_at?: string | null
          form_schema_json?: Json | null
          id?: string
          is_paid?: boolean
          location_type?: string | null
          location_value?: string | null
          owner_id: string
          page_id: string
          price_amount?: number | null
          registration_closes_at?: string | null
          settings_json?: Json | null
          start_at?: string | null
          status?: string
          timezone?: string | null
          title_i18n_json?: Json
          updated_at?: string
        }
        Update: {
          block_id?: string
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          description_i18n_json?: Json | null
          end_at?: string | null
          form_schema_json?: Json | null
          id?: string
          is_paid?: boolean
          location_type?: string | null
          location_value?: string | null
          owner_id?: string
          page_id?: string
          price_amount?: number | null
          registration_closes_at?: string | null
          settings_json?: Json | null
          start_at?: string | null
          status?: string
          timezone?: string | null
          title_i18n_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          automation_sent_count: number | null
          created_at: string
          email: string | null
          id: string
          last_automation_check: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_sent_count?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_automation_check?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_sent_count?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_automation_check?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_boosts: {
        Row: {
          boost_type: string
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          page_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          boost_type?: string
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          page_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          page_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_boosts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_boosts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_likes: {
        Row: {
          created_at: string | null
          id: string
          ip_hash: string | null
          page_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          page_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          page_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_likes_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_likes_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_snapshots: {
        Row: {
          blocks_json: Json
          content_hash: string
          created_at: string
          id: string
          page_id: string
          published_at: string
          seo_json: Json | null
          theme_json: Json | null
          version_id: string
        }
        Insert: {
          blocks_json: Json
          content_hash: string
          created_at?: string
          id?: string
          page_id: string
          published_at?: string
          seo_json?: Json | null
          theme_json?: Json | null
          version_id: string
        }
        Update: {
          blocks_json?: Json
          content_hash?: string
          created_at?: string
          id?: string
          page_id?: string
          published_at?: string
          seo_json?: Json | null
          theme_json?: Json | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_snapshots_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_snapshots_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          avatar_style: Json | null
          avatar_url: string | null
          created_at: string | null
          description: string | null
          editor_mode: string
          gallery_featured_at: string | null
          gallery_likes: number | null
          grid_config: Json | null
          id: string
          is_in_gallery: boolean | null
          is_indexable: boolean | null
          is_paid: boolean | null
          is_primary_paid: boolean | null
          is_published: boolean | null
          last_snapshot_at: string | null
          niche: string | null
          page_type: string | null
          preview_url: string | null
          quality_score: number | null
          seo_meta: Json | null
          slug: string
          theme_settings: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          avatar_style?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          editor_mode?: string
          gallery_featured_at?: string | null
          gallery_likes?: number | null
          grid_config?: Json | null
          id?: string
          is_in_gallery?: boolean | null
          is_indexable?: boolean | null
          is_paid?: boolean | null
          is_primary_paid?: boolean | null
          is_published?: boolean | null
          last_snapshot_at?: string | null
          niche?: string | null
          page_type?: string | null
          preview_url?: string | null
          quality_score?: number | null
          seo_meta?: Json | null
          slug: string
          theme_settings?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          avatar_style?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          editor_mode?: string
          gallery_featured_at?: string | null
          gallery_likes?: number | null
          grid_config?: Json | null
          id?: string
          is_in_gallery?: boolean | null
          is_indexable?: boolean | null
          is_paid?: boolean | null
          is_primary_paid?: boolean | null
          is_published?: boolean | null
          last_snapshot_at?: string | null
          niche?: string | null
          page_type?: string | null
          preview_url?: string | null
          quality_score?: number | null
          seo_meta?: Json | null
          slug?: string
          theme_settings?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      premium_gifts: {
        Row: {
          claimed_at: string | null
          created_at: string
          days_gifted: number
          id: string
          is_claimed: boolean
          message: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          days_gifted?: number
          id?: string
          is_claimed?: boolean
          message?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          days_gifted?: number
          id?: string
          is_claimed?: boolean
          message?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      private_page_data: {
        Row: {
          chatbot_context: string | null
          created_at: string
          id: string
          page_id: string
          updated_at: string
        }
        Insert: {
          chatbot_context?: string | null
          created_at?: string
          id?: string
          page_id: string
          updated_at?: string
        }
        Update: {
          chatbot_context?: string | null
          created_at?: string
          id?: string
          page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_page_data_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_page_data_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      shoutouts: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          is_featured: boolean | null
          message: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          is_featured?: boolean | null
          message?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          is_featured?: boolean | null
          message?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean | null
          name: string
          niche: string | null
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          name: string
          niche?: string | null
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          name?: string
          niche?: string | null
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_likes: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_likes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "user_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_purchases: {
        Row: {
          buyer_id: string
          currency: string
          id: string
          price: number
          purchased_at: string
          seller_id: string
          template_id: string
        }
        Insert: {
          buyer_id: string
          currency?: string
          id?: string
          price: number
          purchased_at?: string
          seller_id: string
          template_id: string
        }
        Update: {
          buyer_id?: string
          currency?: string
          id?: string
          price?: number
          purchased_at?: string
          seller_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_purchases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "user_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string
          description: string | null
          id: string
          item_id: string | null
          item_type: string | null
          net_amount: number | null
          original_price: number | null
          platform_fee: number | null
          seller_id: string | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          net_amount?: number | null
          original_price?: number | null
          platform_fee?: number | null
          seller_id?: string | null
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          net_amount?: number | null
          original_price?: number | null
          platform_fee?: number | null
          seller_id?: string | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      token_withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          created_at: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          email_notifications_enabled: boolean | null
          friends_count: number | null
          id: string
          is_premium: boolean | null
          is_verified: boolean | null
          last_active_date: string | null
          longest_streak: number | null
          premium_expires_at: string | null
          premium_tier: string | null
          push_notifications_enabled: boolean | null
          push_subscription: Json | null
          streak_bonus_days: number | null
          telegram_chat_id: string | null
          telegram_language: string | null
          telegram_notifications_enabled: boolean | null
          trial_ends_at: string | null
          updated_at: string | null
          username: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
          verification_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email_notifications_enabled?: boolean | null
          friends_count?: number | null
          id: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_date?: string | null
          longest_streak?: number | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          push_notifications_enabled?: boolean | null
          push_subscription?: Json | null
          streak_bonus_days?: number | null
          telegram_chat_id?: string | null
          telegram_language?: string | null
          telegram_notifications_enabled?: boolean | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          verification_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email_notifications_enabled?: boolean | null
          friends_count?: number | null
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_date?: string | null
          longest_streak?: number | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          push_notifications_enabled?: boolean | null
          push_subscription?: Json | null
          streak_bonus_days?: number | null
          telegram_chat_id?: string | null
          telegram_language?: string | null
          telegram_notifications_enabled?: boolean | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          verification_type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          blocks: Json
          category: string
          created_at: string
          currency: string | null
          description: string | null
          downloads_count: number
          id: string
          is_for_sale: boolean
          is_public: boolean
          likes_count: number
          name: string
          preview_url: string | null
          price: number | null
          theme_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks: Json
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          downloads_count?: number
          id?: string
          is_for_sale?: boolean
          is_public?: boolean
          likes_count?: number
          name: string
          preview_url?: string | null
          price?: number | null
          theme_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          downloads_count?: number
          id?: string
          is_for_sale?: boolean
          is_public?: boolean
          likes_count?: number
          name?: string
          preview_url?: string | null
          price?: number | null
          theme_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          business_registration_url: string | null
          created_at: string
          face_photo_url: string | null
          id: string
          id_document_url: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          verification_type: string
        }
        Insert: {
          admin_notes?: string | null
          business_registration_url?: string | null
          created_at?: string
          face_photo_url?: string | null
          id?: string
          id_document_url?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          verification_type: string
        }
        Update: {
          admin_notes?: string | null
          business_registration_url?: string | null
          created_at?: string
          face_photo_url?: string | null
          id?: string
          id_document_url?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          verification_type?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_key: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          reward_hours: number
          target_count: number
          title: string
          week_start: string
        }
        Insert: {
          challenge_key: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          reward_hours?: number
          target_count?: number
          title: string
          week_start?: string
        }
        Update: {
          challenge_key?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          reward_hours?: number
          target_count?: number
          title?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_pages: {
        Row: {
          avatar_style: Json | null
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_published: boolean | null
          seo_meta: Json | null
          slug: string | null
          theme_settings: Json | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          avatar_style?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_published?: boolean | null
          seo_meta?: Json | null
          slug?: string | null
          theme_settings?: Json | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          avatar_style?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_published?: boolean | null
          seo_meta?: Json | null
          slug?: string | null
          theme_settings?: Json | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      public_user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          friends_count: number | null
          id: string | null
          is_premium: boolean | null
          longest_streak: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          friends_count?: number | null
          id?: string | null
          is_premium?: boolean | null
          longest_streak?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          friends_count?: number | null
          id?: string | null
          is_premium?: boolean | null
          longest_streak?: number | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_linkkon_tokens: {
        Args: {
          p_amount: number
          p_description?: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      apply_referral: {
        Args: { p_code: string; p_referred_user_id: string }
        Returns: Json
      }
      check_page_limits: { Args: { p_user_id: string }; Returns: Json }
      claim_daily_token_reward: {
        Args: { p_action_type: string; p_amount: number; p_user_id: string }
        Returns: Json
      }
      claim_premium_gift: { Args: { p_gift_id: string }; Returns: Json }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      complete_daily_quest: {
        Args: { p_bonus_hours?: number; p_quest_key: string; p_user_id: string }
        Returns: Json
      }
      complete_weekly_challenge: {
        Args: { p_challenge_id: string }
        Returns: Json
      }
      convert_tokens_to_premium: { Args: { p_user_id: string }; Returns: Json }
      create_user_page: {
        Args: { p_slug: string; p_title: string; p_user_id: string }
        Returns: Json
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      generate_unique_slug: { Args: { base_slug: string }; Returns: string }
      get_event_registration_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      get_page_version: {
        Args: { p_slug: string; p_version_id?: string }
        Returns: {
          blocks_json: Json
          page_id: string
          published_at: string
          seo_json: Json
          slug: string
          theme_json: Json
          version_id: string
        }[]
      }
      get_token_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_top_referrers: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          referrals_count: number
          user_id: string
          username: string
        }[]
      }
      get_user_pages: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_block_clicks: {
        Args: { block_uuid: string }
        Returns: undefined
      }
      increment_challenge_progress: {
        Args: { p_challenge_key: string }
        Returns: undefined
      }
      increment_view_count: { Args: { page_slug: string }; Returns: undefined }
      like_gallery_page: { Args: { p_page_id: string }; Returns: undefined }
      like_template: { Args: { p_template_id: string }; Returns: undefined }
      process_marketplace_purchase: {
        Args: {
          p_buyer_id: string
          p_description?: string
          p_item_id: string
          p_item_type: string
          p_price: number
          p_seller_id: string
        }
        Returns: Json
      }
      purchase_template: { Args: { p_template_id: string }; Returns: Json }
      save_page_blocks: {
        Args: { p_blocks: Json; p_is_premium?: boolean; p_page_id: string }
        Returns: undefined
      }
      set_primary_paid_page: {
        Args: { p_page_id: string; p_user_id: string }
        Returns: Json
      }
      spend_linkkon_tokens: {
        Args: {
          p_amount: number
          p_description?: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      toggle_gallery_status: { Args: { p_user_id: string }; Returns: boolean }
      unlike_gallery_page: { Args: { p_page_id: string }; Returns: undefined }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
      upsert_user_page:
        | {
            Args: {
              p_avatar_style: Json
              p_avatar_url: string
              p_description: string
              p_seo_meta: Json
              p_slug: string
              p_theme_settings: Json
              p_title: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_avatar_style: Json
              p_avatar_url: string
              p_description: string
              p_editor_mode?: string
              p_grid_config?: Json
              p_seo_meta: Json
              p_slug: string
              p_theme_settings: Json
              p_title: string
              p_user_id: string
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      collab_status: "pending" | "accepted" | "rejected"
      interaction_type: "note" | "call" | "email" | "message" | "meeting"
      lead_source: "page_view" | "form" | "messenger" | "manual" | "other"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      collab_status: ["pending", "accepted", "rejected"],
      interaction_type: ["note", "call", "email", "message", "meeting"],
      lead_source: ["page_view", "form", "messenger", "manual", "other"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
    },
  },
} as const
