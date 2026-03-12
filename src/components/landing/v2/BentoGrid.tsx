import { cn } from "@/lib/utils/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-[2rem] group/bento hover:shadow-glass-lg transition-all duration-500 p-6 glass-subtle backdrop-blur-xl border border-white/10 justify-between flex flex-col space-y-4 relative overflow-hidden",
                "hover:bg-white/[0.08] dark:hover:bg-white/[0.04]",
                className
            )}
        >
            {/* Prismatic top border on hover */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 w-full h-full flex flex-col justify-between">
                {header}
                <div className="group-hover/bento:translate-y-[-4px] transition-transform duration-500 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover/bento:bg-primary group-hover/bento:text-primary-foreground transition-colors duration-500">
                            {icon}
                        </div>
                        <div className="font-heading font-bold text-foreground text-lg tracking-tight">
                            {title}
                        </div>
                    </div>
                    <div className="font-sans font-medium text-muted-foreground/80 text-sm leading-relaxed">
                        {description}
                    </div>
                </div>
            </div>
        </div>
    );
};
