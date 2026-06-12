import { supabase } from "@/lib/supabase";
import type { Database, Friendship } from "@/types/database";

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("You must be signed in.");
  }

  return data.user.id;
}

export async function loadMyProfile() {
  const userId = await requireUserId();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadProfile(profileId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).single();

  if (error) {
    throw error;
  }

  return data;
}

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function updateMyProfile(update: ProfileUpdate) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createFriendshipByCode(code: string) {
  const { data, error } = await supabase.rpc("create_friendship_by_code", {
    p_invite_code: code.trim()
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listFriendships() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function acceptFriendship(friendship: Friendship) {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", friendship.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteFriendship(friendshipId: string) {
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);

  if (error) {
    throw error;
  }
}
