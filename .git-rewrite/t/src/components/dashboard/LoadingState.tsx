interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading your page...' }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[120px] animate-morph" />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[100px] animate-morph"
          style={{ animationDelay: '-5s' }}
        />
      </div>
      <div className="relative text-center p-8 rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/30 shadow-glass-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Failed to load page' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-destructive/10 to-transparent rounded-full blur-[100px]" />
      </div>
      <div className="relative text-center p-8 rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/30 shadow-glass">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
