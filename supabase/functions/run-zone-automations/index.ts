/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ZoneAutomation {
  id: string;
  zone_id: string;
  trigger_type: string;
  action_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { zone_id, trigger_type, deal_id, stage_id, contact_id } = body as {
      zone_id?: string;
      trigger_type?: string;
      deal_id?: string;
      stage_id?: string;
      contact_id?: string;
    };

    if (!zone_id || !trigger_type) {
      return new Response(
        JSON.stringify({ error: "zone_id and trigger_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: automations, error: autoError } = await supabase
      .from("zone_automations")
      .select("*")
      .eq("zone_id", zone_id)
      .eq("trigger_type", trigger_type)
      .eq("is_active", true);

    if (autoError || !automations?.length) {
      return new Response(
        JSON.stringify({ success: true, run: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let runCount = 0;

    for (const auto of automations as ZoneAutomation[]) {
      if (trigger_type === "deal_stage_change" && deal_id && stage_id) {
        const configStage = auto.config?.stage_id as string | undefined;
        if (configStage && configStage !== "any" && configStage !== stage_id) continue;
      }

      if (auto.action_type === "create_task") {
        const taskTitle = (auto.config?.task_title as string) || "Follow up";
        let assignedTo: string | null = null;
        if (deal_id) {
          const { data: deal } = await supabase
            .from("zone_deals")
            .select("assigned_to")
            .eq("id", deal_id)
            .single();
          assignedTo = deal?.assigned_to ?? null;
        }
        const { data: zone } = await supabase.from("zones").select("owner_user_id").eq("id", zone_id).single();
        let createdBy = zone?.owner_user_id ?? assignedTo;
        if (!createdBy) {
          const { data: member } = await supabase
            .from("zone_members")
            .select("user_id")
            .eq("zone_id", zone_id)
            .limit(1)
            .single();
          createdBy = member?.user_id ?? null;
        }
        if (!createdBy) continue;
        const { error: taskErr } = await supabase.from("zone_tasks").insert({
          zone_id,
          title: taskTitle,
          description: null,
          status: "todo",
          priority: "medium",
          assigned_to: assignedTo || createdBy,
          created_by: createdBy,
          deal_id: deal_id || null,
          contact_id: contact_id || null,
        });
        if (!taskErr) runCount++;
      } else if (auto.action_type === "create_deal" && trigger_type === "new_contact" && contact_id) {
        const { data: stages } = await supabase
          .from("zone_deal_stages")
          .select("id")
          .eq("zone_id", zone_id)
          .order("order_index")
          .limit(1);
        const firstStageId = stages?.[0]?.id ?? null;
        const { data: zone } = await supabase.from("zones").select("owner_user_id").eq("id", zone_id).single();
        const { error: dealErr } = await supabase.from("zone_deals").insert({
          zone_id,
          contact_id,
          title: "New lead",
          stage_id: firstStageId,
          value_amount: 0,
          currency: "KZT",
          status: "open",
          assigned_to: zone?.owner_user_id ?? null,
        });
        if (!dealErr) runCount++;
      } else if (auto.action_type === "notify_owner") {
        runCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, run: runCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("run-zone-automations error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
