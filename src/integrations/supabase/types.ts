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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          end_time: string
          id: string
          start_time: string
          weekday: number
          worker_id: string
        }
        Insert: {
          end_time: string
          id?: string
          start_time: string
          weekday: number
          worker_id: string
        }
        Update: {
          end_time?: string
          id?: string
          start_time?: string
          weekday?: number
          worker_id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          note: string | null
          requested_by: string
          starts_at: string
          status: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          note?: string | null
          requested_by: string
          starts_at: string
          status?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          note?: string | null
          requested_by?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          job_id: string | null
          last_message_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          job_id?: string | null
          last_message_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string | null
          last_message_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_completions: {
        Row: {
          conversation_id: string
          created_at: string
          customer_confirmed_at: string | null
          worker_confirmed_at: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          customer_confirmed_at?: string | null
          worker_confirmed_at?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          customer_confirmed_at?: string | null
          worker_confirmed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_completions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_responses: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string
          status: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message: string
          status?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_responses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area: string
          budget_note: string | null
          category_id: string | null
          created_at: string
          customer_id: string
          description: string
          id: string
          status: string
          timing: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          budget_note?: string | null
          category_id?: string | null
          created_at?: string
          customer_id: string
          description: string
          id?: string
          status?: string
          timing?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          budget_note?: string | null
          category_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          status?: string
          timing?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          category_id: string | null
          completed_on: string | null
          created_at: string
          description: string | null
          id: string
          image_paths: string[]
          location_text: string | null
          title: string
          worker_id: string
        }
        Insert: {
          category_id?: string | null
          completed_on?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_paths?: string[]
          location_text?: string | null
          title: string
          worker_id: string
        }
        Update: {
          category_id?: string | null
          completed_on?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_paths?: string[]
          location_text?: string | null
          title?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      privacy_requests: {
        Row: {
          created_at: string
          handled_at: string | null
          id: string
          kind: string
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          id?: string
          kind: string
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          id?: string
          kind?: string
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          postcode: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          communication: number
          conversation_id: string
          created_at: string
          customer_id: string
          id: string
          quality: number
          reliability: number
          status: string
          value: number
          worker_id: string
          worker_reply: string | null
        }
        Insert: {
          body: string
          communication: number
          conversation_id: string
          created_at?: string
          customer_id: string
          id?: string
          quality: number
          reliability: number
          status?: string
          value: number
          worker_id: string
          worker_reply?: string | null
        }
        Update: {
          body?: string
          communication?: number
          conversation_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          quality?: number
          reliability?: number
          status?: string
          value?: number
          worker_id?: string
          worker_reply?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          monthly_price_pence: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_price_pence?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_price_pence?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          base_area: string | null
          bio: string | null
          business_name: string
          created_at: string
          headline: string | null
          is_published: boolean
          slug: string
          travel_radius_miles: number
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          base_area?: string | null
          bio?: string | null
          business_name: string
          created_at?: string
          headline?: string | null
          is_published?: boolean
          slug: string
          travel_radius_miles?: number
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          base_area?: string | null
          bio?: string | null
          business_name?: string
          created_at?: string
          headline?: string | null
          is_published?: boolean
          slug?: string
          travel_radius_miles?: number
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      worker_specialisms: {
        Row: {
          category_id: string
          id: string
          is_primary: boolean
          worker_id: string
        }
        Insert: {
          category_id: string
          id?: string
          is_primary?: boolean
          worker_id: string
        }
        Update: {
          category_id?: string
          id?: string
          is_primary?: boolean
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_specialisms_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_specialisms_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_job_response: { Args: { _response_id: string }; Returns: string }
      admin_set_account_status: {
        Args: { _status: string; _user: string }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      choose_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      confirm_completion: { Args: { _conv: string }; Returns: undefined }
      conversation_party_names: {
        Args: { _conv: string }
        Returns: {
          customer_name: string
          job_title: string
          worker_name: string
        }[]
      }
      decline_job_response: {
        Args: { _response_id: string }
        Returns: undefined
      }
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_party: { Args: { _conv: string }; Returns: boolean }
      notify: {
        Args: { _link: string; _title: string; _user: string }
        Returns: undefined
      }
      start_conversation_with_worker: {
        Args: { _body: string; _worker_id: string }
        Returns: string
      }
      worker_reviews: {
        Args: { _worker: string }
        Returns: {
          body: string
          communication: number
          created_at: string
          id: string
          quality: number
          reliability: number
          reviewer: string
          value: number
          worker_reply: string
        }[]
      }
    }
    Enums: {
      app_role: "customer" | "worker" | "moderator" | "admin" | "super_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["customer", "worker", "moderator", "admin", "super_admin"],
    },
  },
} as const
