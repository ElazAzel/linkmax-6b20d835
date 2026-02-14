import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  Sparkles,
  ChevronRight,
  Check
} from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';

interface ReferralPanelProps {
  userId: string | undefined;
  compact?: boolean;
}

export function ReferralPanel({ userId, compact = false }: ReferralPanelProps) {
  const { stats, loading, applying, wasReferred, applyCode, copyCode, shareLink } = useReferral(userId);
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30 animate-pulse">
        <div className="h-20 bg-muted/30 rounded-lg" />
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10 backdrop-blur-xl border-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Gift className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Пригласи друга</p>
              <p className="text-xs text-muted-foreground">+3 дня Premium</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="gap-1"
            onClick={shareLink}
          >
            Поделиться
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10 backdrop-blur-xl border-violet-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Gift className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h3 className="font-semibold">Реферальная программа</h3>
          <p className="text-xs text-muted-foreground">
            +3 дня Premium за каждого друга
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card/40 backdrop-blur-xl rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{stats?.referralsCount || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">Приглашено</p>
        </div>
        <div className="bg-card/40 backdrop-blur-xl rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold">+{stats?.bonusDaysEarned || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">Дней Premium</p>
        </div>
      </div>

      {/* Your Code */}
      {stats?.code && (
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground">Ваш код</Label>
          <div className="flex gap-2 mt-1.5">
            <div className="flex-1 bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl px-4 py-2.5 font-mono text-lg tracking-wider text-center">
              {stats.code}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-xl shrink-0"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Share Button */}
      <Button 
        className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 mb-4"
        onClick={shareLink}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Поделиться ссылкой
      </Button>

      {/* Apply Code Section */}
      {!wasReferred && (
        <div className="pt-4 border-t border-border/30">
          <Label className="text-xs text-muted-foreground">Есть код от друга?</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="font-mono uppercase tracking-wider bg-card/60 rounded-xl"
            />
            <Button 
              variant="outline"
              className="rounded-xl shrink-0"
              onClick={() => applyCode(inputCode)}
              disabled={applying || inputCode.length < 6}
            >
              {applying ? '...' : 'Применить'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
