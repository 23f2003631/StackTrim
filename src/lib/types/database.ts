export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audits: {
        Row: {
          id: string;
          slug: string;
          input_data: Json;
          result_data: Json;
          public_snapshot: Json;
          catalog_version: string;
          engine_version: string;
          total_monthly_savings: number;
          total_annual_savings: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          input_data: Json;
          result_data: Json;
          public_snapshot: Json;
          catalog_version: string;
          engine_version?: string;
          total_monthly_savings?: number;
          total_annual_savings?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          input_data?: Json;
          result_data?: Json;
          public_snapshot?: Json;
          catalog_version?: string;
          engine_version?: string;
          total_monthly_savings?: number;
          total_annual_savings?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          email: string;
          company_name: string | null;
          role: string | null;
          consultation_intent: boolean;
          audit_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          company_name?: string | null;
          role?: string | null;
          consultation_intent?: boolean;
          audit_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          company_name?: string | null;
          role?: string | null;
          consultation_intent?: boolean;
          audit_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          event_type: string;
          audit_id: string | null;
          event_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          audit_id?: string | null;
          event_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          audit_id?: string | null;
          event_data?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
