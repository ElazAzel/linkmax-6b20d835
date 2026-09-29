/**
 * /design-system — living catalog of the LinkMAX design system (DESIGN.md).
 * Everything here renders from the real tokens and primitives, so it shows
 * exactly what screens get in the current interface theme.
 */
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Send from 'lucide-react/dist/esm/icons/send';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { AppThemeSwitcher } from '@/components/settings/AppThemeSwitcher';
import { colors, radius } from '@/design-system/tokens';

const kebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const COLOR_ROLES = Object.keys(colors.light).filter((key) => key !== 'chart');

function Section({ id, title, children, note }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid gap-4">
      <div className="grid gap-1">
        <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
        {note ? <p className="text-sm text-muted-foreground max-w-prose">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystem() {
  return (
    <div className="app-canvas min-h-screen">
      <Helmet>
        <title>Дизайн-система — LinkMAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="grid">
            <span className="brand-wordmark text-lg">Link<span className="brand-wordmark-accent">MAX</span></span>
            <span className="text-xs text-muted-foreground">Дизайн-система «Тёплый мастер» · DESIGN.md</span>
          </div>
          <AppThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-4 py-8 sm:px-8">
        <Section id="colors" title="Цвет" note="Семантические токены интерфейса. В коде — только классы вида bg-card, text-muted-foreground, text-success.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_ROLES.map((role) => {
              const name = kebab(role);
              return (
                <div key={role} className="grid gap-2 rounded-card border border-border bg-card p-3">
                  <div
                    className="h-14 rounded-control border border-border"
                    style={{ background: `hsl(var(--${name}))` }}
                  />
                  <div className="grid">
                    <code className="text-xs font-semibold">{name}</code>
                    <code className="font-num text-[11px] text-muted-foreground">{colors.light[role as keyof typeof colors.light] as string}</code>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="type" title="Типографика" note="Onest для интерфейса и заголовков, JetBrains Mono для цифр (font-num).">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:p-6">
              <p className="text-3xl font-semibold tracking-tight">Страница, на которую записываются</p>
              <p className="text-2xl font-semibold">Заголовок экрана · 24 px</p>
              <p className="text-lg font-semibold">Заголовок карточки · 18 px</p>
              <p className="text-base">Текст форм и описаний · 16 px</p>
              <p className="text-sm">Основной текст интерфейса · 14 px</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Лейбл секции · 11 px</p>
              <p className="text-lg">Қызметтер · Жазылу · Әә Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі</p>
              <p className="font-num text-2xl">8 000 ₸ · 11:00 · 4,1% · 1 250 000 ₸</p>
            </CardContent>
          </Card>
        </Section>

        <Section id="shape" title="Радиусы и тени">
          <div className="flex flex-wrap gap-4">
            {Object.entries(radius).map(([name, value]) => (
              <div key={name} className="grid justify-items-center gap-2">
                <div className="h-16 w-24 border border-border bg-card" style={{ borderRadius: value }} />
                <code className="text-xs">rounded-{name}</code>
              </div>
            ))}
            {(['shadow-sm', 'shadow-md', 'shadow-lg'] as const).map((shadow) => (
              <div key={shadow} className="grid justify-items-center gap-2">
                <div className={`h-16 w-24 rounded-card bg-card ${shadow}`} />
                <code className="text-xs">{shadow}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section id="buttons" title="Кнопки" note="Одно главное действие (default) на экран. Размеры: sm, default, lg, icon, icon-sm.">
          <Card>
            <CardContent className="grid gap-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Опубликовать</Button>
                <Button variant="secondary">Предпросмотр</Button>
                <Button variant="outline">Фильтр</Button>
                <Button variant="ghost">Отмена</Button>
                <Button variant="destructive"><Trash2 />Удалить</Button>
                <Button variant="link">Подробнее</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Маленькая</Button>
                <Button>Обычная</Button>
                <Button size="lg">Большая</Button>
                <Button size="icon" aria-label="Добавить"><Plus /></Button>
                <Button size="icon-sm" variant="ghost" aria-label="Отправить"><Send /></Button>
                <Button loading>Сохраняем</Button>
                <Button disabled>Недоступно</Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section id="status" title="Статусы и бейджи">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Новая</Badge>
            <Badge variant="warning">В работе</Badge>
            <Badge variant="success">Записан</Badge>
            <Badge variant="destructive">Отменено</Badge>
            <Badge variant="secondary">Черновик</Badge>
            <Badge variant="outline">Маникюр</Badge>
            <Badge>3</Badge>
          </div>
        </Section>

        <Section id="forms" title="Поля ввода">
          <Card>
            <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div className="grid gap-2">
                <Label htmlFor="ds-service">Название услуги</Label>
                <Input id="ds-service" defaultValue="Маникюр с покрытием" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ds-phone">Телефон</Label>
                <Input id="ds-phone" defaultValue="8 700" aria-invalid="true" className="border-destructive" />
                <p className="text-xs text-destructive">Введите номер в формате +7 7XX XXX XX XX</p>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="ds-note">Описание</Label>
                <Textarea id="ds-note" defaultValue="Снятие, форма, покрытие гель-лаком. 1 ч 30 мин." />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3 sm:col-span-2">
                <Label htmlFor="ds-switch">Уведомления в Telegram</Label>
                <Switch id="ds-switch" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section id="cards" title="Карточки и статистика">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Визиты за 7 дней</span>
                <CardTitle className="font-num text-3xl">412</CardTitle>
                <CardDescription className="text-success">+18% к прошлой неделе (пример)</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="interactive">
              <CardHeader>
                <CardTitle className="text-lg">Интерактивная карточка</CardTitle>
                <CardDescription>Вся карточка — одна цель нажатия.</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="solid">
              <CardHeader>
                <CardTitle className="text-lg">Выделенная</CardTitle>
                <CardDescription>Например, тариф Pro.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Section>

        <Section id="states" title="Состояния: пусто, загрузка, ошибка">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><EmptyState icon={Inbox} title="Заявок пока нет" description="Поделитесь ссылкой на страницу — заявки появятся здесь." action={{ label: 'Скопировать ссылку' }} /></Card>
            <Card>
              <CardContent className="grid gap-3 p-6">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
            <Card><ErrorState title="Не удалось загрузить заявки" description="Проверьте интернет и повторите." retryLabel="Повторить" onRetry={() => undefined} /></Card>
          </div>
        </Section>

        <Section id="toasts" title="Уведомления">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => toast.success('Сохранено')}>Успех</Button>
            <Button variant="outline" onClick={() => toast.error('Не удалось сохранить. Проверьте интернет и повторите.')}>Ошибка</Button>
            <Button variant="outline" onClick={() => toast('Страница опубликована', { description: 'lnkmx.my/aigerim.nails' })}>Информация</Button>
          </div>
        </Section>
      </main>
    </div>
  );
}
