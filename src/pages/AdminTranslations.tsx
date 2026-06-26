import { useState, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Shield from 'lucide-react/dist/esm/icons/shield';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { getAppDomain } from '@/lib/utils/url-helpers';
import Search from 'lucide-react/dist/esm/icons/search';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Download from 'lucide-react/dist/esm/icons/download';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Languages from 'lucide-react/dist/esm/icons/languages';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Upload from 'lucide-react/dist/esm/icons/upload';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Globe from 'lucide-react/dist/esm/icons/globe';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import FileJson from 'lucide-react/dist/esm/icons/file-json';
import Check from 'lucide-react/dist/esm/icons/check';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { LanguageUploadDialog } from '@/components/admin/LanguageUploadDialog';
import { useAdminTranslations, setNestedValue } from '@/hooks/admin/useAdminTranslations';
import { handleKeyboardActivation } from '@/lib/utils/a11y';


// DB translations are used primarily via useAdminTranslations hook

type TranslationData = Record<string, unknown>;

// All available languages with metadata
const ALL_LANGUAGES = [
  // Core languages (always visible)
  { code: 'en', name: 'English', flag: '🇬🇧', region: 'core' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', region: 'core' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿', region: 'core' },
  // CIS
  { code: 'uk', name: 'Українська', flag: '🇺🇦', region: 'cis' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾', region: 'cis' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿', region: 'cis' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿', region: 'cis' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬', region: 'cis' },
  { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯', region: 'cis' },
  { code: 'hy', name: 'Հայdelays', flag: '🇦🇲', region: 'cis' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪', region: 'cis' },
  // Europe
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'europe' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'europe' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'europe' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', region: 'europe' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', region: 'europe' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', region: 'europe' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', region: 'europe' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿', region: 'europe' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', region: 'europe' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰', region: 'europe' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮', region: 'europe' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴', region: 'europe' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', region: 'europe' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', region: 'europe' },
  { code: 'bg', name: 'Български', flag: '🇧🇬', region: 'europe' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷', region: 'europe' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸', region: 'europe' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰', region: 'europe' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮', region: 'europe' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪', region: 'europe' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻', region: 'europe' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹', region: 'europe' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺', region: 'europe' },
  // Turkic
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', region: 'turkic' },
  { code: 'tk', name: 'Türkmençe', flag: '🇹🇲', region: 'turkic' },
  // Asia
  { code: 'zh', name: '中文', flag: '🇨🇳', region: 'asia' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', region: 'asia' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', region: 'asia' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', region: 'asia' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', region: 'asia' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', region: 'asia' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', region: 'asia' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', region: 'asia' },
  // Middle East
  { code: 'ar', name: 'العربية', flag: '🇸🇦', region: 'middle_east' },
  { code: 'he', name: 'עברית', flag: '🇮🇱', region: 'middle_east' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', region: 'middle_east' },
];

const REGIONS: Record<string, string> = {
  core: '⭐ Core',
  cis: '🌍 CIS',
  europe: '🇪🇺 Europe',
  turkic: '🌙 Turkic',
  asia: '🌏 Asia',
  middle_east: '🌍 Middle East',
};

const CORE_LANGUAGES = ['en', 'ru', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'];

// Copy structure from source with empty values
function copyStructureEmpty(src: TranslationData): TranslationData {
  const dest: TranslationData = {};
  for (const key of Object.keys(src)) {
    if (typeof src[key] === 'object' && src[key] !== null && !Array.isArray(src[key])) {
      dest[key] = copyStructureEmpty(src[key] as TranslationData);
    } else {
      dest[key] = '';
    }
  }
  return dest;
}

// Group keys by namespace
function groupKeysByNamespace(keys: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const key of keys) {
    const namespace = key.split('.')[0];
    if (!groups[namespace]) {
      groups[namespace] = [];
    }
    groups[namespace].push(key);
  }
  return groups;
}

// Deep merge function
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

export default function AdminTranslations() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canonical = `${getAppDomain()}/admin/translations`;
  const seoTitle = t('adminTranslations.seo.title', 'lnkmx Admin Translations');
  const seoDescription = t('adminTranslations.seo.description', 'Internal translation management for lnkmx.');
  const { isAdmin, loading } = useAdminAuth();

  const {
    translations,
    flattenedTranslations,
    activeLanguages,
    allKeys,
    saving,
    updateTranslation,
    upsertFullTranslations,
    deleteKey,
    addLanguage
  } = useAdminTranslations(isAdmin);

  // UI state
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [filterMode, setFilterMode] = useState<'all' | 'missing'>('all');
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set(['common', 'blocks']));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Dialogs
  const [addLanguageOpen, setAddLanguageOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValues, setNewKeyValues] = useState<Record<string, string>>({});
  const [languageSearch, setLanguageSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter keys
  const filteredKeys = useMemo(() => {
    return allKeys.all.filter(key => {
      if (deferredSearch) {
        const query = deferredSearch.toLowerCase();
        const matchesKey = key.toLowerCase().includes(query);
        const matchesValue = activeLanguages.some(lang =>
          (flattenedTranslations[lang]?.[key] || '').toLowerCase().includes(query)
        );
        if (!matchesKey && !matchesValue) return false;
      }

      if (filterMode === 'missing') {
        const hasMissing = activeLanguages.some(l => !flattenedTranslations[l]?.[key]?.trim());
        if (!hasMissing) return false;
      }

      return true;
    });
  }, [allKeys.all, deferredSearch, filterMode, flattenedTranslations, activeLanguages]);

  // Group filtered keys by namespace
  const groupedKeys = useMemo(() => groupKeysByNamespace(filteredKeys), [filteredKeys]);

  // Stats
  const stats = useMemo(() => {
    const result: Record<string, number> = {};
    for (const lang of activeLanguages) {
      let missing = 0;
      for (const key of allKeys.all) {
        if (!flattenedTranslations[lang]?.[key]?.trim()) missing++;
      }
      result[lang] = missing;
    }
    return result;
  }, [flattenedTranslations, activeLanguages, allKeys.all]);

  // Save inline edit
  const handleSaveEdit = async () => {
    if (editingKey) {
      setSavingKey(editingKey);
      await updateTranslation({ lang: selectedLang, key: editingKey, value: editValue });
      setSavingKey(null);
      setEditingKey(null);
      setEditValue('');
    }
  };

  // Add new language
  const handleAddLanguage = async (langCode: string) => {
    if (!activeLanguages.includes(langCode)) {
      const emptyLang = copyStructureEmpty(translations['en'] || {});
      await addLanguage(langCode, emptyLang);
    }
    setAddLanguageOpen(false);
    setLanguageSearch('');
  };

  // Remove language
  const handleRemoveLanguage = (langCode: string) => {
    if (CORE_LANGUAGES.includes(langCode)) {
      toast.error('Основные языки нельзя удалить');
      return;
    }
    toast.info('Функционал удаления языка из БД в разработке. Язык останется в списке.');
  };

  // Add new key
  const handleAddKey = async () => {
    const trimmedKey = newKeyName.trim();
    if (!trimmedKey) {
      toast.error('Введите ключ');
      return;
    }
    if (allKeys.all.includes(trimmedKey)) {
      toast.error('Такой ключ уже существует');
      return;
    }

    const payload = activeLanguages.map(lang => {
      const updated = JSON.parse(JSON.stringify(translations[lang] || {}));
      setNestedValue(updated, trimmedKey, newKeyValues[lang]?.trim() || '');
      return { lang, data: updated };
    });

    await upsertFullTranslations(payload);

    setNewKeyName('');
    setNewKeyValues({});
    setAddKeyOpen(false);
  };

  // Delete key
  const handleDeleteKey = (key: string) => {
    setDeleteConfirmKey(key);
  };

  const confirmDeleteKey = () => {
    if (deleteConfirmKey) {
      deleteKey(deleteConfirmKey);
      setDeleteConfirmKey(null);
    }
  };

  // Export
  const downloadJSON = (lang: string) => {
    const json = JSON.stringify(translations[lang] || {}, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lang}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Файл ${lang}.json скачан`);
  };

  const downloadAllJSON = () => {
    for (const lang of activeLanguages) {
      downloadJSON(lang);
    }
  };

  const copyToClipboard = async (lang: string) => {
    try {
      const json = JSON.stringify(translations[lang] || {}, null, 2);
      await navigator.clipboard.writeText(json);
      toast.success(`JSON для ${lang.toUpperCase()} скопирован`);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  // Import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text) as TranslationData;
      const mergedData = mergeDeep(translations[selectedLang] || {}, importedData);

      await upsertFullTranslations([{ lang: selectedLang, data: mergedData }]);
    } catch (error) {
      toast.error('Failed to import translations');
      logger.error('Import error:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reset
  const resetToOriginal = () => {
    toast.info('Сброс к локальным файлам не рекомендуется при использовании БД-бэкэнда.');
  };

  const syncAllToDB = async () => {
    if (!confirm('Отправить все текущие переводы в базу данных? Существующие в БД данные будут перезаписаны.')) return;

    const payload = activeLanguages.map(lang => ({
      lang,
      data: translations[lang]
    }));
    await upsertFullTranslations(payload);
  };

  // Toggle namespace
  const toggleNamespace = (ns: string) => {
    const newExpanded = new Set(expandedNamespaces);
    if (newExpanded.has(ns)) {
      newExpanded.delete(ns);
    } else {
      newExpanded.add(ns);
    }
    setExpandedNamespaces(newExpanded);
  };

  // Available languages to add
  const availableToAdd = useMemo(() => {
    const filtered = ALL_LANGUAGES.filter(l => !activeLanguages.includes(l.code));
    if (!languageSearch.trim()) return filtered;
    const query = languageSearch.toLowerCase();
    return filtered.filter(l =>
      l.name.toLowerCase().includes(query) ||
      l.code.toLowerCase().includes(query)
    );
  }, [activeLanguages, languageSearch]);

  // Get language info
  const getLangInfo = (code: string) => {
    return ALL_LANGUAGES.find(l => l.code === code) || { code, name: code.toUpperCase(), flag: '🏳️', region: 'other' };
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncAllToDB}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                Синхронизировать с БД
              </Button>
              <Button variant="outline" size="sm" onClick={resetToOriginal} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Сброс
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Active Languages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Активные языки ({activeLanguages.length})
              </CardTitle>
              <CardDescription>Нажмите на язык для редактирования</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeLanguages.map((langCode) => {
                  const lang = getLangInfo(langCode);
                  const missing = stats[langCode] || 0;
                  const isSelected = selectedLang === langCode;
                  const isCore = CORE_LANGUAGES.includes(langCode);

                  return (
                    <div
                      key={langCode}
                      className={`
                        relative group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                        ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-border hover:border-primary/50'}
                      `}
                      onClick={() => setSelectedLang(langCode)}
                      onKeyDown={(event) => handleKeyboardActivation(event, () => setSelectedLang(langCode))}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div>
                        <div className="font-medium text-sm">{lang.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {missing > 0 ? (
                            <span className="text-destructive">{missing} отсутствует</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">✓ Полный</span>
                          )}
                        </div>
                      </div>
                      {!isCore && (
                        <button
                          className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLanguage(langCode);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Language Button */}
                <Dialog open={addLanguageOpen} onOpenChange={setAddLanguageOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto py-2 px-3">
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить язык
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Добавить язык</DialogTitle>
                      <DialogDescription>
                        Выберите язык из списка для добавления в проект
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={languageSearch}
                          onChange={(e) => setLanguageSearch(e.target.value)}
                          placeholder="Поиск языка..."
                          className="pl-10"
                        />
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {Object.entries(REGIONS).map(([regionKey, regionName]) => {
                            const regionLangs = availableToAdd.filter(l => l.region === regionKey);
                            if (regionLangs.length === 0) return null;

                            return (
                              <div key={regionKey}>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">{regionName}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {regionLangs.map((lang) => (
                                    <Button
                                      key={lang.code}
                                      variant="outline"
                                      className="justify-start h-auto py-2"
                                      onClick={() => handleAddLanguage(lang.code)}
                                    >
                                      <span className="mr-2">{lang.flag}</span>
                                      <span className="truncate">{lang.name}</span>
                                      <span className="ml-auto text-xs text-muted-foreground">{lang.code}</span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {availableToAdd.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              {languageSearch ? 'Языки не найдены' : 'Все языки добавлены'}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{allKeys.all.length}</div>
                <p className="text-sm text-muted-foreground">Всего ключей</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{activeLanguages.length}</div>
                <p className="text-sm text-muted-foreground">Языков</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{Object.keys(groupedKeys).length}</div>
                <p className="text-sm text-muted-foreground">Неймспейсов</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {activeLanguages.filter(l => (stats[l] || 0) === 0).length}
                </div>
                <p className="text-sm text-muted-foreground">Полных языков</p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по ключу или значению..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
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
                    Отсутствующие
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить ключ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Добавить новый ключ</DialogTitle>
                  <DialogDescription>
                    Создайте новый ключ перевода и задайте значения для основных языков
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Ключ (dot notation)</Label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., common.newButton"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Переводы</Label>
                    {activeLanguages.slice(0, 5).map(lang => {
                      const info = getLangInfo(lang);
                      return (
                        <div key={lang} className="flex items-center gap-2">
                          <span className="w-8 text-center">{info.flag}</span>
                          <Input
                            value={newKeyValues[lang] || ''}
                            onChange={(e) => setNewKeyValues(prev => ({ ...prev, [lang]: e.target.value }))}
                            placeholder={`${info.name}...`}
                          />
                        </div>
                      );
                    })}
                    {activeLanguages.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        + ещё {activeLanguages.length - 5} языков (добавятся пустыми)
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddKeyOpen(false)}>Отмена</Button>
                  <Button onClick={handleAddKey}>Добавить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-1" />
              Импорт JSON ({selectedLang})
            </Button>
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1" />
              Загрузить язык из файла
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedLang)}>
              <Copy className="h-4 w-4 mr-1" />
              Копировать ({selectedLang})
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadJSON(selectedLang)}>
              <FileJson className="h-4 w-4 mr-1" />
              Скачать ({selectedLang})
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAllJSON}>
              <Download className="h-4 w-4 mr-1" />
              Скачать все
            </Button>
          </div>

          {/* Editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getLangInfo(selectedLang).flag} Редактирование: {getLangInfo(selectedLang).name}
                </CardTitle>
                <Badge variant="outline">{filteredKeys.length} ключей</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {Object.entries(groupedKeys).sort().map(([namespace, keys]) => (
                    <Collapsible
                      key={namespace}
                      open={expandedNamespaces.has(namespace)}
                      onOpenChange={() => toggleNamespace(namespace)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50">
                        {expandedNamespaces.has(namespace) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{namespace}</span>
                        <Badge variant="secondary" className="ml-auto">{keys.length}</Badge>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pl-6 space-y-1 mt-1">
                        {keys.sort().map((key) => {
                          const shortKey = key.substring(namespace.length + 1);
                          const flat = flattenedTranslations[selectedLang] || {};
                          const value = flat[key] || '';
                          const enVal = (flattenedTranslations['en'] || {})[key] || '';
                          const isEmpty = !value.trim();
                          const isSavingThis = savingKey === key;

                          return (
                            <div
                              key={key}
                              className={`
                                group flex items-start gap-3 p-2 rounded-lg border
                                ${isEmpty ? 'border-destructive/30 bg-destructive/5' : 'border-transparent hover:bg-muted/30'}
                                ${editingKey === key ? 'ring-2 ring-primary' : ''}
                              `}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-xs text-muted-foreground font-mono truncate">{shortKey}</code>
                                  {isSavingThis ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : isEmpty ? (
                                    <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  )}
                                </div>

                                {editingKey === key ? (
                                  <div className="space-y-2">
                                    {selectedLang !== 'en' && enVal && (
                                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                        <span className="font-medium">🇬🇧 EN:</span> {enVal}
                                      </div>
                                    )}
                                    <Textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="min-h-[60px] text-sm"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={handleSaveEdit} disabled={isSavingThis}>
                                        {isSavingThis ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                        {isSavingThis ? 'Сохранение...' : 'Сохранить'}
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingKey(null)} disabled={isSavingThis}>
                                        Отмена
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="text-sm cursor-pointer min-h-[24px]"
                                    onClick={() => {
                                      setEditingKey(key);
                                      setEditValue(value);
                                    }}
                                    onKeyDown={(event) => handleKeyboardActivation(event, () => {
                                      setEditingKey(key);
                                      setEditValue(value);
                                    })}
                                    role="button"
                                    tabIndex={0}
                                  >
                                    {value || <span className="text-muted-foreground italic">Нажмите чтобы добавить...</span>}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {enVal && selectedLang !== 'en' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    title="Скопировать с EN"
                                    onClick={() => {
                                      updateTranslation({ lang: selectedLang, key, value: enVal });
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-destructive"
                                  title="Удалить ключ"
                                  onClick={() => handleDeleteKey(key)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
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

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Инструкция</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>1. Добавьте языки:</strong> Кнопка "Добавить язык" → выберите из списка</p>
              <p><strong>2. Выберите язык:</strong> Кликните на карточку языка для редактирования</p>
              <p><strong>3. Редактируйте:</strong> Кликните на любой перевод для изменения. Он сохранится в БД автоматически.</p>
              <p><strong>4. Синхронизация:</strong> Если в БД нет данных, используйте кнопку "Синхронизировать с БД" для загрузки локальных файлов в базу.</p>
              <p className="text-green-600 dark:text-green-400 pt-2 font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Изменения сохраняются в реальном времени в базу данных Supabase.
              </p>
            </CardContent>
          </Card>
        </main>

        {/* Delete key confirmation */}
        <AlertDialog open={deleteConfirmKey !== null} onOpenChange={() => setDeleteConfirmKey(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить ключ?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить ключ "<strong>{deleteConfirmKey}</strong>" изо всех языков? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteKey}>Удалить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Upload Dialog */}
        <LanguageUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={() => {
            // Можно добавить логику для обновления переводов
            toast.success('Язык успешно загружен и применён');
          }}
        />
      </div>
    </>
  );
}
