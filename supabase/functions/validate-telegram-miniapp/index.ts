import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// ------------------------------------------------------------------
// Telegram Mini App initData validation (HMAC-SHA256)
// See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// ------------------------------------------------------------------

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
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

/**
 * Validate Telegram Mini App initData
 *
 * 1. Parse initData as URLSearchParams
 * 2. Extract `hash`, sort remaining params by key
 * 3. Create data_check_string = sorted key=value pairs joined by \n
 * 4. secret_key = HMAC-SHA256("WebAppData", bot_token)
 * 5. computed_hash = HMAC-SHA256(secret_key, data_check_string)
 * 6. Compare computed_hash === hash
 * 7. Check auth_date is not stale (within MAX_AUTH_AGE_SECONDS)
 */
const MAX_AUTH_AGE_SECONDS = 3600; // 1 hour

interface ValidatedInitData {
    user: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
        is_premium?: boolean;
        allows_write_to_pm?: boolean;
        photo_url?: string;
    };
    query_id?: string;
    chat_instance?: string;
    chat_type?: string;
    start_param?: string;
    auth_date: number;
    hash: string;
}

async function validateInitData(
    initData: string,
    botToken: string
): Promise<ValidatedInitData> {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
        throw new Error("Missing hash in initData");
    }

    // Build data_check_string: sorted params without hash, joined by \n
    const entries: [string, string][] = [];
    params.forEach((value, key) => {
        if (key !== "hash") {
            entries.push([key, value]);
        }
    });
    entries.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

    // secret_key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = await hmacSHA256(
        new TextEncoder().encode("WebAppData"),
        botToken
    );

    // computed_hash = HMAC-SHA256(secret_key, data_check_string)
    const computedHash = bufferToHex(
        await hmacSHA256(new Uint8Array(secretKey), dataCheckString)
    );

    if (computedHash !== hash) {
        throw new Error("Invalid initData signature");
    }

    // Check auth_date freshness
    const authDateStr = params.get("auth_date");
    if (!authDateStr) {
        throw new Error("Missing auth_date in initData");
    }
    const authDate = parseInt(authDateStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > MAX_AUTH_AGE_SECONDS) {
        throw new Error("initData is too old (auth_date expired)");
    }

    // Parse user
    const userStr = params.get("user");
    if (!userStr) {
        throw new Error("Missing user in initData");
    }
    const user = JSON.parse(userStr);

    return {
        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code,
            is_premium: user.is_premium,
            allows_write_to_pm: user.allows_write_to_pm,
            photo_url: user.photo_url,
        },
        query_id: params.get("query_id") || undefined,
        chat_instance: params.get("chat_instance") || undefined,
        chat_type: params.get("chat_type") || undefined,
        start_param: params.get("start_param") || undefined,
        auth_date: authDate,
        hash,
    };
}

/**
 * Determine launch_source from available data
 */
