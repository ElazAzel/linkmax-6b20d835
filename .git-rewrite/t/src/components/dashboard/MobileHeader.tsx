import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  onSignOut: () => void;
  onOpenGallery: () => void;
}

export function MobileHeader({ onSignOut, onOpenGallery }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 md:hidden">
      <div className="mx-3 mt-3">
        <div className="backdrop-blur-2xl bg-card/75 border border-border/30 rounded-[22px] shadow-glass-lg px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-colors" />
              <img
                src="/favicon.jpg"
                alt="LinkMAX"
                className="relative h-9 w-9 rounded-xl shadow-sm object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight">LinkMAX</h1>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenGallery}
              className={cn(
                "h-10 w-10 rounded-xl",
                "hover:bg-primary/10 hover:text-primary",
                "active:scale-95 transition-all duration-200"
              )}
              aria-label="Open gallery"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className={cn(
                "h-10 w-10 rounded-xl",
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
