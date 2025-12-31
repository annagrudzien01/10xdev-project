export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      child_profiles: {
        Row: {
          created_at: string;
          current_level_id: number;
          date_of_birth: string;
          id: string;
          last_played_at: string | null;
          parent_id: string;
          profile_name: string;
          total_score: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          current_level_id: number;
          date_of_birth: string;
          id?: string;
          last_played_at?: string | null;
          parent_id: string;
          profile_name: string;
          total_score?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          current_level_id?: number;
          date_of_birth?: string;
          id?: string;
          last_played_at?: string | null;
          parent_id?: string;
          profile_name?: string;
          total_score?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "child_profiles_current_level_id_fkey";
            columns: ["current_level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
        ];
      };
      levels: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          seq_length: number;
          tempo: number;
          updated_at: string | null;
          use_black_keys: boolean;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id: number;
          seq_length: number;
          tempo: number;
          updated_at?: string | null;
          use_black_keys?: boolean;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          seq_length?: number;
          tempo?: number;
          updated_at?: string | null;
          use_black_keys?: boolean;
        };
        Relationships: [];
      };
      sequence: {
        Row: {
          created_at: string;
          id: string;
          level_id: number;
          sequence_beginning: string;
          sequence_end: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          level_id: number;
          sequence_beginning: string;
          sequence_end: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          level_id?: number;
          sequence_beginning?: string;
          sequence_end?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sequence_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          child_id: string;
          created_at: string;
          ended_at: string | null;
          id: string;
          is_active: boolean;
          started_at: string;
          updated_at: string | null;
        };
        Insert: {
          child_id: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          is_active?: boolean;
          started_at?: string;
          updated_at?: string | null;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          is_active?: boolean;
          started_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "child_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_results: {
        Row: {
          attempts_used: number;
          child_id: string;
          completed_at: string;
          created_at: string;
          id: string;
          level_id: number;
          score: number;
          sequence_id: string;
          updated_at: string | null;
        };
        Insert: {
          attempts_used: number;
          child_id: string;
          completed_at?: string;
          created_at?: string;
          id?: string;
          level_id: number;
          score: number;
          sequence_id: string;
          updated_at?: string | null;
        };
        Update: {
          attempts_used?: number;
          child_id?: string;
          completed_at?: string;
          created_at?: string;
          id?: string;
          level_id?: number;
          score?: number;
          sequence_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_results_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "child_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_results_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_results_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "sequence";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
