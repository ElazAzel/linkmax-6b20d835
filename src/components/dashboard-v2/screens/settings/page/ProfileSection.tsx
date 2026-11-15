import { memo, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NicheSelector } from '@/components/settings/NicheSelector';
import type { Niche } from '@/lib/niches';
import { GroupTitle } from './shared';
import { getCountryOptions } from './helpers';

export interface EntityFields {
  city?: string;
  profession?: string;
  entity_type?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  country_code?: string;
}

type TextField = 'profession' | 'city' | 'contact_email' | 'contact_phone' | 'contact_whatsapp';

interface ProfileSectionProps {
  niche?: Niche;
  city?: string;
  profession?: string;
  entityType?: 'person' | 'organization';
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  countryCode?: string;
  onNicheChange: (niche: Niche) => void;
  onUpdateEntityFields?: (fields: EntityFields) => void;
  onSaved: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Empty is fine (the field is optional); otherwise at least 7 digits. */
function isValidPhone(value: string): boolean {
  return /^[+\d\s()-]+$/.test(value) && value.replace(/\D/g, '').length >= 7;
}

export const ProfileSection = memo(function ProfileSection({
  niche, city, profession, entityType, contactEmail, contactPhone, contactWhatsapp, countryCode,
  onNicheChange, onUpdateEntityFields, onSaved,
}: ProfileSectionProps) {
  const { t, i18n } = useTranslation();
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language]);

  const [values, setValues] = useState<Record<TextField, string>>({
    profession: profession || '',
    city: city || '',
    contact_email: contactEmail || '',
    contact_phone: contactPhone || '',
    contact_whatsapp: contactWhatsapp || '',
  });
  const [errors, setErrors] = useState<Partial<Record<TextField, string>>>({});
  const [country, setCountry] = useState(countryCode || '');
  const [entity, setEntity] = useState<string>(entityType || 'person');
  // Last value that reached the draft: leaving an untouched field must not save or toast.
  const saved = useRef<Record<TextField, string>>({ ...values });

  const setField = (key: TextField, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const commit = (key: TextField) => {
    const value = values[key].trim();
    if (value !== values[key]) setValues((prev) => ({ ...prev, [key]: value }));
    if (value === saved.current[key] || !onUpdateEntityFields) return;

    if (value && key === 'contact_email' && !EMAIL_REGEX.test(value)) {
      setErrors((prev) => ({ ...prev, [key]: t('dashboard.pageSettings.emailInvalid', 'Проверьте адрес почты') }));
      return;
    }
    if (value && (key === 'contact_phone' || key === 'contact_whatsapp') && !isValidPhone(value)) {
      setErrors((prev) => ({ ...prev, [key]: t('dashboard.pageSettings.phoneInvalid', 'Укажите номер в международном формате, например +7 777 123 4567') }));
      return;
    }

    saved.current[key] = value;
    onUpdateEntityFields({ [key]: value || undefined });
    onSaved();
  };

  const textField = (key: TextField, label: string, placeholder: string, type: 'text' | 'email' | 'tel' = 'text') => (
    <div className="space-y-2">
      <Label htmlFor={`page-${key}`}>{label}</Label>
      <Input
        id={`page-${key}`}
        value={values[key]}
        onChange={(e) => setField(key, e.target.value)}
        onBlur={() => commit(key)}
        placeholder={placeholder}
        className="h-12 rounded-xl"
        type={type}
        inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
        aria-invalid={!!errors[key]}
      />
      {errors[key] && <p role="alert" className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  const optional = t('common.optional', 'необязательно');

  return (
    <>
      <div className="space-y-2">
        <GroupTitle>{t('dashboard.pageSettings.category', 'Категория')}</GroupTitle>
        <NicheSelector value={niche} onChange={(next) => { if (next === niche) return; onNicheChange(next); onSaved(); }} />
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <GroupTitle>{t('dashboard.pageSettings.aboutGroup', 'Кто вы и где работаете')}</GroupTitle>
        <div className="space-y-2">
          <Label>{t('dashboard.pageSettings.entityType', 'Тип профиля')}</Label>
          <Select
            value={entity}
            onValueChange={(value: string) => {
              if (value === entity) return;
              setEntity(value);
              if (onUpdateEntityFields) {
                onUpdateEntityFields({ entity_type: value });
                onSaved();
              }
            }}
          >
            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="person">{t('dashboard.pageSettings.personalProfile', 'Личный профиль')}</SelectItem>
              <SelectItem value="organization">{t('dashboard.pageSettings.organization', 'Организация')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {textField('profession', t('dashboard.pageSettings.profession', 'Профессия / специализация'), t('dashboard.pageSettings.professionPlaceholder', 'Мастер маникюра, фотограф, коуч…'))}
        <div className="space-y-2">
          <Label>{t('dashboard.pageSettings.country', 'Страна')}</Label>
          <Select
            value={country || 'none'}
            onValueChange={(value: string) => {
              const next = value === 'none' ? '' : value;
              if (next === country) return;
              setCountry(next);
              if (onUpdateEntityFields) {
                onUpdateEntityFields({ country_code: next });
                onSaved();
              }
            }}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder={t('fields.selectCountry', 'Выберите страну')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('fields.notSpecified', 'Не указана')}</SelectItem>
              {countries.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
              <SelectItem value="OTHER">🌍 {t('dashboard.pageSettings.countryOther', 'Другая')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {textField('city', t('dashboard.pageSettings.city', 'Город'), t('dashboard.pageSettings.cityPlaceholder', 'Алматы, Астана, Ташкент…'))}
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <div className="space-y-1">
          <GroupTitle>{t('dashboard.pageSettings.contactsGroup', 'Публичные контакты')}</GroupTitle>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.pageSettings.contactsHint', 'Эти контакты видят посетители и поисковики. Оставьте поля пустыми, если не хотите их показывать.')}
          </p>
        </div>
        {textField('contact_phone', `${t('dashboard.pageSettings.publicPhoneLabel', 'Телефон')} (${optional})`, '+7 777 123 4567', 'tel')}
        {textField('contact_whatsapp', `WhatsApp (${optional})`, '+7 777 123 4567', 'tel')}
        {textField('contact_email', `${t('dashboard.pageSettings.publicEmailLabel', 'Email')} (${optional})`, 'hello@example.com', 'email')}
      </div>
    </>
  );
});
