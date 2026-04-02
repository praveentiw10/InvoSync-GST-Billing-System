const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabaseClientPromise = null;

async function loadCreateClient() {
  const packageName = "@supabase/supabase-js";

  try {
    const module = await import(/* @vite-ignore */ packageName);
    return module.createClient;
  } catch {
    const module = await import(/* @vite-ignore */ "https://esm.sh/@supabase/supabase-js@2?bundle");
    return module.createClient;
  }
}

export async function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = loadCreateClient().then((createClient) =>
      createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    );
  }

  return supabaseClientPromise;
}
