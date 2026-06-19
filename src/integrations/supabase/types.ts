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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
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
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          id: string
          order_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          followup_sent_at: string | null
          id: string
          owner_id: string
          page_id: string
          payment_amount: number | null
          payment_method: string | null
          payment_status: string
          reminder_sent: boolean
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
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          followup_sent_at?: string | null
          id?: string
          owner_id: string
          page_id: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string
          reminder_sent?: boolean
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
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          followup_sent_at?: string | null
          id?: string
          owner_id?: string
          page_id?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string
          reminder_sent?: boolean
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
      currency_rates: {
        Row: {
          created_at: string | null
          currency_pair: string
          fetched_at: string | null
          id: string
          rate: number
          source: string | null
        }
        Insert: {
          created_at?: string | null
          currency_pair: string
          fetched_at?: string | null
          id?: string
          rate: number
          source?: string | null
        }
        Update: {
          created_at?: string | null
          currency_pair?: string
          fetched_at?: string | null
          id?: string
          rate?: number
          source?: string | null
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
          currency: string | null
          event_id: string
          id: string
          owner_id: string
          page_id: string
          paid_amount: number | null
          payment_status: string
          provider: string | null
          provider_payment_id: string | null
          status: string
          updated_at: string
          user_id: string | null
          utm_json: Json | null
        }
        Insert: {
          answers_json?: Json | null
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          block_id: string
          created_at?: string
          currency?: string | null
          event_id: string
          id?: string
          owner_id: string
          page_id: string
          paid_amount?: number | null
          payment_status?: string
          provider?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          utm_json?: Json | null
        }
        Update: {
          answers_json?: Json | null
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          block_id?: string
          created_at?: string
          currency?: string | null
          event_id?: string
          id?: string
          owner_id?: string
          page_id?: string
          paid_amount?: number | null
          payment_status?: string
          provider?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          utm_json?: Json | null
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
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
      experiment_variants: {
        Row: {
          block_data: Json
          clicks: number
          conversions: number
          created_at: string
          experiment_id: string
          id: string
          impressions: number
          variant_key: string
        }
        Insert: {
          block_data?: Json
          clicks?: number
          conversions?: number
          created_at?: string
          experiment_id: string
          id?: string
          impressions?: number
          variant_key?: string
        }
        Update: {
          block_data?: Json
          clicks?: number
          conversions?: number
          created_at?: string
          experiment_id?: string
          id?: string
          impressions?: number
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          block_id: string
          created_at: string
          ended_at: string | null
          id: string
          name: string
          page_id: string
          started_at: string
          status: string
          traffic_split: number
          winning_variant_id: string | null
        }
        Insert: {
          block_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          page_id: string
          started_at?: string
          status?: string
          traffic_split?: number
          winning_variant_id?: string | null
        }
        Update: {
          block_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          page_id?: string
          started_at?: string
          status?: string
          traffic_split?: number
          winning_variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_page_id_fkey"
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
      i18n_translations: {
        Row: {
          data: Json
          lang_code: string
          updated_at: string
        }
        Insert: {
          data?: Json
          lang_code: string
          updated_at?: string
        }
        Update: {
          data?: Json
          lang_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      indexing_submissions: {
        Row: {
          action_type: string
          batch_id: string | null
          child_item_id: string | null
          child_slug: string | null
          child_type: string | null
          created_at: string
          http_status: number | null
          id: string
          last_attempted_at: string | null
          next_retry_at: string | null
          page_id: string | null
          payload: Json | null
          provider: string
          retry_count: number
          skip_reason: string | null
          submission_status: string
          target_url: string
        }
        Insert: {
          action_type?: string
          batch_id?: string | null
          child_item_id?: string | null
          child_slug?: string | null
          child_type?: string | null
          created_at?: string
          http_status?: number | null
          id?: string
          last_attempted_at?: string | null
          next_retry_at?: string | null
          page_id?: string | null
          payload?: Json | null
          provider: string
          retry_count?: number
          skip_reason?: string | null
          submission_status?: string
          target_url: string
        }
        Update: {
          action_type?: string
          batch_id?: string | null
          child_item_id?: string | null
          child_slug?: string | null
          child_type?: string | null
          created_at?: string
          http_status?: number | null
          id?: string
          last_attempted_at?: string | null
          next_retry_at?: string | null
          page_id?: string | null
          payload?: Json | null
          provider?: string
          retry_count?: number
          skip_reason?: string | null
          submission_status?: string
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexing_submissions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indexing_submissions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
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
      newsletter_subscriptions: {
        Row: {
          block_id: string | null
          created_at: string
          email: string
          id: string
          owner_id: string
          page_id: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          email: string
          id?: string
          owner_id: string
          page_id?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string
          email?: string
          id?: string
          owner_id?: string
          page_id?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriptions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_subscriptions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          provider: string
          status: string
          updated_at: string | null
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string | null
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
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          country_code: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          editor_mode: string
          entity_type: string | null
          favicon_url: string | null
          gallery_featured_at: string | null
          gallery_likes: number | null
          grid_config: Json | null
          hide_branding: boolean | null
          id: string
          index_exclusion_reasons: string[] | null
          integrations: Json | null
          is_home: boolean
          is_in_gallery: boolean | null
          is_indexable: boolean | null
          is_paid: boolean | null
          is_primary_paid: boolean | null
          is_published: boolean | null
          last_indexnow_at: string | null
          last_snapshot_at: string | null
          niche: string | null
          organization_id: string | null
          page_path: string | null
          page_type: string | null
          preview_url: string | null
          profession: string | null
          quality_breakdown: Json | null
          quality_score: number | null
          seo_meta: Json | null
          service_slugs: Json | null
          site_id: string | null
          slug: string
          theme_settings: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          avatar_style?: Json | null
          avatar_url?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          country_code?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          editor_mode?: string
          entity_type?: string | null
          favicon_url?: string | null
          gallery_featured_at?: string | null
          gallery_likes?: number | null
          grid_config?: Json | null
          hide_branding?: boolean | null
          id?: string
          index_exclusion_reasons?: string[] | null
          integrations?: Json | null
          is_home?: boolean
          is_in_gallery?: boolean | null
          is_indexable?: boolean | null
          is_paid?: boolean | null
          is_primary_paid?: boolean | null
          is_published?: boolean | null
          last_indexnow_at?: string | null
          last_snapshot_at?: string | null
          niche?: string | null
          organization_id?: string | null
          page_path?: string | null
          page_type?: string | null
          preview_url?: string | null
          profession?: string | null
          quality_breakdown?: Json | null
          quality_score?: number | null
          seo_meta?: Json | null
          service_slugs?: Json | null
          site_id?: string | null
          slug: string
          theme_settings?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          avatar_style?: Json | null
          avatar_url?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          country_code?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          editor_mode?: string
          entity_type?: string | null
          favicon_url?: string | null
          gallery_featured_at?: string | null
          gallery_likes?: number | null
          grid_config?: Json | null
          hide_branding?: boolean | null
          id?: string
          index_exclusion_reasons?: string[] | null
          integrations?: Json | null
          is_home?: boolean
          is_in_gallery?: boolean | null
          is_indexable?: boolean | null
          is_paid?: boolean | null
          is_primary_paid?: boolean | null
          is_published?: boolean | null
          last_indexnow_at?: string | null
          last_snapshot_at?: string | null
          niche?: string | null
          organization_id?: string | null
          page_path?: string | null
          page_type?: string | null
          preview_url?: string | null
          profession?: string | null
          quality_breakdown?: Json | null
          quality_score?: number | null
          seo_meta?: Json | null
          service_slugs?: Json | null
          site_id?: string | null
          slug?: string
          theme_settings?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
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
      sites: {
        Row: {
          created_at: string
          footer_blocks: Json
          header_blocks: Json
          id: string
          name: string
          primary_page_id: string | null
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          footer_blocks?: Json
          header_blocks?: Json
          id?: string
          name?: string
          primary_page_id?: string | null
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          footer_blocks?: Json
          header_blocks?: Json
          id?: string
          name?: string
          primary_page_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_primary_page_id_fkey"
            columns: ["primary_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_primary_page_id_fkey"
            columns: ["primary_page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
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
            referencedRelation: "public_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_secrets: {
        Row: {
          created_at: string
          invite_code: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          invite_code: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          invite_code?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_secrets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "public_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_secrets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
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
          is_public?: boolean | null
          name?: string
          niche?: string | null
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_bot_settings: {
        Row: {
          active_page_id: string | null
          chat_id: string
          created_at: string
          id: string
          language: string | null
          pending_action: string | null
          updated_at: string
        }
        Insert: {
          active_page_id?: string | null
          chat_id: string
          created_at?: string
          id?: string
          language?: string | null
          pending_action?: string | null
          updated_at?: string
        }
        Update: {
          active_page_id?: string | null
          chat_id?: string
          created_at?: string
          id?: string
          language?: string | null
          pending_action?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_bot_settings_active_page_id_fkey"
            columns: ["active_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_bot_settings_active_page_id_fkey"
            columns: ["active_page_id"]
            isOneToOne: false
            referencedRelation: "public_pages"
            referencedColumns: ["id"]
          },
        ]
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
      templates: {
        Row: {
          blocks: Json
          category: string
          created_at: string
          description: string | null
          id: string
          is_premium: boolean | null
          is_public: boolean | null
          name: string
          preview_image: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          blocks?: Json
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          is_public?: boolean | null
          name: string
          preview_image?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          blocks?: Json
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          is_public?: boolean | null
          name?: string
          preview_image?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
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
      user_integrations_status: {
        Row: {
          id: string
          is_connected: boolean
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_connected?: boolean
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_connected?: boolean
          provider?: string
          updated_at?: string
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
          last_seen_at: string | null
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
          trial_started_at: string | null
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
          last_seen_at?: string | null
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
          trial_started_at?: string | null
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
          last_seen_at?: string | null
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
          trial_started_at?: string | null
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
      user_wallets: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
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
      wallet_transactions: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          description: string | null
          fee_amount: number
          gross_amount: number
          id: string
          metadata: Json | null
          net_amount: number
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json | null
          net_amount?: number
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json | null
          net_amount?: number
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
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
      zone_audit_log: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata_json: Json | null
          zone_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata_json?: Json | null
          zone_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata_json?: Json | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_audit_log_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_automations: {
        Row: {
          action_type: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          action_type: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          trigger_type: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          action_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_automations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_contact_fields: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          name: string
          order_index: number
          type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          name: string
          order_index?: number
          type?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          name?: string
          order_index?: number
          type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_contact_fields_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          type: string
          zone_id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          type?: string
          zone_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          type?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "zone_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_contact_notes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_contacts: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          custom_fields: Json | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          position: string | null
          source: string | null
          tags: string[] | null
          telegram_user_id: string | null
          telegram_username: string | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          tags?: string[] | null
          telegram_user_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          tags?: string[] | null
          telegram_user_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_contacts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          contact_id: string | null
          created_at: string
          external_chat_id: string | null
          id: string
          last_message_at: string | null
          status: string
          title: string | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          external_chat_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          external_chat_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "zone_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_conversations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_deal_activities: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          happened_at: string
          id: string
          summary: string
          type: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          happened_at?: string
          id?: string
          summary: string
          type?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          happened_at?: string
          id?: string
          summary?: string
          type?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "zone_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deal_activities_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_deal_comments: {
        Row: {
          content: string
          created_at: string | null
          deal_id: string
          id: string
          mentioned_user_ids: string[] | null
          updated_at: string | null
          user_id: string
          zone_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deal_id: string
          id?: string
          mentioned_user_ids?: string[] | null
          updated_at?: string | null
          user_id: string
          zone_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          mentioned_user_ids?: string[] | null
          updated_at?: string | null
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_deal_comments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "zone_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deal_comments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_deal_fields: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          name: string
          options: string[] | null
          order_index: number
          type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          name: string
          options?: string[] | null
          order_index?: number
          type?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          name?: string
          options?: string[] | null
          order_index?: number
          type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_deal_fields_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_deal_products: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          product_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
          zone_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
          zone_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_deal_products_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "zone_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "zone_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deal_products_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_deal_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          order_index: number
          zone_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          order_index?: number
          zone_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          order_index?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_deal_stages_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_deals: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          currency: string | null
          custom_fields: Json | null
          deleted_at: string | null
          id: string
          lost_reason: string | null
          next_step: string | null
          next_step_at: string | null
          pipeline_id: string | null
          source: string | null
          stage_id: string | null
          status: string
          title: string
          updated_at: string
          value_amount: number | null
          zone_id: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          id?: string
          lost_reason?: string | null
          next_step?: string | null
          next_step_at?: string | null
          pipeline_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string
          title: string
          updated_at?: string
          value_amount?: number | null
          zone_id: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          id?: string
          lost_reason?: string | null
          next_step?: string | null
          next_step_at?: string | null
          pipeline_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          value_amount?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "zone_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "zone_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "zone_deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_deals_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_document_templates: {
        Row: {
          content_html: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          content_html?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          content_html?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_document_templates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_documents: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          deleted_at: string | null
          document_number: string | null
          file_url: string | null
          id: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          document_number?: string | null
          file_url?: string | null
          id?: string
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          document_number?: string | null
          file_url?: string | null
          id?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "zone_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "zone_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "zone_document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_documents_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_invites: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: string
          status: string
          token: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          role?: string
          status?: string
          token?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: string
          status?: string
          token?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_invites_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number | null
          unit_price: number
          zone_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number | null
          unit_price?: number
          zone_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number | null
          unit_price?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "zone_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_invoice_items_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_invoices: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string
          currency: string
          deal_id: string | null
          deleted_at: string | null
          description: string | null
          id: string
          paid_at: string | null
          pay_url: string | null
          robokassa_invoice_id: string | null
          status: string
          zone_id: string
        }
        Insert: {
          amount: number
          contact_id?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          pay_url?: string | null
          robokassa_invoice_id?: string | null
          status?: string
          zone_id: string
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          pay_url?: string | null
          robokassa_invoice_id?: string | null
          status?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "zone_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "zone_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_invoices_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
          zone_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
          zone_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_members_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          metadata: Json | null
          sender_id: string | null
          sender_type: string
          zone_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          direction?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
          zone_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "zone_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_messages_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
          zone_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
          zone_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_notifications_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          order_index: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          order_index?: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          order_index?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_pipelines_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          unit: string
          unit_price: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          unit?: string
          unit_price?: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          unit?: string
          unit_price?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_products_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_resources: {
        Row: {
          capacity: number | null
          color: string | null
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          capacity?: number | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          type?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          capacity?: number | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_resources_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_secrets: {
        Row: {
          calendar_feed_token: string
          created_at: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          calendar_feed_token: string
          created_at?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          calendar_feed_token?: string
          created_at?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_secrets_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_payment_at: string | null
          plan_code: string
          plan_cycle: string
          status: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_at?: string | null
          plan_code: string
          plan_cycle?: string
          status?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_at?: string | null
          plan_code?: string
          plan_cycle?: string
          status?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_subscriptions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_task_checklist: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          order_index: number
          task_id: string
          title: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          order_index?: number
          task_id: string
          title: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          order_index?: number
          task_id?: string
          title?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_task_checklist_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "zone_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_task_checklist_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
          zone_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
          zone_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "zone_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_task_comments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "zone_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "zone_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_tasks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_period_end: string | null
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          plan_code: string
          plan_cycle: string
          plan_status: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_end?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          plan_code?: string
          plan_cycle?: string
          plan_status?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_end?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          plan_code?: string
          plan_cycle?: string
          plan_status?: string
          slug?: string
          updated_at?: string
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
      public_teams: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string | null
          invite_code: string | null
          is_public: boolean | null
          name: string | null
          niche: string | null
          owner_id: string | null
          slug: string | null
          updated_at: string | null
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
      accept_zone_invite: { Args: { p_token: string }; Returns: Json }
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
      auto_complete_past_bookings: {
        Args: { p_owner_id: string }
        Returns: number
      }
      check_email_registered_for_event: {
        Args: { p_email: string; p_event_id: string }
        Returns: boolean
      }
      check_page_limits: { Args: { p_user_id: string }; Returns: Json }
      claim_daily_token_reward:
        | {
            Args: { p_action_type: string; p_amount: number; p_user_id: string }
            Returns: Json
          }
        | {
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
      compute_page_quality_score: {
        Args: { p_page_id: string }
        Returns: number
      }
      convert_tokens_to_premium: { Args: { p_user_id: string }; Returns: Json }
      create_user_page: {
        Args: { p_slug: string; p_title: string; p_user_id: string }
        Returns: Json
      }
      create_zone: {
        Args: {
          p_name: string
          p_plan_code?: string
          p_plan_cycle?: string
          p_slug: string
        }
        Returns: string
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      generate_unique_slug: { Args: { base_slug: string }; Returns: string }
      get_admin_dashboard_aggregates: {
        Args: {
          p_block_limit?: number
          p_cumulative_days?: number
          p_days?: number
        }
        Returns: Json
      }
      get_admin_platform_stats: { Args: never; Returns: Json }
      get_auth_user_email: { Args: never; Returns: string }
      get_event_registration_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      get_growth_metrics: { Args: { p_days?: number }; Returns: Json }
      get_page_search_diagnostics: {
        Args: { p_page_id: string }
        Returns: Json
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
      get_public_trust_metrics: { Args: never; Returns: Json }
      get_site_pages_stats: {
        Args: { _days?: number; _site_id: string }
        Returns: {
          clicks: number
          page_id: string
          views: number
        }[]
      }
      get_team_by_invite_code: {
        Args: { p_code: string }
        Returns: {
          avatar_url: string
          description: string
          id: string
          is_public: boolean
          name: string
          niche: string
          slug: string
        }[]
      }
      get_team_invite_code: { Args: { _team_id: string }; Returns: string }
      get_team_owner: { Args: { p_team_id: string }; Returns: string }
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
      get_user_org_ids: { Args: { p_user_id: string }; Returns: string[] }
      get_user_org_ids_for_members: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_user_pages: { Args: { p_user_id: string }; Returns: Json }
      get_user_zone_ids: { Args: { p_user_id: string }; Returns: string[] }
      get_zone_calendar_feed_token: {
        Args: { p_zone_id: string }
        Returns: string
      }
      get_zone_calendar_token: { Args: { _zone_id: string }; Returns: string }
      get_zone_invite_by_token: { Args: { p_token: string }; Returns: Json }
      get_zone_member_limit: { Args: { p_plan_code: string }; Returns: number }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_block_clicks:
        | {
            Args: { block_uuid: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.increment_block_clicks(block_uuid => text), public.increment_block_clicks(block_uuid => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { block_uuid: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.increment_block_clicks(block_uuid => text), public.increment_block_clicks(block_uuid => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      increment_challenge_progress: {
        Args: { p_challenge_key: string }
        Returns: undefined
      }
      increment_view_count: { Args: { page_slug: string }; Returns: undefined }
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_public: { Args: { p_team_id: string }; Returns: boolean }
      is_zone_admin: {
        Args: { p_user_id: string; p_zone_id: string }
        Returns: boolean
      }
      is_zone_member: {
        Args: { p_user_id: string; p_zone_id: string }
        Returns: boolean
      }
      leave_zone: { Args: { p_zone_id: string }; Returns: Json }
      like_gallery_page: { Args: { p_page_id: string }; Returns: undefined }
      like_template: { Args: { p_template_id: string }; Returns: undefined }
      process_marketplace_purchase:
        | {
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
        | {
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
      regenerate_zone_calendar_feed_token: {
        Args: { p_zone_id: string }
        Returns: string
      }
      remove_zone_member: {
        Args: { p_member_user_id: string; p_zone_id: string }
        Returns: Json
      }
      rotate_team_invite_code: { Args: { p_team_id: string }; Returns: string }
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
      start_pro_trial: { Args: never; Returns: Json }
      sync_block_contact_to_zone: {
        Args: {
          p_email?: string
          p_name: string
          p_owner_user_id?: string
          p_page_id: string
          p_phone?: string
          p_source_tag?: string
        }
        Returns: string
      }
      toggle_gallery_status: { Args: { p_user_id: string }; Returns: boolean }
      unlike_gallery_page: { Args: { p_page_id: string }; Returns: undefined }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
      update_zone_member_role: {
        Args: {
          p_member_user_id: string
          p_new_role: string
          p_zone_id: string
        }
        Returns: Json
      }
      upsert_telegram_bot_active_page: {
        Args: { p_chat_id: string; p_page_id: string }
        Returns: undefined
      }
      upsert_telegram_bot_settings: {
        Args: { p_chat_id: string; p_language: string }
        Returns: undefined
      }
      upsert_user_page: {
        Args: {
          p_avatar_style: Json
          p_avatar_url: string
          p_description: string
          p_editor_mode?: string
          p_favicon_url?: string
          p_grid_config?: Json
          p_hide_branding?: boolean
          p_integrations?: Json
          p_organization_id?: string
          p_seo_meta: Json
          p_slug: string
          p_theme_settings: Json
          p_title: string
          p_user_id: string
          p_webhook_secret?: string
          p_webhook_url?: string
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
