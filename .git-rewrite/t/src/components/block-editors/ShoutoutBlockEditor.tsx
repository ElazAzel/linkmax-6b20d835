import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { searchUsers } from '@/services/collaboration';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';

interface UserSearchResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

function ShoutoutBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchError('Введите минимум 2 символа');
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Ошибка поиска. Попробуйте позже.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user: typeof searchResults[0]) => {
    onChange({
      ...formData,
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const clearUser = () => {
    onChange({
      ...formData,
      userId: undefined,
      username: undefined,
      displayName: undefined,
      avatarUrl: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {formData.userId ? (
        <Card className="p-4">
          <Label className="text-sm mb-3 block">Выбранный пользователь</Label>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/30">
              <AvatarImage src={formData.avatarUrl || ''} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {formData.displayName?.[0] || formData.username?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {formData.displayName || formData.username}
              </p>
              {formData.username && (
                <p className="text-sm text-muted-foreground">@{formData.username}</p>
              )}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={clearUser}
            >
              Изменить
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <Label>Выберите пользователя для рекомендации</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Поиск по имени или @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectUser(user)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.display_name || user.username}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {searchError && (
            <p className="text-sm text-destructive text-center py-2">
              {searchError}
            </p>
          )}

          {!searchError && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пользователи не найдены. Попробуйте другой запрос.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Почему рекомендуете?</Label>
        <Textarea
          value={typeof formData.message === 'string' ? formData.message : formData.message?.ru || ''}
          onChange={(e) => onChange({ ...formData, message: e.target.value })}
          placeholder="Отличный специалист, рекомендую!"
        />
      </div>
    </div>
  );
}

export const ShoutoutBlockEditor = withBlockEditor(ShoutoutBlockEditorComponent, {
  isPremium: false,
  description: 'Рекомендуйте других пользователей вашей аудитории',
});
