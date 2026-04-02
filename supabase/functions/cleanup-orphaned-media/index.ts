import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dry_run = true } = await req.json().catch(() => ({ dry_run: true }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find assets with 0 references and deleted_at > 24h ago
    // We use a grace period (deleted_at) to avoid racing with current uploads/updates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    console.log(`Cleaning up orphaned media (dry_run: ${dry_run})...`);

    const { data: orphans, error: fetchError } = await supabase
      .from("media_assets")
      .select("*")
      .eq("reference_count", 0)
      .lt("deleted_at", oneDayAgo)
      .limit(50); // Process in batches

    if (fetchError) throw fetchError;
    if (!orphans || orphans.length === 0) {
      return new Response(JSON.stringify({ message: "No orphaned media found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const orphan of orphans) {
      try {
        const urlObj = new URL(orphan.url);
        // Extract bucket and path from URL: 
        // /storage/v1/object/public/[bucket]/[path]
        const storagePrefix = "/storage/v1/object/public/";
        if (!urlObj.pathname.includes(storagePrefix)) {
          throw new Error("URL is not a standard Supabase public storage URL");
        }

        const relativePath = urlObj.pathname.split(storagePrefix)[1];
        const parts = relativePath.split("/");
        const bucket = parts[0];
        const path = parts.slice(1).join("/");

        if (dry_run) {
           results.push({ id: orphan.id, url: orphan.url, bucket, path, status: "dry_run_listed" });
        } else {
           console.log(`Deleting ${path} from bucket ${bucket}...`);
           const { error: storageError } = await supabase.storage.from(bucket).remove([path]);
           
           if (storageError) {
             // If file already gone from storage, we should still remove from DB
             console.warn(`Storage delete failed for ${path}:`, storageError);
           }

           // Delete record from DB
           const { error: dbDeleteError } = await supabase
            .from("media_assets")
            .delete()
            .eq("id", orphan.id);
           
           if (dbDeleteError) throw dbDeleteError;

           results.push({ id: orphan.id, url: orphan.url, status: "deleted" });
        }
      } catch (err) {
         console.error(`Error processing orphan ${orphan.id}:`, err);
         results.push({ id: orphan.id, url: orphan.url, status: "failed", error: err.message });
      }
    }

    return new Response(JSON.stringify({ 
      dry_run, 
      count: results.length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Cleanup worker error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
