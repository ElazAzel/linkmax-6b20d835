import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';

interface MobileHeaderProps {
  onSignOut: () => void;
  onOpenGallery: () => void;
}

export function MobileHeader({ onSignOut, onOpenGallery }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 md:hidden">
      <div className="mx-3 mt-2">
        <div className="backdrop-blur-2xl bg-card/50 border border-border/30 rounded-2xl shadow-glass px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
              <img
                src="/pwa-maskable-512x512.png"
                alt="LinkMAX"
                className="relative h-7 w-7 rounded-lg"
              />
            </div>
            <h1 className="text-lg font-bold text-primary">LinkMAX</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenGallery}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
