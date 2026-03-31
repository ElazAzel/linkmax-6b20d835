import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/utils.ts";

interface Step {
  id: string;
  sequence_id: string;
  template_id: string;
  delay_hours: number;
  step_order: number;
}

const MAX_EMAILS_PER_RUN = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const senderEmail = Deno.env.get('EMAIL_SENDER') || 'LinkMAX <noreply@lnkmx.my>';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing email sequences...");

    // 1. Fetch active subscriptions scheduled for now or earlier
    //    Idempotency: skip subscriptions already being processed (processing_started_at within last 5 min)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: subscriptions, error: subError } = await supabase
      .from('lead_sequence_subscriptions')
      .select('*, lead:leads(*), sequence:email_sequences(*)')
      .eq('status', 'running')
      .lte('next_run_at', new Date().toISOString())
      .or(`processing_started_at.is.null,processing_started_at.lt.${fiveMinAgo}`)
      .limit(MAX_EMAILS_PER_RUN);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No active subscriptions found" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Atomically mark subscriptions as processing (idempotency lock)
    const subIds = subscriptions.map((s: any) => s.id);
    await supabase
      .from('lead_sequence_subscriptions')
      .update({ processing_started_at: new Date().toISOString() })
      .in('id', subIds);

    const processed = [];

    for (const sub of subscriptions) {
      try {
        let nextStep: Step | null = null;
        
        if (!sub.current_step_id) {
          const { data: firstStep } = await supabase
            .from('email_sequence_steps')
            .select('*')
            .eq('sequence_id', sub.sequence_id)
            .order('step_order', { ascending: true })
            .limit(1)
            .single();
          nextStep = firstStep;
        } else {
          const { data: currentStep } = await supabase
            .from('email_sequence_steps')
            .select('step_order')
            .eq('id', sub.current_step_id)
            .single();
            
          if (currentStep) {
            const { data: followingStep } = await supabase
              .from('email_sequence_steps')
              .select('*')
              .eq('sequence_id', sub.sequence_id)
              .gt('step_order', currentStep.step_order)
              .order('step_order', { ascending: true })
              .limit(1)
              .maybeSingle();
            nextStep = followingStep;
          }
        }

        if (!nextStep) {
          await supabase
            .from('lead_sequence_subscriptions')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', sub.id);
          continue;
        }

        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('id', nextStep.template_id)
          .single();

        if (template && sub.lead && sub.lead.email) {
          const leadName = (sub.lead.form_data?.name as string) || (sub.lead.form_data?.Имя as string) || "Клиент";
          let sent = false;
          let errorMsg = null;

          if (resendApiKey) {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: senderEmail,
                to: sub.lead.email,
                subject: template.subject.replace('{lead_name}', leadName),
                html: template.content_html
                  .replace(/\{lead_name\}/g, leadName)
              })
            });
            const resData = await res.json();
            sent = res.ok;
            if (!sent) errorMsg = JSON.stringify(resData);
          } else {
            console.log(`Simulation: Sending email to ${sub.lead.email}`);
            sent = true;
          }

          await supabase.from('email_logs').insert({
            user_id: sub.sequence.user_id,
            lead_id: sub.lead_id,
            template_id: template.id,
            status: sent ? 'sent' : 'failed',
            error_message: errorMsg
          });

          if (sent) {
            const { data: nextNextStep } = await supabase
              .from('email_sequence_steps')
              .select('*')
              .eq('sequence_id', sub.sequence_id)
              .gt('step_order', nextStep.step_order)
              .order('step_order', { ascending: true })
              .limit(1)
              .maybeSingle();

            const nextRunAt = new Date();
            nextRunAt.setHours(nextRunAt.getHours() + (nextNextStep?.delay_hours || 24));

            await supabase
              .from('lead_sequence_subscriptions')
              .update({
                current_step_id: nextStep.id,
                next_run_at: nextRunAt.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);
          }
        }
        processed.push(sub.id);
      } catch (err) {
        console.error(`Error processing subscription ${sub.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processed.length }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    console.error("Critical error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
