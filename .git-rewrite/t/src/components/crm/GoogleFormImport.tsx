/**
 * GoogleFormImport - Dialog for importing form structure from Google Forms
 * Supports URL parsing via edge function and manual JSON import
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Link, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  isValidGoogleFormsUrl,
  parseGoogleFormJson,
  convertToEventFormFields,
  getManualImportTemplate,
  type ParsedGoogleForm,
} from '@/lib/google-forms-parser';
import type { EventFormField } from '@/types/page';

interface GoogleFormImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (fields: EventFormField[], title?: string) => void;
}

export function GoogleFormImport({ open, onOpenChange, onImport }: GoogleFormImportProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'url' | 'json'>('url');
  const [formUrl, setFormUrl] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedForm, setParsedForm] = useState<ParsedGoogleForm | null>(null);

  const lang = (i18n.language || 'ru') as 'ru' | 'en' | 'kk';

  const handleUrlImport = async () => {
    setError(null);
    setParsedForm(null);
    
    if (!formUrl.trim()) {
      setError(t('googleForms.urlRequired', 'Введите ссылку на Google Form'));
      return;
    }
    
    if (!isValidGoogleFormsUrl(formUrl)) {
      setError(t('googleForms.invalidUrl', 'Неверная ссылка. Используйте ссылку вида docs.google.com/forms/...'));
      return;
    }

    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-forms-parser', {
        body: { url: formUrl }
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        setError(t('googleForms.serverError', 'Ошибка сервера. Попробуйте позже.'));
        return;
      }

      if (data.error) {
        const errorMessages: Record<string, string> = {
          'url_required': t('googleForms.urlRequired', 'Введите ссылку на Google Form'),
          'invalid_url': t('googleForms.invalidUrl', 'Неверная ссылка'),
          'fetch_failed': t('googleForms.fetchFailed', 'Не удалось загрузить форму. Проверьте ссылку.'),
          'form_closed': t('googleForms.formClosed', 'Форма закрыта для ответов'),
          'form_not_public': t('googleForms.formNotPublic', 'Форма не публичная. Откройте доступ в настройках Google Forms.'),
          'form_data_not_found': t('googleForms.formDataNotFound', 'Не удалось найти данные формы'),
          'parse_error': t('googleForms.parseError', 'Ошибка парсинга формы'),
        };
        setError(errorMessages[data.error] || t('googleForms.unknownError', 'Неизвестная ошибка'));
        return;
      }

      if (!data.fields || data.fields.length === 0) {
        setError(t('googleForms.noFields', 'Не найдено полей для импорта'));
        return;
      }

      setParsedForm(data as ParsedGoogleForm);
      toast.success(t('googleForms.parseSuccess', 'Форма успешно распознана!'));

    } catch (err) {
      console.error('Import error:', err);
      setError(t('googleForms.serverError', 'Ошибка сервера. Попробуйте позже.'));
    } finally {
      setLoading(false);
    }
  };

  const handleJsonParse = () => {
    setError(null);
    setLoading(true);
    
    try {
      const result = parseGoogleFormJson(jsonData);
      
      if (result.error === 'parse_error') {
        setError(t('googleForms.parseError', 'Ошибка парсинга JSON. Проверьте формат.'));
        return;
      }
      
      if (result.fields.length === 0) {
        setError(t('googleForms.noFields', 'Не найдено полей для импорта.'));
        return;
      }
      
      setParsedForm(result);
    } catch {
      setError(t('googleForms.parseError', 'Ошибка парсинга JSON. Проверьте формат.'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!parsedForm || parsedForm.fields.length === 0) return;
    
    const eventFields = convertToEventFormFields(parsedForm.fields, lang);
    onImport(eventFields, parsedForm.title);
    
    toast.success(t('googleForms.importSuccess', 'Импортировано полей: {{count}}', { count: eventFields.length }));
    handleClose();
  };

  const handleClose = () => {
    setFormUrl('');
    setJsonData('');
    setError(null);
    setParsedForm(null);
    onOpenChange(false);
  };

  const handleLoadTemplate = () => {
    setJsonData(getManualImportTemplate());
    toast.info(t('googleForms.templateLoaded', 'Шаблон загружен. Отредактируйте под свои нужды.'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('googleForms.importTitle', 'Импорт из Google Forms')}
          </DialogTitle>
          <DialogDescription>
            {t('googleForms.importDescription', 'Импортируйте структуру полей из Google Forms')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'json')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              {t('googleForms.byUrl', 'По ссылке')}
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileText className="h-4 w-4 mr-2" />
              {t('googleForms.manualJson', 'JSON')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('googleForms.formUrl', 'Ссылка на Google Form')}</Label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/d/..."
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('googleForms.urlHint', 'Форма должна быть публичной')}
              </p>
            </div>
            
            <Button onClick={handleUrlImport} className="w-full" disabled={loading || !formUrl.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {loading ? t('googleForms.loading', 'Загрузка...') : t('googleForms.importFromUrl', 'Импортировать')}
            </Button>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('googleForms.jsonStructure', 'Структура формы (JSON)')}</Label>
                <Button variant="ghost" size="sm" onClick={handleLoadTemplate}>
                  {t('googleForms.loadTemplate', 'Загрузить шаблон')}
                </Button>
              </div>
              <Textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder={`{
  "title": "Form Title",
  "fields": [
    { "title": "Name", "type": "short_text", "required": true },
    { "title": "Phone", "type": "short_text" }
  ]
}`}
                className="font-mono text-xs min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {t('googleForms.jsonHint', 'Поддерживаемые типы: short_text, long_text, single_choice, multiple_choice, dropdown, date, checkbox')}
              </p>
            </div>
            
            <Button onClick={handleJsonParse} className="w-full" disabled={loading || !jsonData.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('googleForms.parseJson', 'Распарсить')}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parsedForm && parsedForm.fields.length > 0 && (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{t('googleForms.foundFields', 'Найдено полей')}: {parsedForm.fields.length}</span>
            </div>
            {parsedForm.title && (
              <div className="text-sm text-muted-foreground">
                {t('googleForms.formTitle', 'Название')}: {parsedForm.title}
              </div>
            )}
            <div className="space-y-1 text-sm max-h-[150px] overflow-y-auto">
              {parsedForm.fields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                  <span>• {field.title}</span>
                  <span className="text-xs opacity-70">({field.type})</span>
                  {field.required && <span className="text-destructive">*</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel', 'Отмена')}
          </Button>
          <Button onClick={handleImport} disabled={!parsedForm || parsedForm.fields.length === 0}>
            {t('googleForms.import', 'Импортировать')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}