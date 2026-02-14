import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'
import { DEMO_ACCOUNTS } from './demo-data.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate page content using AI Builder
async function generateAIContent(description: string, niche: string, apiKey: string): Promise<any> {
  console.log(`Generating AI content for: ${description}`)
  
  const systemPrompt = `Ты AI-конструктор профессиональных страниц LinkMAX для Казахстана. 
Создаёшь ПОЛНЫЕ реалистичные страницы с 8-12 блоками.

НИША: ${niche}

ОБЯЗАТЕЛЬНЫЕ СЕКЦИИ:
1. profile - имя и bio с эмодзи (1-2 предложения)
2. Услуги/товары - 3-4 блока product с реальными ценами в KZT
3. Отзывы - testimonial с 2-3 отзывами
4. FAQ - 2-3 частых вопроса
5. Контакты - messenger блок

ТИПЫ БЛОКОВ (все с blockSize):
- profile: { name: "string", bio: "string с эмодзи" }
- product: { name: "string", description: "string", price: number (реальная цена KZT), currency: "KZT", image: null, blockSize: "half" }
- testimonial: { testimonials: [{ name: "имя", role: "роль", text: "отзыв", rating: 5 }], blockSize: "full" }
- faq: { items: [{ question: "?", answer: "ответ" }], blockSize: "full" }
- messenger: { messengers: [{ platform: "whatsapp", username: "+77001234567" }], blockSize: "half" }
- pricing: { items: [{ name: "услуга", price: "цена ₸" }], blockSize: "full" }
- text: { content: "заголовок", style: "heading", alignment: "center", blockSize: "full" }
- link: { title: "название", url: "https://...", icon: "instagram|telegram|youtube", blockSize: "half" }

ВАЖНО:
- Цены реалистичные для Казахстана
- Контент на русском языке
- image: null для всех блоков (картинки добавим отдельно)
- Уникальные имена и детали для каждой страницы

JSON формат:
{
  "profile": { "name": "...", "bio": "..." },
  "blocks": [... 8-12 блоков ...]
}

Return ONLY valid JSON, no markdown.`

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Создай полную страницу для: ${description}` }
      ],
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('AI generation failed:', error)
    throw new Error(`AI generation failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
  
  try {
    return JSON.parse(cleanContent)
  } catch (e) {
    console.error('Failed to parse AI response:', cleanContent)
    throw new Error('Invalid AI response')
  }
}

// Generate avatar image using AI
async function generateAvatarImage(description: string, niche: string, apiKey: string): Promise<string | null> {
  console.log(`Generating avatar for: ${description}`)
  
  const nichePrompts: Record<string, string> = {
    beauty: 'Professional beauty salon interior or makeup artist workspace, elegant and modern',
    fitness: 'Modern gym interior or fitness equipment, energetic and motivating',
    food: 'Beautiful food photography, gourmet dishes, restaurant setting',
    education: 'Modern classroom or study space, books and learning materials',
    art: 'Artist studio with paintings and brushes, creative workspace',
    music: 'Music studio with instruments, professional audio equipment',
    tech: 'Modern tech workspace, coding setup, clean minimalist design',
    business: 'Professional office space, business meeting room',
    health: 'Calming therapy room, wellness spa interior',
    fashion: 'Fashion showroom, stylish clothing display',
    travel: 'Beautiful Kazakhstan landscape, mountains or lakes',
    realty: 'Modern apartment interior, real estate photography',
    events: 'Event decoration, celebration setup',
    services: 'Professional service workshop, tools and equipment'
  }

  const prompt = `${nichePrompts[niche] || 'Professional business portrait'}, high quality, 1:1 aspect ratio, vibrant colors, professional photography`

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      }),
    })

    if (!response.ok) {
      console.error('Image generation failed:', response.status)
      return null
    }

    const data = await response.json()
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
    return imageUrl || null
  } catch (error) {
    console.error('Image generation error:', error)
    return null
  }
}

