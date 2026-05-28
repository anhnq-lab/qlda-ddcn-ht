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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agency_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "agency_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      agency_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["agency_event_type"]
          id: string
          leader_id: string | null
          location: string | null
          room: Database["public"]["Enums"]["agency_event_room"] | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type?: Database["public"]["Enums"]["agency_event_type"]
          id?: string
          leader_id?: string | null
          location?: string | null
          room?: Database["public"]["Enums"]["agency_event_room"] | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["agency_event_type"]
          id?: string
          leader_id?: string | null
          location?: string | null
          room?: Database["public"]["Enums"]["agency_event_room"] | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      annual_plan_items: {
        Row: {
          collaborating_dept_codes: string[] | null
          collaborating_text: string | null
          created_at: string
          created_by: string | null
          deliverable: string | null
          department_code: string
          department_name: string
          end_period: string | null
          frequency: Database["public"]["Enums"]["plan_frequency"]
          group_name: string | null
          group_sort_order: number | null
          id: string
          notes: string | null
          plan_year: number
          project_id: string | null
          responsible_text: string | null
          sort_order: number | null
          source_task_id: string | null
          source_type: string
          start_period: string | null
          task_name: string
          updated_at: string
        }
        Insert: {
          collaborating_dept_codes?: string[] | null
          collaborating_text?: string | null
          created_at?: string
          created_by?: string | null
          deliverable?: string | null
          department_code: string
          department_name: string
          end_period?: string | null
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          group_name?: string | null
          group_sort_order?: number | null
          id?: string
          notes?: string | null
          plan_year: number
          project_id?: string | null
          responsible_text?: string | null
          sort_order?: number | null
          source_task_id?: string | null
          source_type?: string
          start_period?: string | null
          task_name: string
          updated_at?: string
        }
        Update: {
          collaborating_dept_codes?: string[] | null
          collaborating_text?: string | null
          created_at?: string
          created_by?: string | null
          deliverable?: string | null
          department_code?: string
          department_name?: string
          end_period?: string | null
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          group_name?: string | null
          group_sort_order?: number | null
          id?: string
          notes?: string | null
          plan_year?: number
          project_id?: string | null
          responsible_text?: string | null
          sort_order?: number | null
          source_task_id?: string | null
          source_type?: string
          start_period?: string | null
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annual_plan_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "annual_plan_items_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string
          created_at: string | null
          details: string | null
          log_id: string
          target_entity: string
          target_id: string
          timestamp: string
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string | null
          details?: string | null
          log_id?: string
          target_entity: string
          target_id: string
          timestamp?: string
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string | null
          details?: string | null
          log_id?: string
          target_entity?: string
          target_id?: string
          timestamp?: string
        }
        Relationships: []
      }
      bidding_packages: {
        Row: {
          approval_date_result: string | null
          bid_closing_date: string | null
          bid_fee: number | null
          bid_opening_date: string | null
          bid_type: string | null
          bidders_count: number | null
          bidding_scope: string | null
          capital_source: string | null
          completion_pct: number | null
          completion_updated_at: string | null
          contract_id: string | null
          contract_type: string | null
          created_at: string
          decision_agency: string | null
          decision_date: string | null
          decision_file: string | null
          decision_number: string | null
          description: string | null
          duration: string | null
          estimate_price: number | null
          evaluation_bidders_count: number | null
          field: string | null
          funding_source: string | null
          has_option: boolean | null
          khlcnt_code: string | null
          msc_package_link: string | null
          msc_plan_code: string | null
          msc_publish_status: string | null
          notification_code: string | null
          package_id: string
          package_name: string
          package_number: string
          personnel: Json | null
          plan_decision_date: string | null
          plan_decision_number: string | null
          plan_group_name: string | null
          plan_id: string | null
          posting_date: string | null
          price: number
          project_id: string
          selection_duration: string | null
          selection_method: string | null
          selection_procedure: string | null
          selection_start_date: string | null
          sort_order: number | null
          status: string
          updated_at: string
          winning_consortium: Json | null
          winning_contractor_id: string | null
          winning_price: number | null
        }
        Insert: {
          approval_date_result?: string | null
          bid_closing_date?: string | null
          bid_fee?: number | null
          bid_opening_date?: string | null
          bid_type?: string | null
          bidders_count?: number | null
          bidding_scope?: string | null
          capital_source?: string | null
          completion_pct?: number | null
          completion_updated_at?: string | null
          contract_id?: string | null
          contract_type?: string | null
          created_at?: string
          decision_agency?: string | null
          decision_date?: string | null
          decision_file?: string | null
          decision_number?: string | null
          description?: string | null
          duration?: string | null
          estimate_price?: number | null
          evaluation_bidders_count?: number | null
          field?: string | null
          funding_source?: string | null
          has_option?: boolean | null
          khlcnt_code?: string | null
          msc_package_link?: string | null
          msc_plan_code?: string | null
          msc_publish_status?: string | null
          notification_code?: string | null
          package_id: string
          package_name: string
          package_number: string
          personnel?: Json | null
          plan_decision_date?: string | null
          plan_decision_number?: string | null
          plan_group_name?: string | null
          plan_id?: string | null
          posting_date?: string | null
          price?: number
          project_id: string
          selection_duration?: string | null
          selection_method?: string | null
          selection_procedure?: string | null
          selection_start_date?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
          winning_consortium?: Json | null
          winning_contractor_id?: string | null
          winning_price?: number | null
        }
        Update: {
          approval_date_result?: string | null
          bid_closing_date?: string | null
          bid_fee?: number | null
          bid_opening_date?: string | null
          bid_type?: string | null
          bidders_count?: number | null
          bidding_scope?: string | null
          capital_source?: string | null
          completion_pct?: number | null
          completion_updated_at?: string | null
          contract_id?: string | null
          contract_type?: string | null
          created_at?: string
          decision_agency?: string | null
          decision_date?: string | null
          decision_file?: string | null
          decision_number?: string | null
          description?: string | null
          duration?: string | null
          estimate_price?: number | null
          evaluation_bidders_count?: number | null
          field?: string | null
          funding_source?: string | null
          has_option?: boolean | null
          khlcnt_code?: string | null
          msc_package_link?: string | null
          msc_plan_code?: string | null
          msc_publish_status?: string | null
          notification_code?: string | null
          package_id?: string
          package_name?: string
          package_number?: string
          personnel?: Json | null
          plan_decision_date?: string | null
          plan_decision_number?: string | null
          plan_group_name?: string | null
          plan_id?: string | null
          posting_date?: string | null
          price?: number
          project_id?: string
          selection_duration?: string | null
          selection_method?: string | null
          selection_procedure?: string | null
          selection_start_date?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
          winning_consortium?: Json | null
          winning_contractor_id?: string | null
          winning_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bidding_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fk_bidding_packages_winning_contractor_id"
            columns: ["winning_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["contractor_id"]
          },
        ]
      }
      bim_models: {
        Row: {
          created_at: string | null
          discipline: string | null
          element_count: number | null
          error_message: string | null
          file_name: string
          file_size: number | null
          frag_path: string | null
          id: string
          ifc_path: string | null
          project_id: string
          properties_path: string | null
          status: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          discipline?: string | null
          element_count?: number | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          frag_path?: string | null
          id?: string
          ifc_path?: string | null
          project_id: string
          properties_path?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          discipline?: string | null
          element_count?: number | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          frag_path?: string | null
          id?: string
          ifc_path?: string | null
          project_id?: string
          properties_path?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bim_models_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      capital_plans: {
        Row: {
          amount: number
          approval_status: string | null
          approved_by: string | null
          approved_date: string | null
          created_at: string
          date_assigned: string | null
          decision_number: string | null
          disbursed_amount: number
          notes: string | null
          period_end: number | null
          period_start: number | null
          plan_id: string
          plan_type: string
          project_id: string
          source: string | null
          status: string | null
          year: number
        }
        Insert: {
          amount?: number
          approval_status?: string | null
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          date_assigned?: string | null
          decision_number?: string | null
          disbursed_amount?: number
          notes?: string | null
          period_end?: number | null
          period_start?: number | null
          plan_id: string
          plan_type?: string
          project_id: string
          source?: string | null
          status?: string | null
          year: number
        }
        Update: {
          amount?: number
          approval_status?: string | null
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          date_assigned?: string | null
          decision_number?: string | null
          disbursed_amount?: number
          notes?: string | null
          period_end?: number | null
          period_start?: number | null
          plan_id?: string
          plan_type?: string
          project_id?: string
          source?: string | null
          status?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "capital_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      cde_internal_workflow_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          created_by_name: string
          current_step_no: number
          doc_id: number | null
          due_date: string | null
          id: string
          metadata: Json
          project_id: string
          started_at: string
          status: Database["public"]["Enums"]["internal_workflow_instance_status"]
          template_code: string
          template_id: string
          template_name: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          created_by_name?: string
          current_step_no?: number
          doc_id?: number | null
          due_date?: string | null
          id?: string
          metadata?: Json
          project_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["internal_workflow_instance_status"]
          template_code: string
          template_id: string
          template_name: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string
          current_step_no?: number
          doc_id?: number | null
          due_date?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["internal_workflow_instance_status"]
          template_code?: string
          template_id?: string
          template_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cde_internal_workflow_instances_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["doc_id"]
          },
          {
            foreignKeyName: "cde_internal_workflow_instances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      cde_internal_workflow_step_records: {
        Row: {
          acted_at: string | null
          actor_id: string | null
          actor_name: string | null
          attachments: string[]
          comment: string
          created_at: string
          deadline: string | null
          department: string
          department_label: string
          id: string
          instance_id: string
          status: Database["public"]["Enums"]["internal_step_status"]
          step_code: string
          step_name: string
          step_no: number
        }
        Insert: {
          acted_at?: string | null
          actor_id?: string | null
          actor_name?: string | null
          attachments?: string[]
          comment?: string
          created_at?: string
          deadline?: string | null
          department: string
          department_label?: string
          id?: string
          instance_id: string
          status?: Database["public"]["Enums"]["internal_step_status"]
          step_code: string
          step_name: string
          step_no: number
        }
        Update: {
          acted_at?: string | null
          actor_id?: string | null
          actor_name?: string | null
          attachments?: string[]
          comment?: string
          created_at?: string
          deadline?: string | null
          department?: string
          department_label?: string
          id?: string
          instance_id?: string
          status?: Database["public"]["Enums"]["internal_step_status"]
          step_code?: string
          step_name?: string
          step_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "cde_internal_workflow_step_records_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "cde_internal_workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      cde_permissions: {
        Row: {
          account_id: string
          cde_role: string
          created_at: string
          granted_by: string | null
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          cde_role: string
          created_at?: string
          granted_by?: string | null
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          cde_role?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cde_permissions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "contractor_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "cde_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      cde_workflow_instances: {
        Row: {
          created_at: string
          current_step_index: number
          id: string
          initiated_by: string | null
          notes: string | null
          officer_name: string | null
          project_id: string
          state_code: string
          status: string
          total_steps: number
          updated_at: string
          workflow_code: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          current_step_index?: number
          id?: string
          initiated_by?: string | null
          notes?: string | null
          officer_name?: string | null
          project_id: string
          state_code?: string
          status?: string
          total_steps?: number
          updated_at?: string
          workflow_code: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          current_step_index?: number
          id?: string
          initiated_by?: string | null
          notes?: string | null
          officer_name?: string | null
          project_id?: string
          state_code?: string
          status?: string
          total_steps?: number
          updated_at?: string
          workflow_code?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cde_workflow_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cde_workflow_step_records: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          conclusion: string | null
          created_at: string
          form_code: string | null
          form_data: Json
          id: string
          instance_id: string
          is_completed: boolean
          node_id: string | null
          notes: string | null
          step_index: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          conclusion?: string | null
          created_at?: string
          form_code?: string | null
          form_data?: Json
          id?: string
          instance_id: string
          is_completed?: boolean
          node_id?: string | null
          notes?: string | null
          step_index: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          conclusion?: string | null
          created_at?: string
          form_code?: string | null
          form_data?: Json
          id?: string
          instance_id?: string
          is_completed?: boolean
          node_id?: string | null
          notes?: string | null
          step_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cde_workflow_step_records_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "cde_workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cde_workflow_step_records_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_works: {
        Row: {
          address: string | null
          design_level: number | null
          grade: number | null
          project_id: string
          type: string | null
          work_id: string
          work_name: string
        }
        Insert: {
          address?: string | null
          design_level?: number | null
          grade?: number | null
          project_id: string
          type?: string | null
          work_id?: string
          work_name: string
        }
        Update: {
          address?: string | null
          design_level?: number | null
          grade?: number | null
          project_id?: string
          type?: string | null
          work_id?: string
          work_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_works_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      contractor_accounts: {
        Row: {
          account_id: string
          allowed_project_ids: string[] | null
          auth_user_id: string | null
          contractor_id: string | null
          created_at: string
          display_name: string | null
          is_active: boolean
          updated_at: string
          username: string
        }
        Insert: {
          account_id?: string
          allowed_project_ids?: string[] | null
          auth_user_id?: string | null
          contractor_id?: string | null
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          account_id?: string
          allowed_project_ids?: string[] | null
          auth_user_id?: string | null
          contractor_id?: string | null
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_accounts_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["contractor_id"]
          },
        ]
      }
      contractors: {
        Row: {
          address: string | null
          cap_cert_code: string | null
          cap_cert_link: string | null
          contact_info: string | null
          contractor_id: string
          contractor_type: string | null
          created_at: string
          email: string | null
          established_year: number | null
          full_name: string
          is_foreign: boolean
          op_license_no: string | null
          representative: string | null
          tax_code: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          cap_cert_code?: string | null
          cap_cert_link?: string | null
          contact_info?: string | null
          contractor_id: string
          contractor_type?: string | null
          created_at?: string
          email?: string | null
          established_year?: number | null
          full_name: string
          is_foreign?: boolean
          op_license_no?: string | null
          representative?: string | null
          tax_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          cap_cert_code?: string | null
          cap_cert_link?: string | null
          contact_info?: string | null
          contractor_id?: string
          contractor_type?: string | null
          created_at?: string
          email?: string | null
          established_year?: number | null
          full_name?: string
          is_foreign?: boolean
          op_license_no?: string | null
          representative?: string | null
          tax_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          advance_rate: number | null
          contract_id: string
          contract_name: string | null
          contract_type: string | null
          contractor_id: string | null
          created_at: string
          duration_months: number | null
          end_date: string | null
          has_vat: boolean | null
          package_id: string | null
          payment_terms: string | null
          project_id: string | null
          scope: string | null
          sign_date: string | null
          start_date: string | null
          status: number
          updated_at: string
          value: number
          warranty: number | null
        }
        Insert: {
          advance_rate?: number | null
          contract_id: string
          contract_name?: string | null
          contract_type?: string | null
          contractor_id?: string | null
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          has_vat?: boolean | null
          package_id?: string | null
          payment_terms?: string | null
          project_id?: string | null
          scope?: string | null
          sign_date?: string | null
          start_date?: string | null
          status?: number
          updated_at?: string
          value?: number
          warranty?: number | null
        }
        Update: {
          advance_rate?: number | null
          contract_id?: string
          contract_name?: string | null
          contract_type?: string | null
          contractor_id?: string | null
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          has_vat?: boolean | null
          package_id?: string | null
          payment_terms?: string | null
          project_id?: string | null
          scope?: string | null
          sign_date?: string | null
          start_date?: string | null
          status?: number
          updated_at?: string
          value?: number
          warranty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "contracts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "bidding_packages"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      disbursement_plans: {
        Row: {
          actual_amount: number
          created_at: string | null
          id: string
          month: number
          notes: string | null
          planned_amount: number
          project_id: string
          year: number
        }
        Insert: {
          actual_amount?: number
          created_at?: string | null
          id: string
          month: number
          notes?: string | null
          planned_amount?: number
          project_id: string
          year: number
        }
        Update: {
          actual_amount?: number
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          planned_amount?: number
          project_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "disbursement_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      disbursements: {
        Row: {
          advance_balance: number
          amount: number
          capital_plan_id: string | null
          contract_number: string | null
          created_at: string
          cumulative_before: number
          date: string
          description: string | null
          disbursement_id: string
          form_type: string | null
          payment_id: number | null
          project_id: string
          status: string
          treasury_code: string | null
          type: string
        }
        Insert: {
          advance_balance?: number
          amount?: number
          capital_plan_id?: string | null
          contract_number?: string | null
          created_at?: string
          cumulative_before?: number
          date: string
          description?: string | null
          disbursement_id: string
          form_type?: string | null
          payment_id?: number | null
          project_id: string
          status?: string
          treasury_code?: string | null
          type?: string
        }
        Update: {
          advance_balance?: number
          amount?: number
          capital_plan_id?: string | null
          contract_number?: string | null
          created_at?: string
          cumulative_before?: number
          date?: string
          description?: string | null
          disbursement_id?: string
          form_type?: string | null
          payment_id?: number | null
          project_id?: string
          status?: string
          treasury_code?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "disbursements_capital_plan_id_fkey"
            columns: ["capital_plan_id"]
            isOneToOne: false
            referencedRelation: "capital_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "disbursements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "disbursements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      documents: {
        Row: {
          book_number: string | null
          category: number
          created_at: string
          doc_id: number
          doc_name: string
          doc_type: string | null
          document_book: string | null
          document_number: string | null
          document_symbol: string | null
          drafter: string | null
          drafting_department: string | null
          file_hash: string | null
          folder_id: string | null
          is_digitized: boolean | null
          is_latest: boolean | null
          iso_status: string | null
          issue_date: string | null
          issuing_authority: string | null
          notes: string | null
          project_id: string | null
          reference_id: string | null
          revision: string | null
          signer: string | null
          size: string | null
          source: string | null
          storage_path: string
          summary: string | null
          upload_date: string
          uploaded_by: string | null
          version: string | null
          version_group_id: string | null
        }
        Insert: {
          book_number?: string | null
          category?: number
          created_at?: string
          doc_id?: number
          doc_name: string
          doc_type?: string | null
          document_book?: string | null
          document_number?: string | null
          document_symbol?: string | null
          drafter?: string | null
          drafting_department?: string | null
          file_hash?: string | null
          folder_id?: string | null
          is_digitized?: boolean | null
          is_latest?: boolean | null
          iso_status?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          project_id?: string | null
          reference_id?: string | null
          revision?: string | null
          signer?: string | null
          size?: string | null
          source?: string | null
          storage_path: string
          summary?: string | null
          upload_date?: string
          uploaded_by?: string | null
          version?: string | null
          version_group_id?: string | null
        }
        Update: {
          book_number?: string | null
          category?: number
          created_at?: string
          doc_id?: number
          doc_name?: string
          doc_type?: string | null
          document_book?: string | null
          document_number?: string | null
          document_symbol?: string | null
          drafter?: string | null
          drafting_department?: string | null
          file_hash?: string | null
          folder_id?: string | null
          is_digitized?: boolean | null
          is_latest?: boolean | null
          iso_status?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          project_id?: string | null
          reference_id?: string | null
          revision?: string | null
          signer?: string | null
          size?: string | null
          source?: string | null
          storage_path?: string
          summary?: string | null
          upload_date?: string
          uploaded_by?: string | null
          version?: string | null
          version_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          completion_criteria: string | null
          created_at: string
          department: string | null
          email: string | null
          employee_id: string
          full_name: string
          gender: string | null
          job_content: string | null
          join_date: string | null
          managed_unit_ids: string[] | null
          management_rank: number | null
          phone: string | null
          position: string | null
          role: string
          status: number
          system_role: string | null
          updated_at: string
          date_of_birth: string | null
          permanent_address: string | null
          specialty: string | null
          political_theory: string | null
          tenure_info: string | null
        }
        Insert: {
          avatar_url?: string | null
          completion_criteria?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id: string
          full_name: string
          gender?: string | null
          job_content?: string | null
          join_date?: string | null
          managed_unit_ids?: string[] | null
          management_rank?: number | null
          phone?: string | null
          position?: string | null
          role?: string
          status?: number
          system_role?: string | null
          updated_at?: string
          date_of_birth?: string | null
          permanent_address?: string | null
          specialty?: string | null
          political_theory?: string | null
          tenure_info?: string | null
        }
        Update: {
          avatar_url?: string | null
          completion_criteria?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string
          full_name?: string
          gender?: string | null
          job_content?: string | null
          join_date?: string | null
          managed_unit_ids?: string[] | null
          management_rank?: number | null
          phone?: string | null
          position?: string | null
          role?: string
          status?: number
          system_role?: string | null
          updated_at?: string
          date_of_birth?: string | null
          permanent_address?: string | null
          specialty?: string | null
          political_theory?: string | null
          tenure_info?: string | null
        }
        Relationships: []
      }
      evaluation_forms: {
        Row: {
          chuc_vu: string | null
          created_at: string
          department_code: string
          department_name: string
          employee_id: string
          employee_name: string
          eval_month: number
          eval_year: number
          form_type: string
          id: string
          manager_id: string | null
          manager_name: string | null
          manager_notes: string | null
          manager_score_1: number | null
          manager_score_2: number | null
          manager_score_3: number | null
          manager_score_4: number | null
          manager_score_5: number | null
          manager_score_6: number | null
          manager_score_7: number | null
          manager_scores: Json | null
          reviewed_at: string | null
          self_notes: string | null
          self_score_1: number
          self_score_2: number
          self_score_3: number
          self_score_4: number
          self_score_5: number
          self_score_6: number
          self_score_7: number
          self_scores: Json | null
          self_submitted_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          chuc_vu?: string | null
          created_at?: string
          department_code?: string
          department_name?: string
          employee_id: string
          employee_name?: string
          eval_month: number
          eval_year: number
          form_type?: string
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          manager_notes?: string | null
          manager_score_1?: number | null
          manager_score_2?: number | null
          manager_score_3?: number | null
          manager_score_4?: number | null
          manager_score_5?: number | null
          manager_score_6?: number | null
          manager_score_7?: number | null
          manager_scores?: Json | null
          reviewed_at?: string | null
          self_notes?: string | null
          self_score_1?: number
          self_score_2?: number
          self_score_3?: number
          self_score_4?: number
          self_score_5?: number
          self_score_6?: number
          self_score_7?: number
          self_scores?: Json | null
          self_submitted_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          chuc_vu?: string | null
          created_at?: string
          department_code?: string
          department_name?: string
          employee_id?: string
          employee_name?: string
          eval_month?: number
          eval_year?: number
          form_type?: string
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          manager_notes?: string | null
          manager_score_1?: number | null
          manager_score_2?: number | null
          manager_score_3?: number | null
          manager_score_4?: number | null
          manager_score_5?: number | null
          manager_score_6?: number | null
          manager_score_7?: number | null
          manager_scores?: Json | null
          reviewed_at?: string | null
          self_notes?: string | null
          self_score_1?: number
          self_score_2?: number
          self_score_3?: number
          self_score_4?: number
          self_score_5?: number
          self_score_6?: number
          self_score_7?: number
          self_scores?: Json | null
          self_submitted_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_forms_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "evaluation_forms_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      facility_assets: {
        Row: {
          asset_code: string | null
          asset_id: string
          asset_name: string
          bim_element_id: string | null
          category: string | null
          condition: string | null
          created_at: string | null
          install_date: string | null
          last_maintenance: string | null
          location: string | null
          maintenance_cycle_days: number | null
          manufacturer: string | null
          model: string | null
          next_maintenance: string | null
          notes: string | null
          project_id: string
          status: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_code?: string | null
          asset_id?: string
          asset_name: string
          bim_element_id?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          install_date?: string | null
          last_maintenance?: string | null
          location?: string | null
          maintenance_cycle_days?: number | null
          manufacturer?: string | null
          model?: string | null
          next_maintenance?: string | null
          notes?: string | null
          project_id: string
          status?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_code?: string | null
          asset_id?: string
          asset_name?: string
          bim_element_id?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          install_date?: string | null
          last_maintenance?: string | null
          location?: string | null
          maintenance_cycle_days?: number | null
          manufacturer?: string | null
          model?: string | null
          next_maintenance?: string | null
          notes?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      feasibility_studies: {
        Row: {
          approval_authority: string | null
          approval_date: string | null
          approval_number: string | null
          construction_scale: string | null
          created_at: string
          design_phases: number | null
          document_path: string | null
          environmental_approval: string | null
          main_technology: string | null
          project_id: string
          report_id: string
          report_type: string | null
          total_investment: number | null
        }
        Insert: {
          approval_authority?: string | null
          approval_date?: string | null
          approval_number?: string | null
          construction_scale?: string | null
          created_at?: string
          design_phases?: number | null
          document_path?: string | null
          environmental_approval?: string | null
          main_technology?: string | null
          project_id: string
          report_id?: string
          report_type?: string | null
          total_investment?: number | null
        }
        Update: {
          approval_authority?: string | null
          approval_date?: string | null
          approval_number?: string | null
          construction_scale?: string | null
          created_at?: string
          design_phases?: number | null
          document_path?: string | null
          environmental_approval?: string | null
          main_technology?: string | null
          project_id?: string
          report_id?: string
          report_type?: string | null
          total_investment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_studies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      folders: {
        Row: {
          folder_id: string
          name: string
          parent_id: string | null
          path: string
          type: string | null
        }
        Insert: {
          folder_id?: string
          name: string
          parent_id?: string | null
          path: string
          type?: string | null
        }
        Update: {
          folder_id?: string
          name?: string
          parent_id?: string | null
          path?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["folder_id"]
          },
        ]
      }
      investment_policy_decisions: {
        Row: {
          authority: string | null
          capital_sources: string[] | null
          created_at: string
          decision_date: string | null
          decision_number: string
          document_path: string | null
          duration: string | null
          id: string
          location: string | null
          objectives: string | null
          preliminary_investment: number | null
          project_id: string
        }
        Insert: {
          authority?: string | null
          capital_sources?: string[] | null
          created_at?: string
          decision_date?: string | null
          decision_number: string
          document_path?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          objectives?: string | null
          preliminary_investment?: number | null
          project_id: string
        }
        Update: {
          authority?: string | null
          capital_sources?: string[] | null
          created_at?: string
          decision_date?: string | null
          decision_number?: string
          document_path?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          objectives?: string | null
          preliminary_investment?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_policy_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      legal_articles: {
        Row: {
          chapter_id: string
          code: string
          content: string | null
          document_id: string
          fts: unknown
          full_content: string | null
          id: string
          sort_order: number
          summary: string | null
          title: string
        }
        Insert: {
          chapter_id: string
          code: string
          content?: string | null
          document_id: string
          fts?: unknown
          full_content?: string | null
          id: string
          sort_order?: number
          summary?: string | null
          title: string
        }
        Update: {
          chapter_id?: string
          code?: string
          content?: string | null
          document_id?: string
          fts?: unknown
          full_content?: string | null
          id?: string
          sort_order?: number
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_articles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "legal_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_articles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_chapters: {
        Row: {
          code: string
          document_id: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          document_id: string
          id: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          document_id?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_chapters_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          code: string
          created_at: string
          effective_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: string | null
          fts: unknown
          id: string
          issued_by: string | null
          issued_date: string | null
          related_doc_ids: string[] | null
          short_title: string | null
          status: Database["public"]["Enums"]["doc_status"]
          summary: string | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["doc_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          effective_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: string | null
          fts?: unknown
          id: string
          issued_by?: string | null
          issued_date?: string | null
          related_doc_ids?: string[] | null
          short_title?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          summary?: string | null
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["doc_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          effective_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: string | null
          fts?: unknown
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          related_doc_ids?: string[] | null
          short_title?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          summary?: string | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["doc_type"]
          updated_at?: string
        }
        Relationships: []
      }
      material_mines: {
        Row: {
          address: string | null
          capacity: string | null
          coordinates: Json | null
          created_at: string | null
          id: string
          mine_type: Database["public"]["Enums"]["mine_type_enum"]
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["mine_status_enum"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          mine_type?: Database["public"]["Enums"]["mine_type_enum"]
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["mine_status_enum"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          mine_type?: Database["public"]["Enums"]["mine_type_enum"]
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["mine_status_enum"]
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_plan_items: {
        Row: {
          annual_plan_item_id: string | null
          collaborating_dept_codes: string[] | null
          collaborating_text: string | null
          completion_result: string | null
          created_at: string
          created_by: string | null
          deadline_note: string | null
          deferred_to_plan_id: string | null
          deliverable: string | null
          due_date: string | null
          group_name: string | null
          group_sort_order: number | null
          id: string
          incomplete_reason: string | null
          monthly_plan_id: string
          notes: string | null
          project_id: string | null
          sort_order: number | null
          source_subtask_id: string | null
          source_task_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["monthly_task_status"]
          task_name: string
          updated_at: string
        }
        Insert: {
          annual_plan_item_id?: string | null
          collaborating_dept_codes?: string[] | null
          collaborating_text?: string | null
          completion_result?: string | null
          created_at?: string
          created_by?: string | null
          deadline_note?: string | null
          deferred_to_plan_id?: string | null
          deliverable?: string | null
          due_date?: string | null
          group_name?: string | null
          group_sort_order?: number | null
          id?: string
          incomplete_reason?: string | null
          monthly_plan_id: string
          notes?: string | null
          project_id?: string | null
          sort_order?: number | null
          source_subtask_id?: string | null
          source_task_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["monthly_task_status"]
          task_name: string
          updated_at?: string
        }
        Update: {
          annual_plan_item_id?: string | null
          collaborating_dept_codes?: string[] | null
          collaborating_text?: string | null
          completion_result?: string | null
          created_at?: string
          created_by?: string | null
          deadline_note?: string | null
          deferred_to_plan_id?: string | null
          deliverable?: string | null
          due_date?: string | null
          group_name?: string | null
          group_sort_order?: number | null
          id?: string
          incomplete_reason?: string | null
          monthly_plan_id?: string
          notes?: string | null
          project_id?: string | null
          sort_order?: number | null
          source_subtask_id?: string | null
          source_task_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["monthly_task_status"]
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plan_items_annual_plan_item_id_fkey"
            columns: ["annual_plan_item_id"]
            isOneToOne: false
            referencedRelation: "annual_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plan_items_deferred_to_plan_id_fkey"
            columns: ["deferred_to_plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plan_items_monthly_plan_id_fkey"
            columns: ["monthly_plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plan_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "monthly_plan_items_source_subtask_id_fkey"
            columns: ["source_subtask_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plan_items_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_plans: {
        Row: {
          created_at: string
          created_by: string | null
          department_code: string
          department_name: string
          id: string
          notes: string | null
          plan_month: number
          plan_year: number
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_code: string
          department_name: string
          id?: string
          notes?: string | null
          plan_month: number
          plan_year: number
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_code?: string
          department_name?: string
          id?: string
          notes?: string | null
          plan_month?: number
          plan_year?: number
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: []
      }
      package_bidders: {
        Row: {
          appointment_reason: string | null
          bid_price: number | null
          combined_score: number | null
          contractor_id: string
          created_at: string | null
          decision_agency: string | null
          decision_date: string | null
          decision_number: string | null
          evaluation_file_name: string | null
          evaluation_file_url: string | null
          financial_score: number | null
          hsdx_date: string | null
          hsyc_date: string | null
          id: string
          legal_basis: string | null
          negotiated_price: number | null
          notes: string | null
          package_id: string
          rank: number | null
          status: string | null
          technical_score: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_reason?: string | null
          bid_price?: number | null
          combined_score?: number | null
          contractor_id: string
          created_at?: string | null
          decision_agency?: string | null
          decision_date?: string | null
          decision_number?: string | null
          evaluation_file_name?: string | null
          evaluation_file_url?: string | null
          financial_score?: number | null
          hsdx_date?: string | null
          hsyc_date?: string | null
          id?: string
          legal_basis?: string | null
          negotiated_price?: number | null
          notes?: string | null
          package_id: string
          rank?: number | null
          status?: string | null
          technical_score?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_reason?: string | null
          bid_price?: number | null
          combined_score?: number | null
          contractor_id?: string
          created_at?: string | null
          decision_agency?: string | null
          decision_date?: string | null
          decision_number?: string | null
          evaluation_file_name?: string | null
          evaluation_file_url?: string | null
          financial_score?: number | null
          hsdx_date?: string | null
          hsyc_date?: string | null
          id?: string
          legal_basis?: string | null
          negotiated_price?: number | null
          notes?: string | null
          package_id?: string
          rank?: number | null
          status?: string | null
          technical_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_bidders_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "package_bidders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "bidding_packages"
            referencedColumns: ["package_id"]
          },
        ]
      }
      package_issues: {
        Row: {
          description: string | null
          issue_id: string
          package_id: string
          reported_date: string
          reporter: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          description?: string | null
          issue_id?: string
          package_id: string
          reported_date?: string
          reporter?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          description?: string | null
          issue_id?: string
          package_id?: string
          reported_date?: string
          reporter?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_issues_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "bidding_packages"
            referencedColumns: ["package_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          approved_by: string | null
          approved_date: string | null
          batch_no: number
          contract_id: string
          created_at: string
          description: string | null
          paid_date: string | null
          payment_id: number
          project_id: string | null
          request_date: string | null
          status: string
          treasury_ref: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          approved_date?: string | null
          batch_no?: number
          contract_id: string
          created_at?: string
          description?: string | null
          paid_date?: string | null
          payment_id?: number
          project_id?: string | null
          request_date?: string | null
          status?: string
          treasury_ref?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          approved_date?: string | null
          batch_no?: number
          contract_id?: string
          created_at?: string
          description?: string | null
          paid_date?: string | null
          payment_id?: number
          project_id?: string | null
          request_date?: string | null
          status?: string
          treasury_ref?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      procurement_plans: {
        Row: {
          created_at: string
          decision_agency: string | null
          decision_date: string | null
          decision_number: string | null
          msc_plan_code: string | null
          notes: string | null
          plan_code: string | null
          plan_id: string
          plan_name: string
          plan_type: string | null
          project_id: string
          status: string | null
          total_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision_agency?: string | null
          decision_date?: string | null
          decision_number?: string | null
          msc_plan_code?: string | null
          notes?: string | null
          plan_code?: string | null
          plan_id: string
          plan_name: string
          plan_type?: string | null
          project_id: string
          status?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision_agency?: string | null
          decision_date?: string | null
          decision_number?: string | null
          msc_plan_code?: string | null
          notes?: string | null
          plan_code?: string | null
          plan_id?: string
          plan_name?: string
          plan_type?: string | null
          project_id?: string
          status?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_members: {
        Row: {
          employee_id: string
          id: string
          joined_at: string | null
          project_id: string
          role: string | null
        }
        Insert: {
          employee_id: string
          id?: string
          joined_at?: string | null
          project_id: string
          role?: string | null
        }
        Update: {
          employee_id?: string
          id?: string
          joined_at?: string | null
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          above_ground_floors: number | null
          acceptance_date: string | null
          acceptance_result: string | null
          actual_end_date: string | null
          actual_start_date_construction: string | null
          adjusted_approval: Json | null
          applicable_standards: string | null
          appraisal_agency: string | null
          appraisal_result_date: string | null
          appraisal_result_number: string | null
          approval_date: string | null
          basement_floors: number | null
          bidding_form: string | null
          bim_status: string | null
          budget_allocations: Json | null
          building_density: number | null
          building_height: number | null
          capital_source: string | null
          cde_project_code: string | null
          competent_authority: string | null
          construction_area: number | null
          construction_grade: string | null
          construction_permit_agency: string | null
          construction_permit_date: string | null
          construction_permit_number: string | null
          construction_type: string | null
          contractor_details: Json | null
          coordinates: Json | null
          cost_breakdown: Json | null
          created_at: string
          current_status_code: number | null
          decision_authority: string | null
          decision_date: string | null
          decision_level_before_handover: string | null
          decision_maker_id: string | null
          decision_number: string | null
          design_appraisal_date: string | null
          design_appraisal_number: string | null
          design_approval_authority: string | null
          design_approval_date: string | null
          design_approval_number: string | null
          design_contractor: string | null
          duration: string | null
          env_approval_date: string | null
          env_approval_number: string | null
          env_approval_type: string | null
          expected_end_date: string | null
          feasibility_contractor: string | null
          floor_area: number | null
          group_code: string
          handover_date: string | null
          image_url: string | null
          implementation_tracking: Json | null
          insurance_contract: string | null
          insurance_value: number | null
          investment_scale: string | null
          investment_type: number
          investor_name: string | null
          is_emergency: boolean
          is_oda: boolean | null
          is_synced: boolean | null
          khv_info: Json | null
          land_use_coefficient: number | null
          last_sync_date: string | null
          location_code: string | null
          main_contractor_name: string | null
          management_board: number | null
          management_form: string | null
          national_project_code: string | null
          objective: string | null
          old_investor: string | null
          payment_progress: number | null
          pccc_approval_agency: string | null
          pccc_approval_date: string | null
          pccc_approval_number: string | null
          planning_approval_date: string | null
          planning_approval_number: string | null
          policy_decision_authority: string | null
          policy_decision_date: string | null
          policy_decision_level: string | null
          policy_decision_number: string | null
          progress: number | null
          project_id: string
          project_management: Json | null
          project_name: string
          project_number: string | null
          project_status_info: Json | null
          province_code: string | null
          requires_bim: boolean | null
          review_contractor: string | null
          sector: string | null
          site_area: number | null
          specialty_details: string | null
          specialty_type: string | null
          stage: string | null
          start_date: string | null
          status: number
          supervision_contractor: string | null
          survey_contractor: string | null
          sync_error: string | null
          total_estimate: number | null
          total_investment: number
          transfer_decision: string | null
          tt24_completion_pct: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          above_ground_floors?: number | null
          acceptance_date?: string | null
          acceptance_result?: string | null
          actual_end_date?: string | null
          actual_start_date_construction?: string | null
          adjusted_approval?: Json | null
          applicable_standards?: string | null
          appraisal_agency?: string | null
          appraisal_result_date?: string | null
          appraisal_result_number?: string | null
          approval_date?: string | null
          basement_floors?: number | null
          bidding_form?: string | null
          bim_status?: string | null
          budget_allocations?: Json | null
          building_density?: number | null
          building_height?: number | null
          capital_source?: string | null
          cde_project_code?: string | null
          competent_authority?: string | null
          construction_area?: number | null
          construction_grade?: string | null
          construction_permit_agency?: string | null
          construction_permit_date?: string | null
          construction_permit_number?: string | null
          construction_type?: string | null
          contractor_details?: Json | null
          coordinates?: Json | null
          cost_breakdown?: Json | null
          created_at?: string
          current_status_code?: number | null
          decision_authority?: string | null
          decision_date?: string | null
          decision_level_before_handover?: string | null
          decision_maker_id?: string | null
          decision_number?: string | null
          design_appraisal_date?: string | null
          design_appraisal_number?: string | null
          design_approval_authority?: string | null
          design_approval_date?: string | null
          design_approval_number?: string | null
          design_contractor?: string | null
          duration?: string | null
          env_approval_date?: string | null
          env_approval_number?: string | null
          env_approval_type?: string | null
          expected_end_date?: string | null
          feasibility_contractor?: string | null
          floor_area?: number | null
          group_code?: string
          handover_date?: string | null
          image_url?: string | null
          implementation_tracking?: Json | null
          insurance_contract?: string | null
          insurance_value?: number | null
          investment_scale?: string | null
          investment_type?: number
          investor_name?: string | null
          is_emergency?: boolean
          is_oda?: boolean | null
          is_synced?: boolean | null
          khv_info?: Json | null
          land_use_coefficient?: number | null
          last_sync_date?: string | null
          location_code?: string | null
          main_contractor_name?: string | null
          management_board?: number | null
          management_form?: string | null
          national_project_code?: string | null
          objective?: string | null
          old_investor?: string | null
          payment_progress?: number | null
          pccc_approval_agency?: string | null
          pccc_approval_date?: string | null
          pccc_approval_number?: string | null
          planning_approval_date?: string | null
          planning_approval_number?: string | null
          policy_decision_authority?: string | null
          policy_decision_date?: string | null
          policy_decision_level?: string | null
          policy_decision_number?: string | null
          progress?: number | null
          project_id: string
          project_management?: Json | null
          project_name: string
          project_number?: string | null
          project_status_info?: Json | null
          province_code?: string | null
          requires_bim?: boolean | null
          review_contractor?: string | null
          sector?: string | null
          site_area?: number | null
          specialty_details?: string | null
          specialty_type?: string | null
          stage?: string | null
          start_date?: string | null
          status?: number
          supervision_contractor?: string | null
          survey_contractor?: string | null
          sync_error?: string | null
          total_estimate?: number | null
          total_investment?: number
          transfer_decision?: string | null
          tt24_completion_pct?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          above_ground_floors?: number | null
          acceptance_date?: string | null
          acceptance_result?: string | null
          actual_end_date?: string | null
          actual_start_date_construction?: string | null
          adjusted_approval?: Json | null
          applicable_standards?: string | null
          appraisal_agency?: string | null
          appraisal_result_date?: string | null
          appraisal_result_number?: string | null
          approval_date?: string | null
          basement_floors?: number | null
          bidding_form?: string | null
          bim_status?: string | null
          budget_allocations?: Json | null
          building_density?: number | null
          building_height?: number | null
          capital_source?: string | null
          cde_project_code?: string | null
          competent_authority?: string | null
          construction_area?: number | null
          construction_grade?: string | null
          construction_permit_agency?: string | null
          construction_permit_date?: string | null
          construction_permit_number?: string | null
          construction_type?: string | null
          contractor_details?: Json | null
          coordinates?: Json | null
          cost_breakdown?: Json | null
          created_at?: string
          current_status_code?: number | null
          decision_authority?: string | null
          decision_date?: string | null
          decision_level_before_handover?: string | null
          decision_maker_id?: string | null
          decision_number?: string | null
          design_appraisal_date?: string | null
          design_appraisal_number?: string | null
          design_approval_authority?: string | null
          design_approval_date?: string | null
          design_approval_number?: string | null
          design_contractor?: string | null
          duration?: string | null
          env_approval_date?: string | null
          env_approval_number?: string | null
          env_approval_type?: string | null
          expected_end_date?: string | null
          feasibility_contractor?: string | null
          floor_area?: number | null
          group_code?: string
          handover_date?: string | null
          image_url?: string | null
          implementation_tracking?: Json | null
          insurance_contract?: string | null
          insurance_value?: number | null
          investment_scale?: string | null
          investment_type?: number
          investor_name?: string | null
          is_emergency?: boolean
          is_oda?: boolean | null
          is_synced?: boolean | null
          khv_info?: Json | null
          land_use_coefficient?: number | null
          last_sync_date?: string | null
          location_code?: string | null
          main_contractor_name?: string | null
          management_board?: number | null
          management_form?: string | null
          national_project_code?: string | null
          objective?: string | null
          old_investor?: string | null
          payment_progress?: number | null
          pccc_approval_agency?: string | null
          pccc_approval_date?: string | null
          pccc_approval_number?: string | null
          planning_approval_date?: string | null
          planning_approval_number?: string | null
          policy_decision_authority?: string | null
          policy_decision_date?: string | null
          policy_decision_level?: string | null
          policy_decision_number?: string | null
          progress?: number | null
          project_id?: string
          project_management?: Json | null
          project_name?: string
          project_number?: string | null
          project_status_info?: Json | null
          province_code?: string | null
          requires_bim?: boolean | null
          review_contractor?: string | null
          sector?: string | null
          site_area?: number | null
          specialty_details?: string | null
          specialty_type?: string | null
          stage?: string | null
          start_date?: string | null
          status?: number
          supervision_contractor?: string | null
          survey_contractor?: string | null
          sync_error?: string | null
          total_estimate?: number | null
          total_investment?: number
          transfer_decision?: string | null
          tt24_completion_pct?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      public_asset_categories: {
        Row: {
          asset_type: string
          code: string
          created_at: string | null
          depreciation_rate: number | null
          id: string
          name: string
          parent_id: string | null
          useful_life_years: number | null
        }
        Insert: {
          asset_type: string
          code: string
          created_at?: string | null
          depreciation_rate?: number | null
          id?: string
          name: string
          parent_id?: string | null
          useful_life_years?: number | null
        }
        Update: {
          asset_type?: string
          code?: string
          created_at?: string | null
          depreciation_rate?: number | null
          id?: string
          name?: string
          parent_id?: string | null
          useful_life_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_asset_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "public_asset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      public_asset_inventories: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_date: string
          notes: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_date: string
          notes?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_date?: string
          notes?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      public_asset_inventory_details: {
        Row: {
          actual_quantity: number
          asset_id: string
          book_quantity: number
          condition: string | null
          difference_quantity: number | null
          id: string
          inventory_id: string
          notes: string | null
        }
        Insert: {
          actual_quantity: number
          asset_id: string
          book_quantity: number
          condition?: string | null
          difference_quantity?: number | null
          id?: string
          inventory_id: string
          notes?: string | null
        }
        Update: {
          actual_quantity?: number
          asset_id?: string
          book_quantity?: number
          condition?: string | null
          difference_quantity?: number | null
          id?: string
          inventory_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_asset_inventory_details_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "public_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_asset_inventory_details_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "public_asset_inventories"
            referencedColumns: ["id"]
          },
        ]
      }
      public_asset_transactions: {
        Row: {
          asset_id: string
          cost_change: number | null
          created_at: string | null
          created_by: string | null
          decision_date: string | null
          decision_number: string | null
          depreciation_change: number | null
          description: string | null
          id: string
          reason: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          asset_id: string
          cost_change?: number | null
          created_at?: string | null
          created_by?: string | null
          decision_date?: string | null
          decision_number?: string | null
          depreciation_change?: number | null
          description?: string | null
          id?: string
          reason: string
          transaction_date: string
          transaction_type: string
        }
        Update: {
          asset_id?: string
          cost_change?: number | null
          created_at?: string | null
          created_by?: string | null
          decision_date?: string | null
          decision_number?: string | null
          depreciation_change?: number | null
          description?: string | null
          id?: string
          reason?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_asset_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "public_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      public_assets: {
        Row: {
          accumulated_depreciation: number
          asset_code: string
          asset_name: string
          branch: string | null
          category_id: string
          created_at: string | null
          custodian_id: string | null
          department: string | null
          depreciation_rate: number
          description: string | null
          funding_budget_cost: number | null
          funding_other_cost: number | null
          id: string
          location: string | null
          original_cost: number
          project_id: string | null
          purchase_date: string
          quantity: number
          remaining_value: number
          status: string
          unit: string
          updated_at: string | null
          use_date: string
        }
        Insert: {
          accumulated_depreciation?: number
          asset_code: string
          asset_name: string
          branch?: string | null
          category_id: string
          created_at?: string | null
          custodian_id?: string | null
          department?: string | null
          depreciation_rate?: number
          description?: string | null
          funding_budget_cost?: number | null
          funding_other_cost?: number | null
          id?: string
          location?: string | null
          original_cost?: number
          project_id?: string | null
          purchase_date: string
          quantity?: number
          remaining_value?: number
          status?: string
          unit: string
          updated_at?: string | null
          use_date: string
        }
        Update: {
          accumulated_depreciation?: number
          asset_code?: string
          asset_name?: string
          branch?: string | null
          category_id?: string
          created_at?: string | null
          custodian_id?: string | null
          department?: string | null
          depreciation_rate?: number
          description?: string | null
          funding_budget_cost?: number | null
          funding_other_cost?: number | null
          id?: string
          location?: string | null
          original_cost?: number
          project_id?: string | null
          purchase_date?: string
          quantity?: number
          remaining_value?: number
          status?: string
          unit?: string
          updated_at?: string | null
          use_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "public_asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assets_custodian_id_fkey"
            columns: ["custodian_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "public_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      regulations: {
        Row: {
          article_code: string
          article_title: string
          chapter_code: string
          chapter_title: string
          content: string
          content_json: Json | null
          created_at: string | null
          embedding: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          article_code: string
          article_title: string
          chapter_code: string
          chapter_title: string
          content: string
          content_json?: Json | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          article_code?: string
          article_title?: string
          chapter_code?: string
          chapter_title?: string
          content?: string
          content_json?: Json | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permission_defaults: {
        Row: {
          actions: Json
          created_at: string
          id: string
          resource: string
          role: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          id?: string
          resource: string
          role: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          id?: string
          resource?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_clearance_milestones: {
        Row: {
          completed_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          status: string | null
          step_name: string
          step_number: number
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          status?: string | null
          step_name: string
          step_number: number
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          status?: string | null
          step_name?: string
          step_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_clearance_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      site_clearances: {
        Row: {
          cleared_area: number | null
          compensation_budget: number | null
          created_at: string | null
          disbursed_compensation: number | null
          id: string
          project_id: string
          resettled_households: number | null
          status: string | null
          total_area: number | null
          total_households: number | null
          updated_at: string | null
        }
        Insert: {
          cleared_area?: number | null
          compensation_budget?: number | null
          created_at?: string | null
          disbursed_compensation?: number | null
          id?: string
          project_id: string
          resettled_households?: number | null
          status?: string | null
          total_area?: number | null
          total_households?: number | null
          updated_at?: string | null
        }
        Update: {
          cleared_area?: number | null
          compensation_budget?: number | null
          created_at?: string | null
          disbursed_compensation?: number | null
          id?: string
          project_id?: string
          resettled_households?: number | null
          status?: string | null
          total_area?: number | null
          total_households?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      stage_transitions: {
        Row: {
          decision_date: string | null
          decision_number: string | null
          end_date: string | null
          id: string
          notes: string | null
          project_id: string
          stage: string
          start_date: string
        }
        Insert: {
          decision_date?: string | null
          decision_number?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          stage: string
          start_date?: string
        }
        Update: {
          decision_date?: string | null
          decision_number?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          stage?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_transitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      sub_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          due_date: string | null
          id: string
          sort_order: number | null
          status: string
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          sort_order?: number | null
          status?: string
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          sort_order?: number | null
          status?: string
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activities: {
        Row: {
          action_type: string
          created_at: string
          id: string
          new_value: Json | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          new_value?: Json | null
          task_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          approver_id: string | null
          assignee_id: string | null
          collaborator_ids: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          duration_days: number | null
          id: string
          legal_basis: string | null
          metadata: Json | null
          monthly_plan_item_id: string | null
          output_document: string | null
          parent_id: string | null
          phase: string | null
          predecessor_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          progress: number
          project_id: string | null
          responsibility_level: string
          sort_order: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          step_code: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          workflow_id: string | null
          workflow_node_id: string | null
          obstacles: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          approver_id?: string | null
          assignee_id?: string | null
          collaborator_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          duration_days?: number | null
          id?: string
          legal_basis?: string | null
          metadata?: Json | null
          monthly_plan_item_id?: string | null
          output_document?: string | null
          parent_id?: string | null
          phase?: string | null
          predecessor_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          progress?: number
          project_id?: string | null
          responsibility_level?: string
          sort_order?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          step_code?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
          workflow_id?: string | null
          workflow_node_id?: string | null
          obstacles?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          approver_id?: string | null
          assignee_id?: string | null
          collaborator_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          duration_days?: number | null
          id?: string
          legal_basis?: string | null
          metadata?: Json | null
          monthly_plan_item_id?: string | null
          output_document?: string | null
          parent_id?: string | null
          phase?: string | null
          predecessor_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          progress?: number
          project_id?: string | null
          responsibility_level?: string
          sort_order?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          step_code?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
          workflow_id?: string | null
          workflow_node_id?: string | null
          obstacles?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_monthly_plan_item_id_fkey"
            columns: ["monthly_plan_item_id"]
            isOneToOne: false
            referencedRelation: "monthly_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_predecessor_task_id_fkey"
            columns: ["predecessor_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workflow_node_id_fkey"
            columns: ["workflow_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          account_id: string
          auth_user_id: string | null
          created_at: string
          employee_id: string | null
          is_active: boolean
          last_login: string | null
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          account_id?: string
          auth_user_id?: string | null
          created_at?: string
          employee_id?: string | null
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          updated_at?: string
          username: string
        }
        Update: {
          account_id?: string
          auth_user_id?: string | null
          created_at?: string
          employee_id?: string | null
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          actions: string[]
          created_at: string
          created_by: string | null
          id: string
          resource: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          resource: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          resource?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      variation_orders: {
        Row: {
          adjusted_amount: number
          adjusted_duration: number | null
          approval_file: string | null
          content: string | null
          contract_id: string
          created_at: string
          number: string
          sign_date: string | null
          vo_id: string
        }
        Insert: {
          adjusted_amount?: number
          adjusted_duration?: number | null
          approval_file?: string | null
          content?: string | null
          contract_id: string
          created_at?: string
          number: string
          sign_date?: string | null
          vo_id?: string
        }
        Update: {
          adjusted_amount?: number
          adjusted_duration?: number | null
          approval_file?: string | null
          content?: string | null
          contract_id?: string
          created_at?: string
          number?: string
          sign_date?: string | null
          vo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      workflow_edges: {
        Row: {
          condition_expr: string | null
          created_at: string | null
          id: string
          source_node: string | null
          target_node: string | null
          workflow_id: string
        }
        Insert: {
          condition_expr?: string | null
          created_at?: string | null
          id?: string
          source_node?: string | null
          target_node?: string | null
          workflow_id: string
        }
        Update: {
          condition_expr?: string | null
          created_at?: string | null
          id?: string
          source_node?: string | null
          target_node?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_edges_source_node_fkey"
            columns: ["source_node"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_target_node_fkey"
            columns: ["target_node"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          context_data: Json | null
          created_by: string | null
          current_node_id: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_instance_status"] | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          context_data?: Json | null
          created_by?: string | null
          current_node_id?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["workflow_instance_status"]
            | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          context_data?: Json | null
          created_by?: string | null
          current_node_id?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["workflow_instance_status"]
            | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          assignee_role: string | null
          created_at: string | null
          form_config: Json | null
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          name: string
          sla_formula: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["workflow_node_type"] | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          assignee_role?: string | null
          created_at?: string | null
          form_config?: Json | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          name: string
          sla_formula?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["workflow_node_type"] | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          assignee_role?: string | null
          created_at?: string | null
          form_config?: Json | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          name?: string
          sla_formula?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["workflow_node_type"] | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_tasks: {
        Row: {
          action_taken: string | null
          assignee_id: string | null
          cde_folder_id: string | null
          comments: string | null
          completed_at: string | null
          created_at: string | null
          digital_signature: Json | null
          due_date: string | null
          id: string
          instance_id: string
          metadata: Json | null
          name: string | null
          node_id: string | null
          progress: number | null
          start_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_task_status"] | null
          task_type: string | null
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          assignee_id?: string | null
          cde_folder_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          digital_signature?: Json | null
          due_date?: string | null
          id?: string
          instance_id: string
          metadata?: Json | null
          name?: string | null
          node_id?: string | null
          progress?: number | null
          start_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
          task_type?: string | null
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          assignee_id?: string | null
          cde_folder_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          digital_signature?: Json | null
          due_date?: string | null
          id?: string
          instance_id?: string
          metadata?: Json | null
          name?: string | null
          node_id?: string | null
          progress?: number | null
          start_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
          task_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_tasks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          category: Database["public"]["Enums"]["workflow_category"] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["workflow_category"] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["workflow_category"] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      cde_project_stats_view: {
        Row: {
          archived: number | null
          project_id: string | null
          published: number | null
          shared: number | null
          total: number | null
          wip: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
    }
    Functions: {
      get_current_contractor_id: { Args: never; Returns: string }
      get_current_employee_department: { Args: never; Returns: string }
      get_current_employee_id: { Args: never; Returns: string }
      get_current_employee_role: { Args: never; Returns: string }
      get_task_activities_v2: { Args: { p_task_id: string }; Returns: Json }
      get_task_comments_v2: { Args: { p_task_id: string }; Returns: Json }
      get_task_status_counts: {
        Args: never
        Returns: {
          done_count: number
          in_progress_count: number
          overdue_count: number
          todo_count: number
          total_count: number
        }[]
      }
      get_user_dashboard_stats: {
        Args: { p_department: string; p_employee_id: string; p_role: string }
        Returns: Json
      }
      get_user_profile_by_auth_id: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_global_role: { Args: never; Returns: boolean }
      is_project_member: { Args: { p_project_id: string }; Returns: boolean }
      resolve_user_identity: { Args: { p_identifier: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      agency_event_room: "Ph├▓ng hß╗ìp 1" | "Ph├▓ng hß╗ìp 2" | "Ph├▓ng hß╗ìp 3"
      agency_event_type:
        | "meeting"
        | "business_trip"
        | "internal_event"
        | "other"
      doc_status: "hieu-luc" | "het-hieu-luc" | "sap-hieu-luc"
      doc_type: "luat" | "nghi-dinh" | "thong-tu" | "qcvn" | "quyet-dinh"
      internal_step_status:
        | "waiting"
        | "pending"
        | "done"
        | "rejected"
        | "skipped"
      internal_workflow_instance_status:
        | "draft"
        | "in_progress"
        | "completed"
        | "rejected"
        | "on_hold"
      mine_status_enum: "─Éang khai th├íc" | "Quy hoß║ích" | "─É├│ng cß╗¡a"
      mine_type_enum: "─Éß║Ñt" | "─É├í" | "C├ít" | "Sß╗Åi" | "Kh├íc"
      monthly_task_status:
        | "planned"
        | "completed"
        | "incomplete"
        | "partial"
        | "deferred"
      plan_frequency:
        | "one_time"
        | "monthly"
        | "quarterly"
        | "daily"
        | "as_needed"
      plan_status: "draft" | "published" | "closed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "done" | "incomplete"
      task_type: "project" | "internal" | "management"
      workflow_category:
        | "project"
        | "document"
        | "finance"
        | "hr"
        | "asset"
        | "other"
      workflow_instance_status:
        | "draft"
        | "in_progress"
        | "completed"
        | "rejected"
        | "cancelled"
      workflow_node_type: "start" | "end" | "approval" | "input" | "automated"
      workflow_task_status:
        | "pending"
        | "completed"
        | "skipped"
        | "transferred"
        | "in_progress"
        | "rejected"
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
      agency_event_room: ["Ph├▓ng hß╗ìp 1", "Ph├▓ng hß╗ìp 2", "Ph├▓ng hß╗ìp 3"],
      agency_event_type: [
        "meeting",
        "business_trip",
        "internal_event",
        "other",
      ],
      doc_status: ["hieu-luc", "het-hieu-luc", "sap-hieu-luc"],
      doc_type: ["luat", "nghi-dinh", "thong-tu", "qcvn", "quyet-dinh"],
      internal_step_status: [
        "waiting",
        "pending",
        "done",
        "rejected",
        "skipped",
      ],
      internal_workflow_instance_status: [
        "draft",
        "in_progress",
        "completed",
        "rejected",
        "on_hold",
      ],
      mine_status_enum: ["─Éang khai th├íc", "Quy hoß║ích", "─É├│ng cß╗¡a"],
      mine_type_enum: ["─Éß║Ñt", "─É├í", "C├ít", "Sß╗Åi", "Kh├íc"],
      monthly_task_status: [
        "planned",
        "completed",
        "incomplete",
        "partial",
        "deferred",
      ],
      plan_frequency: [
        "one_time",
        "monthly",
        "quarterly",
        "daily",
        "as_needed",
      ],
      plan_status: ["draft", "published", "closed"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "review", "done", "incomplete"],
      task_type: ["project", "internal", "management"],
      workflow_category: [
        "project",
        "document",
        "finance",
        "hr",
        "asset",
        "other",
      ],
      workflow_instance_status: [
        "draft",
        "in_progress",
        "completed",
        "rejected",
        "cancelled",
      ],
      workflow_node_type: ["start", "end", "approval", "input", "automated"],
      workflow_task_status: [
        "pending",
        "completed",
        "skipped",
        "transferred",
        "in_progress",
        "rejected",
      ],
    },
  },
} as const
