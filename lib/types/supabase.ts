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
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      change_order_approvals: {
        Row: {
          approver_id: string | null
          approver_org_id: string | null
          change_order_id: string
          created_at: string
          decision_at: string | null
          id: string
          notes: string | null
          stage: Database["public"]["Enums"]["approval_stage"]
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          version: number
        }
        Insert: {
          approver_id?: string | null
          approver_org_id?: string | null
          change_order_id: string
          created_at?: string
          decision_at?: string | null
          id?: string
          notes?: string | null
          stage: Database["public"]["Enums"]["approval_stage"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          approver_id?: string | null
          approver_org_id?: string | null
          change_order_id?: string
          created_at?: string
          decision_at?: string | null
          id?: string
          notes?: string | null
          stage?: Database["public"]["Enums"]["approval_stage"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "change_order_approvals_approver_org_id_fkey"
            columns: ["approver_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_order_approvals_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_order_attachments: {
        Row: {
          category: Database["public"]["Enums"]["attachment_category"]
          change_order_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          uploaded_by: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["attachment_category"]
          change_order_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["attachment_category"]
          change_order_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_order_attachments_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_order_line_items: {
        Row: {
          change_order_id: string
          created_at: string
          csi_section: string | null
          description: string
          extended_cost: number | null
          gc_markup_amount: number | null
          gc_markup_percent: number | null
          id: string
          quantity: number | null
          sort_order: number
          sub_cost: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          unit: string | null
          unit_cost: number | null
          updated_at: string
          version: number
        }
        Insert: {
          change_order_id: string
          created_at?: string
          csi_section?: string | null
          description: string
          extended_cost?: number | null
          gc_markup_amount?: number | null
          gc_markup_percent?: number | null
          id?: string
          quantity?: number | null
          sort_order?: number
          sub_cost?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          change_order_id?: string
          created_at?: string
          csi_section?: string | null
          description?: string
          extended_cost?: number | null
          gc_markup_amount?: number | null
          gc_markup_percent?: number | null
          id?: string
          quantity?: number | null
          sort_order?: number
          sub_cost?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "change_order_line_items_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_order_versions: {
        Row: {
          change_order_id: string
          cost_impact: number | null
          created_at: string
          created_by: string
          id: string
          reason: string
          schedule_impact_days: number | null
          version_number: number
        }
        Insert: {
          change_order_id: string
          cost_impact?: number | null
          created_at?: string
          created_by: string
          id?: string
          reason: string
          schedule_impact_days?: number | null
          version_number: number
        }
        Update: {
          change_order_id?: string
          cost_impact?: number | null
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          schedule_impact_days?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "change_order_versions_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          approved_at: string | null
          cost_impact: number | null
          created_at: string
          created_by: string
          current_version: number
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          id: string
          invoiced_at: string | null
          new_completion_date: string | null
          number: string
          originating_event_id: string | null
          originating_event_type:
            | Database["public"]["Enums"]["originating_event_type"]
            | null
          project_id: string
          rejected_at: string | null
          schedule_impact_days: number | null
          status: Database["public"]["Enums"]["change_order_status"]
          submitted_at: string | null
          title: string
          type: Database["public"]["Enums"]["change_order_type"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          cost_impact?: number | null
          created_at?: string
          created_by: string
          current_version?: number
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          invoiced_at?: string | null
          new_completion_date?: string | null
          number: string
          originating_event_id?: string | null
          originating_event_type?:
            | Database["public"]["Enums"]["originating_event_type"]
            | null
          project_id: string
          rejected_at?: string | null
          schedule_impact_days?: number | null
          status?: Database["public"]["Enums"]["change_order_status"]
          submitted_at?: string | null
          title: string
          type: Database["public"]["Enums"]["change_order_type"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          cost_impact?: number | null
          created_at?: string
          created_by?: string
          current_version?: number
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          invoiced_at?: string | null
          new_completion_date?: string | null
          number?: string
          originating_event_id?: string | null
          originating_event_type?:
            | Database["public"]["Enums"]["originating_event_type"]
            | null
          project_id?: string
          rejected_at?: string | null
          schedule_impact_days?: number | null
          status?: Database["public"]["Enums"]["change_order_status"]
          submitted_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["change_order_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      csi_spec_sections: {
        Row: {
          created_at: string
          division: string
          division_title: string
          id: string
          section_code: string
          section_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          division: string
          division_title: string
          id?: string
          section_code: string
          section_title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          division?: string
          division_title?: string
          id?: string
          section_code?: string
          section_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_report_attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["attachment_type"]
          captured_at: string | null
          created_at: string
          daily_report_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          uploaded_by: string
        }
        Insert: {
          attachment_type?: Database["public"]["Enums"]["attachment_type"]
          captured_at?: string | null
          created_at?: string
          daily_report_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          uploaded_by: string
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["attachment_type"]
          captured_at?: string | null
          created_at?: string
          daily_report_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_attachments_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_crew_entries: {
        Row: {
          classification: string | null
          created_at: string
          csi_division: string | null
          daily_report_id: string
          headcount: number
          hourly_rate: number | null
          hours_worked: number
          id: string
          notes: string | null
          subcontractor_org_id: string | null
          trade: string
          updated_at: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          csi_division?: string | null
          daily_report_id: string
          headcount: number
          hourly_rate?: number | null
          hours_worked: number
          id?: string
          notes?: string | null
          subcontractor_org_id?: string | null
          trade: string
          updated_at?: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          csi_division?: string | null
          daily_report_id?: string
          headcount?: number
          hourly_rate?: number | null
          hours_worked?: number
          id?: string
          notes?: string | null
          subcontractor_org_id?: string | null
          trade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_crew_entries_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_crew_entries_subcontractor_org_id_fkey"
            columns: ["subcontractor_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_equipment_entries: {
        Row: {
          created_at: string
          daily_report_id: string
          equipment_id: string | null
          equipment_type: string
          fuel_consumed: number | null
          hours_used: number
          id: string
          notes: string | null
          operator_name: string | null
          rental_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_report_id: string
          equipment_id?: string | null
          equipment_type: string
          fuel_consumed?: number | null
          hours_used: number
          id?: string
          notes?: string | null
          operator_name?: string | null
          rental_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_report_id?: string
          equipment_id?: string | null
          equipment_type?: string
          fuel_consumed?: number | null
          hours_used?: number
          id?: string
          notes?: string | null
          operator_name?: string | null
          rental_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_equipment_entries_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_incidents: {
        Row: {
          corrective_action: string | null
          created_at: string
          daily_report_id: string
          description: string
          follow_up_required: boolean | null
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          involved_parties: string | null
          notes: string | null
          osha_recordable: boolean | null
          reported_to: string | null
          severity: Database["public"]["Enums"]["incident_severity"] | null
          time_occurred: string | null
          updated_at: string
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          daily_report_id: string
          description: string
          follow_up_required?: boolean | null
          id?: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          involved_parties?: string | null
          notes?: string | null
          osha_recordable?: boolean | null
          reported_to?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          time_occurred?: string | null
          updated_at?: string
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          daily_report_id?: string
          description?: string
          follow_up_required?: boolean | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          involved_parties?: string | null
          notes?: string | null
          osha_recordable?: boolean | null
          reported_to?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          time_occurred?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_incidents_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_material_entries: {
        Row: {
          created_at: string
          daily_report_id: string
          delivery_ticket: string | null
          delivery_time: string | null
          id: string
          location: string | null
          material_description: string
          notes: string | null
          quantity: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_report_id: string
          delivery_ticket?: string | null
          delivery_time?: string | null
          id?: string
          location?: string | null
          material_description: string
          notes?: string | null
          quantity: number
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_report_id?: string
          delivery_ticket?: string | null
          delivery_time?: string | null
          id?: string
          location?: string | null
          material_description?: string
          notes?: string | null
          quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_material_entries_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          delays_challenges: string | null
          deleted_at: string | null
          humidity: number | null
          id: string
          inspections: string | null
          narrative: string | null
          precipitation: number | null
          project_id: string
          report_date: string
          safety_notes: string | null
          status: Database["public"]["Enums"]["daily_report_status"]
          submitted_at: string | null
          submitted_by: string | null
          temperature_high: number | null
          temperature_low: number | null
          total_crew_count: number | null
          updated_at: string
          visitors: string | null
          visitors_inspections: string | null
          weather_condition:
            | Database["public"]["Enums"]["weather_condition"]
            | null
          wind_speed: number | null
          work_hours_end: string | null
          work_hours_start: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          delays_challenges?: string | null
          deleted_at?: string | null
          humidity?: number | null
          id?: string
          inspections?: string | null
          narrative?: string | null
          precipitation?: number | null
          project_id: string
          report_date: string
          safety_notes?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          temperature_high?: number | null
          temperature_low?: number | null
          total_crew_count?: number | null
          updated_at?: string
          visitors?: string | null
          visitors_inspections?: string | null
          weather_condition?:
            | Database["public"]["Enums"]["weather_condition"]
            | null
          wind_speed?: number | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          delays_challenges?: string | null
          deleted_at?: string | null
          humidity?: number | null
          id?: string
          inspections?: string | null
          narrative?: string | null
          precipitation?: number | null
          project_id?: string
          report_date?: string
          safety_notes?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          temperature_high?: number | null
          temperature_low?: number | null
          total_crew_count?: number | null
          updated_at?: string
          visitors?: string | null
          visitors_inspections?: string | null
          weather_condition?:
            | Database["public"]["Enums"]["weather_condition"]
            | null
          wind_speed?: number | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          invited_at: string
          invited_by: string | null
          joined_at: string | null
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
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
          deleted_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      project_access: {
        Row: {
          created_at: string
          deleted_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          trade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          trade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          trade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budget_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_amount: number
          old_amount: number | null
          project_budget_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_amount: number
          old_amount?: number | null
          project_budget_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_amount?: number
          old_amount?: number | null
          project_budget_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_history_project_budget_id_fkey"
            columns: ["project_budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_items: {
        Row: {
          ai_confidence: number | null
          ai_corrections: Json | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string
          id: string
          line_number: number | null
          line_total: number
          project_budget_id: string
          project_quote_id: string | null
          quantity: number | null
          search_vector: unknown | null
          unit_of_measure: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_corrections?: Json | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description: string
          id?: string
          line_number?: number | null
          line_total: number
          project_budget_id: string
          project_quote_id?: string | null
          quantity?: number | null
          search_vector?: unknown | null
          unit_of_measure?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_corrections?: Json | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string
          id?: string
          line_number?: number | null
          line_total?: number
          project_budget_id?: string
          project_quote_id?: string | null
          quantity?: number | null
          search_vector?: unknown | null
          unit_of_measure?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_project_budget_id_fkey"
            columns: ["project_budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_project_quote_id_fkey"
            columns: ["project_quote_id"]
            isOneToOne: false
            referencedRelation: "project_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          allocated_amount: number
          category: Database["public"]["Enums"]["project_budget_category"]
          created_at: string
          deleted_at: string | null
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          allocated_amount: number
          category: Database["public"]["Enums"]["project_budget_category"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          category?: Database["public"]["Enums"]["project_budget_category"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          amount: number
          attachments: Json | null
          budget_category: Database["public"]["Enums"]["project_budget_category"]
          cost_date: string
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          attachments?: Json | null
          budget_category: Database["public"]["Enums"]["project_budget_category"]
          cost_date: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachments?: Json | null
          budget_category?: Database["public"]["Enums"]["project_budget_category"]
          cost_date?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invoices: {
        Row: {
          ai_confidence: number | null
          ai_parsed: boolean | null
          ai_raw_response: Json | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_category: Database["public"]["Enums"]["project_budget_category"]
          created_at: string
          deleted_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          invoice_date: string | null
          invoice_number: string | null
          mime_type: string
          project_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          uploaded_by: string
          vendor_name: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_parsed?: boolean | null
          ai_raw_response?: Json | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_category: Database["public"]["Enums"]["project_budget_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          mime_type: string
          project_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          uploaded_by: string
          vendor_name?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_parsed?: boolean | null
          ai_raw_response?: Json | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_category?: Database["public"]["Enums"]["project_budget_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          mime_type?: string
          project_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          uploaded_by?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_quotes: {
        Row: {
          ai_confidence: number | null
          ai_parsed: boolean | null
          ai_raw_response: Json | null
          budget_category: Database["public"]["Enums"]["project_budget_category"]
          created_at: string
          deleted_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          page_count: number | null
          project_id: string
          quote_date: string | null
          quote_number: string | null
          total_amount: number | null
          updated_at: string
          uploaded_by: string
          vendor_name: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_parsed?: boolean | null
          ai_raw_response?: Json | null
          budget_category: Database["public"]["Enums"]["project_budget_category"]
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          page_count?: number | null
          project_id: string
          quote_date?: string | null
          quote_number?: string | null
          total_amount?: number | null
          updated_at?: string
          uploaded_by: string
          vendor_name?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_parsed?: boolean | null
          ai_raw_response?: Json | null
          budget_category?: Database["public"]["Enums"]["project_budget_category"]
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          page_count?: number | null
          project_id?: string
          quote_date?: string | null
          quote_number?: string | null
          total_amount?: number | null
          updated_at?: string
          uploaded_by?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_quotes_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget: number | null
          created_at: string
          cumulative_contract_value: number | null
          deleted_at: string | null
          end_date: string | null
          id: string
          latitude: number | null
          location_address: string | null
          longitude: number | null
          name: string
          number: string | null
          org_id: string
          settings: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          budget?: number | null
          created_at?: string
          cumulative_contract_value?: number | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          name: string
          number?: string | null
          org_id: string
          settings?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          budget?: number | null
          created_at?: string
          cumulative_contract_value?: number | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          name?: string
          number?: string | null
          org_id?: string
          settings?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_attachments: {
        Row: {
          created_at: string
          drawing_sheet: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          response_id: string | null
          rfi_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          drawing_sheet?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          response_id?: string | null
          rfi_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          drawing_sheet?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          response_id?: string | null
          rfi_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_attachments_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "rfi_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfi_attachments_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfi_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_responses: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_official_answer: boolean
          rfi_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_official_answer?: boolean
          rfi_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_official_answer?: boolean
          rfi_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_responses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfi_responses_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          answered_at: string | null
          assigned_to_id: string | null
          assigned_to_org: string | null
          closed_at: string | null
          cost_impact: number | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          deleted_at: string | null
          description: string
          discipline: string | null
          drawing_reference: string | null
          due_date: string | null
          id: string
          number: string
          overdue_at: string | null
          priority: Database["public"]["Enums"]["rfi_priority"]
          project_id: string
          response_due_date: string | null
          schedule_impact: number | null
          spec_section: string | null
          status: Database["public"]["Enums"]["rfi_status"]
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          assigned_to_id?: string | null
          assigned_to_org?: string | null
          closed_at?: string | null
          cost_impact?: number | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          deleted_at?: string | null
          description: string
          discipline?: string | null
          drawing_reference?: string | null
          due_date?: string | null
          id?: string
          number: string
          overdue_at?: string | null
          priority?: Database["public"]["Enums"]["rfi_priority"]
          project_id: string
          response_due_date?: string | null
          schedule_impact?: number | null
          spec_section?: string | null
          status?: Database["public"]["Enums"]["rfi_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          assigned_to_id?: string | null
          assigned_to_org?: string | null
          closed_at?: string | null
          cost_impact?: number | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string
          discipline?: string | null
          drawing_reference?: string | null
          due_date?: string | null
          id?: string
          number?: string
          overdue_at?: string | null
          priority?: Database["public"]["Enums"]["rfi_priority"]
          project_id?: string
          response_due_date?: string | null
          schedule_impact?: number | null
          spec_section?: string | null
          status?: Database["public"]["Enums"]["rfi_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfis_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_assigned_to_org_fkey"
            columns: ["assigned_to_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["submittal_attachment_type"]
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          submittal_id: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          attachment_type: Database["public"]["Enums"]["submittal_attachment_type"]
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          submittal_id: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["submittal_attachment_type"]
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          submittal_id?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "submittal_attachments_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_reviews: {
        Row: {
          action: Database["public"]["Enums"]["review_action"]
          comments: string | null
          created_at: string
          id: string
          reviewed_at: string
          reviewer_id: string
          stage: Database["public"]["Enums"]["review_stage"]
          submittal_id: string
          version_number: number
        }
        Insert: {
          action: Database["public"]["Enums"]["review_action"]
          comments?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string
          reviewer_id: string
          stage: Database["public"]["Enums"]["review_stage"]
          submittal_id: string
          version_number: number
        }
        Update: {
          action?: Database["public"]["Enums"]["review_action"]
          comments?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string
          reviewer_id?: string
          stage?: Database["public"]["Enums"]["review_stage"]
          submittal_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "submittal_reviews_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_versions: {
        Row: {
          id: string
          notes: string | null
          submittal_id: string
          uploaded_at: string
          uploaded_by: string
          version: string
          version_number: number
        }
        Insert: {
          id?: string
          notes?: string | null
          submittal_id: string
          uploaded_at?: string
          uploaded_by: string
          version: string
          version_number: number
        }
        Update: {
          id?: string
          notes?: string | null
          submittal_id?: string
          uploaded_at?: string
          uploaded_by?: string
          version?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "submittal_versions_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          current_reviewer_id: string | null
          current_stage: Database["public"]["Enums"]["review_stage"]
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          id: string
          lead_time_days: number | null
          number: string
          parent_submittal_id: string | null
          procurement_deadline: string | null
          project_id: string
          required_on_site: string | null
          reviewed_at: string | null
          spec_section: string
          spec_section_title: string | null
          status: Database["public"]["Enums"]["submittal_status"]
          submittal_type: Database["public"]["Enums"]["submittal_type"]
          submitted_at: string | null
          submitted_by_org: string | null
          title: string
          updated_at: string
          version: string
          version_number: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by: string
          current_reviewer_id?: string | null
          current_stage?: Database["public"]["Enums"]["review_stage"]
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          lead_time_days?: number | null
          number: string
          parent_submittal_id?: string | null
          procurement_deadline?: string | null
          project_id: string
          required_on_site?: string | null
          reviewed_at?: string | null
          spec_section: string
          spec_section_title?: string | null
          status?: Database["public"]["Enums"]["submittal_status"]
          submittal_type: Database["public"]["Enums"]["submittal_type"]
          submitted_at?: string | null
          submitted_by_org?: string | null
          title: string
          updated_at?: string
          version?: string
          version_number?: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          current_reviewer_id?: string | null
          current_stage?: Database["public"]["Enums"]["review_stage"]
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          lead_time_days?: number | null
          number?: string
          parent_submittal_id?: string | null
          procurement_deadline?: string | null
          project_id?: string
          required_on_site?: string | null
          reviewed_at?: string | null
          spec_section?: string
          spec_section_title?: string | null
          status?: Database["public"]["Enums"]["submittal_status"]
          submittal_type?: Database["public"]["Enums"]["submittal_type"]
          submitted_at?: string | null
          submitted_by_org?: string | null
          title?: string
          updated_at?: string
          version?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "submittals_parent_submittal_id_fkey"
            columns: ["parent_submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_submitted_by_org_fkey"
            columns: ["submitted_by_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_cost_summary: {
        Row: {
          allocated_amount: number | null
          category:
            | Database["public"]["Enums"]["project_budget_category"]
            | null
          project_id: string | null
          remaining_amount: number | null
          spent_amount: number | null
          spent_percentage: number | null
          total_budget: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accessible_project_ids: {
        Args: never
        Returns: {
          project_id: string
        }[]
      }
      calculate_burn_rate: {
        Args: { p_project_id: string }
        Returns: {
          daily_burn_rate: number
          days_elapsed: number
          days_remaining: number
          days_total: number
          forecasted_overrun: number
          forecasted_total: number
          status: string
          total_spent: number
        }[]
      }
      cleanup_orphaned_attachments: {
        Args: never
        Returns: {
          cleanup_timestamp: string
          deleted_count: number
        }[]
      }
      create_organization_with_member: {
        Args: { p_name: string; p_slug: string }
        Returns: {
          organization_id: string
          organization_name: string
          organization_slug: string
        }[]
      }
      create_project_with_access: {
        Args: {
          p_address?: string
          p_budget?: number
          p_end_date?: string
          p_name: string
          p_number?: string
          p_org_id: string
          p_start_date?: string
          p_status?: string
        }
        Returns: {
          project_address: string
          project_budget: number
          project_end_date: string
          project_id: string
          project_name: string
          project_number: string
          project_org_id: string
          project_start_date: string
          project_status: string
        }[]
      }
      get_audit_history: {
        Args: { p_limit?: number; p_record_id: string; p_table_name: string }
        Returns: {
          action: string
          id: string
          new_values: Json
          old_values: Json
          timestamp: string
          user_email: string
          user_id: string
        }[]
      }
      get_next_co_number: {
        Args: {
          p_project_id: string
          p_status: Database["public"]["Enums"]["change_order_status"]
        }
        Returns: string
      }
      is_org_admin: {
        Args: { check_org_id: string; user_uuid: string }
        Returns: boolean
      }
      is_project_manager: {
        Args: { check_project_id: string; user_uuid: string }
        Returns: boolean
      }
      next_rfi_number: { Args: { p_project_id: string }; Returns: string }
      next_submittal_number: {
        Args: { p_project_id: string; p_spec_section: string }
        Returns: string
      }
      recalculate_cumulative_contract_value: {
        Args: { p_project_id: string }
        Returns: number
      }
      user_org_ids: {
        Args: { user_uuid?: string }
        Returns: {
          org_id: string
        }[]
      }
      user_project_ids: {
        Args: { user_uuid?: string }
        Returns: {
          project_id: string
        }[]
      }
    }
    Enums: {
      approval_stage: "gc_review" | "owner_approval" | "architect_approval"
      approval_status: "pending" | "approved" | "rejected" | "skipped"
      attachment_category: "quote" | "drawing" | "photo" | "contract" | "other"
      attachment_type: "photo" | "document" | "other"
      change_order_status:
        | "contemplated"
        | "potential"
        | "proposed"
        | "approved"
        | "rejected"
        | "cancelled"
        | "invoiced"
      change_order_type:
        | "scope_change"
        | "design_change"
        | "site_condition"
        | "owner_requested"
        | "time_extension"
        | "cost_only"
        | "schedule_only"
      daily_report_status: "draft" | "submitted" | "approved" | "archived"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_type:
        | "safety"
        | "delay"
        | "quality"
        | "visitor"
        | "inspection"
        | "other"
      invoice_status: "pending" | "approved" | "rejected" | "paid"
      org_role: "owner" | "admin" | "member"
      originating_event_type: "rfi" | "submittal" | "daily_report" | "manual"
      project_budget_category: "labor" | "materials" | "equipment" | "other"
      project_role: "manager" | "supervisor" | "viewer"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "archived"
      review_action:
        | "approved"
        | "approved_as_noted"
        | "revise_resubmit"
        | "rejected"
        | "forwarded"
      review_stage:
        | "draft"
        | "gc_review"
        | "ae_review"
        | "owner_review"
        | "complete"
      rfi_priority: "low" | "medium" | "high" | "critical"
      rfi_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "answered"
        | "closed"
        | "cancelled"
      submittal_attachment_type:
        | "product_data"
        | "shop_drawing"
        | "sample_photo"
        | "specification"
        | "other"
      submittal_status:
        | "draft"
        | "submitted"
        | "gc_review"
        | "ae_review"
        | "owner_review"
        | "approved"
        | "approved_as_noted"
        | "revise_resubmit"
        | "rejected"
        | "cancelled"
      submittal_type: "product_data" | "shop_drawings" | "samples" | "mixed"
      weather_condition:
        | "clear"
        | "partly_cloudy"
        | "overcast"
        | "rain"
        | "snow"
        | "fog"
        | "wind"
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
      approval_stage: ["gc_review", "owner_approval", "architect_approval"],
      approval_status: ["pending", "approved", "rejected", "skipped"],
      attachment_category: ["quote", "drawing", "photo", "contract", "other"],
      attachment_type: ["photo", "document", "other"],
      change_order_status: [
        "contemplated",
        "potential",
        "proposed",
        "approved",
        "rejected",
        "cancelled",
        "invoiced",
      ],
      change_order_type: [
        "scope_change",
        "design_change",
        "site_condition",
        "owner_requested",
        "time_extension",
        "cost_only",
        "schedule_only",
      ],
      daily_report_status: ["draft", "submitted", "approved", "archived"],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_type: [
        "safety",
        "delay",
        "quality",
        "visitor",
        "inspection",
        "other",
      ],
      invoice_status: ["pending", "approved", "rejected", "paid"],
      org_role: ["owner", "admin", "member"],
      originating_event_type: ["rfi", "submittal", "daily_report", "manual"],
      project_budget_category: ["labor", "materials", "equipment", "other"],
      project_role: ["manager", "supervisor", "viewer"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "archived",
      ],
      review_action: [
        "approved",
        "approved_as_noted",
        "revise_resubmit",
        "rejected",
        "forwarded",
      ],
      review_stage: [
        "draft",
        "gc_review",
        "ae_review",
        "owner_review",
        "complete",
      ],
      rfi_priority: ["low", "medium", "high", "critical"],
      rfi_status: [
        "draft",
        "submitted",
        "under_review",
        "answered",
        "closed",
        "cancelled",
      ],
      submittal_attachment_type: [
        "product_data",
        "shop_drawing",
        "sample_photo",
        "specification",
        "other",
      ],
      submittal_status: [
        "draft",
        "submitted",
        "gc_review",
        "ae_review",
        "owner_review",
        "approved",
        "approved_as_noted",
        "revise_resubmit",
        "rejected",
        "cancelled",
      ],
      submittal_type: ["product_data", "shop_drawings", "samples", "mixed"],
      weather_condition: [
        "clear",
        "partly_cloudy",
        "overcast",
        "rain",
        "snow",
        "fog",
        "wind",
      ],
    },
  },
} as const
