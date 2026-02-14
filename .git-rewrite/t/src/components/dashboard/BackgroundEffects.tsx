export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[130px] animate-morph" />
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-[120px] animate-morph"
        style={{ animationDelay: '-7s' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent rounded-full blur-[100px] animate-float-slow" />
    </div>
  );
}
