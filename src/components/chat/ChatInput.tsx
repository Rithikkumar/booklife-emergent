import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Send, Smile, X, AlertTriangle } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { ChatMessage } from '@/hooks/useChat';

interface ChatInputProps {
  onSend: (message: string, replyToId?: string) => Promise<boolean>;
  onTyping?: () => void;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  isRateLimited?: boolean;
  retryAfter?: number;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
  isRateLimited = false,
  retryAfter = 0,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 2000
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = async () => {
    // Guard: prevent double-send
    if (!message.trim() || sending || disabled || isRateLimited) return;

    const messageToSend = message.trim();
    const replyToIdToSend = replyingTo?.id;

    // Clear immediately to prevent double-send on rapid Enter presses
    setMessage('');
    onCancelReply?.();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setSending(true);
    const success = await onSend(messageToSend, replyToIdToSend);
    setSending(false);

    if (!success) {
      // Restore message on failure
      setMessage(messageToSend);
    }

    // Re-focus the input after sending
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      onTyping?.();
    }
  };

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    setMessage(prev => prev + emojiData.emoji);
    setEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };

  const remainingChars = maxLength - message.length;
  const showCharCount = remainingChars <= 200;

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Rate limit warning */}
      {isRateLimited && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Please wait {retryAfter}s before sending another message</span>
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground">Replying to </span>
            <span className="text-xs font-medium">
              {replyingTo.sender?.display_name || replyingTo.sender?.username || 'Unknown'}
            </span>
            <p className="text-sm text-muted-foreground truncate">
              {replyingTo.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Emoji picker */}
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={disabled}
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="start" 
            className="w-auto p-0 border-0 shadow-lg"
            sideOffset={8}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              theme={Theme.AUTO}
              width={320}
              height={400}
              searchPlaceholder="Search emoji..."
              previewConfig={{ showPreview: false }}
            />
          </PopoverContent>
        </Popover>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'min-h-[40px] max-h-[120px] resize-none py-2.5 pr-12',
              'rounded-2xl bg-muted/50 border-0 focus-visible:ring-1',
              'placeholder:text-muted-foreground/60'
            )}
            rows={1}
          />
          
          {/* Character count */}
          {showCharCount && (
            <span className={cn(
              'absolute right-3 bottom-2 text-xs',
              remainingChars < 50 ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {remainingChars}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className={cn(
            'h-9 w-9 shrink-0 rounded-full transition-all',
            message.trim() 
              ? 'bg-primary hover:bg-primary/90' 
              : 'bg-muted text-muted-foreground'
          )}
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled || isRateLimited}
        >
          <Send className={cn(
            'h-4 w-4 transition-transform',
            sending && 'animate-pulse'
          )} />
        </Button>
      </div>
    </div>
  );
};
