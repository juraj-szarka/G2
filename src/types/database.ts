export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Enums: {
      friendship_status: "pending" | "accepted" | "blocked";
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          handle: string | null;
          avatar_url: string | null;
          bio: string | null;
          invite_code: string;
          share_metrics: boolean;
          target_workout_minutes: number;
          target_sleep_minutes: number;
          target_calories: number;
          target_protein: number;
          target_carbs: number;
          target_fat: number;
          current_health_score: number;
          current_exercise_score: number;
          streak_days: number;
          workout_points_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          handle?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          invite_code?: string;
          share_metrics?: boolean;
          target_workout_minutes?: number;
          target_sleep_minutes?: number;
          target_calories?: number;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
          current_health_score?: number;
          current_exercise_score?: number;
          streak_days?: number;
          workout_points_goal?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: Database["public"]["Enums"]["friendship_status"];
          created_at: string;
          responded_at: string | null;
          updated_at: string;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: Database["public"]["Enums"]["friendship_status"];
        };
        Update: {
          status?: Database["public"]["Enums"]["friendship_status"];
          responded_at?: string | null;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          workout_minutes: number;
          workout_target_minutes: number;
          sleep_minutes: number;
          sleep_target_minutes: number;
          sleep_quality: number | null;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          target_calories: number;
          target_protein: number;
          target_carbs: number;
          target_fat: number;
          health_score: number;
          exercise_score: number;
          manual_workout_points: number;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          log_date?: string;
          workout_minutes?: number;
          workout_target_minutes?: number;
          sleep_minutes?: number;
          sleep_target_minutes?: number;
          sleep_quality?: number | null;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          target_calories?: number;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
          manual_workout_points?: number;
          synced_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_logs"]["Insert"]>;
        Relationships: [];
      };
      manual_workouts: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          name: string;
          unit: string;
          target_count: number;
          increment_step: number;
          current_count: number;
          score_per_unit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          log_date?: string;
          name?: string;
          unit?: string;
          target_count?: number;
          increment_step?: number;
          current_count?: number;
          score_per_unit?: number;
        };
        Update: Partial<Database["public"]["Tables"]["manual_workouts"]["Insert"]>;
        Relationships: [];
      };
      nutrition_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          meal_name: string | null;
          image_path: string | null;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          raw_response: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          log_date?: string;
          meal_name?: string | null;
          image_path?: string | null;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          raw_response?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["nutrition_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_friendship_by_code: {
        Args: {
          p_invite_code: string;
        };
        Returns: string;
      };
      sync_manual_workout_points: {
        Args: {
          p_user_id: string;
          p_log_date: string;
        };
        Returns: undefined;
      };
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type ManualWorkout = Database["public"]["Tables"]["manual_workouts"]["Row"];
export type NutritionLog = Database["public"]["Tables"]["nutrition_logs"]["Row"];
export type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
