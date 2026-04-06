import { createClient } from '@supabase/supabase-js'

// These should normally be added to a .env file
// The user will need to provide their own keys to connect to their real Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
