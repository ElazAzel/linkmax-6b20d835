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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="w-full h-full p-2 md:p-8"
          >
            <div className="max-w-7xl mx-auto glass rounded-[2.5rem] min-h-full shadow-glass-lg border border-white/5 overflow-hidden">
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
