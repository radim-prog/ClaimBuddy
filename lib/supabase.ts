import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL a ANON_KEY musí být nastaveny v .env.local\n' +
    'Viz .env.local.example pro příklad'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper pro získání aktuálního uživatele
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Získat extended user data z public.users
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData;
}

// Helper pro kontrolu role
export async function isAccountant() {
  const user = await getCurrentUser();
  return user && (user.role === 'accountant' || user.role === 'admin');
}

export async function isClient() {
  const user = await getCurrentUser();
  return user && user.role === 'client';
}
