import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchUsers } from '@/services/collaboration';

interface ShoutoutBlockEditorProps {
  block: {
    id: string;
    type: string;
    content: Record<string, unknown>;
  };
  onChange: (block: Record<string, unknown>) => void;
  onDelete: () => void;
}

export function ShoutoutBlockEditor({ block, onChange, onDelete }: ShoutoutBlockEditorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>>([]);
  const [searching, setSearching] = useState(false);

  const content = block.content as {
    userId?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    message?: string;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const selectUser = (user: typeof searchResults[0]) => {
    onChange({
      ...block,
      content: {
        ...content,
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const updateMessage = (message: string) => {
    onChange({
      ...block,
      content: { ...content, message },
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Шаут-аут</Label>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {content.userId ? (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={content.avatarUrl || ''} />
            <AvatarFallback>{content.displayName?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{content.displayName || content.username}</p>
            <p className="text-sm text-muted-foreground">@{content.username}</p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onChange({
              ...block,
              content: { message: content.message },
            })}
          >
            Изменить
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Label>Выберите пользователя</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => selectUser(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.display_name || user.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Почему рекомендуете?</Label>
        <Textarea
          value={content.message || ''}
          onChange={(e) => updateMessage(e.target.value)}
          placeholder="Отличный специалист, рекомендую!"
        />
      </div>
    </div>
  );
}
