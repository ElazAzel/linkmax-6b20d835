/**
 * Dashboard v2 State Hook
 * Provides state management for the new dashboard layout
 */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDashboard } from './useDashboard';
import { usePremiumStatus } from './usePremiumStatus';

export type DashboardTab = 'home' | 'pages' | 'activity' | 'insights' | 'monetize' | 'settings';

export function useDashboardV2() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dashboard = useDashboard();
  const { isPremium, tier, inTrial, trialEndsAt, isLoading: premiumLoading } = usePremiumStatus();

  // Current active tab from URL
  const activeTab = useMemo<DashboardTab>(() => {
    const tab = searchParams.get('tab');
    const validTabs: DashboardTab[] = ['home', 'pages', 'activity', 'insights', 'monetize', 'settings'];
    if (tab && validTabs.includes(tab as DashboardTab)) {
      return tab as DashboardTab;
    }
    return 'home';
  }, [searchParams]);

  // Change tab
  const setActiveTab = useCallback((tab: DashboardTab) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  // Activity badge count (leads + registrations)
  const activityBadge = useMemo(() => {
    // TODO: Fetch real data from leads/registrations
    return 0;
  }, []);

  // Page list for PagesScreen
  const pages = useMemo(() => {
    if (!dashboard.pageData) return [];
    
    // Currently single page, but structure supports multiple
    return [{
      id: dashboard.pageData.id,
      title: dashboard.profileBlock?.name || 'My Page',
      slug: dashboard.pageData.slug,
      isPublished: dashboard.pageData.isPublished,
      updatedAt: new Date().toISOString(),
      viewCount: undefined, // TODO: fetch from analytics
      coverUrl: undefined,
    }];
  }, [dashboard.pageData, dashboard.profileBlock]);

  // Quick stats for HomeScreen
  const quickStats = useMemo(() => {
    return {
      views: 0, // TODO: fetch from analytics
      leads: 0,
      conversions: 0,
    };
  }, []);

  // Handle navigation to editor
  const openEditor = useCallback(() => {
    setSearchParams({ tab: 'editor' });
  }, [setSearchParams]);

  // Handle preview
  const handlePreview = useCallback(() => {
    dashboard.sharingState.handlePreview();
  }, [dashboard.sharingState]);

  // Handle share
  const handleShare = useCallback(() => {
    dashboard.sharingState.handleShare();
  }, [dashboard.sharingState]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    dashboard.handleSignOut();
  }, [dashboard.handleSignOut]);

  // Handle upgrade click
  const handleUpgrade = useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  return {
    // Core state
    user: dashboard.user,
    pageData: dashboard.pageData,
    profileBlock: dashboard.profileBlock,
    loading: dashboard.loading,
    saving: dashboard.saving,
    saveStatus: dashboard.saveStatus,

    // Tab state
    activeTab,
    setActiveTab,

    // Premium state
    isPremium,
    tier: tier || 'free',
    inTrial: inTrial || false,
    trialEndsAt,
    premiumLoading,

    // Data
    pages,
    quickStats,
    activityBadge,

    // Actions
    openEditor,
    handlePreview,
    handleShare,
    handleSignOut,
    handleUpgrade,

    // Pass through dashboard for legacy compatibility
    dashboard,
  };
}
