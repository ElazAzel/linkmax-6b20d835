/**
 * ZoneSettingsScreen - Zone management (members, invites, billing, general, leave)
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Users from 'lucide-react/dist/esm/icons/users';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Shield from 'lucide-react/dist/esm/icons/shield';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import UserMinus from 'lucide-react/dist/esm/icons/user-minus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { toast } from 'sonner';
import type { Zone, ZoneMember, ZoneInvite, ZoneMemberRole } from '@/types/zones';
import { ZONE_PLANS, getPlanByCode, getMemberLimitFromPlan } from '@/types/zones';
import { ZonePlanSelector } from './ZonePlanSelector';
import { ZonePipelineSettings } from './settings/ZonePipelineSettings';
import { ZoneContactFieldsSettings } from './settings/ZoneContactFieldsSettings';
import { ZoneDealFieldsSettings } from './settings/ZoneDealFieldsSettings';
import Layers from 'lucide-react/dist/esm/icons/layers';
import FileText from 'lucide-react/dist/esm/icons/file-text';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<ZoneInvite[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [removeMember, setRemoveMember] = useState<ZoneMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [zoneName, setZoneName] = useState(zone.name);
  const [saving, setSaving] = useState(false);

  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';
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

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invites/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(t('zones.settings.linkCopied', 'Invite link copied to clipboard'));
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      const { error } = await supabase.from('zone_invites').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('zones.settings.inviteRevoked', 'Invite revoked'));
      fetchInvites();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLeaveZone = async () => {
    setLeaving(true);
    try {
      const { data, error } = await supabase.rpc('leave_zone' as any, { p_zone_id: zone.id });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error === 'owner_cannot_leave' ? 'Владелец не может покинуть зону' : result.error);
      toast.success(t('zones.settings.leftZone', 'You left the zone'));
      await onRefetch();
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLeaving(false);
      setLeaveOpen(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMember) return;
    setRemoving(true);
    try {
      const { data, error } = await supabase.rpc('remove_zone_member' as any, {
        p_zone_id: zone.id,
        p_member_user_id: removeMember.user_id,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      toast.success(t('zones.settings.memberRemoved', 'Member removed'));
      await onRefetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
      setRemoveMember(null);
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.rpc('update_zone_member_role' as any, {
        p_zone_id: zone.id,
        p_member_user_id: memberUserId,
        p_new_role: newRole,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      toast.success(t('zones.settings.roleUpdated', 'Role updated'));
      await onRefetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveGeneral = async () => {
    if (!zoneName.trim() || zoneName === zone.name) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('zones')
        .update({ name: zoneName.trim() } as any)
        .eq('id', zone.id);
      if (error) throw error;
      toast.success(t('zones.settings.saved', 'Settings saved'));
      await onRefetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{zone.name} — {t('zones.settings.title', 'Settings')}</h1>

      <Tabs defaultValue="members">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="members" className="gap-1 flex-1 min-w-[120px]"><Users className="h-4 w-4" />{t('zones.settings.members', 'Members')}</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1 flex-1 min-w-[120px]"><CreditCard className="h-4 w-4" />{t('zones.settings.billing', 'Billing')}</TabsTrigger>
          <TabsTrigger value="pipelines" className="gap-1 flex-1 min-w-[120px]"><Layers className="h-4 w-4" />{t('zones.settings.pipelinesTab', 'Воронки')}</TabsTrigger>
          <TabsTrigger value="fields" className="gap-1 flex-1 min-w-[120px]"><FileText className="h-4 w-4" />{t('zones.settings.fieldsTab', 'Поля')}</TabsTrigger>
          <TabsTrigger value="general" className="gap-1 flex-1 min-w-[120px]"><Shield className="h-4 w-4" />{t('zones.settings.general', 'General')}</TabsTrigger>
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
                  <div className="flex items-center gap-2">
                    {isAdmin && member.role !== 'owner' && member.user_id !== user?.id ? (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.user_id, val)}
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('zones.settings.roles.admin', 'Admin')}</SelectItem>
                            <SelectItem value="member">{t('zones.settings.roles.member', 'Member')}</SelectItem>
                            <SelectItem value="viewer">{t('zones.settings.roles.viewer', 'Viewer')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveMember(member)}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('zones.settings.pendingInvites', 'Pending invites')}</p>
              {invites.map(invite => (
                <Card key={invite.id} className="border-dashed">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{invite.email}</p>
                        <Badge variant="outline" className="text-xs h-4">{invite.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('zones.settings.expires', 'Expires')}: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => copyInviteLink(invite.token)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRevokeInvite(invite.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{t('zones.settings.currentPlan', 'Current Plan')}</CardTitle>
                <CardDescription>{t('zones.settings.planDesc', 'Manage your membership tier and usage limits.')}</CardDescription>
              </div>
              <Badge variant={zone.plan_status === 'active' ? 'default' : 'destructive'} className="h-6">
                {zone.plan_status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('zones.settings.plan', 'Plan')}</span>
                  <p className="font-semibold text-lg">{zone.plan_code.replace('business_', 'Business ')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('zones.settings.cycle', 'Billing Cycle')}</span>
                  <p className="font-medium capitalize">{zone.plan_cycle}</p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border border-primary/10">
                <div>
                  <p className="text-sm font-medium">{t('zones.settings.renewsAt', 'Next Renewal')}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {zone.current_period_end ? new Date(zone.current_period_end).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {plan && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">{t('zones.settings.price', 'Subscription Cost')}</p>
                    <p className="text-xl font-bold text-primary">
                      {zone.plan_cycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.yearlyPrice.toLocaleString()} KZT
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-3">{t('zones.settings.managePlan', 'Upgrade or Change Plan')}</p>
                <ZonePlanSelector zone={zone} onRefetch={onRefetch} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('zones.settings.pipelines.title', 'Управление воронками продаж')}</CardTitle>
              <CardDescription>{t('zones.settings.pipelines.desc', 'Создавайте и настраивайте воронки для разных процессов.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ZonePipelineSettings zoneId={zone.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact/Deal Fields Tab */}
        <TabsContent value="fields" className="space-y-8 mt-4">
          <div>
            <ZoneContactFieldsSettings zoneId={zone.id} />
          </div>
          <div className="pt-4 border-t border-border/50">
            <ZoneDealFieldsSettings zoneId={zone.id} />
          </div>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>{t('zones.name', 'Zone name')}</Label>
                <Input
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('zones.slug', 'Slug')}</Label>
                <Input defaultValue={zone.slug} disabled />
              </div>
              {isAdmin && (
                <Button onClick={handleSaveGeneral} disabled={saving || zoneName === zone.name || !zoneName.trim()}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {t('common.save', 'Save')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Leave / Danger zone */}
          <Card className="border-destructive/30">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">{t('zones.settings.dangerZone', 'Danger Zone')}</p>
              {!isOwner && (
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('zones.settings.leaveZone', 'Leave Zone')}
                </Button>
              )}
              {isOwner && (
                <p className="text-xs text-muted-foreground">
                  {t('zones.settings.ownerCannotLeave', 'As the owner, you cannot leave the zone. Transfer ownership first or contact support.')}
                </p>
              )}
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
              <Label>{t('zones.settings.emailLabel', 'Email')}</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.settings.role', 'Role')}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('zones.settings.roles.admin', 'Admin')}</SelectItem>
                  <SelectItem value="member">{t('zones.settings.roles.member', 'Member')}</SelectItem>
                  <SelectItem value="viewer">{t('zones.settings.roles.viewer', 'Viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('zones.settings.sendInvite', 'Send Invite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Zone Confirm */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('zones.settings.leaveConfirmTitle', 'Leave this zone?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('zones.settings.leaveConfirmDesc', 'You will lose access to all zone data including deals, contacts, and messages. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveZone}
              disabled={leaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('zones.settings.confirmLeave', 'Leave Zone')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirm */}
      <AlertDialog open={!!removeMember} onOpenChange={(open) => !open && setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('zones.settings.removeMemberTitle', 'Remove member?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('zones.settings.removeMemberDesc', 'This will remove {{name}} from the zone. They will lose access to all zone data.', {
                name: removeMember?.display_name || removeMember?.user_id.slice(0, 8) || ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('zones.settings.confirmRemove', 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default ZoneSettingsScreen;
