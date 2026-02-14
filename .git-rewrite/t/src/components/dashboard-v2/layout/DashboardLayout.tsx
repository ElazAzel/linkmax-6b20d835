/**
 * DashboardLayout - Main layout wrapper for dashboard v2
 * Handles responsive layout: sidebar (desktop) + bottom nav (mobile)
 */
import { memo, useState, useCallback, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-background flex">
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
          "flex-1 min-w-0 h-screen overflow-y-auto",
          isMobile && "pb-24 h-auto" // Space for bottom nav, reset height on mobile
        )}
      >
        {children}
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
