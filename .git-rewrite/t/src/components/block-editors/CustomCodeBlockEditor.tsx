import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Code, Palette, Zap, Eye, EyeOff, Sparkles, Gamepad2, Calculator, Timer, Heart, Briefcase, Users } from 'lucide-react';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateCustomCodeBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { WIDGET_TEMPLATES, WIDGET_CATEGORIES, type WidgetTemplate } from '@/lib/widget-templates';
import { ScrollArea } from '@/components/ui/scroll-area';

const CATEGORY_ICONS = { games: Gamepad2, calculators: Calculator, timers: Timer, engagement: Heart, business: Briefcase, social: Users };

function CustomCodeBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!formData.html);
  const [selectedCategory, setSelectedCategory] = useState<string>('games');

  const applyTemplate = (template: WidgetTemplate) => {
    onChange({ ...formData, html: template.html, css: template.css, javascript: template.javascript, title: i18n.language === 'ru' ? template.nameRu : template.name, enableInteraction: true });
    setShowTemplates(false);
  };

  const filteredTemplates = WIDGET_TEMPLATES.filter(t => t.category === selectedCategory);

  const previewContent = useMemo(() => {
    const html = formData.html || '';
    const css = formData.css || '';
    const js = formData.javascript || '';
    
    let bodyContent = html;
    let headContent = '';
    
    const hasDoctype = html.toLowerCase().includes('<!doctype');
    const hasHtmlTag = html.toLowerCase().includes('<html');
    
    if (hasDoctype || hasHtmlTag) {
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      if (headMatch) headContent = headMatch[1];
      
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) bodyContent = bodyMatch[1];
      
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches && !js) {
        const inlineScripts = scriptMatches
          .map(script => {
            const contentMatch = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            return contentMatch ? contentMatch[1] : '';
          })
          .filter(Boolean);
        
        if (inlineScripts.length > 0) {
          bodyContent += `<script>${inlineScripts.join('\n')}</script>`;
        }
      }
    }
    
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 8px; font-family: system-ui, sans-serif; }
    ${css}
  </style>
  ${headContent}
</head>
<body>
  ${bodyContent}
  ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
  }, [formData.html, formData.css, formData.javascript]);

  const previewSrc = useMemo(() => {
    const blob = new Blob([previewContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [previewContent]);

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label className="font-semibold">Готовые шаблоны</Label>
          </div>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-primary hover:underline"
          >
            {showTemplates ? 'Скрыть' : 'Показать'}
          </button>
        </div>

        {showTemplates && (
          <div className="space-y-3">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(WIDGET_CATEGORIES).map(([key, cat]) => {
                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                      selectedCategory === key 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {i18n.language === 'ru' ? cat.nameRu : cat.name}
                  </button>
                );
              })}
            </div>

            {/* Templates grid */}
            <ScrollArea className="h-48">
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left"
                  >
                    <div className="text-lg mb-1">{template.icon === 'Bomb' ? '💣' : template.icon === 'Cherry' ? '🍒' : template.icon === 'Brain' ? '🧠' : template.icon === 'RotateCw' ? '🎡' : template.icon === 'Receipt' ? '💵' : template.icon === 'Scale' ? '⚖️' : template.icon === 'Percent' ? '🏷️' : template.icon === 'Calendar' ? '🎂' : template.icon === 'Clock' ? '⏰' : template.icon === 'Timer' ? '🍅' : template.icon === 'Watch' ? '⏱️' : template.icon === 'Vote' ? '📊' : template.icon === 'Smile' ? '😊' : template.icon === 'HelpCircle' ? '❓' : template.icon === 'CalendarCheck' ? '📅' : template.icon === 'DollarSign' ? '💰' : template.icon === 'Users' ? '👥' : template.icon === 'MessageCircle' ? '💬' : '🎮'}</div>
                    <div className="font-medium text-sm truncate">
                      {i18n.language === 'ru' ? template.nameRu : template.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {i18n.language === 'ru' ? template.descriptionRu : template.description}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('warnings.customCodeSecurity', 'Warning: Only use trusted code. Custom code runs with full JavaScript capabilities.')}
        </AlertDescription>
      </Alert>

      <MultilingualInput
        label={`${t('fields.title', 'Title')} (${t('fields.optional', 'optional')})`}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder="Custom Widget"
      />

      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="html" className="gap-1">
            <Code className="h-3 w-3" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="gap-1">
            <Palette className="h-3 w-3" />
            CSS
          </TabsTrigger>
          <TabsTrigger value="js" className="gap-1">
            <Zap className="h-3 w-3" />
            JavaScript
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="html" className="mt-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Вставьте HTML код или полную HTML страницу
            </Label>
            <Textarea
              value={formData.html || ''}
              onChange={(e) => onChange({ ...formData, html: e.target.value })}
              placeholder={`<div class="container">
  <h1>Заголовок</h1>
  <p>Контент...</p>
</div>

Или полная страница:
<!DOCTYPE html>
<html>
<head>...</head>
<body>...</body>
</html>`}
              rows={12}
              className="font-mono text-xs"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="css" className="mt-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Дополнительные стили (если нужны)
            </Label>
            <Textarea
              value={formData.css || ''}
              onChange={(e) => onChange({ ...formData, css: e.target.value })}
              placeholder={`.container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
}

h1 {
  color: white;
  font-size: 24px;
}`}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="js" className="mt-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              JavaScript код (выполняется в изолированном iframe)
            </Label>
            <Textarea
              value={formData.javascript || ''}
              onChange={(e) => onChange({ ...formData, javascript: e.target.value })}
              placeholder={`// Ваш JavaScript код
document.querySelector('.button').addEventListener('click', () => {
  alert('Нажата кнопка!');
});

// Или любая интерактивная логика
function startGame() {
  // ...
}`}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t('fields.height', 'Высота блока')}</Label>
          <Select
            value={formData.height || 'medium'}
            onValueChange={(value) => onChange({ ...formData, height: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Авто</SelectItem>
              <SelectItem value="small">Маленькая (200px)</SelectItem>
              <SelectItem value="medium">Средняя (400px)</SelectItem>
              <SelectItem value="large">Большая (600px)</SelectItem>
              <SelectItem value="full">На весь экран</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="text-sm">Интерактивность</Label>
            <p className="text-xs text-muted-foreground">
              Разрешить взаимодействие
            </p>
          </div>
          <Switch
            checked={formData.enableInteraction !== false}
            onCheckedChange={(checked) => onChange({ ...formData, enableInteraction: checked })}
          />
        </div>
      </div>

      {/* Preview Section */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Предпросмотр</Label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3 w-3" />
                Скрыть
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Показать
              </>
            )}
          </button>
        </div>
        
        {showPreview && formData.html && (
          <div className="border rounded-lg overflow-hidden bg-background">
            <iframe
              src={previewSrc}
              title="Preview"
              className="w-full border-0"
              style={{ height: '300px', minHeight: '100px' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        )}
        
        {showPreview && !formData.html && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Добавьте HTML код для предпросмотра
          </div>
        )}
      </Card>

      <Alert>
        <Code className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Совет:</strong> Вы можете вставить полную HTML страницу (включая {`<!DOCTYPE html>`}, {`<head>`} и {`<body>`}). 
          Все скрипты и стили будут автоматически извлечены и выполнены в изолированном iframe.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export const CustomCodeBlockEditor = withBlockEditor(CustomCodeBlockEditorComponent, {
  isPremium: true,
  description: 'Custom code blocks allow you to embed interactive HTML, CSS and JavaScript widgets',
  validate: validateCustomCodeBlock,
});
