-- Keep the MCP page-creation RPC callable only by authenticated users.
-- SECURITY DEFINER functions are executable by PUBLIC by default in Postgres,
-- so the explicit revoke is required even though the function checks auth.uid().
REVOKE EXECUTE ON FUNCTION public.mcp_create_user_page(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mcp_create_user_page(text, text, text) TO authenticated;
