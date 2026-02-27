import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils/utils";

export const LiquidCursor = () => {
    const outerRef = useRef<HTMLDivElement>(null);
    const posRef = useRef({ x: -100, y: -100 });
    const targetRef = useRef({ x: -100, y: -100 });
    const rafRef = useRef<number>(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = useCallback(() => {
        posRef.current.x = lerp(posRef.current.x, targetRef.current.x, 0.15);
        posRef.current.y = lerp(posRef.current.y, targetRef.current.y, 0.15);
        if (outerRef.current) {
            outerRef.current.style.transform = `translate(${posRef.current.x - 8}px, ${posRef.current.y - 8}px)`;
        }
        rafRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            targetRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            setIsHovering(!!(target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')));
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseover", handleMouseOver);
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseover", handleMouseOver);
            cancelAnimationFrame(rafRef.current);
        };
    }, [animate]);

    return (
        <div
            ref={outerRef}
            className="fixed top-0 left-0 pointer-events-none z-[100] hidden md:block mix-blend-difference"
            style={{ willChange: 'transform' }}
        >
            <div
                className={cn(
                    "bg-white rounded-full transition-all duration-300",
                    isHovering ? "h-16 w-16 opacity-30" : "h-4 w-4 opacity-100",
                    isClicking && "scale-75"
                )}
            />
        </div>
    );
};
