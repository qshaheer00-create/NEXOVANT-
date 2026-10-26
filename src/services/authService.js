import { requireSupabase } from './supabaseClient';
export async function signOut(){ const { error } = await requireSupabase().auth.signOut(); if(error) throw error; }
export async function getCurrentUser(){ const { data, error } = await requireSupabase().auth.getUser(); if(error) throw error; return data.user; }
