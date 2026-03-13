/* =============================================
   CARENIUM — Supabase Configuration
   Must be imported FIRST before all other modules.
   ============================================= */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize global reference
window.supabaseClient = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
   console.error('Carenium: Missing Supabase environment variables.');
}

// The CDN script loads synchronously before this module runs,
// so window.supabase should be available.
if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
   try {
      const { createClient } = window.supabase;
      window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase initialized");
      console.log('Carenium: Supabase client initialized successfully.');
   } catch (err) {
      console.error('Carenium: Supabase init error:', err.message);
   }
} else if (!window.supabase) {
   console.error('Carenium: Supabase CDN library not loaded.');
}
