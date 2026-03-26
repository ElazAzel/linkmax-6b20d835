import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * Compute SHA256 hash using WebCrypto
 */
async function sha256(data: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    return await crypto.subtle.digest("SHA-256", encoder.encode(data));
}

/**
 * Compute HMAC-SHA256 using WebCrypto
 */
async function hmacSHA256(
    key: ArrayBuffer | Uint8Array,
    data: string
): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key as ArrayBuffer,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

const MAX_AUTH_AGE_SECONDS = 3600; // 1 hour

interface TelegramWidgetData {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

async function validateTelegramWebData(
    data: TelegramWidgetData,
    botToken: string
): Promise<TelegramWidgetData> {
    if (!data.hash) {
        throw new Error("Missing hash in telegram data");
    }

    // Build data_check_string: sorted format key=value joined by \n
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(data)) {
        if (key !== "hash" && value !== undefined && value !== null) {
            entries.push([key, String(value)]);
        }
    }

    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

    // Telegram Web Widget uses SHA256 of botToken as the secret key
    const secretKey = await sha256(botToken);

    // computed_hash = HMAC-SHA256(secret_key, data_check_string)
    const computedHashHex = bufferToHex(
        await hmacSHA256(new Uint8Array(secretKey), dataCheckString)
    );

    if (computedHashHex !== data.hash) {
        throw new Error("Invalid Telegram signature");
    }

    // Check auth_date freshness
    const now = Math.floor(Date.now() / 1000);
    if (now - data.auth_date > MAX_AUTH_AGE_SECONDS) {
        throw new Error("Telegram authentication is too old (auth_date expired)");
    }

    return data;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        if (!isConfigured()) {
      console.log("Telegram gateway not configured");
    }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const { telegramData } = await req.json();

        if (!telegramData || typeof telegramData !== "object") {
            return new Response(
                JSON.stringify({ valid: false, error: "missing_telegram_data" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // ---- Step 1: Validate payload signature ----
        let validatedData: TelegramWidgetData;
        try {
            validatedData = await validateTelegramWebData(telegramData, botToken);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error("Telegram web validation failed:", errorMessage);
            return new Response(
                JSON.stringify({ valid: false, error: errorMessage }),
                {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        console.log(
            `Validated Web Telegram user: ${validatedData.id} (@${validatedData.username || "no_username"})`
        );

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ---- Step 2: Find or create user (similar to miniapp logic) ----
        const { data: existingAccount } = await supabase
            .from("telegram_accounts")
            .select("id, telegram_user_id")
            .eq("telegram_user_id", validatedData.id)
            .maybeSingle();

        let userId: string;

        if (existingAccount) {
            // Existing user — update their account info
            userId = existingAccount.id;
            await supabase.rpc("upsert_telegram_account", {
                p_user_id: userId,
                p_telegram_user_id: validatedData.id,
                p_username: validatedData.username || null,
                p_first_name: validatedData.first_name || null,
                p_last_name: validatedData.last_name || null,
                p_language_code: "ru", // Web widget doesn't return language_code
                p_photo_url: validatedData.photo_url || null,
                p_allows_write_to_pm: true,
                p_is_premium: false,
            });
        } else {
            // Check if user profile exists with matching telegram_chat_id
            const { data: linkedProfile } = await supabase
                .from("user_profiles")
                .select("id")
                .eq("telegram_chat_id", validatedData.id.toString())
                .maybeSingle();

            if (linkedProfile) {
                // Profile already linked — create telegram_accounts entry
                userId = linkedProfile.id;
                await supabase.rpc("upsert_telegram_account", {
                    p_user_id: userId,
                    p_telegram_user_id: validatedData.id,
                    p_username: validatedData.username || null,
                    p_first_name: validatedData.first_name || null,
                    p_last_name: validatedData.last_name || null,
                    p_language_code: "ru",
                    p_photo_url: validatedData.photo_url || null,
                    p_allows_write_to_pm: true,
                    p_is_premium: false,
                });
            } else {
                // Brand new user — auto-create auth.users + user_profiles + telegram_accounts
                const tgEmail = `tg_${validatedData.id}@telegram.linkmax.user`;
                const tgPassword = crypto.randomUUID();

                const { data: newUser, error: signUpError } =
                    await supabase.auth.admin.createUser({
                        email: tgEmail,
                        password: tgPassword,
                        email_confirm: true,
                        user_metadata: {
                            full_name:
                                [validatedData.first_name, validatedData.last_name]
                                    .filter(Boolean)
                                    .join(" ") || "Telegram User",
                            telegram_user_id: validatedData.id,
                            telegram_username: validatedData.username,
                            avatar_url: validatedData.photo_url,
                            source: "telegram_web",
                        },
                    });

                if (signUpError || !newUser?.user) {
                    console.error("Failed to create user:", signUpError);
                    return new Response(
                        JSON.stringify({
                            valid: false,
                            error: "user_creation_failed",
                            details: signUpError?.message,
                        }),
                        {
                            status: 500,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                userId = newUser.user.id;

                const displayName =
                    [validatedData.first_name, validatedData.last_name]
                        .filter(Boolean)
                        .join(" ") || "Telegram User";

                await supabase.from("user_profiles").upsert({
                    id: userId,
                    display_name: displayName,
                    telegram_chat_id: validatedData.id.toString(),
                    telegram_notifications_enabled: true,
                    avatar_url: validatedData.photo_url || null,
                });

                await supabase.rpc("upsert_telegram_account", {
                    p_user_id: userId,
                    p_telegram_user_id: validatedData.id,
                    p_username: validatedData.username || null,
                    p_first_name: validatedData.first_name || null,
                    p_last_name: validatedData.last_name || null,
                    p_language_code: "ru",
                    p_photo_url: validatedData.photo_url || null,
                    p_allows_write_to_pm: true,
                    p_is_premium: false,
                });
            }
        }

        // ---- Step 3: Generate session for the client ----
        // Use signInWithPassword with the deterministic email/password
        const tgEmail = `tg_${validatedData.id}@telegram.linkmax.user`;
        const tgPassword = crypto.randomUUID();

        // Update user password so we can sign in
        await supabase.auth.admin.updateUserById(userId, { password: tgPassword });

        const { data: sessionData, error: sessionError } =
            await supabase.auth.signInWithPassword({
                email: tgEmail,
                password: tgPassword,
            });

        if (sessionError || !sessionData?.session) {
            console.error("Failed to create session:", sessionError);
            throw new Error("Could not create user session");
        }

        return new Response(
            JSON.stringify({
                valid: true,
                user: {
                    id: userId,
                    telegram_user_id: validatedData.id,
                    username: validatedData.username,
                    first_name: validatedData.first_name,
                    last_name: validatedData.last_name,
                },
                session: sessionData.session,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error in auth-telegram-web:", error);
        return new Response(
            JSON.stringify({ valid: false, error: "server_error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