// Upload base64 image to Supabase storage
async function uploadImageToStorage(
  supabase: any, 
  base64Data: string, 
  fileName: string
): Promise<string | null> {
  try {
    // Extract base64 content
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0))
    
    const { data, error } = await supabase.storage
      .from('user-media')
      .upload(`demo-avatars/${fileName}.png`, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('user-media')
      .getPublicUrl(`demo-avatars/${fileName}.png`)

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload failed:', error)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body for batch processing params
    let startFrom = 0
    let limit = 5 // Process 5 accounts at a time to avoid timeout
    
    try {
      const body = await req.json()
      if (body.start_from !== undefined) startFrom = parseInt(body.start_from)
      if (body.limit !== undefined) limit = parseInt(body.limit)
    } catch {
      // No body or invalid JSON, use defaults
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const results: { email: string; status: string; error?: string }[] = []
    const endIndex = Math.min(startFrom + limit, DEMO_ACCOUNTS.length)
    
    console.log(`Processing accounts ${startFrom + 1} to ${endIndex} of ${DEMO_ACCOUNTS.length}`)

    for (let i = startFrom; i < endIndex; i++) {
      const account = DEMO_ACCOUNTS[i]
      const accountNum = i + 1
      const email = `demoaccount${accountNum}@gmail.com`
      const password = `Account@123${accountNum}`

      try {
        console.log(`Processing account ${accountNum}: ${account.slug}`)
        
        let userId: string

        // Try to create user via Admin API
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: account.title,
            username: account.slug
          }
        })

        if (createError) {
          if (createError.message.includes('already been registered')) {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users?.find(u => u.email === email)
            if (!existingUser) {
              results.push({ email, status: 'error', error: 'User exists but cannot find ID' })
              continue
            }
            userId = existingUser.id
            
            // Delete existing page and blocks
            const { data: existingPage } = await supabaseAdmin
              .from('pages')
              .select('id')
              .eq('user_id', userId)
              .single()
            
            if (existingPage) {
              await supabaseAdmin.from('blocks').delete().eq('page_id', existingPage.id)
              await supabaseAdmin.from('pages').delete().eq('id', existingPage.id)
            }
          } else {
            throw createError
          }
        } else {
          userId = userData.user.id
        }

        // Generate AI content
        let aiContent
        try {
          aiContent = await generateAIContent(account.description, account.niche, LOVABLE_API_KEY)
        } catch (aiError) {
          console.error(`AI generation failed for ${account.slug}, using default content`)
          aiContent = null
        }

        // Generate avatar image
        let avatarUrl = account.defaultAvatar
        try {
          const base64Image = await generateAvatarImage(account.description, account.niche, LOVABLE_API_KEY)
          if (base64Image && base64Image.startsWith('data:image')) {
            const uploadedUrl = await uploadImageToStorage(supabaseAdmin, base64Image, account.slug)
            if (uploadedUrl) {
              avatarUrl = uploadedUrl
            }
          }
        } catch (imgError) {
          console.error(`Image generation failed for ${account.slug}, using default`)
        }

        // Prepare page data
        const title = aiContent?.profile?.name || account.title
        const description = aiContent?.profile?.bio || account.description

        // Upsert user profile
        await supabaseAdmin.from('user_profiles').upsert({
          id: userId,
          username: account.slug,
          display_name: title,
          bio: description,
          avatar_url: avatarUrl,
          is_premium: true,
          premium_tier: 'business',
          trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })

        // Create page with random views/likes for gallery visibility
        const viewCount = Math.floor(Math.random() * 2000) + 500
        const likeCount = Math.floor(Math.random() * 100) + 20
        
        const { data: pageData, error: pageError } = await supabaseAdmin.from('pages').insert({
          user_id: userId,
          slug: account.slug,
          title,
          description,
          avatar_url: avatarUrl,
          avatar_style: account.avatarStyle,
          theme_settings: account.themeSettings,
          seo_meta: { title, description },
          is_published: true,
          is_in_gallery: true,
          gallery_featured_at: new Date().toISOString(),
          gallery_likes: likeCount,
          view_count: viewCount,
          niche: account.niche,
          editor_mode: 'linear'
        }).select('id').single()

        if (pageError) throw pageError

        // Create blocks from AI content or defaults
        const blocks = aiContent?.blocks || account.defaultBlocks
        const blocksToInsert = blocks.map((block: Record<string, unknown>, position: number) => {
          return {
            page_id: pageData.id,
            type: block.type as string,
            position,
            title: null,
            content: block,
            style: {},
            is_premium: true
          }
        })

        await supabaseAdmin.from('blocks').insert(blocksToInsert)

        results.push({ 
          email, 
          status: createError ? 'updated' : 'created',
        })
        
        console.log(`✅ Account ${accountNum} completed: ${account.slug}`)
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Account ${accountNum} failed:`, errMsg)
        results.push({ email, status: 'error', error: errMsg })
      }
    }

    const nextBatch = endIndex < DEMO_ACCOUNTS.length 
      ? { start_from: endIndex, limit } 
      : null

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      total: DEMO_ACCOUNTS.length,
      next_batch: nextBatch,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
