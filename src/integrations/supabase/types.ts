export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      app_feedback: {
        Row: {
          created_at: string
          feedback: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      book_comments: {
        Row: {
          book_id: number | null
          comment: string
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          book_id?: number | null
          comment: string
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          book_id?: number | null
          comment?: string
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_book_comments_book_id"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_ratings: {
        Row: {
          book_id: number | null
          created_at: string
          id: number
          rating: number
          user_id: string | null
        }
        Insert: {
          book_id?: number | null
          created_at?: string
          id?: number
          rating: number
          user_id?: string | null
        }
        Update: {
          book_id?: number | null
          created_at?: string
          id?: number
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_book_ratings_book_id"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reactions: {
        Row: {
          book_id: number | null
          created_at: string
          id: number
          reaction: string
          user_id: string | null
        }
        Insert: {
          book_id?: number | null
          created_at?: string
          id?: number
          reaction: string
          user_id?: string | null
        }
        Update: {
          book_id?: number | null
          created_at?: string
          id?: number
          reaction?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_book_reactions_book_id"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          added_by_user_id: string | null
          ai_summary: string | null
          author: string
          author_description: string | null
          average_rating: number | null
          book_description: string | null
          book_type: Database["public"]["Enums"]["book_type"] | null
          created_at: string | null
          id: number
          image_url: string | null
          location: Database["public"]["Enums"]["book_location"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          ai_summary?: string | null
          author: string
          author_description?: string | null
          average_rating?: number | null
          book_description?: string | null
          book_type?: Database["public"]["Enums"]["book_type"] | null
          created_at?: string | null
          id?: never
          image_url?: string | null
          location?: Database["public"]["Enums"]["book_location"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          ai_summary?: string | null
          author?: string
          author_description?: string | null
          average_rating?: number | null
          book_description?: string | null
          book_type?: Database["public"]["Enums"]["book_type"] | null
          created_at?: string | null
          id?: never
          image_url?: string | null
          location?: Database["public"]["Enums"]["book_location"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          book_id: number | null
          created_at: string | null
          id: number
          lent_to: string | null
          returned_at: string | null
          user_id: string | null
        }
        Insert: {
          book_id?: number | null
          created_at?: string | null
          id?: never
          lent_to?: string | null
          returned_at?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: number | null
          created_at?: string | null
          id?: never
          lent_to?: string | null
          returned_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_loans_book"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_loans_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          google_id: string | null
          id: string
          is_approved: boolean | null
          picture_url: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          google_id?: string | null
          id: string
          is_approved?: boolean | null
          picture_url?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          google_id?: string | null
          id?: string
          is_approved?: boolean | null
          picture_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      book_location: "Stockholm 🇸🇪" | "Oslo 🇧🇻" | "Helsingør 🇩🇰"
      book_type: "fiction" | "non-fiction" | "cookbook"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
