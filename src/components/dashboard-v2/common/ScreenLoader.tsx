export function ScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse space-y-4 w-full max-w-md px-4">
        <div className="h-8 bg-muted rounded-lg w-3/4" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-12 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
