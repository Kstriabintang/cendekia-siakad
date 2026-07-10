// Single data gateway for the whole app.
//
// Today it points at the mock backend so the UI is fully functional & demoable
// with zero configuration. When you paste your Supabase keys into .env
// (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), implement `supabaseBackend`
// with the SAME method names and flip USE_SUPABASE — no view needs to change.

import { mockBackend } from './mockBackend.js'

const USE_SUPABASE = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Placeholder — will be wired when keys are provided.
// import { supabaseBackend } from './supabaseBackend.js'
const backend = USE_SUPABASE ? mockBackend /* → supabaseBackend */ : mockBackend

export const api = backend
export const IS_MOCK = !USE_SUPABASE
