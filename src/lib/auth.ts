import { supabase } from "./supabase";

export async function getUser() {
  // Use cached session for performance (avoids network request to Auth server)
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
}