import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Search, Loader2, Crown, Edit, Calendar, User, RefreshCw, Shield } from 'lucide-react';
import { format, addDays, addMonths, addYears } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';

type PremiumTier = 'free' | 'pro' | 'business';

interface UserTierData {
  id: string;
  username: string | null;
  display_name: string | null;
  premium_tier: PremiumTier;
  premium_expires_at: string | null;
  is_premium: boolean;
  trial_ends_at: string | null;
  created_at: string;
  isAdmin?: boolean;
}

export function UserTierManager() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<UserTierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserTierData | null>(null);
  const [newTier, setNewTier] = useState<PremiumTier>('free');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'kk': return kk;
      default: return enUS;
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, premium_tier, premium_expires_at, is_premium, trial_ends_at, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (profilesError) throw profilesError;

      // Load admin roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(rolesData?.map(r => r.user_id) || []);
      
      const usersWithRoles = (profilesData || []).map(user => ({
        ...user,
        isAdmin: adminUserIds.has(user.id)
      })) as UserTierData[];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: UserTierData) => {
    setEditingUser(user);
    setNewTier((user.premium_tier as PremiumTier) || 'free');
    setExpiresAt(user.premium_expires_at ? user.premium_expires_at.split('T')[0] : '');
    setIsAdmin(user.isAdmin || false);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    try {
      // Update user profile
      const updateData: Record<string, any> = {
        premium_tier: newTier,
        premium_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_premium: newTier !== 'free'
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Handle admin role
      const wasAdmin = editingUser.isAdmin || false;
      if (isAdmin && !wasAdmin) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: editingUser.id, role: 'admin' });
        if (roleError) throw roleError;
      } else if (!isAdmin && wasAdmin) {
        // Remove admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id)
          .eq('role', 'admin');
        if (roleError) throw roleError;
      }

      toast.success(t('admin.tierUpdated'));
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error(t('admin.tierUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const setQuickExpiry = (duration: 'week' | 'month' | 'year' | 'lifetime') => {
    const now = new Date();
    let newDate: Date;
    
    switch (duration) {
      case 'week':
        newDate = addDays(now, 7);
        break;
      case 'month':
        newDate = addMonths(now, 1);
        break;
      case 'year':
        newDate = addYears(now, 1);
        break;
      case 'lifetime':
        newDate = addYears(now, 100);
        break;
    }
    
    setExpiresAt(format(newDate, 'yyyy-MM-dd'));
  };

  const getTierBadge = (tier: PremiumTier) => {
    switch (tier) {
      case 'business':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">{t('admin.tierBusiness')}</Badge>;
      case 'pro':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">{t('admin.tierPro')}</Badge>;
      default:
        return <Badge variant="secondary">{t('admin.tierFree')}</Badge>;
    }
  };

  const getExpiryStatus = (user: UserTierData) => {
    if (user.premium_tier === 'free') return null;
    
    const expiresAt = user.premium_expires_at;
    if (!expiresAt) return <span className="text-green-500 text-xs">{t('admin.lifetime')}</span>;
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    if (expiryDate < now) {
      return <span className="text-destructive text-xs">{t('admin.expired')}</span>;
    }
    
    return (
      <span className="text-muted-foreground text-xs">
        {t('admin.expiresOn')} {format(expiryDate, 'dd.MM.yyyy', { locale: getDateLocale() })}
      </span>
    );
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {t('admin.tierManagement')}
        </h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.premium_tier === 'free').length}</div>
            <div className="text-sm text-muted-foreground">{t('admin.tierFree')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{users.filter(u => u.premium_tier === 'pro').length}</div>
            <div className="text-sm text-muted-foreground">{t('admin.tierPro')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-500">{users.filter(u => u.premium_tier === 'business').length}</div>
            <div className="text-sm text-muted-foreground">{t('admin.tierBusiness')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.user')}</TableHead>
                  <TableHead>{t('admin.tier')}</TableHead>
                  <TableHead>{t('admin.expiry')}</TableHead>
                  <TableHead>{t('admin.registered')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.isAdmin ? (
                          <Shield className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            {user.display_name || user.username || 'No name'}
                            {user.isAdmin && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-yellow-500 text-yellow-500">
                                Admin
                              </Badge>
                            )}
                          </div>
                          {user.username && (
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(user.premium_tier || 'free')}</TableCell>
                    <TableCell>{getExpiryStatus(user)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t('admin.edit')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Crown className="h-5 w-5 text-yellow-500" />
                              {t('admin.editUserTier')}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {editingUser?.id === user.id && (
                            <div className="space-y-4 pt-4">
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="font-medium">{editingUser.display_name || editingUser.username}</div>
                                {editingUser.username && (
                                  <div className="text-sm text-muted-foreground">@{editingUser.username}</div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>{t('admin.selectTier')}</Label>
                                <Select value={newTier} onValueChange={(v) => setNewTier(v as PremiumTier)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">{t('admin.tierFree')}</SelectItem>
                                    <SelectItem value="pro">{t('admin.tierPro')}</SelectItem>
                                    <SelectItem value="business">{t('admin.tierBusiness')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Admin toggle */}
                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-yellow-500" />
                                  <div>
                                    <Label className="font-medium">{t('admin.adminRole')}</Label>
                                    <p className="text-xs text-muted-foreground">{t('admin.adminRoleDesc')}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={isAdmin}
                                  onCheckedChange={setIsAdmin}
                                />
                              </div>

                              {newTier !== 'free' && (
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('admin.expiryDate')}
                                  </Label>
                                  <Input
                                    type="date"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                  />
                                  
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setQuickExpiry('week')}
                                    >
                                      +1 {t('admin.week')}
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setQuickExpiry('month')}
                                    >
                                      +1 {t('admin.month')}
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setQuickExpiry('year')}
                                    >
                                      +1 {t('admin.year')}
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setQuickExpiry('lifetime')}
                                    >
                                      {t('admin.lifetime')}
                                    </Button>
                                  </div>

                                  <p className="text-xs text-muted-foreground">
                                    {t('admin.leaveEmptyLifetime')}
                                  </p>
                                </div>
                              )}

                              <div className="flex justify-end gap-2 pt-4">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setEditingUser(null)}
                                >
                                  {t('admin.cancel')}
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  {t('admin.save')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
