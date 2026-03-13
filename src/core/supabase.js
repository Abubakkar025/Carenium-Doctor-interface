/* =============================================
   CARENIUM — Supabase Configuration
   Must be imported FIRST before all other modules.
   ============================================= */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabaseClient = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
   console.error('Carenium: Missing Supabase environment variables.');
}

if (window.supabase) {
   initializeSupabase();
} else {
   // Retry logic for CDN loading
   let retries = 0;
   const maxRetries = 5;
   const interval = setInterval(() => {
      retries++;
      if (window.supabase) {
         clearInterval(interval);
         initializeSupabase();
      } else if (retries >= maxRetries) {
         clearInterval(interval);
         console.error('Carenium: Supabase CDN library failed to load after multiple attempts.');
         if (window.Notifications) window.Notifications.error('System connection failed. Please check your internet or refresh.');
      }
   }, 500);
}

function initializeSupabase() {
   if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Carenium: Supabase environment variables missing. Backend disabled.');
      return;
   }
   try {
      const { createClient } = window.supabase;
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
         auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
         }
      });
      window.supabaseClient = supabaseClient;
      console.log('Carenium: [OK] Supabase client initialized.');

      // Proactive Health Check
      validateConnection();
   } catch (err) {
      console.error('Carenium: [CRITICAL] Supabase init failed:', err.message);
   }
}

async function validateConnection() {
   if (!supabaseClient) return false;
   try {
      const { data, error } = await supabaseClient.from('patients').select('id').limit(1);
      if (error) {
         console.warn('Carenium: [WARN] Supabase connection degraded:', error.message);
         return false;
      }
      console.log('Carenium: [OK] Supabase connection verified.');
      return true;
   } catch (err) {
      return false;
   }
}

export { validateConnection };

