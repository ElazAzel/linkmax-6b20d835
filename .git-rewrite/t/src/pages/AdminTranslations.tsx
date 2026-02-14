import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, ArrowLeft, Search, Copy, Download, AlertTriangle,
  CheckCircle, Languages, Loader2, Upload, RefreshCw, Plus,
  Globe, ChevronDown, ChevronRight, Trash2, FileJson, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { LanguageUploadDialog } from '@/components/admin/LanguageUploadDialog';

import ru from '@/i18n/locales/ru.json';
import en from '@/i18n/locales/en.json';
import kk from '@/i18n/locales/kk.json';
import de from '@/i18n/locales/de.json';
import uk from '@/i18n/locales/uk.json';
import uz from '@/i18n/locales/uz.json';
import be from '@/i18n/locales/be.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';
import it from '@/i18n/locales/it.json';
import pt from '@/i18n/locales/pt.json';
import zh from '@/i18n/locales/zh.json';
import tr from '@/i18n/locales/tr.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
import ar from '@/i18n/locales/ar.json';

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
  const canonical = 'https://lnkmx.my/admin/translations';
  const seoTitle = t('adminTranslations.seo.title', 'lnkmx Admin Translations');
  const seoDescription = t('adminTranslations.seo.description', 'Internal translation management for lnkmx.');
  const { isAdmin, loading } = useAdminAuth();

  // State: translations data for all active languages
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({
    ru: JSON.parse(JSON.stringify(ru)),
    en: JSON.parse(JSON.stringify(en)),
    kk: JSON.parse(JSON.stringify(kk)),
    de: JSON.parse(JSON.stringify(de)),
    uk: JSON.parse(JSON.stringify(uk)),
    uz: JSON.parse(JSON.stringify(uz)),
    be: JSON.parse(JSON.stringify(be)),
    es: JSON.parse(JSON.stringify(es)),
    fr: JSON.parse(JSON.stringify(fr)),
    it: JSON.parse(JSON.stringify(it)),
    pt: JSON.parse(JSON.stringify(pt)),
    zh: JSON.parse(JSON.stringify(zh)),
    tr: JSON.parse(JSON.stringify(tr)),
    ja: JSON.parse(JSON.stringify(ja)),
    ko: JSON.parse(JSON.stringify(ko)),
    ar: JSON.parse(JSON.stringify(ar)),
  });

  // State: active languages (can add more)
  const [activeLanguages, setActiveLanguages] = useState<string[]>(['en', 'ru', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar']);
  const [selectedLang, setSelectedLang] = useState<string>('en');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing'>('all');
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set(['common', 'blocks']));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Dialogs
  const [addLanguageOpen, setAddLanguageOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValues, setNewKeyValues] = useState<Record<string, string>>({});
  const [languageSearch, setLanguageSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [loading, isAdmin, navigate]);

  // Get all unique keys from all active translations
  const allKeys = useMemo(() => {
    const keySet = new Set<string>();
    for (const lang of activeLanguages) {
      if (translations[lang]) {
        Object.keys(flattenObject(translations[lang])).forEach(k => keySet.add(k));
      }
    }
    return Array.from(keySet).sort();
  }, [translations, activeLanguages]);

  // Filter keys
  const filteredKeys = useMemo(() => {
    return allKeys.filter(key => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesKey = key.toLowerCase().includes(query);
        const matchesValue = activeLanguages.some(lang => {
          const flat = flattenObject(translations[lang] || {});
          return flat[key]?.toLowerCase().includes(query);
        });
        if (!matchesKey && !matchesValue) return false;
      }

      // Missing filter
      if (filterMode === 'missing') {
        const hasMissing = activeLanguages.some(lang => {
          const flat = flattenObject(translations[lang] || {});
          return !flat[key]?.trim();
        });
        if (!hasMissing) return false;
      }

      return true;
    });
  }, [allKeys, searchQuery, filterMode, translations, activeLanguages]);

  // Group filtered keys by namespace
  const groupedKeys = useMemo(() => groupKeysByNamespace(filteredKeys), [filteredKeys]);

  // Stats
  const stats = useMemo(() => {
    const result: Record<string, number> = {};
    for (const lang of activeLanguages) {
      const flat = flattenObject(translations[lang] || {});
      let missing = 0;
      for (const key of allKeys) {
        if (!flat[key]?.trim()) missing++;
      }
      result[lang] = missing;
    }
    return result;
  }, [translations, activeLanguages, allKeys]);

  // Get value for a key in a language
  const getValue = (lang: string, key: string): string => {
    const flat = flattenObject(translations[lang] || {});
    return flat[key] || '';
  };

  // Update value
  const handleValueChange = (lang: string, key: string, value: string) => {
    setTranslations(prev => {
      const updated = { ...prev };
      updated[lang] = JSON.parse(JSON.stringify(prev[lang] || {}));
      setNestedValue(updated[lang], key, value);
      return updated;
    });
  };

  // Save inline edit
  const handleSaveEdit = () => {
    if (editingKey) {
      handleValueChange(selectedLang, editingKey, editValue);
      setEditingKey(null);
      setEditValue('');
      toast.success('Перевод сохранён');
    }
  };

  // Add new language
  const handleAddLanguage = (langCode: string) => {
    if (!activeLanguages.includes(langCode)) {
      setActiveLanguages([...activeLanguages, langCode]);
      // Initialize with empty structure from English
      if (!translations[langCode]) {
        const emptyLang = copyStructureEmpty(translations['en'] || {});
        setTranslations({ ...translations, [langCode]: emptyLang });
      }
      toast.success(`Добавлен язык: ${langCode.toUpperCase()}`);
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
    setActiveLanguages(activeLanguages.filter(l => l !== langCode));
    if (selectedLang === langCode) {
      setSelectedLang('en');
    }
    toast.success(`Язык ${langCode.toUpperCase()} удалён`);
  };

  // Add new key
  const handleAddKey = () => {
    const trimmedKey = newKeyName.trim();
    if (!trimmedKey) {
      toast.error('Введите ключ');
      return;
    }
    if (allKeys.includes(trimmedKey)) {
      toast.error('Такой ключ уже существует');
      return;
    }

    setTranslations(prev => {
      const updated = { ...prev };
      for (const lang of activeLanguages) {
        updated[lang] = JSON.parse(JSON.stringify(prev[lang] || {}));
        setNestedValue(updated[lang], trimmedKey, newKeyValues[lang]?.trim() || '');
      }
      return updated;
    });

    setNewKeyName('');
    setNewKeyValues({});
    setAddKeyOpen(false);
    toast.success('Ключ добавлен');
  };

  // Delete key
  const handleDeleteKey = (key: string) => {
    const parts = key.split('.');
    const updated = { ...translations };

    for (const lang of activeLanguages) {
      const langObj = JSON.parse(JSON.stringify(updated[lang] || {}));
      let current: TranslationData = langObj;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) break;
        current = current[parts[i]] as TranslationData;
      }

      delete current[parts[parts.length - 1]];
      updated[lang] = langObj;
    }

    setTranslations(updated);
    toast.success('Ключ удалён');
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

      setTranslations(prev => {
        const updated = { ...prev };
        updated[selectedLang] = mergeDeep(prev[selectedLang] || {}, importedData);
        return updated;
      });

      toast.success(`JSON для ${selectedLang.toUpperCase()} импортирован`);
    } catch (error) {
      toast.error('Failed to import translations');
      logger.error('Import error:', error, { context: 'AdminTranslations' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reset
  const resetToOriginal = () => {
    setTranslations({
      ru: JSON.parse(JSON.stringify(ru)),
      en: JSON.parse(JSON.stringify(en)),
      kk: JSON.parse(JSON.stringify(kk)),
    });
    setActiveLanguages(['en', 'ru', 'kk']);
    setSelectedLang('en');
    toast.success('Переводы сброшены');
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
              <Button variant="outline" size="sm" onClick={resetToOriginal}>
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
                <div className="text-2xl font-bold">{allKeys.length}</div>
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
                          const value = getValue(selectedLang, key);
                          const enValue = getValue('en', key);
                          const isEmpty = !value.trim();

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
                                  {isEmpty ? (
                                    <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  )}
                                </div>

                                {editingKey === key ? (
                                  <div className="space-y-2">
                                    {selectedLang !== 'en' && enValue && (
                                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                        <span className="font-medium">🇬🇧 EN:</span> {enValue}
                                      </div>
                                    )}
                                    <Textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="min-h-[60px] text-sm"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={handleSaveEdit}>
                                        <Check className="h-3 w-3 mr-1" />
                                        Сохранить
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
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
                                  >
                                    {value || <span className="text-muted-foreground italic">Нажмите чтобы добавить...</span>}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {enValue && selectedLang !== 'en' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    title="Скопировать с EN"
                                    onClick={() => {
                                      handleValueChange(selectedLang, key, enValue);
                                      toast.success('Скопировано с EN');
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
              <p><strong>3. Редактируйте:</strong> Кликните на любой перевод для изменения</p>
              <p><strong>4. Экспортируйте:</strong> Скачайте JSON и замените в <code className="bg-muted px-1 rounded">src/i18n/locales/</code></p>
              <p className="text-amber-600 dark:text-amber-400 pt-2">
                ⚠️ Изменения хранятся в памяти браузера — не забудьте экспортировать!
              </p>
            </CardContent>
          </Card>
        </main>

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
