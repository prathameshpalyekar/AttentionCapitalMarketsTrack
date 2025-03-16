const supabaseClient = ({ createSupabaseClient, env }: any) => {
  const ENVIRONMENT = env.get("ENVIRONMENT") || "production";
  const isProduction = ENVIRONMENT === "production";
  const SUPABASE_URL = isProduction ? env.get("SUPABASE_URL") : env.get("MY_SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = isProduction ? env.get("SUPABASE_SERVICE_ROLE_KEY") : env.get("MY_SUPABASE_SERVICE_ROLE_KEY") ||"";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are missing");
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { "X-DEBUG": "true" } }, 
    autoRefreshToken: true,
    persistSession: false,
  });
}

export default supabaseClient;