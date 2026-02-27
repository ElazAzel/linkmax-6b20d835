/**
 * ZoneSettingsScreen - Zone management (members, invites, billing, audit)
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Users from 'lucide-react/dist/esm/icons/users';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Shield from 'lucide-react/dist/esm/icons/shield';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import { toast } from 'sonner';
import type { Zone, ZoneMember, ZoneInvite, ZoneMemberRole } from '@/types/zones';
import { ZONE_PLANS, getPlanByCode, getMemberLimitFromPlan } from '@/types/zones';

interface ZoneSettingsScreenProps {
  zone: Zone;
  members: ZoneMember[];
  myRole: ZoneMemberRole | null;
  onRefetch: () => Promise<void>;
}

export const ZoneSettingsScreen = memo(function ZoneSettingsScreen({
  zone,
  members,
  myRole,
  onRefetch,
}: ZoneSettingsScreenProps) {
  const { t } = useTranslation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<ZoneInvite[]>([]);

  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const memberLimit = getMemberLimitFromPlan(zone.plan_code);
  const plan = getPlanByCode(zone.plan_code);

  // Fetch invites
  const fetchInvites = useCallback(async () => {
    const { data } = await supabase
      .from('zone_invites')
      .select('*')
      .eq('zone_id', zone.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setInvites((data as ZoneInvite[]) || []);
  }, [zone.id]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const totalCount = members.length + invites.length;
    if (totalCount >= memberLimit) {
      toast.error(t('zones.settings.memberLimitReached', 'Member limit reached. Upgrade your plan.'));
      return;
    }
    setInviting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from('zone_invites').insert({
        zone_id: zone.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        created_by: user?.id || '',
      } as any);
      if (error) throw error;
      toast.success(t('zones.settings.inviteSent', 'Invite sent'));
      setInviteOpen(false);
      setInviteEmail('');
      fetchInvites();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{zone.name} — {t('zones.settings.title', 'Settings')}</h1>

      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="gap-1"><Users className="h-4 w-4" />{t('zones.settings.members', 'Members')}</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1"><CreditCard className="h-4 w-4" />{t('zones.settings.billing', 'Billing')}</TabsTrigger>
          <TabsTrigger value="general" className="gap-1"><Shield className="h-4 w-4" />{t('zones.settings.general', 'General')}</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {members.length + invites.length} / {memberLimit === 999999 ? '∞' : memberLimit} {t('zones.settings.membersCount', 'members')}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setInviteOpen(true)} size="sm">
                <Mail className="h-4 w-4 mr-1" />
                {t('zones.settings.invite', 'Invite')}
              </Button>
            )}
          </div>

          {/* Members list */}
          <div className="space-y-2">
            {members.map(member => (
              <Card key={member.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                      {(member.display_name || member.user_id).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.display_name || member.user_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{member.email || ''}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                    {member.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('zones.settings.pendingInvites', 'Pending invites')}</p>
              {invites.map(invite => (
                <Card key={invite.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('zones.settings.expires', 'Expires')}: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{invite.role}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('zones.settings.currentPlan', 'Current Plan')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('zones.settings.plan', 'Plan')}</span>
                <span className="font-medium">{zone.plan_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('zones.settings.cycle', 'Cycle')}</span>
                <span className="font-medium">{zone.plan_cycle === 'monthly' ? t('zones.settings.monthly', 'Monthly') : t('zones.settings.yearly', 'Yearly')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('zones.settings.status', 'Status')}</span>
                <Badge variant={zone.plan_status === 'active' ? 'default' : 'destructive'}>
                  {zone.plan_status}
                </Badge>
              </div>
              {zone.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('zones.settings.renewsAt', 'Renews at')}</span>
                  <span className="text-sm">{new Date(zone.current_period_end).toLocaleDateString()}</span>
                </div>
              )}
              {plan && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('zones.settings.price', 'Price')}</span>
                  <span className="font-bold text-primary">
                    {zone.plan_cycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.yearlyPrice.toLocaleString()} KZT
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>{t('zones.name', 'Zone name')}</Label>
                <Input defaultValue={zone.name} disabled={!isAdmin} />
              </div>
              <div className="space-y-2">
                <Label>{t('zones.slug', 'Slug')}</Label>
                <Input defaultValue={zone.slug} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.settings.inviteMember', 'Invite Member')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.settings.role', 'Role')}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>{t('zones.settings.sendInvite', 'Send Invite')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ZoneSettingsScreen;
