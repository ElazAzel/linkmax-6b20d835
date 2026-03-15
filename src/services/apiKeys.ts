import { supabase } from "@/integrations/supabase/client";

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export const apiKeysService = {
  async listKeys(): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async generateKey(name: string): Promise<{ key: string; details: ApiKey }> {
    // Вызов RPC функции для безопасной генерации ключа на стороне сервера
    const { data, error } = await supabase.rpc('generate_user_api_key', {
      key_name: name
    });

    if (error) throw error;
    return data;
  },

  async deleteKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
