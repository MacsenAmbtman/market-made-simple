// Row types for the account tables in drizzle/migrations/0000_user_accounts.sql.
// Kept here (rather than in the generated integrations/supabase/types.ts) so the app
// compiles whether or not Lovable has regenerated those types yet.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string;
  email_reminders: boolean;
  unsubscribe_token: string;
  welcome_email_sent_at: string | null;
  last_reminder_on: string | null;
  last_password_reset_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgressRow = {
  user_id: string;
  completed_lessons: string[];
  lessons: unknown;
  rewards: unknown;
  streak: number;
  best_streak: number;
  last_check_in: string | null;
  simulator: unknown;
  simulator_updated_at: string | null;
  updated_at: string;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type AccountDatabase = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "id" | "email">;
      user_progress: Table<ProgressRow, "user_id">;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** View any Supabase client through the account schema. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const accountDb = (client: SupabaseClient<any, any, any>) => client as unknown as SupabaseClient<AccountDatabase>;
