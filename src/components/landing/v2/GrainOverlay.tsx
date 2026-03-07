

export const GrainOverlay = () => {
    return (
        <div className="pointer-events-none fixed inset-0 z-[40] overflow-hidden opacity-30 mix-blend-overlay hidden sm:block">
            {/* CSS-only grain effect (no external image dependency) */}
            <div
                className="absolute inset-[-200%] h-[400%] w-[400%] animate-grain opacity-[0.08]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    filter: 'contrast(320%) brightness(100%)'
                }}
            />
        </div>
    );
};
