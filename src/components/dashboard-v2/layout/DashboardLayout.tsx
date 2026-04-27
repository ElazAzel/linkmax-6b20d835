'use client';

/**
 * DashboardLayout - Main layout wrapper for dashboard v2
 * Handles responsive layout: sidebar (desktop) + bottom nav (mobile)
 * Adds page transition animations
 */
import { memo, useState, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalCommandPalette } from './GlobalCommandPalette';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  activityBadge?: number;
  isPremium: boolean;
  isBusinessTier?: boolean;
  onSignOut: () => void;
}

export const DashboardLayout = memo(function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  activityBadge,
  isPremium,
  isBusinessTier = false,
  onSignOut,
}: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-transparent flex overflow-hidden translate-z-0">
      <GlobalCommandPalette />
      {!isMobile && (
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          activityBadge={activityBadge}
          isPremium={isPremium}
          isBusinessTier={isBusinessTier}
          onSignOut={onSignOut}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth antialiased",
          isMobile && "pb-24 h-auto"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2, 
              ease: 'easeOut' 
            }}
            className={cn("w-full h-full", isMobile ? "p-0" : "p-8")}
          >
            <div className={cn(
              "max-w-7xl mx-auto min-h-full overflow-visible",
              isMobile ? "bg-transparent" : "bg-background rounded-[2.5rem] border border-border/5"
            )}>
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <DashboardBottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          activityBadge={activityBadge}
        />
      )}
    </div>
  );
});
