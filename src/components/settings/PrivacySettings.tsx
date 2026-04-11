import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  AlertTriangle,
  FileText,
  Lock,
  Loader2
} from 'lucide-react';
import { gdprService } from '@/services/gdpr';
import { useToast } from '@/hooks/ui/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

export const PrivacySettings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const result = await gdprService.exportUserData();
      
      if (result.success) {
        // Create a blob and download it
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `linkmax-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: t('gdpr.exportSuccess', 'Data export complete'),
          description: t('gdpr.exportSuccessDesc', 'Your personal data has been downloaded successfully.'),
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('gdpr.exportError', 'Export failed'),
        description: error.message || t('gdpr.errorGeneral', 'Something went wrong'),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const result = await gdprService.deleteAccount();
      
      if (result.success) {
        toast({
          title: t('gdpr.deleteSuccess', 'Account deleted'),
          description: t('gdpr.deleteSuccessDesc', 'Your account and all associated data have been permanently removed.'),
        });
        // Redirect will be handled by the service (signing out triggers auth guards)
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('gdpr.deleteError', 'Deletion failed'),
        description: error.message || t('gdpr.errorGeneral', 'Something went wrong'),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">{t('gdpr.title', 'Privacy & Data Management')}</h3>
      </div>

      {/* Data Portability */}
      <Card className="p-5 border-primary/10">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">{t('gdpr.exportTitle', 'Export Personal Data')}</h4>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">GDPR</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('gdpr.exportDesc', 'Download a copy of all information stored in your account, including profile, pages, blocks, and analytics.')}
            </p>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={exporting}
              className="mt-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('gdpr.exportButton', 'Generate Data Export')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Deletion */}
      <Card className="p-5 border-destructive/10">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-bold text-destructive">{t('gdpr.deleteTitle', 'Permanent Account Deletion')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('gdpr.deleteDesc', 'Once you delete your account, there is no going back. All your data, pages, and linked custom domains will be permanently removed.')}
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-2">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('gdpr.deleteButton', 'Delete My Account')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {t('gdpr.confirmDeleteTitle', 'Are you absolutely sure?')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('gdpr.confirmDeleteDesc', 'This action will permanently delete your account and all associated data. This action cannot be undone.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {t('gdpr.confirmDeleteButton', 'Yes, Delete Everything')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Policy Links */}
      <div className="flex flex-wrap gap-4 pt-4">
        <a href="/privacy" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
          <FileText className="h-4 w-4" />
          {t('gdpr.privacyPolicy', 'Privacy Policy')}
        </a>
        <a href="/terms" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
          <Lock className="h-4 w-4" />
          {t('gdpr.tos', 'Terms of Service')}
        </a>
      </div>
    </div>
  );
};
