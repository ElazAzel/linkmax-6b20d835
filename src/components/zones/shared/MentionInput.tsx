/**
 * MentionInput - Textarea with @mention autocomplete for zone members
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import { supabase } from '@/platform/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ZoneMemberForMention {
  user_id: string;
  display_name: string;
  email: string;
}

interface MentionInputProps {
  zoneId: string | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Extracts mentioned user IDs from text with format @[userId:name]
export function extractMentions(text: string): string[] {
  const regex = /@\[([a-f0-9-]+):([^\]]+)\]/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

// Converts @[userId:name] to @name for display
export function formatMentionsForDisplay(text: string): string {
  return text.replace(/@\[([a-f0-9-]+):([^\]]+)\]/g, '@$2');
}

// Fetches zone members for autocomplete
async function fetchZoneMembers(zoneId: string): Promise<ZoneMemberForMention[]> {
  const { data, error } = await supabase
    .from('zone_members')
    .select('user_id, user_profiles!zone_members_user_id_fkey(display_name, username)')
    .eq('zone_id', zoneId)
    .eq('status', 'active');
  
  if (error) throw error;
  
  return (data || []).map((m: any) => ({
    user_id: m.user_id,
    display_name: m.user_profiles?.display_name || m.user_profiles?.username || 'User',
    email: '',
  }));
}

export function MentionInput({
  zoneId,
  value,
  onChange,
  onSubmit,
  placeholder = 'Type @ to mention...',
  disabled = false,
  className,
}: MentionInputProps) {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: members = [] } = useQuery({
    queryKey: ['zone-members-mention', zoneId],
    queryFn: () => fetchZoneMembers(zoneId!),
    enabled: !!zoneId,
    staleTime: 60_000,
  });

  const filteredMembers = members.filter((m) =>
    m.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if we should show suggestions
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Show suggestions if @ is at start or preceded by space, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      if ((charBeforeAt === ' ' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setSearchQuery(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }
    setShowSuggestions(false);
  }, [onChange]);

  const handleSelectMember = useCallback((member: ZoneMemberForMention) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = value.slice(0, lastAtIndex);
      const mention = `@[${member.user_id}:${member.display_name}] `;
      const newValue = beforeMention + mention + textAfterCursor;
      onChange(newValue);
      setShowSuggestions(false);
      
      // Focus back to input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPos = beforeMention.length + mention.length;
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  }, [value, cursorPosition, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      const mentionedIds = extractMentions(value);
      const displayText = formatMentionsForDisplay(value);
      if (displayText.trim()) {
        onSubmit(displayText.trim(), mentionedIds);
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [value, showSuggestions, onSubmit]);

  // Display version of value (with @name instead of @[id:name])
  const displayValue = formatMentionsForDisplay(value);

  return (
    <div className="relative w-full">
      <Popover open={showSuggestions && filteredMembers.length > 0} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => {
              // Convert display format back to storage format when needed
              // For simplicity, we track the raw value with mentions
              handleInputChange(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("text-sm h-9", className)}
          />
        </PopoverTrigger>
        <PopoverContent 
          className="w-56 p-1" 
          align="start" 
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea className="max-h-48">
            <div className="space-y-0.5">
              {filteredMembers.map((member) => (
                <Button
                  key={member.user_id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 text-sm"
                  onClick={() => handleSelectMember(member)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {member.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate">{member.display_name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
