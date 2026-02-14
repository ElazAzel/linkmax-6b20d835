import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleFormField {
  id: string;
  title: string;
  type: string;
  required: boolean;
  options?: string[];
  description?: string;
}

interface ParsedGoogleForm {
  title: string;
  description?: string;
  fields: GoogleFormField[];
  formId: string;
  error?: string;
}

function extractFormId(url: string): string | null {
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

function parseFormData(html: string, formId: string): ParsedGoogleForm {
  try {
    // Extract FB_PUBLIC_LOAD_DATA_ which contains form structure
    const dataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
    
    if (!dataMatch) {
      // Try alternative pattern for newer forms
      const altMatch = html.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
      if (!altMatch) {
        return {
          title: '',
          fields: [],
          formId,
          error: 'form_data_not_found'
        };
      }
    }

    const dataStr = dataMatch ? dataMatch[1] : '';
    
    // Parse the JSON-like structure (it's actually JavaScript array)
    let formData: any[];
    try {
      // Clean up the string for JSON parsing
      const cleanedData = dataStr
        .replace(/\n/g, '')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}');
      formData = JSON.parse(cleanedData);
    } catch {
      return {
        title: '',
        fields: [],
        formId,
        error: 'parse_error'
      };
    }

    // Extract form title and description
    const formTitle = formData[1]?.[8] || formData[3] || 'Imported Form';
    const formDescription = formData[1]?.[0] || '';

    // Extract fields from the form data structure
    const fields: GoogleFormField[] = [];
    const fieldItems = formData[1]?.[1] || [];

    for (const item of fieldItems) {
      if (!Array.isArray(item) || item.length < 2) continue;

      const fieldTitle = item[1] || 'Field';
      const fieldDescription = item[2] || '';
      const fieldData = item[4];

      if (!Array.isArray(fieldData) || fieldData.length === 0) continue;

      const fieldInfo = fieldData[0];
      if (!Array.isArray(fieldInfo)) continue;

      const fieldType = fieldInfo[3];
      const isRequired = fieldInfo[2] === 1;
      const fieldId = fieldInfo[0]?.toString() || crypto.randomUUID().slice(0, 8);

      // Map Google Forms field types to our types
      let mappedType: string;
      let options: string[] | undefined;

      switch (fieldType) {
        case 0: // Short answer
          mappedType = 'short_text';
          break;
        case 1: // Paragraph
          mappedType = 'long_text';
          break;
        case 2: // Multiple choice
          mappedType = 'single_choice';
          options = extractOptions(fieldInfo[1]);
          break;
        case 3: // Checkboxes
          mappedType = 'multiple_choice';
          options = extractOptions(fieldInfo[1]);
          break;
        case 4: // Dropdown
          mappedType = 'dropdown';
          options = extractOptions(fieldInfo[1]);
          break;
        case 5: // Linear scale
          mappedType = 'number';
          break;
        case 7: // Grid (multiple choice)
          mappedType = 'single_choice';
          break;
        case 9: // Date
          mappedType = 'date';
          break;
        case 10: // Time
          mappedType = 'short_text';
          break;
        case 13: // File upload
          mappedType = 'file';
          break;
        default:
          mappedType = 'short_text';
      }

      fields.push({
        id: fieldId,
        title: fieldTitle,
        type: mappedType,
        required: isRequired,
        options,
        description: fieldDescription || undefined,
      });
    }

    return {
      title: formTitle,
      description: formDescription || undefined,
      fields,
      formId,
    };
  } catch (error) {
    console.error('Error parsing form data:', error);
    return {
      title: '',
      fields: [],
      formId,
      error: 'parse_error'
    };
  }
}

function extractOptions(optionsData: any[]): string[] | undefined {
  if (!Array.isArray(optionsData)) return undefined;
  
  const options: string[] = [];
  for (const opt of optionsData) {
    if (Array.isArray(opt) && opt[0]) {
      options.push(opt[0].toString());
    }
  }
  
  return options.length > 0 ? options : undefined;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'url_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formId = extractFormId(url);
    if (!formId) {
      return new Response(
        JSON.stringify({ error: 'invalid_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the viewform URL
    let viewformUrl: string;
    if (url.includes('forms.gle')) {
      // Short URL - need to follow redirect first
      const redirectResponse = await fetch(url, { redirect: 'follow' });
      viewformUrl = redirectResponse.url;
    } else if (url.includes('/d/e/')) {
      viewformUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
    } else {
      viewformUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
    }

    console.log('Fetching form from:', viewformUrl);

    // Fetch the form HTML
    const response = await fetch(viewformUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch form:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'fetch_failed', status: response.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    // Check if form is accessible
    if (html.includes('This form is no longer accepting responses') || 
        html.includes('Эта форма больше не принимает ответы')) {
      return new Response(
        JSON.stringify({ error: 'form_closed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (html.includes('Sign in') && html.includes('to continue to Google Forms')) {
      return new Response(
        JSON.stringify({ error: 'form_not_public' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsedForm = parseFormData(html, formId);

    console.log('Parsed form:', JSON.stringify(parsedForm, null, 2));

    return new Response(
      JSON.stringify(parsedForm),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'server_error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});