'use client';

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/platform/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // The Supabase client automatically handles the hash fragment parsing
        // and session restoration on initialization.
        // We just need to wait for the session to be established.

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                // Successful exchange
                // Check specifically for returnTo in the URL first (passed from provider)
                // If not found, check the query params of the current URL
                const hashParams = new URL(window.location.href).searchParams;
                const returnTo = hashParams.get('returnTo');

                navigate(returnTo || "/dashboard/settings");
            }
        });

        // Check if we have an error in the URL immediately
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        if (error) {
            toast.error(`Auth Error: ${errorDescription || error}`);
            navigate("/auth");
        }

        // Fallback timeout in case onAuthStateChange doesn't fire (e.g. already signed in)
        const timeout = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Check URL params for returnTo
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get('returnTo');
                navigate(returnTo || "/dashboard/settings");
            } else {
                // If no session after timeout and no error, redirect to auth
                // But only if we don't have a hash, because hash processing might take a moment
                if (!window.location.hash) {
                    navigate("/auth");
                }
            }
        }, 2000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Completing authentication...</p>
            </div>
        </div>
    );
}
