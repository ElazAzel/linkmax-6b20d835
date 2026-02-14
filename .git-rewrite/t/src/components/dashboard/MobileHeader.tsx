import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import { TokenBalanceDisplay } from '@/components/tokens/TokenBalanceDisplay';
import logoIcon from '@/assets/logo-icon.png';

interface MobileHeaderProps {
  onSignOut: () => void;
  onOpenGallery: () => void;
  onOpenTokens?: () => void;
  userId?: string;
}

export function MobileHeader({ onSignOut, onOpenGallery, onOpenTokens, userId }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 md:hidden">
      <div className="mx-4 mt-4">
        <div className="backdrop-blur-2xl bg-card/80 border border-border/20 rounded-[24px] shadow-glass-xl px-4 h-16 flex items-center justify-between">
          {/* Logo - Larger and bolder */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/25 rounded-2xl blur-xl group-hover:bg-primary/35 transition-all duration-300" />
              <img
                src={logoIcon}
                alt="Lnkmx"
                className="relative h-10 w-10 rounded-2xl shadow-lg object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight">lnkmx</h1>
          </div>
          
          {/* Actions - Larger touch targets */}
          <div className="flex items-center gap-2">
            {/* Streak Display - compact */}
            <StreakDisplay userId={userId} compact />
            
            {/* Token Balance - compact with larger tap area */}
            <TokenBalanceDisplay onClick={onOpenTokens} compact />
            
            {/* Sign Out - Larger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className={cn(
                "h-11 w-11 rounded-2xl",
                "hover:bg-destructive/10 hover:text-destructive",
                "active:scale-95 transition-all duration-200"
              )}
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
