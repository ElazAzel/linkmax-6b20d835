import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Building2,
  ExternalLink,
  Loader2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface VerificationRequest {
  id: string;
  user_id: string;
  verification_type: string;
  face_photo_url: string | null;
  id_document_url: string | null;
  business_registration_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  username?: string;
  display_name?: string;
}

export function AdminVerificationPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get usernames
      const userIds = data?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data?.map(r => ({
        ...r,
        username: profileMap.get(r.user_id)?.username,
        display_name: profileMap.get(r.user_id)?.display_name,
      })) as VerificationRequest[];
    },
  });

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      // Update request
      await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedRequest.id);

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verification_reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.user_id);

      toast.success(t('adminVerification.approveSuccess', 'Верификация одобрена'));
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving:', error);
      toast.error(t('adminVerification.approveError', 'Ошибка при одобрении'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !adminNotes.trim()) {
      toast.error(t('adminVerification.rejectReasonRequired', 'Укажите причину отклонения'));
      return;
    }
    setProcessing(true);

    try {
      // Update request
      await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', selectedRequest.id);

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verification_reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.user_id);

      toast.success(t('adminVerification.rejectSuccess', 'Верификация отклонена'));
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(t('adminVerification.rejectError', 'Ошибка при отклонении'));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('adminVerification.statusApproved', 'Одобрено')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            {t('adminVerification.statusRejected', 'Отклонено')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {t('adminVerification.statusPending', 'Ожидает')}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('adminVerification.totalRequests', 'Всего заявок')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{requests?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? 'border-amber-500/50 bg-amber-500/5' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('adminVerification.pending', 'Ожидают')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('adminVerification.approved', 'Одобрено')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">
                {requests?.filter(r => r.status === 'approved').length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('adminVerification.rejected', 'Отклонено')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">
                {requests?.filter(r => r.status === 'rejected').length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('adminVerification.title', 'Заявки на верификацию')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminVerification.user', 'Пользователь')}</TableHead>
                  <TableHead>{t('adminVerification.type', 'Тип')}</TableHead>
                  <TableHead>{t('adminVerification.status', 'Статус')}</TableHead>
                  <TableHead>{t('adminVerification.date', 'Дата')}</TableHead>
                  <TableHead className="text-right">{t('adminVerification.actions', 'Действия')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((request) => (
                  <TableRow key={request.id} className={request.status === 'pending' ? 'bg-amber-500/5' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.display_name || t('adminVerification.noName', 'Без имени')}</p>
                        <p className="text-sm text-muted-foreground">@{request.username || 'unknown'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {request.verification_type === 'business' ? (
                          <Building2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <User className="h-4 w-4 text-violet-500" />
                        )}
                        <span className="text-sm">
                          {request.verification_type === 'business'
                            ? t('adminVerification.business', 'Юр. лицо')
                            : t('adminVerification.personal', 'Физ. лицо')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAdminNotes(request.admin_notes || '');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('adminVerification.view', 'Просмотр')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!requests?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('adminVerification.noRequests', 'Нет заявок на верификацию')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('adminVerification.request', 'Заявка на верификацию')}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.display_name} (@{selectedRequest?.username})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('adminVerification.typeLabel', 'Тип:')}</span>
              {selectedRequest?.verification_type === 'business' ? (
                <Badge variant="secondary">
                  <Building2 className="h-3 w-3 mr-1" />
                  {t('adminVerification.businessFull', 'Юридическое лицо')}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <User className="h-3 w-3 mr-1" />
                  {t('adminVerification.personalFull', 'Физическое лицо')}
                </Badge>
              )}
              {getStatusBadge(selectedRequest?.status || 'pending')}
            </div>

            {/* Documents */}
            <div className="grid grid-cols-2 gap-4">
              {selectedRequest?.face_photo_url && (
                <a
                  href={selectedRequest.face_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ExternalLink className="h-4 w-4" />
                    {t('adminVerification.facePhoto', 'Фото с документом')}
                  </div>
                </a>
              )}
              {selectedRequest?.id_document_url && (
                <a
                  href={selectedRequest.id_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ExternalLink className="h-4 w-4" />
                    {t('adminVerification.idDocument', 'Удостоверение')}
                  </div>
                </a>
              )}
              {selectedRequest?.business_registration_url && (
                <a
                  href={selectedRequest.business_registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors col-span-2"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ExternalLink className="h-4 w-4" />
                    {t('adminVerification.businessDoc', 'Справка о регистрации')}
                  </div>
                </a>
              )}
            </div>

            {/* User notes */}
            {selectedRequest?.notes && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">{t('adminVerification.userNote', 'Примечание от пользователя:')}</p>
                <p className="text-sm">{selectedRequest.notes}</p>
              </div>
            )}

            {/* Admin notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('adminVerification.adminNote', 'Комментарий администратора')}{' '}
                {selectedRequest?.status === 'pending' && t('adminVerification.adminNoteRequired', '(обязателен при отклонении)')}
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('adminVerification.adminNotePlaceholder', 'Комментарий к решению...')}
                rows={3}
                disabled={selectedRequest?.status !== 'pending'}
              />
            </div>
          </div>

          <DialogFooter>
            {selectedRequest?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={processing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('adminVerification.reject', 'Отклонить')}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t('adminVerification.approve', 'Одобрить')}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                {t('adminVerification.close', 'Закрыть')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
