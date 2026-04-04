export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Exercise { name: string; sets: number; reps: string; notes?: string }

export interface Database {
  public: {
    Tables: {
      families: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { name?: string }
        Relationships: []
      }
      family_members: {
        Row: { id: string; family_id: string; user_id: string | null; name: string; color: string; role: 'owner' | 'member'; created_at: string }
        Insert: { id?: string; family_id: string; user_id?: string | null; name: string; color?: string; role?: 'owner' | 'member' }
        Update: { name?: string; color?: string; role?: 'owner' | 'member'; user_id?: string | null }
        Relationships: []
      }
      schedule_events: {
        Row: { id: string; family_id: string; day: string; person: string; title: string; time_start: string | null; tag: string | null }
        Insert: { id?: string; family_id: string; day: string; person: string; title: string; time_start?: string | null; tag?: string | null }
        Update: { day?: string; person?: string; title?: string; time_start?: string | null; tag?: string | null }
        Relationships: []
      }
      meal_plan: {
        Row: { id: string; family_id: string; day: string; meal_type: string; description: string }
        Insert: { id?: string; family_id: string; day: string; meal_type: string; description: string }
        Update: { day?: string; meal_type?: string; description?: string }
        Relationships: []
      }
      pantry: {
        Row: { id: string; family_id: string; item: string; is_leftover: boolean; expires_date: string | null; added_date: string }
        Insert: { id?: string; family_id: string; item: string; is_leftover?: boolean; expires_date?: string | null; added_date?: string }
        Update: { item?: string; is_leftover?: boolean; expires_date?: string | null }
        Relationships: []
      }
      person_preferences: {
        Row: {
          id: string; family_id: string; family_member_id: string
          date_of_birth: string | null; height_cm: number | null
          gender: 'male' | 'female' | 'other' | null
          training_goal: 'muscle_gain' | 'weight_loss' | 'endurance' | 'general_fitness' | null
          training_goals: string[]
          meal_goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | null
          meal_goals: string[]
          experience_level: 'beginner' | 'intermediate' | 'advanced' | null
          preferred_training_days: number[]
          enable_training: boolean; enable_nutrition_ai: boolean; enable_body_tracking: boolean
          onboarding_completed: boolean; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; family_member_id: string
          date_of_birth?: string | null; height_cm?: number | null
          gender?: 'male' | 'female' | 'other' | null
          training_goal?: 'muscle_gain' | 'weight_loss' | 'endurance' | 'general_fitness' | null
          training_goals?: string[]
          meal_goal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | null
          meal_goals?: string[]
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | null
          preferred_training_days?: number[]
          enable_training?: boolean; enable_nutrition_ai?: boolean; enable_body_tracking?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          date_of_birth?: string | null; height_cm?: number | null
          gender?: 'male' | 'female' | 'other' | null
          training_goal?: 'muscle_gain' | 'weight_loss' | 'endurance' | 'general_fitness' | null
          training_goals?: string[]
          meal_goal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | null
          meal_goals?: string[]
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | null
          preferred_training_days?: number[]
          enable_training?: boolean; enable_nutrition_ai?: boolean; enable_body_tracking?: boolean
          onboarding_completed?: boolean
        }
        Relationships: []
      }
      training_plans: {
        Row: { id: string; family_id: string; person: string; start_date: string; end_date: string; goal_snapshot: string | null; created_at: string }
        Insert: { id?: string; family_id: string; person: string; start_date: string; end_date: string; goal_snapshot?: string | null }
        Update: { goal_snapshot?: string | null }
        Relationships: []
      }
      training_sessions: {
        Row: { id: string; plan_id: string; family_id: string; person: string; scheduled_date: string; workout_type: string; exercises: Exercise[]; notes: string | null; completed: boolean; created_at: string }
        Insert: { id?: string; plan_id: string; family_id: string; person: string; scheduled_date: string; workout_type: string; exercises?: Exercise[]; notes?: string | null; completed?: boolean }
        Update: { scheduled_date?: string; workout_type?: string; exercises?: Exercise[]; notes?: string | null; completed?: boolean }
        Relationships: []
      }
      progress_photos: {
        Row: { id: string; family_id: string; member_name: string; taken_at: string; storage_path: string; label: string | null; notes: string | null; ai_analysis: string | null; created_at: string }
        Insert: { id?: string; family_id: string; member_name: string; taken_at?: string; storage_path: string; label?: string | null; notes?: string | null; ai_analysis?: string | null }
        Update: { label?: string | null; notes?: string | null; ai_analysis?: string | null }
        Relationships: []
      }
      body_log: {
        Row: {
          id: string; family_id: string; member_name: string; logged_at: string
          weight_kg: number | null
          waist_cm: number | null; hip_cm: number | null; neck_cm: number | null
          chest_cm: number | null; arm_cm: number | null; thigh_cm: number | null
          estimated_bf_pct: number | null
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; family_id: string; member_name: string; logged_at?: string
          weight_kg?: number | null
          waist_cm?: number | null; hip_cm?: number | null; neck_cm?: number | null
          chest_cm?: number | null; arm_cm?: number | null; thigh_cm?: number | null
          estimated_bf_pct?: number | null
          notes?: string | null
        }
        Update: {
          weight_kg?: number | null
          waist_cm?: number | null; hip_cm?: number | null; neck_cm?: number | null
          chest_cm?: number | null; arm_cm?: number | null; thigh_cm?: number | null
          estimated_bf_pct?: number | null
          notes?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type Family             = Database['public']['Tables']['families']['Row']
export type FamilyMember       = Database['public']['Tables']['family_members']['Row']
export type ScheduleEvent      = Database['public']['Tables']['schedule_events']['Row']
export type MealPlan           = Database['public']['Tables']['meal_plan']['Row']
export type Pantry             = Database['public']['Tables']['pantry']['Row']
export type PersonPreferences  = Database['public']['Tables']['person_preferences']['Row']
export type TrainingPlan       = Database['public']['Tables']['training_plans']['Row']
export type TrainingSession    = Database['public']['Tables']['training_sessions']['Row']
export type BodyLog            = Database['public']['Tables']['body_log']['Row']
export type ProgressPhoto      = Database['public']['Tables']['progress_photos']['Row']
