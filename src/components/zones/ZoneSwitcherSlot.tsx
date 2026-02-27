/**
 * ZoneSwitcherSlot - Lazy wrapper for ZoneSwitcher that uses ZoneContext
 * Only visible for business tier users
 */
import { useZoneContext } from '@/contexts/ZoneContext';
import { useFreemiumLimits } from '@/hooks/user/useFreemiumLimits';
import { ZoneSwitcher } from './ZoneSwitcher';

interface Props {
  collapsed?: boolean;
}

export default function ZoneSwitcherSlot({ collapsed }: Props) {
  const { zones, currentZone, setCurrentZoneId, createZone } = useZoneContext();
  const { canUseBusinessZone } = useFreemiumLimits();

  if (!canUseBusinessZone()) return null;

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
