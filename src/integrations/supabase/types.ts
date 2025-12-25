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
      book_classes: {
        Row: {
          book_author: string | null
          book_cover_url: string | null
          book_title: string | null
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          max_participants: number | null
          platform: string
          platform_join_url: string | null
          platform_meeting_id: string | null
          platform_meeting_url: string | null
          scheduled_date: string | null
          show_participant_count: boolean
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_author?: string | null
          book_cover_url?: string | null
          book_title?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          max_participants?: number | null
          platform: string
          platform_join_url?: string | null
          platform_meeting_id?: string | null
          platform_meeting_url?: string | null
          scheduled_date?: string | null
          show_participant_count?: boolean
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_author?: string | null
          book_cover_url?: string | null
          book_title?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          max_participants?: number | null
          platform?: string
          platform_join_url?: string | null
          platform_meeting_id?: string | null
          platform_meeting_url?: string | null
          scheduled_date?: string | null
          show_participant_count?: boolean
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      book_story_comments: {
        Row: {
          book_id: string
          comment: string
          commenter_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          book_id: string
          comment: string
          commenter_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          comment?: string
          commenter_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_story_reactions: {
        Row: {
          book_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean
          message: string
          message_type: string
          reactions: Json
          reply_to_id: string | null
          room_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message: string
          message_type?: string
          reactions?: Json
          reply_to_id?: string | null
          room_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message?: string
          message_type?: string
          reactions?: Json
          reply_to_id?: string | null
          room_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_chat_messages: {
        Row: {
          class_id: string
          created_at: string
          id: string
          message: string
          message_type: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_chat_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "book_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_meeting_credentials: {
        Row: {
          access_count: number | null
          class_id: string
          created_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          platform_access_token: string | null
          platform_password: string | null
          platform_refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_count?: number | null
          class_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          platform_access_token?: string | null
          platform_password?: string | null
          platform_refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_count?: number | null
          class_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          platform_access_token?: string | null
          platform_password?: string | null
          platform_refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      class_participants: {
        Row: {
          class_id: string
          created_at: string
          id: string
          joined_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "book_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          activity_score: number
          category: string | null
          created_at: string
          created_by: string
          description: string
          guidelines: string | null
          id: string
          is_public: boolean
          location: string | null
          member_count: number
          name: string
          restrict_messaging: boolean
          tags: string[]
          updated_at: string
        }
        Insert: {
          activity_score?: number
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          guidelines?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          member_count?: number
          name: string
          restrict_messaging?: boolean
          tags?: string[]
          updated_at?: string
        }
        Update: {
          activity_score?: number
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          guidelines?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          member_count?: number
          name?: string
          restrict_messaging?: boolean
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          engagement_score: number
          id: string
          joined_at: string
          last_active_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          engagement_score?: number
          id?: string
          joined_at?: string
          last_active_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          engagement_score?: number
          id?: string
          joined_at?: string
          last_active_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_community_members_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_members_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          message: string
          message_type: string | null
          reactions: Json | null
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message: string
          message_type?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message?: string
          message_type?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_community_messages_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_messages_community_id"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_messages_reply"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_messages_reply_to_id"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_messages_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_recommendations: {
        Row: {
          algorithm_type: string
          community_id: string
          computed_at: string
          expires_at: string
          id: string
          reason: string | null
          score: number
          user_id: string
        }
        Insert: {
          algorithm_type: string
          community_id: string
          computed_at?: string
          expires_at?: string
          id?: string
          reason?: string | null
          score: number
          user_id: string
        }
        Update: {
          algorithm_type?: string
          community_id?: string
          computed_at?: string
          expires_at?: string
          id?: string
          reason?: string | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      community_typing_indicators: {
        Row: {
          community_id: string
          expires_at: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          expires_at?: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          expires_at?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_typing_indicators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      credential_access_log: {
        Row: {
          action: string
          class_id: string
          created_at: string
          id: string
          ip_address: unknown
          risk_score: number | null
          session_id: string | null
          suspicious_activity: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          class_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_id?: string | null
          suspicious_activity?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          class_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_id?: string | null
          suspicious_activity?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_read: boolean
          message: string
          reactions: Json | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_read?: boolean
          message: string
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_read?: boolean
          message?: string
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          class_id: string
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "book_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      followed_books: {
        Row: {
          book_author: string | null
          book_title: string
          followed_at: string
          id: string
          last_activity_check: string | null
          notification_enabled: boolean
          user_id: string
        }
        Insert: {
          book_author?: string | null
          book_title: string
          followed_at?: string
          id?: string
          last_activity_check?: string | null
          notification_enabled?: boolean
          user_id: string
        }
        Update: {
          book_author?: string | null
          book_title?: string
          followed_at?: string
          id?: string
          last_activity_check?: string | null
          notification_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          cover_photo_url: string | null
          created_at: string
          display_name: string | null
          email_notifications: boolean | null
          id: string
          is_private: boolean | null
          location: string | null
          location_sharing_level: string | null
          notify_on_book_class: boolean | null
          notify_on_follow: boolean | null
          profile_picture_url: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          role: string | null
          show_location: boolean | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          is_private?: boolean | null
          location?: string | null
          location_sharing_level?: string | null
          notify_on_book_class?: boolean | null
          notify_on_follow?: boolean | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role?: string | null
          show_location?: boolean | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          is_private?: boolean | null
          location?: string | null
          location_sharing_level?: string | null
          notify_on_book_class?: boolean | null
          notify_on_follow?: boolean | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role?: string | null
          show_location?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_books: {
        Row: {
          acquisition_method: string | null
          author: string
          city: string | null
          code: string | null
          cover_url: string | null
          created_at: string
          district: string | null
          edited_at: string | null
          formatted_address: string | null
          genre: string | null
          id: string
          is_edited: boolean | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          notes: string | null
          previous_owner: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_method?: string | null
          author: string
          city?: string | null
          code?: string | null
          cover_url?: string | null
          created_at?: string
          district?: string | null
          edited_at?: string | null
          formatted_address?: string | null
          genre?: string | null
          id?: string
          is_edited?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          notes?: string | null
          previous_owner?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_method?: string | null
          author?: string
          city?: string | null
          code?: string | null
          cover_url?: string | null
          created_at?: string
          district?: string | null
          edited_at?: string | null
          formatted_address?: string | null
          genre?: string | null
          id?: string
          is_edited?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          notes?: string | null
          previous_owner?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_community_interactions: {
        Row: {
          community_id: string
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
          weight: number
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
          weight?: number
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_join_request: {
        Args: { p_approve?: boolean; p_request_id: string }
        Returns: undefined
      }
      can_user_send_messages: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      clean_expired_recommendations: { Args: never; Returns: undefined }
      cleanup_expired_credentials: { Args: never; Returns: undefined }
      cleanup_expired_typing_indicators: { Args: never; Returns: undefined }
      create_admin_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      create_group_chat: {
        Args: {
          p_avatar_url?: string
          p_description?: string
          p_member_ids: string[]
          p_name: string
        }
        Returns: string
      }
      decrypt_credential: {
        Args: { encrypted_credential: string }
        Returns: string
      }
      detect_suspicious_access: {
        Args: { p_class_id: string; p_user_id: string }
        Returns: boolean
      }
      encrypt_and_store_credentials: {
        Args: {
          p_access_token?: string
          p_class_id: string
          p_password?: string
          p_refresh_token?: string
        }
        Returns: undefined
      }
      encrypt_credential: { Args: { credential: string }; Returns: string }
      ensure_encryption_key: { Args: never; Returns: undefined }
      get_all_book_classes: {
        Args: { filter_categories?: string[]; search_query?: string }
        Returns: {
          book_author: string
          book_cover_url: string
          book_title: string
          category: string
          created_at: string
          description: string
          duration_minutes: number
          host_name: string
          host_user_id: string
          host_username: string
          id: string
          max_participants: number
          participant_count: number
          platform: string
          platform_join_url: string
          scheduled_date: string
          show_participant_count: boolean
          status: string
          tags: string[]
          title: string
        }[]
      }
      get_book_statistics: {
        Args: never
        Returns: {
          author: string
          city: string
          cover_url: string
          created_at: string
          current_location: string
          genre: string
          id: string
          journeys: number
          stories: number
          tags: string[]
          title: string
          user_id: string
        }[]
      }
      get_book_statistics_v2: {
        Args: never
        Returns: {
          author: string
          city: string
          code: string
          cover_url: string
          created_at: string
          current_location: string
          genre: string
          id: string
          journeys: number
          stories: number
          tags: string[]
          title: string
          user_id: string
        }[]
      }
      get_community_analytics: {
        Args: { p_community_id: string }
        Returns: {
          active_members_count: number
          last_activity: string
          member_count: number
          message_count: number
          recent_messages_count: number
        }[]
      }
      get_community_message_count: {
        Args: { p_community_id: string }
        Returns: number
      }
      get_decrypted_credentials: {
        Args: { p_class_id: string }
        Returns: {
          platform_access_token: string
          platform_password: string
          platform_refresh_token: string
        }[]
      }
      get_latest_community_activity: {
        Args: { p_community_id: string }
        Returns: string
      }
      get_live_book_classes:
        | {
            Args: never
            Returns: {
              book_author: string
              book_cover_url: string
              book_title: string
              category: string
              description: string
              duration_minutes: number
              host_name: string
              host_username: string
              id: string
              is_ongoing: boolean
              max_participants: number
              minutes_since_start: number
              participant_count: number
              platform: string
              platform_join_url: string
              scheduled_date: string
              show_participant_count: boolean
              status: string
              tags: string[]
              title: string
            }[]
          }
        | {
            Args: {
              filter_categories?: string[]
              include_upcoming?: boolean
              search_query?: string
            }
            Returns: {
              book_author: string
              book_cover_url: string
              book_title: string
              category: string
              description: string
              duration_minutes: number
              host_name: string
              host_username: string
              id: string
              is_ongoing: boolean
              max_participants: number
              minutes_since_start: number
              participant_count: number
              platform: string
              platform_join_url: string
              scheduled_date: string
              show_participant_count: boolean
              status: string
              tags: string[]
              title: string
            }[]
          }
      get_or_create_chat_room: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_user_books_with_privacy: {
        Args: { target_user_id?: string }
        Returns: {
          acquisition_method: string
          author: string
          code: string
          cover_url: string
          created_at: string
          genre: string
          id: string
          location_data: Json
          notes: string
          previous_owner: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_interests: {
        Args: { p_user_id: string }
        Returns: {
          interest_type: string
          interest_value: string
          weight: number
        }[]
      }
      is_admin: { Args: { user_id_param?: string }; Returns: boolean }
      is_chat_room_admin: {
        Args: { p_room_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_chat_room_member: {
        Args: { p_room_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_class_owner: {
        Args: { class_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_community_admin: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_class_participant: {
        Args: { class_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_user_in_community: {
        Args: { community_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_user_member_of_community: {
        Args: { community_uuid: string; user_uuid: string }
        Returns: boolean
      }
      mask_location_data: {
        Args: {
          city: string
          formatted_address: string
          lat: number
          lng: number
          neighborhood: string
          sharing_level: string
        }
        Returns: Json
      }
      track_credential_access: {
        Args: { p_class_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
