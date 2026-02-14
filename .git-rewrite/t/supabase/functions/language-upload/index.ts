import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationError {
    key: string;
    issue: string;
}

interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    stats: {
        totalKeys: number;
        missingKeys: number;
        extraKeys: number;
        emptyValues: number;
    };
}

// Recursively get all keys from nested object
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
        } else {
            keys.push(fullKey);
        }
    }

    return keys;
}

// Get value from nested object by dot-separated key
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce((acc: unknown, part) => {
        if (acc && typeof acc === 'object') {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, obj);
}

// Validate uploaded language JSON
function validateLanguageJSON(
    uploaded: Record<string, unknown>,
    reference: Record<string, unknown>,
    languageCode: string
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const uploadedKeys = getAllKeys(uploaded);
    const referenceKeys = getAllKeys(reference);

    const uploadedSet = new Set(uploadedKeys);
    const referenceSet = new Set(referenceKeys);

    // Find missing keys
    const missingKeys: string[] = [];
    for (const key of referenceKeys) {
        if (!uploadedSet.has(key)) {
            missingKeys.push(key);
            warnings.push({ key, issue: 'Missing key from reference language' });
        }
    }

    // Find extra keys
    const extraKeys: string[] = [];
    for (const key of uploadedKeys) {
        if (!referenceSet.has(key)) {
            extraKeys.push(key);
            warnings.push({ key, issue: 'Extra key not in reference language' });
        }
    }

    // Check for empty values
    let emptyValues = 0;
    for (const key of uploadedKeys) {
        const value = getNestedValue(uploaded, key);
        if (typeof value === 'string' && value.trim() === '') {
            emptyValues++;
            warnings.push({ key, issue: 'Empty translation value' });
        } else if (value === null || value === undefined) {
            emptyValues++;
            errors.push({ key, issue: 'Null or undefined value' });
        } else if (typeof value !== 'string') {
            errors.push({ key, issue: `Invalid type: ${typeof value} (expected string)` });
        }
    }

    const valid = errors.length === 0;

    return {
        valid,
        errors,
        warnings,
        stats: {
            totalKeys: uploadedKeys.length,
            missingKeys: missingKeys.length,
            extraKeys: extraKeys.length,
            emptyValues,
        },
    };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        // Verify user is admin
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'admin') {
            return new Response(
                JSON.stringify({ error: 'Forbidden: Admin access required' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request
        const { languageCode, translations, action } = await req.json();

        if (!languageCode || !translations) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: languageCode, translations' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate language code format
        if (!/^[a-z]{2}$/.test(languageCode)) {
            return new Response(
                JSON.stringify({ error: 'Invalid language code format. Must be 2 lowercase letters (e.g., en, ru, kk)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get reference language (English) for validation
        const { data: referenceData } = await supabaseClient
            .from('languages')
            .select('translations')
            .eq('language_code', 'en')
            .single();

        let validationResult: ValidationResult;

        if (referenceData && Object.keys(referenceData.translations).length > 0) {
            // Validate against reference
            validationResult = validateLanguageJSON(
                translations as Record<string, unknown>,
                referenceData.translations as Record<string, unknown>,
                languageCode
            );
        } else {
            // If no reference exists, just basic validation
            validationResult = {
                valid: true,
                errors: [],
                warnings: [],
                stats: {
                    totalKeys: getAllKeys(translations as Record<string, unknown>).length,
                    missingKeys: 0,
                    extraKeys: 0,
                    emptyValues: 0,
                },
            };
        }

        // Save to upload history and capture the ID
        const { data: historyRecord, error: historyError } = await supabaseClient
            .from('language_upload_history')
            .insert({
                language_code: languageCode,
                translations,
                validation_result: validationResult,
                uploaded_by: user.id,
                status: validationResult.valid ? 'validated' : 'pending',
            })
            .select('id')
            .single();

        if (historyError) {
            console.error('Error saving upload history:', historyError);
        }

        const historyId = historyRecord?.id;

        // If action is 'apply' and validation is successful, update or insert language
        if (action === 'apply' && validationResult.valid) {
            const { data: existingLang } = await supabaseClient
                .from('languages')
                .select('id, version')
                .eq('language_code', languageCode)
                .single();

            if (existingLang) {
                // Update existing language
                await supabaseClient
                    .from('languages')
                    .update({
                        translations,
                        version: existingLang.version + 1,
                        uploaded_by: user.id,
                    })
                    .eq('language_code', languageCode);
            } else {
                // Insert new language
                // Safely access nested properties with type checking
                const translationsObj = translations as Record<string, unknown>;
                const commonObj = translationsObj.common as Record<string, unknown> | undefined;
                const languageName = (typeof commonObj?.languageName === 'string' && commonObj.languageName)
                    ? commonObj.languageName
                    : languageCode.toUpperCase();

                await supabaseClient.from('languages').insert({
                    language_code: languageCode,
                    language_name: languageName,
                    translations,
                    uploaded_by: user.id,
                });
            }

            // Mark as applied in history using the captured ID
            if (historyId) {
                await supabaseClient
                    .from('language_upload_history')
                    .update({ status: 'applied' })
                    .eq('id', historyId);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                languageCode,
                validation: validationResult,
                applied: action === 'apply' && validationResult.valid,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error processing language upload:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
