import { supabase } from "@/platform/supabase/client";

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
    const { data, error } = await (supabase as unknown as { from: (schema: string) => any })
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ApiKey[];
  },

  async generateKey(name: string): Promise<{ key: string; details: ApiKey }> {
    const { data, error } = await (supabase as unknown as { rpc: (fn: string, args: unknown) => any }).rpc('generate_user_api_key', {
      key_name: name
    });

    if (error) throw error;
    return data as { key: string; details: ApiKey };
  },

  async deleteKey(id: string): Promise<void> {
    const { error } = await (supabase as unknown as { from: (schema: string) => any })
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
