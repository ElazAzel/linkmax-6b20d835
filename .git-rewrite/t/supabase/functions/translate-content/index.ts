import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extended language names for all supported languages
const LANGUAGE_NAMES: Record<string, string> = {
  // Primary
  ru: "Russian", en: "English", kk: "Kazakh",
  // CIS & Turkic
  uk: "Ukrainian", be: "Belarusian", uz: "Uzbek",
  az: "Azerbaijani", ky: "Kyrgyz", tg: "Tajik",
  hy: "Armenian", ka: "Georgian", tr: "Turkish",
  // European
  de: "German", fr: "French", es: "Spanish",
  it: "Italian", pt: "Portuguese", pl: "Polish",
  nl: "Dutch", cs: "Czech", sv: "Swedish",
  da: "Danish", fi: "Finnish", no: "Norwegian",
  el: "Greek", ro: "Romanian", bg: "Bulgarian",
  hr: "Croatian", sr: "Serbian", sk: "Slovak",
  sl: "Slovenian", et: "Estonian", lv: "Latvian",
  lt: "Lithuanian",
  // Asian
  zh: "Chinese (Simplified)", ja: "Japanese", ko: "Korean",
  hi: "Hindi", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay",
  // Middle Eastern
  ar: "Arabic", he: "Hebrew",
};

// Rate limiting: 20 requests per minute per IP (increased for multi-language)
async function checkRateLimit(supabase: any, ipAddress: string, endpoint: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60000).toISOString();
  
  const { data: existingLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .single();

  if (existingLimit) {
    if (existingLimit.request_count >= 20) {
      return false;
    }
    await supabase
      .from('rate_limits')
      .update({ request_count: existingLimit.request_count + 1 })
      .eq('id', existingLimit.id);
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        ip_address: ipAddress,
        endpoint: endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const withinLimit = await checkRateLimit(supabase, ipAddress, 'translate-content');
    if (!withinLimit) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, sourceLanguage, targetLanguages } = await req.json();

    if (!text || !sourceLanguage || !targetLanguages?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit to 10 languages per request to avoid timeout
    const limitedTargetLanguages = targetLanguages.slice(0, 10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
    const targetLangInfo = limitedTargetLanguages.map((l: string) => ({
      code: l,
      name: LANGUAGE_NAMES[l] || l
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional multilingual translator. Translate the given text from ${sourceLangName} to multiple languages simultaneously.

TARGET LANGUAGES:
${targetLangInfo.map((l: { code: string; name: string }) => `- ${l.code}: ${l.name}`).join('\n')}

IMPORTANT RULES:
1. Return ONLY a valid JSON object with language codes as keys and translations as values
2. Keep the original tone, style, and formatting
3. Preserve any HTML tags, links, or special formatting
4. For proper nouns, brand names, or technical terms - keep them as-is or transliterate appropriately
5. Ensure natural, native-sounding translations (not literal word-by-word)

OUTPUT FORMAT (JSON only):
{
  "${limitedTargetLanguages[0]}": "translation in ${LANGUAGE_NAMES[limitedTargetLanguages[0]] || limitedTargetLanguages[0]}",
  ...
}`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No translation received");
    }

    // Parse the JSON response
    let translations: Record<string, string>;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      translations = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse translation response:", content);
      throw new Error("Invalid translation response format");
    }

    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
