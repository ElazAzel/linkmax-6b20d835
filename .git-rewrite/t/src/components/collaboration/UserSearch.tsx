import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserSearchResults, type UserResult } from './UserSearchResults';
import { searchUsers } from '@/services/collaboration';

interface UserSearchProps {
  mode: 'collab' | 'shoutout';
  placeholder?: string;
  onCollabRequest?: (userId: string) => void;
  onShoutout?: (userId: string, message: string) => void;
}

export function UserSearch({ mode, placeholder = 'Поиск по имени...', onCollabRequest, onShoutout }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    const users = await searchUsers(query);
    setResults(users);
    setSearching(false);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      <UserSearchResults 
        users={results} 
        mode={mode}
        onCollabRequest={onCollabRequest}
        onShoutout={onShoutout}
      />
    </div>
  );
}
