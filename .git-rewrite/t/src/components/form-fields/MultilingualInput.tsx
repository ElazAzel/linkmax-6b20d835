import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { LANGUAGES, type MultilingualString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MultilingualInputProps {
  label: string;
  value: MultilingualString;
  onChange: (value: MultilingualString) => void;
  type?: 'input' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

export function MultilingualInput({
  label,
  value,
  onChange,
  type = 'input',
  placeholder,
  required = false,
}: MultilingualInputProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SupportedLanguage>('ru');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleChange = (lang: SupportedLanguage, text: string) => {
    onChange({
      ...value,
      [lang]: text,
    });
  };

  const handleTranslate = async () => {
    const sourceText = value[activeTab];
    if (!sourceText?.trim()) {
      toast.error(t('ai.noTextToTranslate', 'Введите текст для перевода'));
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text: sourceText,
          sourceLanguage: activeTab,
          targetLanguages: LANGUAGES.filter(l => l.code !== activeTab).map(l => l.code),
        },
      });

      if (error) throw error;

      onChange({
        ...value,
        ...data.translations,
      });

      toast.success(t('ai.translationSuccess', 'Перевод выполнен'));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('ai.translationError', 'Ошибка перевода'));
    } finally {
      setIsTranslating(false);
    }
  };

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleTranslate}
          disabled={isTranslating || !value[activeTab]?.trim()}
          className="h-7 px-2 text-xs gap-1.5"
          title={t('ai.translateToOthers', 'Перевести на другие языки')}
        >
          {isTranslating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Languages className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{t('ai.translate', 'Перевести')}</span>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as SupportedLanguage)}>
        <TabsList className="grid w-full grid-cols-3">
          {LANGUAGES.map((lang) => (
            <TabsTrigger key={lang.code} value={lang.code} className="gap-1.5">
              <span>{lang.flag}</span>
              <span className="hidden sm:inline">{lang.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {LANGUAGES.map((lang) => (
          <TabsContent key={lang.code} value={lang.code} className="mt-2">
            <InputComponent
              value={value[lang.code] || ''}
              onChange={(e) => handleChange(lang.code, e.target.value)}
              placeholder={placeholder ? `${placeholder} (${lang.name})` : undefined}
              className={type === 'textarea' ? 'min-h-[100px]' : ''}
            />
            {lang.code === 'ru' && required && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('fields.requiredRussian', 'Обязательное поле для русского языка')}
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
