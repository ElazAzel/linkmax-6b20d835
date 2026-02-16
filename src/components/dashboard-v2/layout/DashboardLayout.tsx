'use client';

/**
 * DashboardLayout - Main layout wrapper for dashboard v2
 * Handles responsive layout: sidebar (desktop) + bottom nav (mobile)
 * Adds page transition animations
 */
import { memo, useState, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  activityBadge?: number;
  isPremium: boolean;
  onSignOut: () => void;
}

export const DashboardLayout = memo(function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  activityBadge,
  isPremium,
  onSignOut,
}: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar - sticky to stay fixed while content scrolls */}
      {!isMobile && (
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          activityBadge={activityBadge}
          isPremium={isPremium}
          onSignOut={onSignOut}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      {/* Main Content - scrollable independently */}
      <main
        className={cn(
          "flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden relative",
          isMobile && "pb-24 h-auto" // Space for bottom nav, reset height on mobile
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full h-full"
          >
            {children}
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