function detectLaunchSource(
    data: ValidatedInitData
): string {
    if (data.start_param) return "direct_link";
    if (data.query_id) return "inline";
    if (data.chat_type) return "menu_button";
    return "main_app";
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        if (!botToken) {
            console.error("TELEGRAM_BOT_TOKEN not configured");
            return new Response(
                JSON.stringify({ valid: false, error: "bot_not_configured" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const { initData } = await req.json();

        if (!initData || typeof initData !== "string") {
            return new Response(
                JSON.stringify({ valid: false, error: "missing_init_data" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // ---- Step 1: Validate initData signature ----
        let data: ValidatedInitData;
        try {
            data = await validateInitData(initData, botToken);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error("initData validation failed:", errorMessage);
            return new Response(
                JSON.stringify({ valid: false, error: errorMessage }),
                {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        console.log(
            `Validated Telegram user: ${data.user.id} (@${data.user.username || "no_username"})`
        );

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ---- Step 2: Find or create user ----
        // Check if telegram_accounts entry exists
        const { data: existingAccount } = await supabase
            .from("telegram_accounts")
            .select("id, telegram_user_id")
            .eq("telegram_user_id", data.user.id)
            .maybeSingle();

        let userId: string;

        if (existingAccount) {
            // Existing user — update their account info
            userId = existingAccount.id;
            await supabase.rpc("upsert_telegram_account", {
                p_user_id: userId,
                p_telegram_user_id: data.user.id,
                p_username: data.user.username || null,
                p_first_name: data.user.first_name || null,
                p_last_name: data.user.last_name || null,
                p_language_code: data.user.language_code || "ru",
                p_photo_url: data.user.photo_url || null,
                p_allows_write_to_pm: data.user.allows_write_to_pm ?? true,
                p_is_premium: data.user.is_premium ?? false,
            });
            console.log(`Updated existing account for user ${userId}`);
        } else {
            // New user — check if a user_profile exists with matching telegram_chat_id
            const { data: linkedProfile } = await supabase
                .from("user_profiles")
                .select("id")
                .eq("telegram_chat_id", data.user.id.toString())
                .maybeSingle();

            if (linkedProfile) {
                // Profile already linked via chat_id — create telegram_accounts entry
                userId = linkedProfile.id;
                await supabase.rpc("upsert_telegram_account", {
                    p_user_id: userId,
                    p_telegram_user_id: data.user.id,
                    p_username: data.user.username || null,
                    p_first_name: data.user.first_name || null,
                    p_last_name: data.user.last_name || null,
                    p_language_code: data.user.language_code || "ru",
                    p_photo_url: data.user.photo_url || null,
                    p_allows_write_to_pm: data.user.allows_write_to_pm ?? true,
                    p_is_premium: data.user.is_premium ?? false,
                });
                console.log(
                    `Created telegram_accounts for existing profile ${userId}`
                );
            } else {
                // Brand new user — auto-create auth.users + user_profiles + telegram_accounts
                // Generate a deterministic email for the Telegram user
                const tgEmail = `tg_${data.user.id}@telegram.linkmax.user`;
                const tgPassword = crypto.randomUUID(); // Random password, user logs in via Telegram

                const { data: newUser, error: signUpError } =
                    await supabase.auth.admin.createUser({
                        email: tgEmail,
                        password: tgPassword,
                        email_confirm: true,
                        user_metadata: {
                            full_name:
                                [data.user.first_name, data.user.last_name]
                                    .filter(Boolean)
                                    .join(" ") || "Telegram User",
                            telegram_user_id: data.user.id,
                            telegram_username: data.user.username,
                            avatar_url: data.user.photo_url,
                            source: "telegram_miniapp",
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

                // Create user_profiles entry
                const displayName =
                    [data.user.first_name, data.user.last_name]
                        .filter(Boolean)
                        .join(" ") || "Telegram User";

                await supabase.from("user_profiles").upsert({
                    id: userId,
                    display_name: displayName,
                    telegram_chat_id: data.user.id.toString(),
                    telegram_notifications_enabled: true,
                    avatar_url: data.user.photo_url || null,
                });

                // Create telegram_accounts entry
                await supabase.rpc("upsert_telegram_account", {
                    p_user_id: userId,
                    p_telegram_user_id: data.user.id,
                    p_username: data.user.username || null,
                    p_first_name: data.user.first_name || null,
                    p_last_name: data.user.last_name || null,
                    p_language_code: data.user.language_code || "ru",
                    p_photo_url: data.user.photo_url || null,
                    p_allows_write_to_pm: data.user.allows_write_to_pm ?? true,
                    p_is_premium: data.user.is_premium ?? false,
                });

                console.log(
                    `Created new user ${userId} for Telegram user ${data.user.id}`
                );
            }
        }

        // ---- Step 3: Record session ----
        const launchSource = detectLaunchSource(data);

        await supabase.rpc("record_miniapp_session", {
            p_telegram_user_id: data.user.id,
            p_user_id: userId,
            p_query_id: data.query_id || null,
            p_chat_instance: data.chat_instance || null,
            p_chat_type: data.chat_type || null,
            p_start_param: data.start_param || null,
            p_launch_source: launchSource,
            p_platform: null, // Will be sent from client on next iteration
            p_is_fullscreen: false,
            p_auth_date: data.auth_date
                ? new Date(data.auth_date * 1000).toISOString()
                : null,
        });

        // ---- Step 4: Track deep link clicks ----
        if (data.start_param) {
            await supabase.rpc("increment_deep_link_clicks", {
                p_start_param: data.start_param,
            });
        }

        // ---- Step 5: Generate session for the Mini App ----
        // This allows the frontend SDK to be fully authenticated
        const { data: sessionData, error: sessionError } =
            await supabase.auth.admin.createSession({
                userId: userId,
            });

        if (sessionError || !sessionData?.session) {
            console.error("Failed to create session:", sessionError);
        }

        return new Response(
            JSON.stringify({
                valid: true,
                user: {
                    id: userId,
                    telegram_user_id: data.user.id,
                    username: data.user.username,
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    language_code: data.user.language_code,
                    is_premium: data.user.is_premium,
                },
                session: sessionData?.session || null,
                start_param: data.start_param,
                launch_source: launchSource,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error in validate-telegram-miniapp:", error);
        return new Response(
            JSON.stringify({ valid: false, error: "server_error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
