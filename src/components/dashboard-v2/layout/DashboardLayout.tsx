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
    <div className="app-canvas min-h-screen flex overflow-hidden translate-z-0">
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
          "app-canvas flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth antialiased",
          isMobile && "pb-24 h-auto"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn("w-full h-full", isMobile ? "p-0" : "px-5 py-5 lg:px-7 lg:py-6")}
          >
            <div className="max-w-7xl mx-auto min-h-full overflow-visible">
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
