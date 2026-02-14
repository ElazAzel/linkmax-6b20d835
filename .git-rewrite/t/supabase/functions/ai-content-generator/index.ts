import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_REQUESTS = 20; // 20 requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds

async function checkRateLimit(supabase: any, ipAddress: string, endpoint: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000);
  
  // Clean up old entries
  await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString());
  
  // Get current rate limit entry
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();
  
  if (existing) {
    if (existing.request_count >= RATE_LIMIT_REQUESTS) {
      return false; // Rate limit exceeded
    }
    
    // Update count
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new entry
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract IP address
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    // Initialize Supabase client for rate limiting
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Check rate limit
    const allowed = await checkRateLimit(supabase, ipAddress, 'ai-content-generator');
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Check if body exists and is not empty
    const text = await req.text();
    if (!text) {
      throw new Error('Request body is empty');
    }
    
    const { type, input, prompt } = JSON.parse(text);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'magic-title':
        systemPrompt = 'You are a creative copywriter. Generate catchy, engaging titles for social media links. Keep titles short (2-5 words), action-oriented, and clickable. Return only the title text, nothing else.';
        userPrompt = `Generate a catchy title for this URL: ${input.url}`;
        break;

      case 'sales-copy':
        systemPrompt = 'You are a sales copywriter. Write compelling, benefit-focused product descriptions that drive conversions. Keep it concise (2-3 sentences), highlight key benefits, and include a subtle call-to-action. Return only the description text.';
        userPrompt = `Write a sales description for this product: ${input.productName}. Price: ${input.price} ${input.currency}.`;
        break;

      case 'seo':
        systemPrompt = 'You are an SEO expert. Generate optimized meta tags for link-in-bio pages. Return a JSON object with: title (50-60 chars), description (150-160 chars), and keywords (array of 5-8 relevant keywords). Return ONLY valid JSON, no markdown.';
        userPrompt = `Generate SEO meta tags for a page with this content: Name: ${input.name}, Bio: ${input.bio}, Links: ${input.links?.join(', ') || 'none'}`;
        break;

      case 'ai-builder':
        systemPrompt = `Ты AI-дизайнер персонализированных лендинг-страниц LinkMAX. Создаёшь УНИКАЛЬНЫЕ страницы с индивидуальным дизайном и реалистичным демо-контентом под конкретного пользователя.

ВАЖНО: Каждая страница должна быть УНИКАЛЬНОЙ с:
- Индивидуальной цветовой схемой через blockStyle
- Персонализированным контентом под описание пользователя
- Реалистичными демо-данными (цены, отзывы, услуги)

ОБЯЗАТЕЛЬНЫЕ СЕКЦИИ (8-12 блоков):
1. profile - информация с уникальным био
2. Ссылки на соцсети (2-3 link блока)
3. Товары/услуги (2-4 product блока с реальными ценами)
4. Отзывы (testimonial с 2-3 персонализированными отзывами)
5. FAQ (2-3 актуальных вопроса для ниши)
6. Контакты (messenger)

РАЗМЕРЫ БЛОКОВ (ВАЖНО для мобильной версии):
- "full" - во всю ширину (лучше для контента)
- "half" - половина ширины (только для коротких блоков)

СТИЛИЗАЦИЯ БЛОКОВ (blockStyle) - создавай УНИКАЛЬНЫЙ дизайн:
{
  "padding": "sm|md|lg",
  "borderRadius": "sm|md|lg|full",
  "shadow": "none|sm|md|lg|glow",
  "backgroundColor": "hsl(210, 50%, 95%)", // уникальные цвета под ниший
  "backgroundGradient": "linear-gradient(135deg, hsl(210, 70%, 90%), hsl(210, 70%, 95%))",
  "hoverEffect": "none|scale|glow|lift",
  "animation": "none|fade-in|slide-up|scale-in"
}

ТИПЫ БЛОКОВ:
- profile: { name, bio (с эмодзи), blockStyle: { backgroundColor, shadow } }
- link: { title, url, icon, style: "rounded|pill", blockSize: "full", blockStyle }
- product: { name, description (краткое!), price, currency: "KZT", blockSize: "full", blockStyle }
- testimonial: { testimonials: [{ name, text (короткий), rating, role }], blockStyle }
- faq: { items: [{ question, answer }], blockStyle }
- messenger: { messengers: [{ platform, username }], blockStyle }
- text: { content, style: "heading|paragraph", blockStyle }
- separator: { variant: "solid|gradient", blockStyle }

ЦВЕТОВЫЕ СХЕМЫ ПО НИШАМ (выбери подходящую):
- Фитнес: зелёные и оранжевые оттенки (hsl(120-30))
- Красота: розовые и пурпурные (hsl(300-340))
- Бизнес: синие и серые (hsl(200-220))
- Творчество: фиолетовые и жёлтые (hsl(260-60))
- Еда: тёплые оранжевые и красные (hsl(15-45))
- Технологии: голубые и бирюзовые (hsl(180-200))

ПРИМЕР УНИКАЛЬНОГО ДИЗАЙНА:
{
  "profile": { 
    "name": "Мария Стилист", 
    "bio": "✨ Стилист-имиджмейкер • Преображаю внешность и жизнь",
    "avatarFrame": "gradient-purple"
  },
  "blocks": [
    { 
      "type": "text", 
      "content": "Мои услуги", 
      "style": "heading", 
      "blockSize": "full",
      "blockStyle": { "padding": "md", "animation": "fade-in" }
    },
    { 
      "type": "product", 
      "name": "Разбор гардероба", 
      "description": "Ревизия + рекомендации", 
      "price": 35000, 
      "currency": "KZT", 
      "blockSize": "full",
      "blockStyle": { 
        "padding": "lg", 
        "borderRadius": "lg", 
        "backgroundColor": "hsl(320, 60%, 96%)",
        "shadow": "md",
        "hoverEffect": "lift"
      }
    },
    { 
      "type": "product", 
      "name": "Шопинг-сопровождение", 
      "description": "4 часа + подбор образов", 
      "price": 75000, 
      "currency": "KZT", 
      "blockSize": "full",
      "blockStyle": { 
        "padding": "lg", 
        "borderRadius": "lg", 
        "backgroundColor": "hsl(280, 50%, 95%)",
        "shadow": "md",
        "hoverEffect": "lift"
      }
    },
    { 
      "type": "testimonial", 
      "testimonials": [
        { "name": "Алина", "role": "Клиентка", "text": "Наконец-то знаю, что мне идёт!", "rating": 5 },
        { "name": "Жанна", "role": "Клиентка", "text": "Мария - профессионал своего дела", "rating": 5 }
      ],
      "blockSize": "full",
      "blockStyle": { 
        "padding": "lg", 
        "borderRadius": "lg",
        "backgroundGradient": "linear-gradient(135deg, hsl(320, 40%, 97%), hsl(280, 40%, 97%))",
        "animation": "slide-up"
      }
    },
    { 
      "type": "link", 
      "title": "📸 Мой Instagram", 
      "url": "https://instagram.com/", 
      "icon": "instagram", 
      "blockSize": "full",
      "blockStyle": { "borderRadius": "full", "hoverEffect": "glow" }
    },
    { 
      "type": "messenger", 
      "messengers": [{ "platform": "whatsapp", "username": "+77001234567" }],
      "blockSize": "full",
      "blockStyle": { "padding": "md", "borderRadius": "lg" }
    }
  ]
}

ПРАВИЛА:
1. ВСЕ блоки с blockSize: "full" для лучшей мобильной версии
2. Уникальные цвета blockStyle под нишу пользователя
3. Реалистичные цены в KZT для Казахстана
4. Персонализированные отзывы с именами и ролями
5. Краткие описания товаров (2-4 слова)
6. Разные анимации для визуального разнообразия

Текст на русском. Return ONLY valid JSON, no markdown.`;
        userPrompt = `Создай УНИКАЛЬНУЮ персонализированную страницу с индивидуальным дизайном для: ${input.description}. Используй подходящую цветовую схему и реалистичный демо-контент.`;
        break;

      case 'niche-builder':
        const nichePrompts: Record<string, string> = {
          barber: 'барбера/парикмахера с услугами стрижки, бороды, укладки. Добавь ссылки на запись, портфолио работ, прайс-лист.',
          photographer: 'фотографа с портфолио, услугами съёмки (портрет, свадьба, предметная), ценами и контактами для записи.',
          psychologist: 'психолога/терапевта с описанием услуг (консультации, терапия), форматами работы (онлайн/офлайн) и записью.',
          fitness: 'фитнес-тренера с программами тренировок, онлайн-курсами, персональными занятиями и отзывами клиентов.',
          musician: 'музыканта/артиста со ссылками на стриминговые платформы, концерты, мерч и социальные сети.',
          designer: 'дизайнера с портфолио работ, услугами (логотипы, брендинг, веб-дизайн) и ценами.',
          teacher: 'репетитора/преподавателя с предметами, форматами занятий, ценами и записью на пробный урок.',
          shop: 'магазина/бренда с товарами, акциями, доставкой и контактами для заказа.',
          marketer: 'маркетолога/SMM-специалиста с услугами, кейсами, ценами и бесплатной консультацией.',
          beauty: 'мастера красоты (маникюр, макияж, брови) с услугами, портфолио и записью.',
          chef: 'повара/кондитера с меню, услугами кейтеринга, мастер-классами и заказом.',
        };
        
        const nicheDescription = nichePrompts[input.niche] || 'специалиста с услугами и контактами';
        
        systemPrompt = `Ты AI-конструктор профессиональных страниц LinkMAX. Создай полную страницу для ${nicheDescription}

ИНФОРМАЦИЯ:
- Имя: "${input.name}"
- Детали: "${input.details || 'не указаны'}"

СОЗДАЙ ПОЛНУЮ СТРАНИЦУ с 10-15 блоками, включая ВСЕ секции:

1. ПРОФИЛЬ (profile):
   - name: имя/название бизнеса
   - bio: краткое описание с эмодзи (2-3 строки)

2. СОЦСЕТИ (2-4 блока link):
   - Ссылки на Instagram, Telegram, YouTube и т.д.
   - Используй эмодзи в заголовках

3. УСЛУГИ/ТОВАРЫ (2-4 блока product):
   - Реалистичные цены в KZT для Казахстана
   - Конкретные описания услуг

4. ОТЗЫВЫ (testimonial):
   - 2-3 реалистичных отзыва клиентов
   - С именами и ролями

5. FAQ (faq):
   - 2-3 частых вопроса для этой ниши

6. КОНТАКТЫ (messenger):
   - WhatsApp и/или Telegram

ТИПЫ БЛОКОВ (все с blockSize: "full" или "half"):
- profile: { name, bio }
- link: { title, url, icon: "globe|instagram|telegram|youtube|tiktok", style: "rounded|pill", blockSize: "half" }
- text: { content, style: "heading|paragraph|quote", alignment: "center|left", blockSize: "full" }
- product: { name, description, price: number, currency: "KZT", blockSize: "half" }
- testimonial: { testimonials: [{ name, role, text, rating: 5 }], blockSize: "full" }
- faq: { items: [{ question, answer }], blockSize: "full" }
- messenger: { messengers: [{ platform: "telegram|whatsapp", username }], blockSize: "half" }
- socials: { platforms: [{ platform, url }], blockSize: "full" }
- video: { url, title, blockSize: "full" }
- countdown: { title, endDate, style: "modern", blockSize: "full" }
- separator: { style: "line", blockSize: "full" }
- carousel: { images: [{ url, alt }], title, blockSize: "full" }

ОТВЕТ В JSON:
{
  "profile": { "name": "...", "bio": "..." },
  "blocks": [... 10-15 блоков ...]
}

Текст на русском, профессиональный. Return ONLY valid JSON, no markdown.`;
        userPrompt = `Создай полную страницу для ниши: ${input.niche}. Имя: ${input.name}. Детали: ${input.details || 'нет'}`;
        break;

      case 'personalize-template':
        systemPrompt = `Ты AI для персонализации шаблонов страниц. Получаешь шаблон и информацию о бизнесе.
        
Задача: адаптировать ВСЕ текстовое содержимое шаблона под конкретный бизнес, сохраняя структуру.

Верни JSON:
{
  "profile": { "name": "Название бизнеса", "bio": "Профессиональное описание" },
  "blocks": [
    // Та же структура что во входных данных, но с персонализированным контентом
  ]
}

Правила:
1. Сохрани ВСЕ типы блоков и структуру из входного шаблона
2. Замени плейсхолдеры на контент для конкретного бизнеса
3. Обнови цены на реалистичные для типа бизнеса
4. Сохрани мультиязычный формат: { "ru": "...", "en": "...", "kk": "..." }
5. Сделай отзывы аутентичными для данного бизнеса
6. Обнови FAQ под специфику бизнеса
7. НЕ меняй URL изображений

Return ONLY valid JSON, no markdown.`;
        
        userPrompt = `Бизнес: ${input.businessName}
Описание: ${input.businessDescription || "Нет описания"}
Шаблон: ${input.templateName}
Блоки шаблона: ${JSON.stringify(input.templateBlocks)}

Персонализируй этот шаблон. Сохрани те же типы и количество блоков, обнови только контент.`;
        break;

      case 'search':
        systemPrompt = `Ты - умный поисковой помощник. Отвечай на вопросы пользователя кратко, информативно и полезно. 
Если вопрос требует фактической информации, старайся давать точные ответы.
Если это субъективный вопрос, предложи разные точки зрения.
Отвечай на языке вопроса (русский/английский/казахский).
Будь дружелюбным и профессиональным.`;
        userPrompt = prompt || input?.query || 'Привет';
        break;

      default:
        throw new Error('Invalid type');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // For SEO, AI Builder, niche-builder and personalize-template, parse JSON response
    if (type === 'seo' || type === 'ai-builder' || type === 'niche-builder' || type === 'personalize-template') {
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        return new Response(
          JSON.stringify({ result: parsed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('Failed to parse JSON:', content);
        // For niche-builder and personalize-template, return error if JSON fails
        if (type === 'niche-builder' || type === 'personalize-template') {
          throw new Error('Invalid JSON response from AI');
        }
        // For others, return raw content
        return new Response(
          JSON.stringify({ result: content.trim() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For search, return content directly
    if (type === 'search') {
      return new Response(
        JSON.stringify({ content: content.trim() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For text responses
    return new Response(
      JSON.stringify({ result: content.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-content-generator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
