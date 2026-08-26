import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * BuildingLoader — текстовый-free лоадер: страница «собирается по кусочкам».
 * 6 вариантов, выбираются случайно при каждом монтировании.
 */

type Variant = 1 | 2 | 3 | 4 | 5 | 6;

const VARIANTS: Variant[] = [1, 2, 3, 4, 5, 6];

const Block = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn("rounded-md bg-primary/25", className)}
    style={style}
    aria-hidden
  />
);

/** 1. Блоки прилетают снизу и встают в стек (сборка страницы) */
const AssembleStack = () => (
  <div className="w-40 space-y-2">
    {[0, 1, 2, 3].map((i) => (
      <Block
        key={i}
        className={cn(
          "lm-load-drop",
          i === 0 ? "h-6 w-1/2" : i === 3 ? "h-8" : "h-4",
        )}
        style={{ animationDelay: `${i * 0.14}s` }}
      />
    ))}
  </div>
);

/** 2. Магнит: два куска притягиваются и соединяются */
const MagnetSnap = () => (
  <div className="flex w-40 items-center justify-center gap-1">
    <Block className="lm-load-magnet-l h-10 w-16" />
    <Block className="lm-load-magnet-r h-10 w-16 bg-primary/50" />
  </div>
);

/** 3. Сетка блоков появляется по одному */
const GridFill = () => (
  <div className="grid w-40 grid-cols-3 gap-2">
    {Array.from({ length: 9 }).map((_, i) => (
      <Block
        key={i}
        className="lm-load-pop aspect-square"
        style={{ animationDelay: `${i * 0.08}s` }}
      />
    ))}
  </div>
);

/** 4. Перестановка: блоки меняются местами (drag & drop) */
const ReorderSwap = () => (
  <div className="w-40 space-y-2">
    <Block className="lm-load-swap-down h-8" />
    <Block className="lm-load-swap-up h-8 bg-primary/50" />
    <Block className="lm-load-pulse h-8" style={{ animationDelay: "0.2s" }} />
  </div>
);

/** 5. Связи: узлы соединяются линией */
const ConnectNodes = () => (
  <div className="relative h-16 w-40">
    <span className="lm-load-line absolute left-4 top-1/2 h-[2px] w-32 origin-left -translate-y-1/2 bg-primary/40" />
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="lm-load-node absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary/60"
        style={{ left: `${i * 60 + 8}px`, animationDelay: `${0.25 + i * 0.18}s` }}
        aria-hidden
      />
    ))}
  </div>
);

/** 6. Удаление лишнего: блок исчезает, остальные подтягиваются */
const CleanUp = () => (
  <div className="w-40 space-y-2">
    <Block className="lm-load-pulse h-6" />
    <Block className="lm-load-dissolve h-6 bg-primary/50" />
    <Block className="lm-load-rise h-6" />
    <Block className="lm-load-rise h-6" style={{ animationDelay: "0.1s" }} />
  </div>
);

const RENDERERS: Record<Variant, () => JSX.Element> = {
  1: AssembleStack,
  2: MagnetSnap,
  3: GridFill,
  4: ReorderSwap,
  5: ConnectNodes,
  6: CleanUp,
};

interface BuildingLoaderProps {
  /** Полный экран (по умолчанию) или инлайн */
  fullscreen?: boolean;
  className?: string;
  variant?: Variant;
}

export const BuildingLoader = ({
  fullscreen = true,
  className,
  variant,
}: BuildingLoaderProps) => {
  const picked = useMemo<Variant>(
    () => variant ?? VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
    [variant],
  );
  const Render = RENDERERS[picked];

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "flex items-center justify-center bg-background",
        fullscreen ? "min-h-screen w-full" : "min-h-[240px] w-full",
        className,
      )}
    >
      <Render />
    </div>
  );
};

export default BuildingLoader;
