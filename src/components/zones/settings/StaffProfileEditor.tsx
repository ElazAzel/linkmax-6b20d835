import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Unlink from 'lucide-react/dist/esm/icons/unlink';
import type { ZoneStaff, ZoneMember } from '@/types/zones';

interface StaffProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  staff: ZoneStaff | null;
  members: ZoneMember[];
  onSaved: () => void;
}

export function StaffProfileEditor({
  open,
  onOpenChange,
  zoneId,
  staff,
  members,
  onSaved,
}: StaffProfileEditorProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [gcalEnabled, setGcalEnabled] = useState(false);
  const [gcalCalendarId, setGcalCalendarId] = useState('primary');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGcalConnected, setIsGcalConnected] = useState(false);
  const [isCheckingGcal, setIsCheckingGcal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (userId) {
      checkGcalStatus(userId);
    } else {
      setIsGcalConnected(false);
    }
  }, [userId]);

  const checkGcalStatus = async (uid: string) => {
    setIsCheckingGcal(true);
    try {
      const { data } = await supabase
        .from('user_integrations_status' as any)
        .select('is_connected')
        .eq('user_id', uid)
        .eq('provider', 'google_calendar')
        .maybeSingle() as any;
      setIsGcalConnected(!!data?.is_connected);
    } finally {
      setIsCheckingGcal(false);
    }
  };

  const handleConnectGcal = async () => {
    try {
      const redirectUrl = window.location.href;
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'get_auth_url',
          payload: { redirect_url: redirectUrl },
        },
      });

      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err: any) {
      toast.error(t('zones.staff.gcalError', 'Failed to initiate Google Calendar connection'));
    }
  };
  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setBio(staff.bio || '');
      setSpecialization(staff.specialization || '');
      setUserId(staff.user_id);
      setIsActive(staff.is_active);
      setGcalEnabled(staff.gcal_sync_enabled);
      setGcalCalendarId(staff.gcal_calendar_id || 'primary');
    } else {
      setName('');
      setBio('');
      setSpecialization('');
      setUserId(null);
      setIsActive(true);
      setGcalEnabled(false);
      setGcalCalendarId('primary');
    }
  }, [staff, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('zones.staff.nameRequired', 'Name is required'));
      return;
    }

    setLoading(true);
    try {
      const staffData = {
        zone_id: zoneId,
        user_id: userId || null,
        name: name.trim(),
        bio: bio.trim() || null,
        specialization: specialization.trim() || null,
        is_active: isActive,
        gcal_sync_enabled: gcalEnabled,
        gcal_calendar_id: gcalCalendarId,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (staff) {
        ({ error } = await supabase
          .from('zone_staff')
          .update(staffData as any)
          .eq('id', staff.id));
      } else {
        ({ error } = await supabase
          .from('zone_staff')
          .insert(staffData as any));
      }

      if (error) throw error;

      toast.success(t('common.saved', 'Saved'));
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving staff:', err);
      toast.error(err.message || t('common.error', 'Error occurred'));
    } finally {
      setLoading(false);
    }
  }

  const handleLinkMember = (val: string) => {
    if (val === 'none') {
      setUserId(null);
      return;
    }
    const member = members.find(m => m.user_id === val);
    if (member) {
      setUserId(member.user_id);
      if (!name) setName(member.display_name || '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{staff ? t('zones.staff.edit', 'Edit Specialist') : t('zones.staff.add', 'Add Specialist')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('zones.staff.linkMember', 'Link to Zone Member')}</Label>
            <Select value={userId || 'none'} onValueChange={handleLinkMember}>
              <SelectTrigger>
                <SelectValue placeholder={t('zones.staff.selectMember', 'Select member')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('zones.staff.noUser', 'Virtual Resource (No User)')}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name || m.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {t('zones.staff.linkHint', 'Linking allows the specialist to use their personal Google Calendar and receive notifications.')}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t('zones.staff.name', 'Name / Title')}</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Doe" 
            />
          </div>

          <div className="space-y-2">
            <Label>{t('zones.staff.specialization', 'Specialization')}</Label>
            <Input 
              value={specialization} 
              onChange={(e) => setSpecialization(e.target.value)} 
              placeholder="Senior Barber" 
            />
          </div>

          <div className="space-y-2">
            <Label>{t('zones.staff.avatarUrl', 'Avatar URL (optional)')}</Label>
            <Input 
              placeholder="https://..." 
              // We'll add an avatar upload in future, using URL for now
            />
          </div>

          <div className="space-y-2">
            <Label>{t('zones.staff.bio', 'Short Bio')}</Label>
            <Textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder={t('zones.staff.bioPlaceholder', 'Briefly describe experience or services...')}
              className="resize-none h-20"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('zones.staff.isActive', 'Active for booking')}</Label>
              <p className="text-xs text-muted-foreground">{t('zones.staff.isActiveDesc', 'Hide from booking page if off')}</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">{t('zones.staff.gcalSync', 'Google Calendar Sync')}</Label>
              </div>
              <Switch checked={gcalEnabled} onCheckedChange={setGcalEnabled} />
            </div>
            
            {gcalEnabled && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                {userId && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-dashed flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {isGcalConnected 
                          ? t('zones.staff.accountConnected', 'Account Connected') 
                          : t('zones.staff.accountNotConnected', 'Account Not Connected')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isGcalConnected 
                          ? t('zones.staff.syncActive', 'Sync is ready for this specialist.')
                          : t('zones.staff.syncInactive', 'User needs to connect GCal in Settings.')}
                      </p>
                    </div>
                    {userId === currentUserId && !isGcalConnected && (
                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px]" onClick={handleConnectGcal}>
                        <Link2 className="h-3 w-3 mr-1" />
                        {t('common.connect', 'Connect')}
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('zones.staff.calendarId', 'Calendar ID')}</Label>
                  <Input 
                    value={gcalCalendarId} 
                    onChange={(e) => setGcalCalendarId(e.target.value)} 
                    placeholder="primary" 
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t('zones.staff.gcalHint', 'Specify calendar ID or use "primary". Make sure the linked user has Google integration connected.')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
