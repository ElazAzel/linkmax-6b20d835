import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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
      return createErrorResponse("zone_id and trigger_type are required", 400);
    }

    // Auth: require JWT and zone membership (or service-role server-to-server call)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return createErrorResponse("Unauthorized", 401);
    }
    const callerRole = claimsData.claims.role;
    if (callerRole !== "service_role") {
      const { data: isMember } = await supabase.rpc("is_zone_member", {
        p_zone_id: zone_id,
        p_user_id: claimsData.claims.sub,
      });
      if (!isMember) {
        return createErrorResponse("Forbidden", 403);
      }
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
          description: `Automatically created from automation ${auto.id}`,
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
      } else if (auto.action_type === "create_invoice" && deal_id) {
        const { data: deal } = await supabase
          .from("zone_deals")
          .select("title, value_amount, contact_id, currency")
          .eq("id", deal_id)
          .single();

        if (deal) {
          const { error: invErr } = await supabase.from("zone_invoices").insert({
            zone_id,
            deal_id,
            contact_id: deal.contact_id,
            amount: deal.value_amount,
            currency: deal.currency || "KZT",
            status: 'created',
            title: `Invoice: ${deal.title}`
          });
          if (!invErr) runCount++;
        }
      } else if (auto.action_type === "send_webhook") {
        const webhookUrl = auto.config?.webhook_url as string;
        const webhookSecret = auto.config?.webhook_secret as string;
        if (webhookUrl) {
          // Prepare payload
          const payload = {
            event: trigger_type,
            automation_id: auto.id,
            zone_id,
            deal_id,
            contact_id,
            timestamp: new Date().toISOString(),
          };

          try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (webhookSecret) headers["X-LinkMAX-Secret"] = webhookSecret;

            await fetch(webhookUrl, {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
            });
            runCount++;
          } catch (err) {
            console.error(`Webhook failed for auto ${auto.id}:`, err);
          }
        }
      } else if (auto.action_type === "send_telegram") {
        const template = auto.config?.message_template as string;
        if (template) {
          // Fetch context for variables
          let contactName = "Client";
          let dealTitle = "";
          let zoneName = "Zone";

          if (contact_id) {
            const { data: contact } = await supabase.from("zone_contacts").select("first_name, last_name").eq("id", contact_id).single();
            if (contact) contactName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Client";
          }
          if (deal_id) {
            const { data: deal } = await supabase.from("zone_deals").select("title").eq("id", deal_id).single();
            if (deal) dealTitle = deal.title || "";
          }
          const { data: zone } = await supabase.from("zones").select("name").eq("id", zone_id).single();
          if (zone) zoneName = zone.name || "Zone";

          // Variable substitution
          const message = template
            .replace(/{{contact_name}}/g, contactName)
            .replace(/{{deal_title}}/g, dealTitle)
            .replace(/{{zone_name}}/g, zoneName);

          try {
            await supabase.functions.invoke("send-zone-notification", {
              body: {
                type: "custom_template",
                zone_id,
                data: { contact_id, deal_id },
                message,
              },
            });
            runCount++;
          } catch (err) {
            console.error(`Telegram notification failed for auto ${auto.id}:`, err);
          }
        }
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
    return createErrorResponse(err as Error, 500);
  }
});
