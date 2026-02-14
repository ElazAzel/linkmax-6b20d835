import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Shield, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  Building2,
  FileImage,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type VerificationType = 'individual' | 'business';
type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function VerificationPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [verificationType, setVerificationType] = useState<VerificationType>('individual');
  const [facePhoto, setFacePhoto] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [businessDoc, setBusinessDoc] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Fetch current verification status
  const { data: verificationData, isLoading } = useQuery({
    queryKey: ['verification-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_verified, verification_status, verification_type')
        .eq('id', user.id)
        .single();
      
      const { data: request } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return { profile, request };
    },
    enabled: !!user?.id,
  });

  const status = (verificationData?.profile?.verification_status || 'none') as VerificationStatus;
  const isVerified = verificationData?.profile?.is_verified || false;

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(path, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      setUploading(true);
      
      const timestamp = Date.now();
      const basePath = `${user.id}/${timestamp}`;
      
      let facePhotoUrl: string | null = null;
      let idDocumentUrl: string | null = null;
      let businessDocUrl: string | null = null;
      
      // Upload files
      if (facePhoto) {
        facePhotoUrl = await uploadFile(facePhoto, `${basePath}/face.${facePhoto.name.split('.').pop()}`);
      }
      
      if (idDocument) {
        idDocumentUrl = await uploadFile(idDocument, `${basePath}/id.${idDocument.name.split('.').pop()}`);
      }
      
      if (verificationType === 'business' && businessDoc) {
        businessDocUrl = await uploadFile(businessDoc, `${basePath}/business.${businessDoc.name.split('.').pop()}`);
      }
      
      // Create verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          face_photo_url: facePhotoUrl,
          id_document_url: idDocumentUrl,
          business_registration_url: businessDocUrl,
          notes,
          status: 'pending',
        });
      
      if (requestError) throw requestError;
      
      // Update profile status
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          verification_status: 'pending',
          verification_type: verificationType,
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast.success(t('verification.submitted', 'Заявка на верификацию отправлена'));
      queryClient.invalidateQueries({ queryKey: ['verification-status'] });
      setFacePhoto(null);
      setIdDocument(null);
      setBusinessDoc(null);
      setNotes('');
    },
    onError: (error) => {
      console.error('Verification error:', error);
      toast.error(t('verification.error', 'Ошибка при отправке заявки'));
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('verification.approved', 'Верифицирован')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {t('verification.pending', 'На рассмотрении')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            {t('verification.rejected', 'Отклонено')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const canSubmit = verificationType === 'individual' 
    ? facePhoto && idDocument 
    : facePhoto && idDocument && businessDoc;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Already verified
  if (isVerified) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('verification.title', 'Верификация')}
                <Badge className="bg-emerald-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('verification.verified', 'Подтверждено')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('verification.verifiedDesc', 'Ваша личность подтверждена. Значок верификации отображается на вашей странице.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Pending verification
  if (status === 'pending') {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('verification.title', 'Верификация')}
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                {t('verification.pendingDesc', 'Ваша заявка находится на рассмотрении. Обычно это занимает 1-3 рабочих дня.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('verification.title', 'Верификация')}
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              {t('verification.description', 'Подтвердите свою личность, чтобы получить значок верификации на странице')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === 'rejected' && verificationData?.request?.admin_notes && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-600">{t('verification.rejectedReason', 'Причина отклонения:')}</p>
                <p className="text-sm text-muted-foreground mt-1">{verificationData.request.admin_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Type selection */}
        <div className="space-y-3">
          <Label>{t('verification.type', 'Тип верификации')}</Label>
          <RadioGroup
            value={verificationType}
            onValueChange={(v) => setVerificationType(v as VerificationType)}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="individual"
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                verificationType === 'individual' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="individual" id="individual" />
              <User className="h-5 w-5" />
              <div>
                <p className="font-medium">{t('verification.individual', 'Физ. лицо')}</p>
                <p className="text-xs text-muted-foreground">{t('verification.individualDesc', 'Эксперт, блогер')}</p>
              </div>
            </Label>
            <Label
              htmlFor="business"
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                verificationType === 'business' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="business" id="business" />
              <Building2 className="h-5 w-5" />
              <div>
                <p className="font-medium">{t('verification.business', 'Юр. лицо')}</p>
                <p className="text-xs text-muted-foreground">{t('verification.businessDesc', 'Компания, магазин')}</p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        {/* File uploads */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facePhoto" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              {t('verification.facePhoto', 'Фото лица с документом')}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="facePhoto"
                type="file"
                accept="image/*"
                onChange={(e) => setFacePhoto(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {facePhoto && (
                <Badge variant="secondary" className="shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {facePhoto.name.slice(0, 15)}...
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('verification.facePhotoHint', 'Селфи с удостоверением личности в руках')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idDocument" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              {t('verification.idDocument', 'Удостоверение личности')}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="idDocument"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {idDocument && (
                <Badge variant="secondary" className="shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {idDocument.name.slice(0, 15)}...
                </Badge>
              )}
            </div>
          </div>

          {verificationType === 'business' && (
            <div className="space-y-2">
              <Label htmlFor="businessDoc" className="flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                {t('verification.businessDoc', 'Справка о регистрации юр. лица')}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="businessDoc"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setBusinessDoc(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {businessDoc && (
                  <Badge variant="secondary" className="shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {businessDoc.name.slice(0, 15)}...
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t('verification.notes', 'Дополнительная информация')} ({t('common.optional', 'опционально')})</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('verification.notesPlaceholder', 'Любая дополнительная информация...')}
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={!canSubmit || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              {t('verification.uploading', 'Загрузка...')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {t('verification.submit', 'Отправить на верификацию')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
