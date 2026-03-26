/**
 * Shared Telegram Gateway helper for all edge functions.
 * Uses Lovable connector gateway instead of direct Bot API.
 */

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

interface TelegramGatewayConfig {
  lovableApiKey: string;
  telegramApiKey: string;
}

function getGatewayConfig(): TelegramGatewayConfig {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');

  const telegramApiKey = Deno.env.get('TELEGRAM_API_KEY');
  if (!telegramApiKey) throw new Error('TELEGRAM_API_KEY is not configured');

  return { lovableApiKey, telegramApiKey };
}

function gatewayHeaders(config: TelegramGatewayConfig): Record<string, string> {
  return {
    'Authorization': `Bearer ${config.lovableApiKey}`,
    'X-Connection-Api-Key': config.telegramApiKey,
    'Content-Type': 'application/json',
  };
}

/**
 * Call any Telegram Bot API method via the connector gateway.
 */
export async function callTelegram(method: string, body: Record<string, unknown>): Promise<any> {
  const config = getGatewayConfig();
  const response = await fetch(`${GATEWAY_URL}/${method}`, {
    method: 'POST',
    headers: gatewayHeaders(config),
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Telegram API ${method} failed [${response.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Send a text message via gateway.
 */
export async function sendMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: unknown;
    disable_web_page_preview?: boolean;
  }
): Promise<any> {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    ...options,
  });
}

/**
 * Answer a callback query.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: { text?: string; show_alert?: boolean }
): Promise<any> {
  return callTelegram('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...options,
  });
}

/**
 * Edit an existing message text.
 */
export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: unknown;
  }
): Promise<any> {
  return callTelegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    ...options,
  });
}

/**
 * Get chat info for validation.
 */
export async function getChat(chatId: string | number): Promise<any> {
  return callTelegram('getChat', { chat_id: chatId });
}

/**
 * Check if gateway credentials are configured.
 */
export function isConfigured(): boolean {
  return !!(Deno.env.get('LOVABLE_API_KEY') && Deno.env.get('TELEGRAM_API_KEY'));
}
