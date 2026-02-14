import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserSearch } from './UserSearch';
import type { Shoutout } from '@/services/collaboration';

interface ShoutoutsTabProps {
  shoutouts: Shoutout[];
  onAddShoutout: (userId: string, message: string) => void;
  onRemoveShoutout: (shoutoutId: string) => void;
}

export function ShoutoutsTab({ shoutouts, onAddShoutout, onRemoveShoutout }: ShoutoutsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Мои рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          {shoutouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Вы ещё никого не рекомендовали
            </p>
          ) : (
            <div className="space-y-2">
              {shoutouts.map(shoutout => (
                <div key={shoutout.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={shoutout.to_user?.avatar_url || ''} />
                      <AvatarFallback>{shoutout.to_user?.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{shoutout.to_user?.display_name || shoutout.to_user?.username}</p>
                      {shoutout.message && (
                        <p className="text-xs text-muted-foreground">{shoutout.message}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onRemoveShoutout(shoutout.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add shoutout */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Добавить шаут-аут</CardTitle>
        </CardHeader>
        <CardContent>
          <UserSearch 
            mode="shoutout"
            placeholder="Поиск пользователя..."
            onShoutout={onAddShoutout}
          />
        </CardContent>
      </Card>
    </div>
  );
}
