import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, ArrowLeft, Search, Copy, Download, AlertTriangle,
  CheckCircle, Languages, Loader2, Upload, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';

import ru from '@/i18n/locales/ru.json';
import en from '@/i18n/locales/en.json';
import kk from '@/i18n/locales/kk.json';

type LanguageCode = 'ru' | 'en' | 'kk';
type TranslationData = Record<string, unknown>;

interface FlattenedKey {
  key: string;
  ru: string;
  en: string;
  kk: string;
  missingIn: LanguageCode[];
}

// Flatten nested JSON object to dot notation keys
function flattenObject(obj: TranslationData, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as TranslationData, newKey));
    } else {
      result[newKey] = String(value ?? '');
    }
  }
  
  return result;
}

// Get all unique keys from all languages
function getAllKeys(translations: Record<LanguageCode, TranslationData>): FlattenedKey[] {
  const flatRu = flattenObject(translations.ru);
  const flatEn = flattenObject(translations.en);
  const flatKk = flattenObject(translations.kk);
  
  const allKeys = new Set([
    ...Object.keys(flatRu),
    ...Object.keys(flatEn),
    ...Object.keys(flatKk),
  ]);
  
  return Array.from(allKeys).sort().map(key => {
    const missingIn: LanguageCode[] = [];
    if (!flatRu[key]) missingIn.push('ru');
    if (!flatEn[key]) missingIn.push('en');
    if (!flatKk[key]) missingIn.push('kk');
    
    return {
      key,
      ru: flatRu[key] || '',
      en: flatEn[key] || '',
      kk: flatKk[key] || '',
      missingIn,
    };
  });
}

// Set nested value by dot notation key
function setNestedValue(obj: TranslationData, key: string, value: string): void {
  const parts = key.split('.');
  let current: TranslationData = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as TranslationData;
  }
  
  current[parts[parts.length - 1]] = value;
}

