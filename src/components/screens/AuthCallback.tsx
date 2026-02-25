'use client';

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/platform/supabase/client";
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // The Supabase client automatically handles the hash fragment parsing
        // and session restoration on initialization.

        // 1. Check for errors in hash or query params first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const error = hashParams.get("error") || searchParams.get("error");
        const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");

        if (error) {
            // If there's an error, check if we have an active session
            // This tells us if it was a login attempt or a link account attempt
            supabase.auth.getSession().then(({ data: { session } }) => {
                const encode = encodeURIComponent;
                if (session) {
                    // They were logged in, so they probably tried to link an account
                    navigate(`/dashboard/settings?auth_error=${encode(error)}&auth_error_description=${encode(errorDescription || '')}`, { replace: true });
                } else {
                    // Regular login error
                    navigate(`/auth?auth_error=${encode(error)}&auth_error_description=${encode(errorDescription || '')}`, { replace: true });
                }
            });
            return;
        }

        // 2. Listen for auth state changes for successful auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                const returnTo = hashParams.get('returnTo') || searchParams.get('returnTo');
                navigate(returnTo || "/dashboard/settings", { replace: true });
            }
        });

        // 3. Fallback timeout in case onAuthStateChange doesn't fire (e.g. already signed in)
        const timeout = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const returnTo = searchParams.get('returnTo') || hashParams.get('returnTo');
                navigate(returnTo || "/dashboard/settings", { replace: true });
            } else {
                if (!window.location.hash) {
                    navigate("/auth", { replace: true });
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
