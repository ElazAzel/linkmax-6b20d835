import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, MapPin, Mail, Ticket, CheckCircle2, ArrowRight, UserPlus, Users, AlertCircle, CalendarPlus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ru, kk } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/platform/supabase/client';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { getEventRegistrationCount, isEmailRegistered } from '@/services/events';
import { downloadICS, getGoogleCalendarUrl, type CalendarEvent } from '@/lib/calendar-utils';
import { EventFormRenderer } from '@/components/event-forms/EventFormRenderer';
import type { EventBlock as EventBlockType, EventFormField } from '@/types/page';

interface EventBlockProps {
  block: EventBlockType;
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
}

const SYSTEM_EMAIL_FIELD_ID = 'system_email';
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

type FormValue = string | string[] | boolean | number;

export const EventBlock = memo(function EventBlock({
  block,
  pageOwnerId,
  pageId,
  isOwnerPremium,
}: EventBlockProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, FormValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [eventError, setEventError] = useState<string | null>(null);

  const language = i18n.language as SupportedLanguage;
  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : undefined;
  const title = getI18nText(block.title, language);
  const description = getI18nText(block.description, language);

  // Check capacity
  const isFull = useMemo(() => {
    if (!block.capacity) return false;
    return registrationCount >= block.capacity;
  }, [block.capacity, registrationCount]);

  const registrationClosed = useMemo(() => {
    if (block.status && block.status !== 'published') return true;
    if (isFull) return true;
    if (!block.registrationClosesAt) return false;
    return new Date(block.registrationClosesAt) <= new Date();
  }, [block.registrationClosesAt, block.status, isFull]);

  const eventFields = useMemo(() => {
    const fields = block.formFields || [];
    return fields.filter((field) => field.type !== 'email');
  }, [block.formFields]);

  const emailLabel = t('event.emailLabel', 'Email');
  const emailPlaceholder = t('event.emailPlaceholder', 'your@email.com');
  const emailHelp = t('event.emailHelp', 'Билет и подтверждение придут на эту почту.');

  // Load registration count
  useEffect(() => {
    if (block.eventId) {
      getEventRegistrationCount(block.eventId).then(setRegistrationCount);
    }
  }, [block.eventId]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setShowPrompt(!user);
    setEventError(null);
  }, [user]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTicketCode(null);
    setEventError(null);
  }, []);

  const draftKey = `draft_event_${block.eventId}`;

  useEffect(() => {
    if (!isOpen) return;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { updatedAt: number; data: Record<string, FormValue> };
      if (Date.now() - parsed.updatedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(draftKey);
        return;
      }
      setFormValues(parsed.data || {});
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, isOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('event') === block.eventId) {
      setIsOpen(true);
      setShowPrompt(!user);
    }
  }, [block.eventId, user]);

  const saveDraft = useCallback(() => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({ updatedAt: Date.now(), data: formValues })
    );
  }, [draftKey, formValues]);

  const handlePromptSignup = () => {
    saveDraft();
    const returnTo = `${window.location.pathname}?event=${block.eventId}`;
    window.location.href = `/auth?mode=signup&returnTo=${encodeURIComponent(returnTo)}`;
  };

  const updateValue = (fieldId: string, value: FormValue) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isFieldRequired = (field: EventFormField) => field.required || field.type === 'email';

  const validateForm = () => {
    const requiredFields = [
      { id: SYSTEM_EMAIL_FIELD_ID, label: emailLabel },
      ...eventFields
        .filter((field) => isFieldRequired(field))
        .map((field) => ({
          id: field.id,
          label: getI18nText(field.label_i18n, language) || t('event.field', 'Поле'),
        })),
    ];

    for (const field of requiredFields) {
      const value = formValues[field.id];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        value === false;

      if (isEmpty) {
        toast.error(
          t('event.fillRequired', 'Заполните обязательные поля') + `: ${field.label}`
        );
        return false;
      }
    }

    const urlFields = eventFields.filter((field) => field.type === 'url');
    for (const field of urlFields) {
      const value = formValues[field.id];
      if (typeof value === 'string' && value.length > 0 && !value.startsWith('https://')) {
        toast.error(t('event.urlInvalid', 'URL должен начинаться с https://'));
        return false;
      }
    }

    return true;
  };

  const resolveAttendeeName = () => {
    const candidate = eventFields.find((field) =>
      ['short_text', 'long_text'].includes(field.type)
    );
    if (candidate) {
      const value = formValues[candidate.id];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    const email = formValues[SYSTEM_EMAIL_FIELD_ID];
    if (typeof email === 'string') return email.split('@')[0] || 'Guest';
    return 'Guest';
  };

  const resolveAttendeePhone = () => {
    const candidate = eventFields.find((field) => field.type === 'phone');
    if (candidate) {
      const value = formValues[candidate.id];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError(null);
    
    if (registrationClosed) {
      toast.error(t('event.registrationClosed', 'Регистрация закрыта'));
      return;
    }
    if (!pageOwnerId || !pageId) {
      setEventError(t('event.configError', 'Ошибка конфигурации события'));
      return;
    }
    if (!block.eventId) {
      setEventError(t('event.eventNotFound', 'Событие не найдено'));
      return;
    }
    if (!validateForm()) return;

    const email = formValues[SYSTEM_EMAIL_FIELD_ID];
    if (typeof email !== 'string' || !email.trim()) {
      toast.error(t('event.emailRequired', 'Email обязателен'));
      return;
    }

    // Check for duplicate email if not allowed
    if (!block.settings?.allowDuplicateEmail) {
      const isDuplicate = await isEmailRegistered(block.eventId, email.trim());
      if (isDuplicate) {
        setEventError(t('event.duplicateRegistration', 'Вы уже зарегистрированы на этот ивент.'));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();

      const answers = {
        [SYSTEM_EMAIL_FIELD_ID]: email.trim(),
        ...eventFields.reduce<Record<string, FormValue>>((acc, field) => {
          acc[field.id] = formValues[field.id];
          return acc;
        }, {}),
      };

      // Capture UTM params for attribution
      const utmParams: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
        const value = new URLSearchParams(window.location.search).get(key);
        if (value) utmParams[key] = value;
      });

      const { data: registration, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: block.eventId,
          block_id: block.id,
          page_id: pageId,
          owner_id: pageOwnerId,
          user_id: session?.session?.user?.id || null,
          attendee_name: resolveAttendeeName(),
          attendee_email: email.trim(),
          attendee_phone: resolveAttendeePhone(),
          answers_json: answers,
          status: block.settings?.requireApproval ? 'pending' : 'confirmed',
          payment_status: 'none',
          utm_json: Object.keys(utmParams).length > 0 ? utmParams : {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') {
          setEventError(t('event.duplicateRegistration', 'Вы уже зарегистрированы на этот ивент.'));
        } else if (error.code === '23503') {
          setEventError(t('event.eventNotFound', 'Событие не найдено. Попробуйте обновить страницу.'));
        } else {
          setEventError(t('event.registrationError', 'Не удалось зарегистрироваться') + `: ${error.message}`);
        }
        return;
      }

      // Wait a moment for the trigger to create the ticket
      await new Promise(r => setTimeout(r, 500));

      const { data: ticket } = await supabase
        .from('event_tickets')
        .select('ticket_code')
        .eq('registration_id', registration.id)
        .maybeSingle();

      setTicketCode(ticket?.ticket_code || null);
      setRegistrationCount(prev => prev + 1);
      toast.success(
        block.settings?.requireApproval
          ? t('event.registrationPending', 'Заявка отправлена на рассмотрение')
          : t('event.registrationSuccess', 'Регистрация подтверждена')
      );
      localStorage.removeItem(draftKey);

      // Send notification to organizer (Pro feature, non-blocking)
      if (isOwnerPremium && registration?.id && block.eventId && pageOwnerId) {
        supabase.functions.invoke('send-event-confirmation', {
          body: {
            registrationId: registration.id,
            eventId: block.eventId,
            ownerId: pageOwnerId,
          },
        }).catch(err => console.warn('Notification send failed:', err));
      }

      // Send confirmation email to attendee
      if (registration?.id && block.eventId) {
        supabase.functions.invoke('send-attendee-email', {
          body: {
            registrationId: registration.id,
            eventId: block.eventId,
            language: i18n.language,
          },
        }).catch(err => console.warn('Attendee email send failed:', err));
      }
    } catch (error: unknown) {
      console.error('Event registration error:', error);
      setEventError(t('event.registrationError', 'Не удалось зарегистрироваться'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: EventFormField) => {
    return (
      <EventFormRenderer
        key={field.id}
        field={field}
        value={formValues[field.id] ?? ''}
        onChange={(val) => updateValue(field.id, val)}
        language={language}
        disabled={isSubmitting}
        isPremium={isOwnerPremium}
        eventId={block.eventId}
      />
    );
  };

  // Calculate form progress
  const formProgress = useMemo(() => {
    if (!block.settings?.showProgressBar) return 0;
    const requiredFields = eventFields.filter(f => f.required || f.type === 'email');
    const totalRequired = requiredFields.length + 1; // +1 for system email
    let filledCount = 0;
    
    const emailVal = formValues[SYSTEM_EMAIL_FIELD_ID];
    if (emailVal && typeof emailVal === 'string' && emailVal.trim()) filledCount++;
    
    for (const field of requiredFields) {
      const val = formValues[field.id];
      if (val !== undefined && val !== '' && val !== false && !(Array.isArray(val) && val.length === 0)) {
        filledCount++;
      }
    }
    
    return Math.round((filledCount / totalRequired) * 100);
  }, [formValues, eventFields, block.settings?.showProgressBar]);

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
        {block.coverUrl ? (
          <img src={block.coverUrl} alt={title} className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-primary/15 via-background to-muted" />
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {block.isPaid && isOwnerPremium && block.price
                ? `${block.price} ${getCurrencySymbol(block.currency || 'KZT')}`
                : t('event.free', 'Free')}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            {block.startAt && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {format(new Date(block.startAt), 'dd MMMM yyyy, HH:mm', { locale })}
                </span>
              </div>
            )}
            {block.locationValue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{block.locationValue}</span>
              </div>
            )}
            {block.capacity && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {registrationCount} / {block.capacity} {t('event.spots', 'мест')}
                  {isFull && <span className="ml-1 text-destructive">({t('event.full', 'мест нет')})</span>}
                </span>
              </div>
            )}
          </div>

          <Button 
            className="w-full rounded-xl" 
            onClick={handleOpen}
            disabled={registrationClosed}
            variant={registrationClosed ? 'secondary' : 'default'}
          >
            {isFull 
              ? t('event.noSpots', 'Мест нет')
              : registrationClosed 
                ? t('event.registrationClosed', 'Регистрация закрыта')
                : (block.buttonText && getI18nText(block.buttonText, language)) || t('event.register', 'Зарегистрироваться')
            }
          </Button>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            {ticketCode ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">
                    {t('event.successTitle', 'Регистрация подтверждена')}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ticket className="h-4 w-4" />
                    <span>{t('event.ticketCode', 'Код билета')}</span>
                  </div>
                  <div className="text-xl font-semibold">{ticketCode}</div>
                </div>
                
                {/* Add to Calendar */}
                {block.startAt && (
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CalendarPlus className="h-4 w-4" />
                      {t('event.addToCalendar', 'Добавить в календарь')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            {t('event.calendar', 'Календарь')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              const calendarEvent: CalendarEvent = {
                                title,
                                description: description || undefined,
                                location: block.locationValue || undefined,
                                startAt: block.startAt!,
                                endAt: block.endAt || undefined,
                                timezone: block.timezone || undefined,
                              };
                              window.open(getGoogleCalendarUrl(calendarEvent), '_blank');
                            }}
                          >
                            Google Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const calendarEvent: CalendarEvent = {
                                title,
                                description: description || undefined,
                                location: block.locationValue || undefined,
                                startAt: block.startAt!,
                                endAt: block.endAt || undefined,
                                timezone: block.timezone || undefined,
                              };
                              downloadICS(calendarEvent, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('event.downloadICS', 'Скачать .ics')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <p className="text-sm">
                      {t(
                        'event.postGuestCta',
                        'Создать аккаунт и добавить билеты в профиль'
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handlePromptSignup}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('event.createAccount', 'Создать аккаунт')}
                      </Button>
                      <Button variant="outline" onClick={handleClose}>
                        {t('event.later', 'Позже')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 py-2">
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}

                {!user && showPrompt && (
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <h4 className="font-semibold">
                      {t('event.promptTitle', 'Хотите хранить билеты в одном месте?')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'event.promptText',
                        'Зарегистрируйтесь, чтобы видеть все билеты в профиле и создать свой личный сайт за пару кликов.'
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handlePromptSignup}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {t('event.promptSignup', 'Зарегистрироваться')}
                      </Button>
                      <Button variant="outline" onClick={() => setShowPrompt(false)}>
                        {t('event.promptContinue', 'Продолжить без регистрации')}
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Progress bar */}
                  {block.settings?.showProgressBar && eventFields.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t('event.formProgress', 'Заполнено')}</span>
                        <span>{formProgress}%</span>
                      </div>
                      <Progress value={formProgress} className="h-1.5" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={SYSTEM_EMAIL_FIELD_ID}>
                      {emailLabel} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={SYSTEM_EMAIL_FIELD_ID}
                      type="email"
                      value={typeof formValues[SYSTEM_EMAIL_FIELD_ID] === 'string' ? formValues[SYSTEM_EMAIL_FIELD_ID] : ''}
                      onChange={(e) => updateValue(SYSTEM_EMAIL_FIELD_ID, e.target.value)}
                      placeholder={emailPlaceholder}
                      required
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {emailHelp}
                    </p>
                  </div>

                  {eventFields.map((field) => (
                    <div key={field.id}>
                      {renderField(field)}
                    </div>
                  ))}

                  {eventError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{eventError}</AlertDescription>
                    </Alert>
                  )}

                  {registrationClosed && !eventError && (
                    <Alert>
                      <AlertDescription>
                        {isFull 
                          ? t('event.noSpotsMessage', 'К сожалению, все места заняты.')
                          : t('event.registrationClosedMessage', 'Регистрация на это событие закрыта.')
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={isSubmitting || registrationClosed}
                  >
                    {isSubmitting ? t('event.submitting', 'Отправка...') : t('event.submit', 'Зарегистрироваться')}
                  </Button>
                </form>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
});
