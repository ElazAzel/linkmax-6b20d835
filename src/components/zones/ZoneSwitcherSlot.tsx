/**
 * ZoneSwitcherSlot - Lazy wrapper for ZoneSwitcher that uses ZoneContext
 */
import { useZoneContext } from '@/contexts/ZoneContext';
import { ZoneSwitcher } from './ZoneSwitcher';

interface Props {
  collapsed?: boolean;
}

export default function ZoneSwitcherSlot({ collapsed }: Props) {
  const { zones, currentZone, setCurrentZoneId, createZone } = useZoneContext();

  if (zones.length === 0 && !currentZone) return null;

  return (
    <ZoneSwitcher
      zones={zones}
      currentZone={currentZone}
      onSelectZone={setCurrentZoneId}
      onCreateZone={createZone}
      collapsed={collapsed}
    />
  );
}
