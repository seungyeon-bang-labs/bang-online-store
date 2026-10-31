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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_variant_id: number
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_variant_id: number
          quantity: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_variant_id?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_operations: {
        Row: {
          cart_id: string
          completed_at: string
          operation_type: string
          request_id: string
          request_payload: Json
          result: Json
        }
        Insert: {
          cart_id: string
          completed_at?: string
          operation_type: string
          request_id: string
          request_payload: Json
          result: Json
        }
        Update: {
          cart_id?: string
          completed_at?: string
          operation_type?: string
          request_id?: string
          request_payload?: Json
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cart_operations_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          revision?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_path: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id: string
          image_path?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          code: string
          hex_code: string
          id: number
          label: string
        }
        Insert: {
          code: string
          hex_code: string
          id: number
          label: string
        }
        Update: {
          code?: string
          hex_code?: string
          id?: number
          label?: string
        }
        Relationships: []
      }
      discount_items: {
        Row: {
          discount_id: number
          discount_rate: number
          product_id: number
        }
        Insert: {
          discount_id: number
          discount_rate: number
          product_id: number
        }
        Update: {
          discount_id?: number
          discount_rate?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_items_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string
          ends_at: string
          id: number
          is_active: boolean
          priority: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id: number
          is_active?: boolean
          priority?: number
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: number
          is_active?: boolean
          priority?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          line_total_amount: number
          option_label: string
          order_id: string
          product_id: number
          product_name: string
          product_variant_id: number
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount: number
          id?: string
          line_total_amount: number
          option_label: string
          order_id: string
          product_id: number
          product_name: string
          product_variant_id: number
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          line_total_amount?: number
          option_label?: string
          order_id?: string
          product_id?: number
          product_name?: string
          product_variant_id?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_transactions: {
        Row: {
          amount: number
          id: string
          occurred_at: string
          order_id: string
          payment_method: Database["public"]["Enums"]["order_payment_method"]
          receipt_details: Json | null
          type: string
        }
        Insert: {
          amount: number
          id?: string
          occurred_at?: string
          order_id: string
          payment_method: Database["public"]["Enums"]["order_payment_method"]
          receipt_details?: Json | null
          type: string
        }
        Update: {
          amount?: number
          id?: string
          occurred_at?: string
          order_id?: string
          payment_method?: Database["public"]["Enums"]["order_payment_method"]
          receipt_details?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_histories: {
        Row: {
          id: string
          occurred_at: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          id?: string
          occurred_at?: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          id?: string
          occurred_at?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_histories_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          delivered_at: string | null
          delivery_note: string | null
          discount_amount: number
          estimated_delivery_at: string | null
          id: string
          order_number: string
          ordered_at: string
          paid_at: string | null
          payment_due_at: string | null
          payment_method: Database["public"]["Enums"]["order_payment_method"]
          postal_code: string
          recipient_name: string
          recipient_phone: string
          request_id: string
          shipping_address_line_1: string
          shipping_address_line_2: string | null
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_amount: number
          total_amount: number
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          delivered_at?: string | null
          delivery_note?: string | null
          discount_amount: number
          estimated_delivery_at?: string | null
          id?: string
          order_number: string
          ordered_at?: string
          paid_at?: string | null
          payment_due_at?: string | null
          payment_method: Database["public"]["Enums"]["order_payment_method"]
          postal_code: string
          recipient_name: string
          recipient_phone: string
          request_id: string
          shipping_address_line_1: string
          shipping_address_line_2?: string | null
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_amount: number
          total_amount: number
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          delivered_at?: string | null
          delivery_note?: string | null
          discount_amount?: number
          estimated_delivery_at?: string | null
          id?: string
          order_number?: string
          ordered_at?: string
          paid_at?: string | null
          payment_due_at?: string | null
          payment_method?: Database["public"]["Enums"]["order_payment_method"]
          postal_code?: string
          recipient_name?: string
          recipient_phone?: string
          request_id?: string
          shipping_address_line_1?: string
          shipping_address_line_2?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_amount?: number
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: number
          image_path: string
          image_type: string
          product_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id: number
          image_path: string
          image_type: string
          product_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: number
          image_path?: string
          image_type?: string
          product_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_section_items: {
        Row: {
          display_order: number
          product_id: number
          section_id: number
        }
        Insert: {
          display_order: number
          product_id: number
          section_id: number
        }
        Update: {
          display_order?: number
          product_id?: number
          section_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_section_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "product_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sections: {
        Row: {
          created_at: string
          desktop_rows: number
          display_order: number
          id: number
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desktop_rows: number
          display_order?: number
          id: number
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desktop_rows?: number
          display_order?: number
          id?: number
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_stats: {
        Row: {
          monthly_sales: number
          product_id: number
          today_sales: number
          total_sales: number
          updated_at: string
          weekly_sales: number
        }
        Insert: {
          monthly_sales?: number
          product_id: number
          today_sales?: number
          total_sales?: number
          updated_at?: string
          weekly_sales?: number
        }
        Update: {
          monthly_sales?: number
          product_id?: number
          today_sales?: number
          total_sales?: number
          updated_at?: string
          weekly_sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_stats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_styles: {
        Row: {
          category_id: string
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id: number
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_styles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: number
          price_offset: number
          product_id: number
          size: string
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          price_offset?: number
          product_id: number
          size: string
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          price_offset?: number
          product_id?: number
          size?: string
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          color_id: number
          created_at: string
          display_name: string | null
          id: number
          price: number
          restocked_at: string | null
          state: string
          style_id: number
          updated_at: string
        }
        Insert: {
          color_id: number
          created_at?: string
          display_name?: string | null
          id: number
          price: number
          restocked_at?: string | null
          state?: string
          style_id: number
          updated_at?: string
        }
        Update: {
          color_id?: number
          created_at?: string
          display_name?: string | null
          id?: number
          price?: number
          restocked_at?: string | null
          state?: string
          style_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "product_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      term_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["term_kind"]
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["term_kind"]
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["term_kind"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      terms: {
        Row: {
          content: string | null
          created_at: string
          effective_at: string
          id: string
          is_active: boolean
          is_required: boolean
          term_code_id: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          effective_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          term_code_id: string
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          content?: string | null
          created_at?: string
          effective_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          term_code_id?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_term_code_id_fkey"
            columns: ["term_code_id"]
            isOneToOne: false
            referencedRelation: "term_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          created_at: string
          delivery_note: string | null
          id: string
          is_default: boolean
          label: string | null
          phone_number: string
          postal_code: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          created_at?: string
          delivery_note?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          phone_number: string
          postal_code: string
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          created_at?: string
          delivery_note?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          phone_number?: string
          postal_code?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_term_consents: {
        Row: {
          consented_at: string
          id: string
          term_id: string
          user_id: string
        }
        Insert: {
          consented_at?: string
          id?: string
          term_id: string
          user_id: string
        }
        Update: {
          consented_at?: string
          id?: string
          term_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_term_consents_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_term_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          email_verified_at: string | null
          id: string
          name: string
          phone_number: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          email_verified_at?: string | null
          id: string
          name: string
          phone_number: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          email_verified_at?: string | null
          id?: string
          name?: string
          phone_number?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_cart_operation: {
        Args: {
          p_expected_user_id: string
          p_operation: Json
          p_request_id: string
        }
        Returns: Json
      }
      complete_signup: {
        Args: {
          p_agreements: Json
          p_email: string
          p_name: string
          p_phone_number: string
          p_user_id: string
        }
        Returns: string
      }
      get_cart: { Args: { p_expected_user_id: string }; Returns: Json }
      place_order: {
        Args: {
          p_address_id: string
          p_cart_item_ids: string[]
          p_expected_total: number
          p_expected_user_id: string
          p_payment_method: string
          p_request_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      order_payment_method: "card"
      order_status:
        | "pending_payment"
        | "payment_completed"
        | "shipping"
        | "delivered"
        | "cancelled"
      term_kind: "document" | "confirmation"
      user_role: "customer" | "admin"
      user_status: "active" | "suspended" | "deleted"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      order_payment_method: ["card"],
      order_status: [
        "pending_payment",
        "payment_completed",
        "shipping",
        "delivered",
        "cancelled",
      ],
      term_kind: ["document", "confirmation"],
      user_role: ["customer", "admin"],
      user_status: ["active", "suspended", "deleted"],
    },
  },
} as const
