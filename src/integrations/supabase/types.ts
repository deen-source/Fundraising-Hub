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
      email_campaigns: {
        Row: {
          body: string
          created_at: string | null
          filters: Json | null
          id: string
          name: string
          scheduled_date: string | null
          sent_count: number | null
          sent_date: string | null
          status: string | null
          subject: string
          target_investor_ids: string[] | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          filters?: Json | null
          id?: string
          name: string
          scheduled_date?: string | null
          sent_count?: number | null
          sent_date?: string | null
          status?: string | null
          subject: string
          target_investor_ids?: string[] | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          filters?: Json | null
          id?: string
          name?: string
          scheduled_date?: string | null
          sent_count?: number | null
          sent_date?: string | null
          status?: string | null
          subject?: string
          target_investor_ids?: string[] | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          name: string
          subject: string
          template_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          name: string
          subject: string
          template_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          name?: string
          subject?: string
          template_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investor_interactions: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          interaction_date: string | null
          interaction_type: string
          investor_id: string
          outcome: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          interaction_date?: string | null
          interaction_type: string
          investor_id: string
          outcome?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string
          investor_id?: string
          outcome?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_interactions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          check_size_max: number | null
          check_size_min: number | null
          created_at: string | null
          email: string | null
          firm_name: string | null
          geographies: string[] | null
          id: string
          industries: string[] | null
          last_contact_date: string | null
          linkedin_url: string | null
          name: string
          next_follow_up_date: string | null
          notes: string | null
          pipeline_stage: string
          priority: string | null
          stage: string[] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string | null
          email?: string | null
          firm_name?: string | null
          geographies?: string[] | null
          id?: string
          industries?: string[] | null
          last_contact_date?: string | null
          linkedin_url?: string | null
          name: string
          next_follow_up_date?: string | null
          notes?: string | null
          pipeline_stage?: string
          priority?: string | null
          stage?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string | null
          email?: string | null
          firm_name?: string | null
          geographies?: string[] | null
          id?: string
          industries?: string[] | null
          last_contact_date?: string | null
          linkedin_url?: string | null
          name?: string
          next_follow_up_date?: string | null
          notes?: string | null
          pipeline_stage?: string
          priority?: string | null
          stage?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_calculations: {
        Row: {
          calculation_data: Json
          created_at: string | null
          id: string
          title: string | null
          tool_type: string
          user_id: string
        }
        Insert: {
          calculation_data: Json
          created_at?: string | null
          id?: string
          title?: string | null
          tool_type: string
          user_id: string
        }
        Update: {
          calculation_data?: Json
          created_at?: string | null
          id?: string
          title?: string | null
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_calculations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      term_sheet_analyses: {
        Row: {
          analysis_result: Json
          created_at: string | null
          id: string
          term_sheet_text: string
          user_id: string
        }
        Insert: {
          analysis_result: Json
          created_at?: string | null
          id?: string
          term_sheet_text: string
          user_id: string
        }
        Update: {
          analysis_result?: Json
          created_at?: string | null
          id?: string
          term_sheet_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_sheet_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
