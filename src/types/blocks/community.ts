import type { MultilingualString, I18nText } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle, Currency } from './base';

// Community Block - for private Telegram channels/groups
export interface CommunityBlock {
    id: string;
    type: 'community';
    title?: string | I18nText | MultilingualString;
    description?: string | I18nText | MultilingualString;
    telegramLink: string;
    icon?: 'users' | 'crown' | 'star' | 'heart' | 'zap' | 'lock';
    memberCount?: string; // e.g., "500+ участников"
    style?: 'default' | 'premium' | 'exclusive';
    buttonText?: string | I18nText | MultilingualString;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export type EventLocationType = 'online' | 'offline';

// Extended field types matching Google Forms capabilities
export type EventFieldType =
    | 'short_text'      // Single line text
    | 'long_text'       // Multi-line paragraph
    | 'email'           // Email with validation
    | 'phone'           // Phone number
    | 'number'          // Numeric input
    | 'dropdown'        // Single select dropdown
    | 'single_choice'   // Radio buttons
    | 'multiple_choice' // Checkboxes (multiple select)
    | 'date'            // Date picker
    | 'time'            // Time picker
    | 'datetime'        // Date and time
    | 'checkbox'        // Single agreement checkbox
    | 'url'             // URL with validation
    | 'linear_scale'    // 1-10 scale rating
    | 'rating'          // Star rating (1-5)
    | 'grid'            // Multiple choice grid
    | 'checkbox_grid'   // Checkbox grid
    | 'media'           // Media section (Pro)
    | 'file'            // File upload (Pro)
    | 'section_header'  // Section divider with title
    | 'description';    // Description/instruction text

export interface EventFieldOption {
    id: string;
    label_i18n: MultilingualString;
    goToSection?: string; // Section navigation for conditional logic
}

export interface EventFormSection {
    id: string;
    title_i18n: MultilingualString;
    description_i18n?: MultilingualString;
    fieldIds: string[]; // Fields belonging to this section
}

export interface LinearScaleConfig {
    min: number;
    max: number;
    minLabel_i18n?: MultilingualString;
    maxLabel_i18n?: MultilingualString;
}

export interface FieldGridConfig {
    rows: EventFieldOption[];
    columns: EventFieldOption[];
}

export interface EventFormField {
    id: string;
    type: EventFieldType;
    label_i18n: MultilingualString;
    placeholder_i18n?: MultilingualString;
    helpText_i18n?: MultilingualString;
    required?: boolean;
    options?: EventFieldOption[];
    sectionId?: string; // Which section this field belongs to
    validation?: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: string;
    };
    // Type-specific configs
    linearScale?: LinearScaleConfig;
    grid?: FieldGridConfig;
    // Conditional logic
    showIf?: {
        fieldId: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'not_empty';
        value?: string | string[];
    };
}

export interface EventBlock {
    id: string;
    type: 'event';
    eventId: string;
    title: MultilingualString;
    description?: MultilingualString;
    coverUrl?: string;
    startAt?: string;
    endAt?: string;
    timezone?: string;
    registrationClosesAt?: string;
    locationType?: EventLocationType;
    locationValue?: string;
    capacity?: number;
    isPaid?: boolean;
    price?: number;
    currency?: Currency;
    status?: 'draft' | 'published' | 'closed';
    formFields?: EventFormField[];
    formSections?: EventFormSection[];
    settings?: {
        requireApproval?: boolean;
        allowDuplicateEmail?: boolean;
        note?: string;
        showProgressBar?: boolean;
        shuffleQuestions?: boolean;
        confirmationMessage_i18n?: MultilingualString;
    };
    buttonText?: MultilingualString; // Custom button text
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}
