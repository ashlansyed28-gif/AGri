const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://zewjinhymoezmucxypdc.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes('your_')) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('Supabase Service Role client initialized successfully.');
  } catch (err) {
    console.error('Error initializing Supabase client:', err.message);
  }
} else {
  console.log('Supabase Service Role Key not yet provided. Waiting for configuration.');
}

module.exports = {
  supabase,
  isConfigured: () => !!supabase,
};
