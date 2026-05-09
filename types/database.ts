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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      acceptance_records: {
        Row: {
          acceptance_date: string
          acceptance_type: string
          contract_id: string
          created_at: string | null
          description: string | null
          id: string
          inspector: string | null
          notes: string | null
          quality_rating: string | null
          updated_at: string | null
        }
        Insert: {
          acceptance_date?: string
          acceptance_type?: string
          contract_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          inspector?: string | null
          notes?: string | null
          quality_rating?: string | null
          updated_at?: string | null
        }
        Update: {
          acceptance_date?: string
          acceptance_type?: string
          contract_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          inspector?: string | null
          notes?: string | null
          quality_rating?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acceptance_records_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string
          details: string | null
          log_id: string
          target_entity: string
          target_id: string
          timestamp: string
        }
        Insert: {
          action: string
          changed_by: string
          details?: string | null
          log_id?: string
          target_entity: string
          target_id: string
          timestamp?: string
        }
        Update: {
          action?: string
          changed_by?: string
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
          bid_closing_date: string | null
          bid_fee: number | null
          bid_type: string | null
          BiddersCount: number | null
          BiddingScope: string | null
          capital_source: string | null
          contract_type: string | null
          created_at: string
          decision_agency: string | null
          decision_date: string | null
          decision_file: string | null
          decision_number: string | null
          description: string | null
          duration: string | null
          estimate_price: number | null
          EvaluationBiddersCount: number | null
          field: string | null
          funding_source: string | null
          has_option: boolean | null
          investor_name: string | null
          khlcnt_code: string | null
          msc_package_link: string | null
          msc_plan_code: string | null
          msc_publish_status: string | null
          notification_code: string | null
          package_id: string
          package_name: string
          package_number: string | null
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
          winning_contractor_id: string | null
          winning_price: number | null
        }
        Insert: {
          bid_closing_date?: string | null
          bid_fee?: number | null
          bid_type?: string | null
          BiddersCount?: number | null
          BiddingScope?: string | null
          capital_source?: string | null
          contract_type?: string | null
          created_at?: string
          decision_agency?: string | null
          decision_date?: string | null
          decision_file?: string | null
          decision_number?: string | null
          description?: string | null
          duration?: string | null
          estimate_price?: number | null
          EvaluationBiddersCount?: number | null
          field?: string | null
          funding_source?: string | null
          has_option?: boolean | null
          investor_name?: string | null
          khlcnt_code?: string | null
          msc_package_link?: string | null
          msc_plan_code?: string | null
          msc_publish_status?: string | null
          notification_code?: string | null
          package_id?: string
          package_name: string
          package_number?: string | null
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
          winning_contractor_id?: string | null
          winning_price?: number | null
        }
        Update: {
          bid_closing_date?: string | null
          bid_fee?: number | null
          bid_type?: string | null
          BiddersCount?: number | null
          BiddingScope?: string | null
          capital_source?: string | null
          contract_type?: string | null
          created_at?: string
          decision_agency?: string | null
          decision_date?: string | null
          decision_file?: string | null
          decision_number?: string | null
          description?: string | null
          duration?: string | null
          estimate_price?: number | null
          EvaluationBiddersCount?: number | null
          field?: string | null
          funding_source?: string | null
          has_option?: boolean | null
          investor_name?: string | null
          khlcnt_code?: string | null
          msc_package_link?: string | null
          msc_plan_code?: string | null
          msc_publish_status?: string | null
          notification_code?: string | null
          package_id?: string
          package_name?: string
          package_number?: string | null
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
          winning_contractor_id?: string | null
          winning_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bidding_packages_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "procurement_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "bidding_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
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
          plan_type: string | null
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
          plan_type?: string | null
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
          plan_type?: string | null
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
      cde_audit_log: {
        Row: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_name?: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          project_id?: string | null
        }
        Relationships: []
      }
      cde_comments: {
        Row: {
          author_id: string
          author_name: string
          author_role: string | null
          content: string
          created_at: string | null
          doc_id: number
          id: string
          reply_to: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          author_role?: string | null
          content: string
          created_at?: string | null
          doc_id: number
          id?: string
          reply_to?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string | null
          content?: string
          created_at?: string | null
          doc_id?: number
          id?: string
          reply_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cde_comments_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["doc_id"]
          },
          {
            foreignKeyName: "cde_comments_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "cde_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      cde_folders: {
        Row: {
          container_type: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          path: string | null
          phase: string | null
          project_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          container_type: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          path?: string | null
          phase?: string | null
          project_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          container_type?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          path?: string | null
          phase?: string | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cde_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cde_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cde_permissions: {
        Row: {
          can_approve: boolean | null
          can_delete: boolean | null
          can_manage: boolean | null
          can_upload: boolean | null
          container_access: string[] | null
          created_at: string | null
          folder_restrictions: string[] | null
          granted_by: string | null
          id: string
          project_id: string
          updated_at: string | null
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          can_approve?: boolean | null
          can_delete?: boolean | null
          can_manage?: boolean | null
          can_upload?: boolean | null
          container_access?: string[] | null
          created_at?: string | null
          folder_restrictions?: string[] | null
          granted_by?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
          user_id: string
          user_name?: string
          user_role?: string
        }
        Update: {
          can_approve?: boolean | null
          can_delete?: boolean | null
          can_manage?: boolean | null
          can_upload?: boolean | null
          container_access?: string[] | null
          created_at?: string | null
          folder_restrictions?: string[] | null
          granted_by?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
      cde_transmittals: {
        Row: {
          cc_list: string[] | null
          created_at: string | null
          created_by: string
          doc_ids: number[] | null
          from_org: string
          from_person: string
          id: string
          notes: string | null
          project_id: string
          purpose: string | null
          sent_at: string | null
          status: string | null
          subject: string
          to_org: string
          to_person: string
          transmittal_no: string
        }
        Insert: {
          cc_list?: string[] | null
          created_at?: string | null
          created_by: string
          doc_ids?: number[] | null
          from_org?: string
          from_person?: string
          id?: string
          notes?: string | null
          project_id: string
          purpose?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          to_org?: string
          to_person?: string
          transmittal_no: string
        }
        Update: {
          cc_list?: string[] | null
          created_at?: string | null
          created_by?: string
          doc_ids?: number[] | null
          from_org?: string
          from_person?: string
          id?: string
          notes?: string | null
          project_id?: string
          purpose?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          to_org?: string
          to_person?: string
          transmittal_no?: string
        }
        Relationships: []
      }
      cde_workflow_history: {
        Row: {
          actor_id: string
          actor_name: string
          actor_role: string | null
          attachments: string[] | null
          comment: string | null
          created_at: string | null
          doc_id: number
          id: string
          status: string
          step_code: string
          step_name: string
        }
        Insert: {
          actor_id: string
          actor_name: string
          actor_role?: string | null
          attachments?: string[] | null
          comment?: string | null
          created_at?: string | null
          doc_id: number
          id?: string
          status: string
          step_code: string
          step_name: string
        }
        Update: {
          actor_id?: string
          actor_name?: string
          actor_role?: string | null
          attachments?: string[] | null
          comment?: string | null
          created_at?: string | null
          doc_id?: number
          id?: string
          status?: string
          step_code?: string
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cde_workflow_history_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["doc_id"]
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
          allowed_project_ids: string[] | null
          auth_user_id: string | null
          contractor_id: string
          created_at: string | null
          current_password: string | null
          display_name: string
          email: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          phone: string | null
          username: string
        }
        Insert: {
          allowed_project_ids?: string[] | null
          auth_user_id?: string | null
          contractor_id: string
          created_at?: string | null
          current_password?: string | null
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          username: string
        }
        Update: {
          allowed_project_ids?: string[] | null
          auth_user_id?: string | null
          contractor_id?: string
          created_at?: string | null
          current_password?: string | null
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
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
          contact_info: string | null
          contractor_id: string
          contractor_type: string
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
          contact_info?: string | null
          contractor_id?: string
          contractor_type?: string
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
          contact_info?: string | null
          contractor_id?: string
          contractor_type?: string
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
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_amount?: number
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          planned_amount?: number
          project_id: string
          updated_at?: string | null
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
          updated_at?: string | null
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
          advance_balance: number | null
          amount: number
          capital_plan_id: string | null
          contract_number: string | null
          created_at: string
          cumulative_before: number | null
          date: string
          description: string | null
          disbursement_id: string
          form_type: string | null
          payment_id: number | null
          project_id: string
          status: string
          treasury_code: string | null
          type: string | null
        }
        Insert: {
          advance_balance?: number | null
          amount?: number
          capital_plan_id?: string | null
          contract_number?: string | null
          created_at?: string
          cumulative_before?: number | null
          date: string
          description?: string | null
          disbursement_id: string
          form_type?: string | null
          payment_id?: number | null
          project_id: string
          status?: string
          treasury_code?: string | null
          type?: string | null
        }
        Update: {
          advance_balance?: number | null
          amount?: number
          capital_plan_id?: string | null
          contract_number?: string | null
          created_at?: string
          cumulative_before?: number | null
          date?: string
          description?: string | null
          disbursement_id?: string
          form_type?: string | null
          payment_id?: number | null
          project_id?: string
          status?: string
          treasury_code?: string | null
          type?: string | null
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
      document_attachments: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          related_id: string
          related_type: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          related_id: string
          related_type: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          related_id?: string
          related_type?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: number
          cde_folder_id: string | null
          cde_status: string | null
          contractor_id: string | null
          created_at: string
          deadline: string | null
          discipline: string | null
          doc_id: number
          doc_name: string
          doc_type: string | null
          document_number: string | null
          folder_id: string | null
          is_digitized: boolean | null
          iso_status: string | null
          issue_date: string | null
          issuing_authority: string | null
          legal_status: string | null
          notes: string | null
          priority: string | null
          project_id: string | null
          reference_id: string | null
          revision: string | null
          size: string | null
          source: string | null
          storage_path: string
          submitted_by: string | null
          submitted_by_org: string | null
          updated_by: string | null
          upload_date: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          category?: number
          cde_folder_id?: string | null
          cde_status?: string | null
          contractor_id?: string | null
          created_at?: string
          deadline?: string | null
          discipline?: string | null
          doc_id?: number
          doc_name: string
          doc_type?: string | null
          document_number?: string | null
          folder_id?: string | null
          is_digitized?: boolean | null
          iso_status?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          legal_status?: string | null
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          reference_id?: string | null
          revision?: string | null
          size?: string | null
          source?: string | null
          storage_path: string
          submitted_by?: string | null
          submitted_by_org?: string | null
          updated_by?: string | null
          upload_date?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          category?: number
          cde_folder_id?: string | null
          cde_status?: string | null
          contractor_id?: string | null
          created_at?: string
          deadline?: string | null
          discipline?: string | null
          doc_id?: number
          doc_name?: string
          doc_type?: string | null
          document_number?: string | null
          folder_id?: string | null
          is_digitized?: boolean | null
          iso_status?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          legal_status?: string | null
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          reference_id?: string | null
          revision?: string | null
          size?: string | null
          source?: string | null
          storage_path?: string
          submitted_by?: string | null
          submitted_by_org?: string | null
          updated_by?: string | null
          upload_date?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_cde_folder_id_fkey"
            columns: ["cde_folder_id"]
            isOneToOne: false
            referencedRelation: "cde_folders"
            referencedColumns: ["id"]
          },
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
        }
        Relationships: []
      }
      entity_registry: {
        Row: {
          color: string | null
          created_at: string | null
          entity_type: string
          icon: string | null
          is_active: boolean | null
          label: string
          url_pattern: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          entity_type: string
          icon?: string | null
          is_active?: boolean | null
          label: string
          url_pattern?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          entity_type?: string
          icon?: string | null
          is_active?: boolean | null
          label?: string
          url_pattern?: string | null
        }
        Relationships: []
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
      inspections: {
        Row: {
          attachments: Json | null
          conclusion: string | null
          created_at: string | null
          created_by: string | null
          decision_date: string | null
          decision_number: string | null
          end_date: string | null
          follow_up_deadline: string | null
          follow_up_notes: string | null
          follow_up_status: string | null
          inspection_agency: string | null
          inspection_id: string
          inspection_name: string
          inspection_type: string
          inspector_name: string | null
          penalties: number | null
          project_id: string
          recommendations: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          conclusion?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_date?: string | null
          decision_number?: string | null
          end_date?: string | null
          follow_up_deadline?: string | null
          follow_up_notes?: string | null
          follow_up_status?: string | null
          inspection_agency?: string | null
          inspection_id?: string
          inspection_name: string
          inspection_type?: string
          inspector_name?: string | null
          penalties?: number | null
          project_id: string
          recommendations?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          conclusion?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_date?: string | null
          decision_number?: string | null
          end_date?: string | null
          follow_up_deadline?: string | null
          follow_up_notes?: string | null
          follow_up_status?: string | null
          inspection_agency?: string | null
          inspection_id?: string
          inspection_name?: string
          inspection_type?: string
          inspector_name?: string | null
          penalties?: number | null
          project_id?: string
          recommendations?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
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
          status: string
          technical_score: number | null
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
          status?: string
          technical_score?: number | null
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
          status?: string
          technical_score?: number | null
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
          rejected_by: string | null
          rejected_date: string | null
          rejected_reason: string | null
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
          rejected_by?: string | null
          rejected_date?: string | null
          rejected_reason?: string | null
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
          rejected_by?: string | null
          rejected_date?: string | null
          rejected_reason?: string | null
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
          plan_id?: string
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
          actual_end_date: string | null
          applicable_standards: string | null
          approval_date: string | null
          basement_floors: number | null
          bim_status: string | null
          building_density: number | null
          building_height: number | null
          capital_source: string | null
          cde_project_code: string | null
          competent_authority: string | null
          construction_area: number | null
          construction_grade: string | null
          construction_type: string | null
          coordinates: Json | null
          created_at: string
          decision_authority: string | null
          decision_date: string | null
          decision_maker_id: string | null
          decision_number: string | null
          design_contractor: string | null
          duration: string | null
          expected_end_date: string | null
          feasibility_contractor: string | null
          floor_area: number | null
          group_code: string
          image_url: string | null
          investment_type: number
          investor_name: string | null
          is_emergency: boolean
          is_oda: boolean | null
          is_synced: boolean | null
          land_use_coefficient: number | null
          last_sync_date: string | null
          location_code: string | null
          main_contractor_name: string | null
          management_board: number | null
          management_form: string | null
          national_project_code: string | null
          objective: string | null
          payment_progress: number | null
          progress: number | null
          project_id: string
          project_name: string
          project_number: string | null
          province_code: string | null
          requires_bim: boolean | null
          review_contractor: string | null
          sector: string | null
          site_area: number | null
          stage: string | null
          start_date: string | null
          status: number
          supervision_contractor: string | null
          survey_contractor: string | null
          sync_error: string | null
          total_estimate: number | null
          total_investment: number
          updated_at: string
          version: string | null
        }
        Insert: {
          above_ground_floors?: number | null
          actual_end_date?: string | null
          applicable_standards?: string | null
          approval_date?: string | null
          basement_floors?: number | null
          bim_status?: string | null
          building_density?: number | null
          building_height?: number | null
          capital_source?: string | null
          cde_project_code?: string | null
          competent_authority?: string | null
          construction_area?: number | null
          construction_grade?: string | null
          construction_type?: string | null
          coordinates?: Json | null
          created_at?: string
          decision_authority?: string | null
          decision_date?: string | null
          decision_maker_id?: string | null
          decision_number?: string | null
          design_contractor?: string | null
          duration?: string | null
          expected_end_date?: string | null
          feasibility_contractor?: string | null
          floor_area?: number | null
          group_code?: string
          image_url?: string | null
          investment_type?: number
          investor_name?: string | null
          is_emergency?: boolean
          is_oda?: boolean | null
          is_synced?: boolean | null
          land_use_coefficient?: number | null
          last_sync_date?: string | null
          location_code?: string | null
          main_contractor_name?: string | null
          management_board?: number | null
          management_form?: string | null
          national_project_code?: string | null
          objective?: string | null
          payment_progress?: number | null
          progress?: number | null
          project_id: string
          project_name: string
          project_number?: string | null
          province_code?: string | null
          requires_bim?: boolean | null
          review_contractor?: string | null
          sector?: string | null
          site_area?: number | null
          stage?: string | null
          start_date?: string | null
          status?: number
          supervision_contractor?: string | null
          survey_contractor?: string | null
          sync_error?: string | null
          total_estimate?: number | null
          total_investment?: number
          updated_at?: string
          version?: string | null
        }
        Update: {
          above_ground_floors?: number | null
          actual_end_date?: string | null
          applicable_standards?: string | null
          approval_date?: string | null
          basement_floors?: number | null
          bim_status?: string | null
          building_density?: number | null
          building_height?: number | null
          capital_source?: string | null
          cde_project_code?: string | null
          competent_authority?: string | null
          construction_area?: number | null
          construction_grade?: string | null
          construction_type?: string | null
          coordinates?: Json | null
          created_at?: string
          decision_authority?: string | null
          decision_date?: string | null
          decision_maker_id?: string | null
          decision_number?: string | null
          design_contractor?: string | null
          duration?: string | null
          expected_end_date?: string | null
          feasibility_contractor?: string | null
          floor_area?: number | null
          group_code?: string
          image_url?: string | null
          investment_type?: number
          investor_name?: string | null
          is_emergency?: boolean
          is_oda?: boolean | null
          is_synced?: boolean | null
          land_use_coefficient?: number | null
          last_sync_date?: string | null
          location_code?: string | null
          main_contractor_name?: string | null
          management_board?: number | null
          management_form?: string | null
          national_project_code?: string | null
          objective?: string | null
          payment_progress?: number | null
          progress?: number | null
          project_id?: string
          project_name?: string
          project_number?: string | null
          province_code?: string | null
          requires_bim?: boolean | null
          review_contractor?: string | null
          sector?: string | null
          site_area?: number | null
          stage?: string | null
          start_date?: string | null
          status?: number
          supervision_contractor?: string | null
          survey_contractor?: string | null
          sync_error?: string | null
          total_estimate?: number | null
          total_investment?: number
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      settlement_records: {
        Row: {
          contract_id: string
          created_at: string | null
          decision_number: string | null
          id: string
          notes: string | null
          retention_amount: number | null
          settlement_date: string | null
          settlement_value: number
          status: string | null
          updated_at: string | null
          warranty_end_date: string | null
          warranty_months: number | null
          warranty_start_date: string | null
          warranty_status: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          decision_number?: string | null
          id?: string
          notes?: string | null
          retention_amount?: number | null
          settlement_date?: string | null
          settlement_value?: number
          status?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
          warranty_status?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          decision_number?: string | null
          id?: string
          notes?: string | null
          retention_amount?: number | null
          settlement_date?: string | null
          settlement_value?: number
          status?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_records_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
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
          due_date: string | null
          status: string
          sub_task_id: string
          task_id: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          due_date?: string | null
          status?: string
          sub_task_id?: string
          task_id: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          due_date?: string | null
          status?: string
          sub_task_id?: string
          task_id?: string
          title?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          attachments: Json | null
          comment_type: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          parent_comment_id: string | null
          reactions: Json | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          comment_type?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reactions?: Json | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          comment_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reactions?: Json | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_links: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_label: string | null
          entity_type: string
          id: string
          link_type: string | null
          task_id: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_label?: string | null
          entity_type: string
          id?: string
          link_type?: string | null
          task_id: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_label?: string | null
          entity_type?: string
          id?: string
          link_type?: string | null
          task_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_done: boolean | null
          name: string
          sort_order: number | null
          space_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_done?: boolean | null
          name: string
          sort_order?: number | null
          space_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_done?: boolean | null
          name?: string
          sort_order?: number | null
          space_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          action_config: Json | null
          action_label: string | null
          action_type: string | null
          actual_end_date: string | null
          actual_start_date: string | null
          approver_id: string | null
          approvers: string[] | null
          assignee_id: string | null
          assignees: string[] | null
          attachments: Json | null
          auto_generated: boolean | null
          completed_at: string | null
          completed_by: string | null
          completion_trigger: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          dependencies: Json | null
          description: string | null
          due_date: string | null
          duration_days: number | null
          estimated_cost: number | null
          folder_id: string | null
          id: string
          is_critical: boolean | null
          is_private: boolean | null
          legal_basis: string | null
          list_id: string | null
          output_document: string | null
          parent_id: string | null
          phase: string | null
          predecessor_task_id: string | null
          priority: string | null
          progress: number | null
          project_id: string | null
          sort_order: number | null
          source_entity_id: string | null
          source_event: string | null
          source_module: string | null
          space_id: string | null
          start_date: string | null
          status: string | null
          status_id: string | null
          step_code: string | null
          sub_tasks: Json | null
          supporters: string[] | null
          tags: string[] | null
          task_id: string | null
          time_estimate: number | null
          time_spent: number | null
          title: string
          updated_at: string | null
          watchers: string[] | null
        }
        Insert: {
          action_config?: Json | null
          action_label?: string | null
          action_type?: string | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          approver_id?: string | null
          approvers?: string[] | null
          assignee_id?: string | null
          assignees?: string[] | null
          attachments?: Json | null
          auto_generated?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          completion_trigger?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          duration_days?: number | null
          estimated_cost?: number | null
          folder_id?: string | null
          id?: string
          is_critical?: boolean | null
          is_private?: boolean | null
          legal_basis?: string | null
          list_id?: string | null
          output_document?: string | null
          parent_id?: string | null
          phase?: string | null
          predecessor_task_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          sort_order?: number | null
          source_entity_id?: string | null
          source_event?: string | null
          source_module?: string | null
          space_id?: string | null
          start_date?: string | null
          status?: string | null
          status_id?: string | null
          step_code?: string | null
          sub_tasks?: Json | null
          supporters?: string[] | null
          tags?: string[] | null
          task_id?: string | null
          time_estimate?: number | null
          time_spent?: number | null
          title: string
          updated_at?: string | null
          watchers?: string[] | null
        }
        Update: {
          action_config?: Json | null
          action_label?: string | null
          action_type?: string | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          approver_id?: string | null
          approvers?: string[] | null
          assignee_id?: string | null
          assignees?: string[] | null
          attachments?: Json | null
          auto_generated?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          completion_trigger?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          duration_days?: number | null
          estimated_cost?: number | null
          folder_id?: string | null
          id?: string
          is_critical?: boolean | null
          is_private?: boolean | null
          legal_basis?: string | null
          list_id?: string | null
          output_document?: string | null
          parent_id?: string | null
          phase?: string | null
          predecessor_task_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          sort_order?: number | null
          source_entity_id?: string | null
          source_event?: string | null
          source_module?: string | null
          space_id?: string | null
          start_date?: string | null
          status?: string | null
          status_id?: string | null
          step_code?: string | null
          sub_tasks?: Json | null
          supporters?: string[] | null
          tags?: string[] | null
          task_id?: string | null
          time_estimate?: number | null
          time_spent?: number | null
          title?: string
          updated_at?: string | null
          watchers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
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
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
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
          password_hash: string
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
          actions: string[] | null
          created_at: string | null
          id: string
          resource: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: string[] | null
          created_at?: string | null
          id?: string
          resource: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: string[] | null
          created_at?: string | null
          id?: string
          resource?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          comments: string | null
          completed_at: string | null
          created_at: string | null
          digital_signature: Json | null
          due_date: string | null
          id: string
          instance_id: string
          node_id: string
          status: Database["public"]["Enums"]["workflow_task_status"] | null
        }
        Insert: {
          action_taken?: string | null
          assignee_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          digital_signature?: Json | null
          due_date?: string | null
          id?: string
          instance_id: string
          node_id: string
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
        }
        Update: {
          action_taken?: string | null
          assignee_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          digital_signature?: Json | null
          due_date?: string | null
          id?: string
          instance_id?: string
          node_id?: string
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
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
      [_ in never]: never
    }
    Functions: {
      activate_project_workflow: {
        Args: {
          p_project_group?: string
          p_project_id: string
          p_start_date?: string
          p_started_by?: string
          p_template_code: string
        }
        Returns: Json
      }
      complete_workflow_step: {
        Args: {
          p_completed_by?: string
          p_decision_authority?: string
          p_decision_date?: string
          p_decision_number?: string
          p_new_status: string
          p_notes?: string
          p_step_id: string
        }
        Returns: Json
      }
      delete_project_tasks: { Args: { p_project_id: string }; Returns: number }
      get_project_workflow_overview: {
        Args: { p_project_id: string }
        Returns: Json
      }
      get_user_profile_by_auth_id: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      resolve_user_identity: { Args: { p_identifier: string }; Returns: Json }
      seed_cde_folders: { Args: { p_project_id: string }; Returns: undefined }
    }
    Enums: {
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
