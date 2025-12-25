-- Create chat_rooms table for unified messaging (direct, group)
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT, -- NULL for direct chats, required for groups
  description TEXT,
  avatar_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

-- Create chat_room_members table
CREATE TABLE public.chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT message_length CHECK (length(message) <= 2000)
);

-- Enable RLS on all tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX idx_chat_room_members_room_id ON public.chat_room_members(room_id);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_rooms_last_message_at ON public.chat_rooms(last_message_at DESC);

-- Security definer function to check if user is member of a room
CREATE OR REPLACE FUNCTION public.is_chat_room_member(p_room_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

-- Security definer function to check if user is admin of a room
CREATE OR REPLACE FUNCTION public.is_chat_room_admin(p_room_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = p_room_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

-- Function to get or create a direct chat room between two users
CREATE OR REPLACE FUNCTION public.get_or_create_chat_room(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_current_user_id UUID := auth.uid();
BEGIN
  -- Find existing direct room between these two users
  SELECT cr.id INTO v_room_id
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM chat_room_members m1
      WHERE m1.room_id = cr.id AND m1.user_id = v_current_user_id
    )
    AND EXISTS (
      SELECT 1 FROM chat_room_members m2
      WHERE m2.room_id = cr.id AND m2.user_id = p_other_user_id
    )
    AND (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) = 2
  LIMIT 1;

  -- If no room exists, create one
  IF v_room_id IS NULL THEN
    INSERT INTO chat_rooms (type, created_by)
    VALUES ('direct', v_current_user_id)
    RETURNING id INTO v_room_id;

    -- Add both users as members
    INSERT INTO chat_room_members (room_id, user_id, role)
    VALUES 
      (v_room_id, v_current_user_id, 'member'),
      (v_room_id, p_other_user_id, 'member');
  END IF;

  RETURN v_room_id;
END;
$$;

-- Function to create a group chat
CREATE OR REPLACE FUNCTION public.create_group_chat(
  p_name TEXT,
  p_member_ids UUID[],
  p_description TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_current_user_id UUID := auth.uid();
  v_member_id UUID;
BEGIN
  -- Create the room
  INSERT INTO chat_rooms (type, name, description, avatar_url, created_by)
  VALUES ('group', p_name, p_description, p_avatar_url, v_current_user_id)
  RETURNING id INTO v_room_id;

  -- Add creator as admin
  INSERT INTO chat_room_members (room_id, user_id, role)
  VALUES (v_room_id, v_current_user_id, 'admin');

  -- Add other members
  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    IF v_member_id != v_current_user_id THEN
      INSERT INTO chat_room_members (room_id, user_id, role)
      VALUES (v_room_id, v_member_id, 'member')
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_room_id;
END;
$$;

-- Trigger to update last_message_at and preview on new message
CREATE OR REPLACE FUNCTION public.update_chat_room_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE chat_rooms
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message, 100),
    updated_at = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_room_last_message();

-- Trigger to track message edits
CREATE OR REPLACE FUNCTION public.track_chat_message_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.message IS DISTINCT FROM NEW.message THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_chat_message_update
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.track_chat_message_edit();

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they are members of"
  ON public.chat_rooms FOR SELECT
  USING (public.is_chat_room_member(id));

CREATE POLICY "Users can create rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room admins can update rooms"
  ON public.chat_rooms FOR UPDATE
  USING (public.is_chat_room_admin(id));

-- RLS Policies for chat_room_members
CREATE POLICY "Users can view members of rooms they belong to"
  ON public.chat_room_members FOR SELECT
  USING (public.is_chat_room_member(room_id));

CREATE POLICY "Room admins can manage members"
  ON public.chat_room_members FOR INSERT
  WITH CHECK (
    public.is_chat_room_admin(room_id)
    OR NOT EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_room_members.room_id)
  );

CREATE POLICY "Room admins can update members"
  ON public.chat_room_members FOR UPDATE
  USING (public.is_chat_room_admin(room_id));

CREATE POLICY "Users can leave rooms (delete own membership)"
  ON public.chat_room_members FOR DELETE
  USING (user_id = auth.uid() OR public.is_chat_room_admin(room_id));

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages FOR SELECT
  USING (public.is_chat_room_member(room_id));

CREATE POLICY "Users can send messages to their rooms"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND public.is_chat_room_member(room_id)
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;