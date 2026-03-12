export const CanvasBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-background">
            {/* CSS Aurora Background — no WebGL artifacts */}
            <div className="absolute inset-0 bg-aurora opacity-70" />
            
            {/* Soft animated gradient blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/[0.07] blur-[120px] animate-float-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/[0.05] blur-[100px] animate-float" />
            
            {/* Grain/Texture Overlay */}
            <div className="absolute inset-0 opacity-[var(--grain-opacity)] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};