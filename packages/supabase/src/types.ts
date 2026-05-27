export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          activity_id: string
          area_id: string | null
          cantidad_estimada: number
          company_id: string
          created_at: string
          estado: Database["public"]["Enums"]["access_request_status"]
          fecha_desde: string
          fecha_hasta: string
          horario_fin: string
          horario_inicio: string
          id: string
          nivel_riesgo: Database["public"]["Enums"]["risk_level"]
          observaciones: string | null
          public_token: string
          public_token_expires_at: string
          responsable_cenfer_id: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          area_id?: string | null
          cantidad_estimada: number
          company_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["access_request_status"]
          fecha_desde: string
          fecha_hasta: string
          horario_fin?: string
          horario_inicio?: string
          id?: string
          nivel_riesgo: Database["public"]["Enums"]["risk_level"]
          observaciones?: string | null
          public_token?: string
          public_token_expires_at: string
          responsable_cenfer_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          area_id?: string | null
          cantidad_estimada?: number
          company_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["access_request_status"]
          fecha_desde?: string
          fecha_hasta?: string
          horario_fin?: string
          horario_inicio?: string
          id?: string
          nivel_riesgo?: Database["public"]["Enums"]["risk_level"]
          observaciones?: string | null
          public_token?: string
          public_token_expires_at?: string
          responsable_cenfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activa: boolean
          created_at: string
          documentos_requeridos: Database["public"]["Enums"]["document_type_key"][]
          id: string
          nivel_riesgo_default: Database["public"]["Enums"]["risk_level"]
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          documentos_requeridos?: Database["public"]["Enums"]["document_type_key"][]
          id?: string
          nivel_riesgo_default: Database["public"]["Enums"]["risk_level"]
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          documentos_requeridos?: Database["public"]["Enums"]["document_type_key"][]
          id?: string
          nivel_riesgo_default?: Database["public"]["Enums"]["risk_level"]
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          activa: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          activa: boolean
          contacto_email: string
          contacto_nombre: string
          contacto_telefono: string | null
          created_at: string
          documentos_legales: Json
          id: string
          nit: string
          razon_social: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          contacto_email: string
          contacto_nombre: string
          contacto_telefono?: string | null
          created_at?: string
          documentos_legales?: Json
          id?: string
          nit: string
          razon_social: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          contacto_email?: string
          contacto_nombre?: string
          contacto_telefono?: string | null
          created_at?: string
          documentos_legales?: Json
          id?: string
          nit?: string
          razon_social?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string
          key: Database["public"]["Enums"]["document_type_key"]
          meses_vigencia_default: number | null
          nombre: string
          requiere_vencimiento: boolean
        }
        Insert: {
          created_at?: string
          key: Database["public"]["Enums"]["document_type_key"]
          meses_vigencia_default?: number | null
          nombre: string
          requiere_vencimiento?: boolean
        }
        Update: {
          created_at?: string
          key?: Database["public"]["Enums"]["document_type_key"]
          meses_vigencia_default?: number | null
          nombre?: string
          requiere_vencimiento?: boolean
        }
        Relationships: []
      }
      people: {
        Row: {
          apellido: string
          arl: string | null
          cargo: string | null
          cedula: string
          company_id: string
          created_at: string
          email: string | null
          eps: string | null
          foto_url: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido: string
          arl?: string | null
          cargo?: string | null
          cedula: string
          company_id: string
          created_at?: string
          email?: string | null
          eps?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string
          arl?: string | null
          cargo?: string | null
          cedula?: string
          company_id?: string
          created_at?: string
          email?: string | null
          eps?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      person_documents: {
        Row: {
          archivo_url: string
          created_at: string
          document_type: Database["public"]["Enums"]["document_type_key"]
          estado: Database["public"]["Enums"]["document_status"]
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          motivo_rechazo: string | null
          person_id: string
          revisado_at: string | null
          revisado_por: string | null
          updated_at: string
        }
        Insert: {
          archivo_url: string
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type_key"]
          estado?: Database["public"]["Enums"]["document_status"]
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          motivo_rechazo?: string | null
          person_id: string
          revisado_at?: string | null
          revisado_por?: string | null
          updated_at?: string
        }
        Update: {
          archivo_url?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type_key"]
          estado?: Database["public"]["Enums"]["document_status"]
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          motivo_rechazo?: string | null
          person_id?: string
          revisado_at?: string | null
          revisado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_documents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      porterias: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
          ubicacion: string | null
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
          ubicacion?: string | null
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
          ubicacion?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string
          created_at: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["role"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido: string
          created_at?: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["role"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string
          created_at?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["role"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      request_misc: {
        Row: {
          access_request_id: string
          descripcion: string
          id: string
        }
        Insert: {
          access_request_id: string
          descripcion: string
          id?: string
        }
        Update: {
          access_request_id?: string
          descripcion?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_misc_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_people: {
        Row: {
          access_request_id: string
          created_at: string
          estado_individual: Database["public"]["Enums"]["person_request_status"]
          id: string
          person_id: string
          qr_code: string | null
          qr_expires_at: string | null
        }
        Insert: {
          access_request_id: string
          created_at?: string
          estado_individual?: Database["public"]["Enums"]["person_request_status"]
          id?: string
          person_id: string
          qr_code?: string | null
          qr_expires_at?: string | null
        }
        Update: {
          access_request_id?: string
          created_at?: string
          estado_individual?: Database["public"]["Enums"]["person_request_status"]
          id?: string
          person_id?: string
          qr_code?: string | null
          qr_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_people_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      request_tools: {
        Row: {
          access_request_id: string
          cantidad: number
          descripcion: string
          id: string
          serial: string | null
        }
        Insert: {
          access_request_id: string
          cantidad?: number
          descripcion: string
          id?: string
          serial?: string | null
        }
        Update: {
          access_request_id?: string
          cantidad?: number
          descripcion?: string
          id?: string
          serial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_tools_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_vehicles: {
        Row: {
          access_request_id: string
          conductor_person_id: string | null
          id: string
          placa: string
          tipo: string
        }
        Insert: {
          access_request_id: string
          conductor_person_id?: string | null
          id?: string
          placa: string
          tipo: string
        }
        Update: {
          access_request_id?: string
          conductor_person_id?: string | null
          id?: string
          placa?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_vehicles_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_conductor_person_id_fkey"
            columns: ["conductor_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role"]
      }
      get_request_by_token: {
        Args: { token: string }
        Returns: {
          activity_id: string
          area_id: string
          cantidad_estimada: number
          company_id: string
          estado: Database["public"]["Enums"]["access_request_status"]
          fecha_desde: string
          fecha_hasta: string
          id: string
          nivel_riesgo: Database["public"]["Enums"]["risk_level"]
          observaciones: string
          public_token_expires_at: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      access_request_status:
        | "borrador"
        | "enviada"
        | "en_carga"
        | "en_revision_sst"
        | "aprobada"
        | "rechazada"
        | "vigente"
        | "vencida"
        | "cancelada"
      document_status: "pendiente" | "aprobado" | "rechazado"
      document_type_key:
        | "cedula"
        | "arl"
        | "eps"
        | "pila"
        | "foto"
        | "induccion"
        | "alturas"
        | "examen_medico"
      person_request_status:
        | "pendiente_docs"
        | "en_revision"
        | "aprobada"
        | "rechazada"
      risk_level: "bajo" | "medio" | "alto"
      role:
        | "super_admin"
        | "sst"
        | "recepcion"
        | "empresa"
        | "portero"
        | "persona"
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
      access_request_status: [
        "borrador",
        "enviada",
        "en_carga",
        "en_revision_sst",
        "aprobada",
        "rechazada",
        "vigente",
        "vencida",
        "cancelada",
      ],
      document_status: ["pendiente", "aprobado", "rechazado"],
      document_type_key: [
        "cedula",
        "arl",
        "eps",
        "pila",
        "foto",
        "induccion",
        "alturas",
        "examen_medico",
      ],
      person_request_status: [
        "pendiente_docs",
        "en_revision",
        "aprobada",
        "rechazada",
      ],
      risk_level: ["bajo", "medio", "alto"],
      role: [
        "super_admin",
        "sst",
        "recepcion",
        "empresa",
        "portero",
        "persona",
      ],
    },
  },
} as const
