// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import React from 'https://esm.sh/react@18.2.0?target=deno';
import { renderAsync } from 'https://esm.sh/@react-email/render@0.0.7?target=deno';
import { WelcomeEmail } from '../_shared/emails/WelcomeEmail.tsx';
import { LeadNotification } from '../_shared/emails/LeadNotification.tsx';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string | string[];
    subject: string;
    template: 'welcome' | 'lead_notification';
    data: any;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, subject, template, data } = await req.json() as EmailRequest;

        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        let emailComponent;

        switch (template) {
            case 'welcome':
                emailComponent = <WelcomeEmail {...data} />;
                break;
            case 'lead_notification':
                emailComponent = <LeadNotification {...data} />;
                break;
            default:
                throw new Error(`Unknown template: ${template}`);
        }

        const html = await renderAsync(emailComponent);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "lnkmx.my <noreply@lnkmx.my>", // Pending domain verification, otherwise use 'onboarding@resend.dev' for testing
                to,
                subject,
                html,
            }),
        });

        const responseData = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", responseData);
            throw new Error("Failed to send email via Resend");
        }

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