export default function AdminTranslations() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canonical = 'https://lnkmx.my/admin/translations';
  const seoTitle = t('adminTranslations.seo.title', 'lnkmx Admin Translations');
  const seoDescription = t(
    'adminTranslations.seo.description',
    'Internal translation management for lnkmx.'
  );
  const { isAdmin, loading } = useAdminAuth();
  
  const [translations, setTranslations] = useState<Record<LanguageCode, TranslationData>>({
    ru: JSON.parse(JSON.stringify(ru)),
    en: JSON.parse(JSON.stringify(en)),
    kk: JSON.parse(JSON.stringify(kk)),
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing'>('all');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('ru');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [loading, isAdmin, navigate]);

  const allKeys = useMemo(() => getAllKeys(translations), [translations]);
  
  const filteredKeys = useMemo(() => {
    return allKeys.filter(item => {
      // Search filter
      const matchesSearch = !searchQuery || 
        item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kk.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Missing filter
      const matchesMissing = filterMode === 'all' || item.missingIn.length > 0;
      
      return matchesSearch && matchesMissing;
    });
  }, [allKeys, searchQuery, filterMode]);

  const stats = useMemo(() => {
    const total = allKeys.length;
    const missingRu = allKeys.filter(k => k.missingIn.includes('ru')).length;
    const missingEn = allKeys.filter(k => k.missingIn.includes('en')).length;
    const missingKk = allKeys.filter(k => k.missingIn.includes('kk')).length;
    const complete = allKeys.filter(k => k.missingIn.length === 0).length;
    
    return { total, missingRu, missingEn, missingKk, complete };
  }, [allKeys]);

  const handleValueChange = (key: string, lang: LanguageCode, value: string) => {
    setTranslations(prev => {
      const updated = { ...prev };
      updated[lang] = JSON.parse(JSON.stringify(prev[lang]));
      setNestedValue(updated[lang], key, value);
      return updated;
    });
  };

  const copyToClipboard = async (lang: LanguageCode) => {
    try {
      const json = JSON.stringify(translations[lang], null, 2);
      await navigator.clipboard.writeText(json);
      toast.success(`JSON для ${lang.toUpperCase()} скопирован`);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const downloadJSON = (lang: LanguageCode) => {
    const json = JSON.stringify(translations[lang], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lang}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Файл ${lang}.json скачан`);
  };

  const copyMissingKeys = async (lang: LanguageCode) => {
    const missing = allKeys.filter(k => k.missingIn.includes(lang));
    const result: TranslationData = {};
    
    missing.forEach(item => {
      // Use value from another language as placeholder
      const placeholder = item.ru || item.en || item.kk || `[${item.key}]`;
      setNestedValue(result, item.key, `[TODO] ${placeholder}`);
    });
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success(`${missing.length} отсутствующих ключей для ${lang.toUpperCase()} скопировано`);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text) as TranslationData;
      
      // Merge imported data with existing translations
      setTranslations(prev => {
        const updated = { ...prev };
        updated[selectedLang] = mergeDeep(prev[selectedLang], importedData);
        return updated;
      });
      
      toast.success(`JSON для ${selectedLang.toUpperCase()} импортирован`);
    } catch (error) {
      toast.error('Ошибка парсинга JSON файла');
      console.error('Import error:', error);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Deep merge function for nested objects
  function mergeDeep(target: TranslationData, source: TranslationData): TranslationData {
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (target[key] && typeof target[key] === 'object') {
          result[key] = mergeDeep(target[key] as TranslationData, source[key] as TranslationData);
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  const resetToOriginal = () => {
    setTranslations({
      ru: JSON.parse(JSON.stringify(ru)),
      en: JSON.parse(JSON.stringify(en)),
      kk: JSON.parse(JSON.stringify(kk)),
    });
    toast.success('Переводы сброшены к исходным');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <StaticSEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        currentLanguage={i18n.language}
        indexable={false}
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'kk', href: `${canonical}?lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Редактор переводов
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Всего ключей</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{stats.complete}</div>
              <p className="text-sm text-muted-foreground">Полные</p>
            </CardContent>
          </Card>
          <Card className={stats.missingRu > 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.missingRu}</div>
              <p className="text-sm text-muted-foreground">Нет в RU</p>
            </CardContent>
          </Card>
          <Card className={stats.missingEn > 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.missingEn}</div>
              <p className="text-sm text-muted-foreground">Нет в EN</p>
            </CardContent>
          </Card>
          <Card className={stats.missingKk > 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.missingKk}</div>
              <p className="text-sm text-muted-foreground">Нет в KK</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ключу или значению..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('all')}
                >
                  Все
                </Button>
                <Button
                  variant={filterMode === 'missing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('missing')}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Только отсутствующие
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Tabs */}
        <Tabs value={selectedLang} onValueChange={(v) => setSelectedLang(v as LanguageCode)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="ru" className="gap-2">
                🇷🇺 Русский
                {stats.missingRu > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.missingRu}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="en" className="gap-2">
                🇬🇧 English
                {stats.missingEn > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.missingEn}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="kk" className="gap-2">
                🇰🇿 Қазақша
                {stats.missingKk > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.missingKk}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="h-4 w-4 mr-1" />
                Импорт JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyMissingKeys(selectedLang)}>
                <AlertTriangle className="h-4 w-4 mr-1" />
                Отсутствующие
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedLang)}>
                <Copy className="h-4 w-4 mr-1" />
                Копировать
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadJSON(selectedLang)}>
                <Download className="h-4 w-4 mr-1" />
                Скачать
              </Button>
              <Button variant="ghost" size="sm" onClick={resetToOriginal}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Сброс
              </Button>
            </div>
          </div>

          {(['ru', 'en', 'kk'] as LanguageCode[]).map(lang => (
            <TabsContent key={lang} value={lang}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Переводы ({filteredKeys.length} из {allKeys.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredKeys.map(item => (
                        <div 
                          key={item.key}
                          className={`flex items-start gap-4 p-3 rounded-lg border ${
                            item.missingIn.includes(lang) 
                              ? 'border-destructive bg-destructive/5' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate">
                                {item.key}
                              </code>
                              {item.missingIn.length === 0 ? (
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Badge variant="destructive" className="text-xs flex-shrink-0">
                                  Нет в: {item.missingIn.join(', ').toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <Input
                              value={item[lang]}
                              onChange={(e) => handleValueChange(item.key, lang, e.target.value)}
                              placeholder={`[Отсутствует] ${item.ru || item.en || item.kk || ''}`}
                              className={item.missingIn.includes(lang) ? 'border-destructive' : ''}
                            />
                            {/* Show other language values for reference */}
                            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                              {lang !== 'ru' && item.ru && (
                                <span>🇷🇺 {item.ru.slice(0, 50)}{item.ru.length > 50 ? '...' : ''}</span>
                              )}
                              {lang !== 'en' && item.en && (
                                <span>🇬🇧 {item.en.slice(0, 50)}{item.en.length > 50 ? '...' : ''}</span>
                              )}
                              {lang !== 'kk' && item.kk && (
                                <span>🇰🇿 {item.kk.slice(0, 50)}{item.kk.length > 50 ? '...' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredKeys.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Ключи не найдены</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Инструкция</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Редактирование:</strong> Изменяйте переводы прямо в полях ввода</p>
            <p><strong>Импорт:</strong> Загрузите JSON файл кнопкой "Импорт JSON" — новые ключи добавятся, существующие обновятся</p>
            <p><strong>Экспорт:</strong> Скачайте или скопируйте JSON и замените файл в <code className="bg-muted px-1 rounded">src/i18n/locales/*.json</code></p>
            <p><strong>Отсутствующие:</strong> Красные поля и бейджи показывают ключи без перевода</p>
            <p><strong>Сброс:</strong> Кнопка сброса вернёт исходные переводы из кодовой базы</p>
            <p className="text-amber-500 pt-2">⚠️ Изменения хранятся в памяти — экспортируйте перед уходом!</p>
          </CardContent>
        </Card>
      </main>
      </div>
    </>
  );
}
