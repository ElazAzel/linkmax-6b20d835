import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { requireCronAuth } from "../_shared/cron-auth.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Motivational messages by language
const motivationalMessages: Record<string, string[]> = {
  ru: [
    "Новая неделя — новые возможности! 🚀 Пусть каждый день приносит успешные записи и довольных клиентов.",
    "Понедельник — это шанс начать всё с чистого листа! 💪 Ваш профессионализм вдохновляет клиентов возвращаться снова.",
    "Великие результаты начинаются с маленьких шагов. Эта неделя будет продуктивной! ✨",
    "Вы делаете важную работу! Каждая запись — это человек, которому вы помогаете. 💫",
    "Неделя впереди полна возможностей. Вы готовы их использовать! 🌟",
    "Ваш талант и трудолюбие — залог успеха. Продуктивной недели! 🎯",
    "Каждый понедельник — это 52 шанса в году стать лучше. Используйте этот! 💎",
  ],
  en: [
    "New week, new opportunities! 🚀 May each day bring successful bookings and happy clients.",
    "Monday is a chance to start fresh! 💪 Your professionalism inspires clients to come back.",
    "Great results start with small steps. This week will be productive! ✨",
    "You're doing important work! Each booking is someone you're helping. 💫",
    "The week ahead is full of opportunities. You're ready to seize them! 🌟",
    "Your talent and hard work are the keys to success. Have a productive week! 🎯",
    "Every Monday is one of 52 chances this year to become better. Use this one! 💎",
  ],
  kk: [
    "Жаңа апта — жаңа мүмкіндіктер! 🚀 Әр күн сәтті жазбалар мен қанағаттанған клиенттер әкелсін.",
    "Дүйсенбі — бәрін таза беттен бастау мүмкіндігі! 💪 Сіздің кәсібилігіңіз клиенттерді қайта оралуға шабыттандырады.",
    "Үлкен нәтижелер кішкентай қадамдардан басталады. Бұл апта өнімді болады! ✨",
    "Сіз маңызды жұмыс істеп жатырсыз! Әр жазба — сіз көмектесетін адам. 💫",
    "Алдағы апта мүмкіндіктерге толы. Сіз оларды пайдалануға дайынсыз! 🌟",
  ],
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronAuthError = requireCronAuth(req, corsHeaders);
  if (cronAuthError) return cronAuthError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!isConfigured()) {
      console.log("Telegram gateway not configured");
      return new Response(JSON.stringify({ error: "not_configured" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if today is Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek !== 1) {
      console.log(`Today is not Monday (day ${dayOfWeek}). Skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: "Not Monday, skipping", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Monday detected. Sending weekly motivation messages.");

    // Get all users with Telegram enabled
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, telegram_chat_id, telegram_notifications_enabled, telegram_language, display_name, username")
      .eq("telegram_notifications_enabled", true)
      .not("telegram_chat_id", "is", null);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch users");
    }

    if (!users || users.length === 0) {
      console.log("No users with Telegram enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users with Telegram", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${users.length} users with Telegram enabled`);

    // Get pages for all users to check if they have booking blocks with weeklyMotivationEnabled
    const userIds = users.map(u => u.id);
    
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id, user_id, title, description, niche")
      .in("user_id", userIds);

    if (pagesError) {
      console.error("Error fetching pages:", pagesError);
    }

    const pagesByUser = new Map<string, typeof pages>();
    if (pages) {
      for (const page of pages) {
        pagesByUser.set(page.user_id, [page]);
      }
    }

    // Get booking blocks to check weeklyMotivationEnabled
    const pageIds = pages?.map(p => p.id) || [];
    
    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("id, content, page_id")
      .in("page_id", pageIds)
      .eq("type", "booking");

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError);
    }

    // Create map of page_id to weeklyMotivationEnabled
    const pageMotivationEnabled = new Map<string, boolean>();
    if (blocks) {
      for (const block of blocks) {
        const content = block.content as Record<string, unknown>;
        if (content?.weeklyMotivationEnabled === true) {
          pageMotivationEnabled.set(block.page_id, true);
        }
      }
    }

    let sentCount = 0;

    for (const user of users) {
      // Check if user has any page with weeklyMotivationEnabled
      const userPages = pagesByUser.get(user.id) || [];
      const hasMotivationEnabled = userPages.some(p => pageMotivationEnabled.get(p.id) === true);

      if (!hasMotivationEnabled) {
        console.log(`Skipping user ${user.id}: No booking blocks with motivation enabled`);
        continue;
      }

      // Get user's page info for personalization
      const userPage = userPages[0];
      const lang = user.telegram_language || 'ru';
      
      // Select random motivational message
      const messages = motivationalMessages[lang] || motivationalMessages['ru'];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      // Personalize the greeting
      const name = user.display_name || user.username || '';
      const greeting = lang === 'en' ? 'Good morning' : (lang === 'kk' ? 'Қайырлы таң' : 'Доброе утро');
      
      let message = `🌅 *${greeting}${name ? `, ${name}` : ''}!*\n\n`;
      message += randomMessage + '\n\n';
      
      // Add personalized touch based on niche
      if (userPage?.niche) {
        const nicheMessages: Record<string, Record<string, string>> = {
          beauty: {
            ru: '💅 Пусть каждый клиент уходит от вас ещё красивее!',
            en: '💅 May every client leave feeling even more beautiful!',
            kk: '💅 Әр клиент сізден одан да сұлу кетсін!',
          },
          fitness: {
            ru: '💪 Вдохновляйте клиентов на новые спортивные достижения!',
            en: '💪 Inspire your clients to new fitness achievements!',
            kk: '💪 Клиенттерді жаңа спорттық жетістіктерге шабыттандырыңыз!',
          },
          health: {
            ru: '🏥 Ваша забота помогает людям чувствовать себя лучше!',
            en: '🏥 Your care helps people feel better!',
            kk: '🏥 Сіздің қамқорлығыңыз адамдарға жақсы сезінуге көмектеседі!',
          },
          education: {
            ru: '📚 Каждый урок — это инвестиция в чьё-то будущее!',
            en: '📚 Every lesson is an investment in someone\'s future!',
            kk: '📚 Әр сабақ — біреудің болашағына инвестиция!',
          },
        };
        
        const nicheMessage = nicheMessages[userPage.niche]?.[lang] || nicheMessages[userPage.niche]?.['ru'];
        if (nicheMessage) {
          message += nicheMessage + '\n\n';
        }
      }
      
      const signOff = lang === 'en' ? '— Your lnkmx.my' : (lang === 'kk' ? '— Сіздің lnkmx.my' : '— Ваш lnkmx.my');
      message += `_${signOff}_`;

      try {
        const telegramResponse = await sendMessage(user.telegram_chat_id, message, { parse_mode: "Markdown" });

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.text();
          console.error(`Telegram API error for user ${user.id}:`, errorData);
        } else {
          console.log(`Weekly motivation sent to user ${user.id}`);
          sentCount++;
        }
      } catch (telegramError) {
        console.error(`Error sending Telegram to user ${user.id}:`, telegramError);
      }
    }

    console.log(`Weekly motivation completed. Sent ${sentCount} notifications.`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-weekly-motivation:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
