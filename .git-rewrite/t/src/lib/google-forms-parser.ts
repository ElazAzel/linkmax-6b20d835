/**
 * Google Forms Parser - Import form structure from Google Forms URL
 * Parses publicly shared Google Forms and extracts field structure
 * 
 * Note: This works without OAuth by parsing the public form HTML
 * Limitations:
 * - Only works with publicly shared forms
 * - May break if Google changes their form structure
 * - Cannot import response data, only structure
 */

import type { EventFormField, EventFieldType } from '@/types/page';
import { createMultilingualString } from '@/lib/i18n-helpers';

export interface GoogleFormField {
  id: string;
  title: string;
  type: GoogleFormFieldType;
  required: boolean;
  options?: string[];
  description?: string;
}

export type GoogleFormFieldType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'linear_scale'
  | 'date'
  | 'time'
  | 'file_upload'
  | 'unknown';

export interface ParsedGoogleForm {
  title: string;
  description?: string;
  fields: GoogleFormField[];
  formId: string;
  error?: string;
}

/**
 * Extract Google Form ID from various URL formats
 */
export function extractGoogleFormId(url: string): string | null {
  if (!url) return null;
  
  // Handle various Google Forms URL formats:
  // - https://docs.google.com/forms/d/e/FORM_ID/viewform
  // - https://docs.google.com/forms/d/FORM_ID/edit
  // - https://docs.google.com/forms/d/FORM_ID/
  // - https://forms.gle/SHORT_ID
  
  const patterns = [
    /forms\/d\/e\/([a-zA-Z0-9_-]+)/,
    /forms\/d\/([a-zA-Z0-9_-]+)/,
    /forms\.gle\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate if a URL is a valid Google Forms URL
 */
export function isValidGoogleFormsUrl(url: string): boolean {
  if (!url) return false;
  
  const validPatterns = [
    /^https?:\/\/(docs\.google\.com\/forms|forms\.gle)/,
  ];
  
  return validPatterns.some(pattern => pattern.test(url));
}

/**
 * Map Google Forms field type to our EventFieldType
 */
function mapFieldType(googleType: GoogleFormFieldType): EventFieldType {
  const mapping: Record<GoogleFormFieldType, EventFieldType> = {
    short_text: 'short_text',
    long_text: 'long_text',
    single_choice: 'single_choice',
    multiple_choice: 'multiple_choice',
    dropdown: 'dropdown',
    linear_scale: 'number',
    date: 'date',
    time: 'short_text', // Time as text since we don't have time type
    file_upload: 'file',
    unknown: 'short_text',
  };
  return mapping[googleType];
}

/**
 * Convert parsed Google Form fields to EventFormFields
 */
export function convertToEventFormFields(googleFields: GoogleFormField[], lang: 'ru' | 'en' | 'kk' = 'ru'): EventFormField[] {
  return googleFields.map(field => {
    const eventField: EventFormField = {
      id: `gf_${field.id || crypto.randomUUID().slice(0, 8)}`,
      type: mapFieldType(field.type),
      label_i18n: createMultilingualString(field.title),
      required: field.required,
    };
    
    if (field.description) {
      eventField.helpText_i18n = createMultilingualString(field.description);
    }
    
    if (field.options && field.options.length > 0) {
      eventField.options = field.options.map((opt, idx) => ({
        id: `opt_${idx}`,
        label_i18n: createMultilingualString(opt),
      }));
    }
    
    return eventField;
  });
}

/**
 * Parse Google Form from URL (client-side approach)
 * 
 * This function attempts to fetch and parse the form structure.
 * Due to CORS restrictions, this may need to be done via a server-side proxy.
 * 
 * For MVP, we provide a manual import option where users can paste
 * the form structure or use a simplified import.
 */
export async function parseGoogleFormUrl(url: string): Promise<ParsedGoogleForm> {
  const formId = extractGoogleFormId(url);
  
  if (!formId) {
    return {
      title: '',
      fields: [],
      formId: '',
      error: 'invalid_url',
    };
  }
  
  // Due to CORS restrictions, direct parsing from client is limited
  // Return a structure indicating manual input is needed
  return {
    title: '',
    description: '',
    fields: [],
    formId,
    error: 'cors_restriction', // Indicates need for manual input or proxy
  };
}

/**
 * Parse Google Form fields from JSON-like structure
 * Users can paste the form structure from browser dev tools
 */
export function parseGoogleFormJson(jsonData: string): ParsedGoogleForm {
  try {
    const data = JSON.parse(jsonData);
    
    // Handle different JSON structures
    // This is a simplified parser for common Google Forms data structures
    
    const fields: GoogleFormField[] = [];
    const formTitle = typeof data.title === 'string' ? data.title : 'Imported Form';
    
    // Try to extract fields from various possible structures
    const fieldArray = data.fields || data.items || data.questions || [];
    
    for (const item of fieldArray) {
      if (!item) continue;
      
      const field: GoogleFormField = {
        id: item.id || crypto.randomUUID().slice(0, 8),
        title: item.title || item.label || item.question || 'Field',
        type: inferFieldType(item),
        required: Boolean(item.required || item.isRequired),
        options: extractOptions(item),
        description: item.description || item.helpText,
      };
      
      fields.push(field);
    }
    
    return {
      title: formTitle,
      description: data.description,
      fields,
      formId: data.formId || 'manual_import',
    };
  } catch (error) {
    return {
      title: '',
      fields: [],
      formId: '',
      error: 'parse_error',
    };
  }
}

/**
 * Infer field type from item structure
 */
function inferFieldType(item: Record<string, unknown>): GoogleFormFieldType {
  const type = (item.type || item.fieldType || '').toString().toLowerCase();
  
  const typeMap: Record<string, GoogleFormFieldType> = {
    'text': 'short_text',
    'short_text': 'short_text',
    'short_answer': 'short_text',
    'paragraph': 'long_text',
    'long_text': 'long_text',
    'long_answer': 'long_text',
    'textarea': 'long_text',
    'radio': 'single_choice',
    'single_choice': 'single_choice',
    'multiple_choice': 'single_choice',
    'checkbox': 'multiple_choice',
    'checkboxes': 'multiple_choice',
    'dropdown': 'dropdown',
    'select': 'dropdown',
    'list': 'dropdown',
    'date': 'date',
    'time': 'time',
    'file': 'file_upload',
    'file_upload': 'file_upload',
    'scale': 'linear_scale',
    'linear_scale': 'linear_scale',
  };
  
  return typeMap[type] || 'short_text';
}

/**
 * Extract options from item structure
 */
function extractOptions(item: Record<string, unknown>): string[] | undefined {
  const possibleKeys = ['options', 'choices', 'values', 'items'];
  
  for (const key of possibleKeys) {
    const options = item[key];
    if (Array.isArray(options)) {
      return options.map(opt => {
        if (typeof opt === 'string') return opt;
        if (typeof opt === 'object' && opt !== null) {
          return (opt as Record<string, unknown>).value?.toString() || 
                 (opt as Record<string, unknown>).label?.toString() || 
                 (opt as Record<string, unknown>).text?.toString() || 
                 'Option';
        }
        return 'Option';
      });
    }
  }
  
  return undefined;
}

/**
 * Create a simplified manual import template
 */
export function getManualImportTemplate(): string {
  return JSON.stringify({
    title: "Form Title",
    description: "Optional description",
    fields: [
      {
        id: "field1",
        title: "Your Name",
        type: "short_text",
        required: true
      },
      {
        id: "field2",
        title: "Your Phone",
        type: "short_text",
        required: false
      },
      {
        id: "field3",
        title: "Choose Option",
        type: "single_choice",
        required: true,
        options: ["Option A", "Option B", "Option C"]
      }
    ]
  }, null, 2);
}
