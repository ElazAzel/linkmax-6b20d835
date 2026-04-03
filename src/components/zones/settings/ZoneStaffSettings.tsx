import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import type { ZoneStaff, ZoneMember } from '@/types/zones';
import { StaffProfileEditor } from './StaffProfileEditor';

interface ZoneStaffSettingsProps {
  zoneId: string;
  members: ZoneMember[];
  isAdmin: boolean;
}

export function ZoneStaffSettings({ zoneId, members, isAdmin }: ZoneStaffSettingsProps) {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<ZoneStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<ZoneStaff | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('zone_staff')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStaff((data as ZoneStaff[]) || []);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      toast.error(t('zones.staff.fetchError', 'Failed to load staff list'));
    } finally {
      setLoading(false);
    }
  }, [zoneId, t]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = () => {
    setEditingStaff(null);
    setEditorOpen(true);
  };

  const handleEditStaff = (member: ZoneStaff) => {
    setEditingStaff(member);
    setEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('zones.staff.desc', 'Manage specialists and resources available for booking in this zone.')}
        </p>
        {isAdmin && (
          <Button onClick={handleAddStaff} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t('zones.staff.add', 'Add Staff')}
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {staff.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">{t('zones.staff.empty', 'No staff members added yet.')}</p>
            </CardContent>
          </Card>
        ) : (
          staff.map((member) => (
            <Card key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.name} 
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{member.name}</p>
                      {!member.is_active && (
                        <Badge variant="secondary" className="text-[10px] h-4 py-0">
                          {t('zones.staff.inactive', 'Inactive')}
                        </Badge>
                      )}
                      {member.gcal_sync_enabled && (
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    {member.specialization && (
                      <p className="text-xs text-muted-foreground">{member.specialization}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleEditStaff(member)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <StaffProfileEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        zoneId={zoneId}
        staff={editingStaff}
        members={members}
        onSaved={fetchStaff}
      />
    </div>
  );
}
