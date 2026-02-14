import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';

interface MobileHeaderProps {
  onSignOut: () => void;
  onOpenGallery: () => void;
}

export function MobileHeader({ onSignOut, onOpenGallery }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 md:hidden">
      <div className="mx-4 mt-3">
        <div className="backdrop-blur-2xl bg-card/60 border border-border/30 rounded-3xl shadow-glass-lg px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-lg" />
              <img
                src="/logo.png"
                alt="LinkMAX"
                className="relative h-10 w-10 rounded-2xl shadow-glass object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tight">LinkMAX</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={onOpenGallery}
              className="h-12 w-12 rounded-2xl hover:bg-primary/10"
            >
              <Users className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onSignOut}
              className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
