import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';
import { getUsersByNiche } from '@/services/collaboration';

interface PromoTabProps {
  onSendRequest: (userId: string) => void;
}

interface NicheUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function PromoTab({ onSendRequest }: PromoTabProps) {
  const { t } = useTranslation();
  const [selectedNiche, setSelectedNiche] = useState('');
  const [nicheUsers, setNicheUsers] = useState<NicheUser[]>([]);

  const handleNicheSearch = useCallback(async (niche: string) => {
    setSelectedNiche(niche);
    const users = await getUsersByNiche(niche);
    setNicheUsers(users);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Взаимный пиар по нише</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {NICHES.slice(0, 8).map((niche) => (
            <Button
              key={niche}
              size="sm"
              variant={selectedNiche === niche ? 'default' : 'outline'}
              onClick={() => handleNicheSearch(niche)}
            >
              {NICHE_ICONS[niche as Niche]} {t(`niches.${niche}`, niche)}
            </Button>
          ))}
        </div>

        {nicheUsers.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Пользователи в нише "{t(`niches.${selectedNiche}`, selectedNiche)}"
            </p>
            {nicheUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.display_name || user.username}</span>
                </div>
                <Button size="sm" onClick={() => onSendRequest(user.id)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Предложить
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
