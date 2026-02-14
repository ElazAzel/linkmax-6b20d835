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
          created_at: string
          email: string | null
          id: string
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
          created_at?: string
          email?: string | null
          id?: string
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
          created_at?: string
          email?: string | null
          id?: string
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
          is_published: boolean | null
          niche: string | null
          preview_url: string | null
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
          is_published?: boolean | null
          niche?: string | null
          preview_url?: string | null
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
          is_published?: boolean | null
          niche?: string | null
          preview_url?: string | null
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
          id: string
          is_premium: boolean | null
          last_active_date: string | null
          longest_streak: number | null
          push_notifications_enabled: boolean | null
          push_subscription: Json | null
          streak_bonus_days: number | null
          telegram_chat_id: string | null
          telegram_notifications_enabled: boolean | null
          trial_ends_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email_notifications_enabled?: boolean | null
          id: string
          is_premium?: boolean | null
          last_active_date?: string | null
          longest_streak?: number | null
          push_notifications_enabled?: boolean | null
          push_subscription?: Json | null
          streak_bonus_days?: number | null
          telegram_chat_id?: string | null
          telegram_notifications_enabled?: boolean | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          is_premium?: boolean | null
          last_active_date?: string | null
          longest_streak?: number | null
          push_notifications_enabled?: boolean | null
          push_subscription?: Json | null
          streak_bonus_days?: number | null
          telegram_chat_id?: string | null
          telegram_notifications_enabled?: boolean | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
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
    }
    Functions: {
      apply_referral: {
        Args: { p_code: string; p_referred_user_id: string }
        Returns: Json
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      complete_daily_quest: {
        Args: { p_bonus_hours?: number; p_quest_key: string; p_user_id: string }
        Returns: Json
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      generate_unique_slug: { Args: { base_slug: string }; Returns: string }
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
      increment_block_clicks: {
        Args: { block_uuid: string }
        Returns: undefined
      }
      increment_view_count: { Args: { page_slug: string }; Returns: undefined }
      like_gallery_page: { Args: { p_page_id: string }; Returns: undefined }
      save_page_blocks: {
        Args: { p_blocks: Json; p_is_premium?: boolean; p_page_id: string }
        Returns: undefined
      }
      toggle_gallery_status: { Args: { p_user_id: string }; Returns: boolean }
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
      collab_status: ["pending", "accepted", "rejected"],
      interaction_type: ["note", "call", "email", "message", "meeting"],
      lead_source: ["page_view", "form", "messenger", "manual", "other"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
    },
  },
} as const
