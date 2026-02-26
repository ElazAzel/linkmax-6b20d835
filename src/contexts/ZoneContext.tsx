/**
 * ZoneContext - Provides current zone state across the app
 */
import { createContext, useContext, ReactNode } from 'react';
import { useZones } from '@/hooks/zones/useZones';
import type { Zone, ZoneMemberRole, ZoneMember } from '@/types/zones';

interface ZoneContextValue {
  zones: Zone[];
  currentZone: Zone | null;
  currentZoneId: string | null;
  setCurrentZoneId: (id: string | null) => void;
  members: ZoneMember[];
  myRole: ZoneMemberRole | null;
  isReadOnly: boolean;
  loading: boolean;
  createZone: (name: string, slug: string, planCode?: string, planCycle?: string) => Promise<any>;
  refetch: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextValue | null>(null);

export function ZoneProvider({ children }: { children: ReactNode }) {
  const zoneState = useZones();
  return (
    <ZoneContext.Provider value={zoneState}>
      {children}
    </ZoneContext.Provider>
  );
}

export function useZoneContext() {
  const ctx = useContext(ZoneContext);
  if (!ctx) throw new Error('useZoneContext must be used within ZoneProvider');
  return ctx;
}
